import OpenAI from 'openai'
import { sampleChunksByDomain } from './vectorIndex.mjs'

const GENERATION_MODEL = 'gpt-4o-mini'
const CONTEXT_CHUNKS_PER_DOMAIN = 20

const openai = new OpenAI()

const QUESTION_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          type: { type: 'string', enum: ['single', 'multiple', 'true_false'] },
          options: { type: 'array', items: { type: 'string' } },
          correctAnswers: { type: 'array', items: { type: 'integer' } },
          explanation: { type: 'string' },
        },
        required: ['question', 'type', 'options', 'correctAnswers', 'explanation'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
}

async function generateForDomain(domain, count) {
  const chunks = await sampleChunksByDomain(domain, CONTEXT_CHUNKS_PER_DOMAIN)
  const context = chunks.map((c, i) => `[Source ${i + 1} - ${c.source}]\n${c.text}`).join('\n\n')

  const response = await openai.chat.completions.create({
    model: GENERATION_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an expert PSPO I (Professional Scrum Product Owner I) exam item writer. Generate exam-style questions strictly grounded in the provided source excerpts for the domain "${domain}".

Rules:
- Always write the question, options, and explanation in English, regardless of what language the source excerpts are in.
- Mix question types across the batch: "single" (one correct answer), "multiple" (two or more correct answers), "true_false" (exactly two options: "True" and "False").
- Type/answer consistency is mandatory: "single" and "true_false" must have exactly one entry in correctAnswers; "multiple" must have two or more entries in correctAnswers. Never label a question "multiple" if only one option is actually correct - use "single" instead.
- Each question must have plausible distractors and a short explanation citing the reasoning.
- Do not invent facts that aren't supported by the sources.`,
      },
      {
        role: 'user',
        content: `Source excerpts:\n\n${context}\n\nGenerate exactly ${count} questions for the "${domain}" domain based only on these excerpts.`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'exam_questions', strict: true, schema: QUESTION_SCHEMA },
    },
  })

  const { questions } = JSON.parse(response.choices[0].message.content)
  return questions.map((q) => sanitizeQuestion(q)).filter(Boolean).map((q) => ({ ...q, domain }))
}

// Defense-in-depth: even with the prompt rules above, enforce type/correctAnswers
// consistency ourselves rather than trusting the model's output blindly - this data
// is used to grade someone's practice exam, so internal consistency matters more
// than trusting the label the model happened to pick.
function sanitizeQuestion(q) {
  if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
    return null // unusable - no correct answer to grade against
  }
  const type = q.correctAnswers.length > 1 ? 'multiple' : q.type === 'true_false' ? 'true_false' : 'single'
  return { ...q, type }
}

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const GENERATION_BUFFER = 5 // extra Qs requested per domain to absorb sanitizer-filtered ones
const MAX_TOPUP_ROUNDS = 3

// domains: array of domain names to cover. count: total desired questions, split evenly across them.
// The model (plus our sanitizer) doesn't always return exactly what was asked for - some items get
// dropped for being ungradable - so we over-request and top up in extra rounds until we actually hit
// `count`, rather than silently shipping a shorter exam than the blueprint promises (e.g. 80 questions).
export async function generateQuestions({ domains, count }) {
  const perDomain = Math.ceil(count / domains.length) + GENERATION_BUFFER
  let pool = (await Promise.all(domains.map((d) => generateForDomain(d, perDomain)))).flat()

  let round = 0
  while (pool.length < count && round < MAX_TOPUP_ROUNDS) {
    round += 1
    const shortfall = count - pool.length
    const topUpPerDomain = Math.ceil(shortfall / domains.length) + GENERATION_BUFFER
    const extra = (await Promise.all(domains.map((d) => generateForDomain(d, topUpPerDomain)))).flat()
    pool = pool.concat(extra)
  }

  if (pool.length < count) {
    console.warn(`generateQuestions: only produced ${pool.length}/${count} questions after ${MAX_TOPUP_ROUNDS} top-up rounds`)
  }

  const combined = shuffle(pool).slice(0, count)
  return combined.map((q, idx) => ({ id: idx, ...q }))
}
