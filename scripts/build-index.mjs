// Builds a static embedding index from everything in knowledge-base/.
// Run with: npm run build-index
// Re-run this whenever you add/change files in knowledge-base/.
import 'dotenv/config'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'
import OpenAI from 'openai'
import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'

const KB_DIRS = ['knowledge-base/notebooklm-exports', 'knowledge-base/raw-sources']
const OUTPUT_PATH = 'data/vector-index.json'
const EMBEDDING_MODEL = 'text-embedding-3-small'
const CLASSIFY_MODEL = 'gpt-4o-mini'
const CHUNK_SIZE_WORDS = 180
const CHUNK_OVERLAP_WORDS = 30
const BATCH_SIZE = 50
const CLASSIFY_BATCH_SIZE = 25
const CLASSIFY_PREVIEW_CHARS = 500
const SKIP_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif']
const SKIP_FILENAMES = ['README.md']

// The 3 official PSPO I content domains (Scrum.org Professional Scrum Competencies)
const DOMAINS = [
  'Scrum Framework',
  'Developing People and Teams',
  'Managing Products with Agility',
]

const DOMAIN_GUIDE = `
- "Scrum Framework": Scrum theory & empiricism, Scrum values, roles/accountabilities (Product Owner, Scrum Master, Developers), events (Sprint, Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective), artifacts (Product Backlog, Sprint Backlog, Increment), Definition of Done, commitments.
- "Developing People and Teams": self-management, cross-functionality, servant leadership, coaching/facilitation, team dynamics, conflict, stakeholder collaboration skills, organizational culture around agility.
- "Managing Products with Agility": product vision & strategy, value & value-driven development, Product Backlog management/ordering/refinement, forecasting & release planning, stakeholder & customer collaboration on product direction, evidence-based management / metrics, market and business context.
`.trim()

const openai = new OpenAI() // reads OPENAI_API_KEY from the environment (.env via dotenv)

async function extractText(filePath) {
  const ext = extname(filePath).toLowerCase()
  if (ext === '.md' || ext === '.txt') {
    return readFile(filePath, 'utf8')
  }
  if (ext === '.pdf') {
    const buffer = await readFile(filePath)
    const parser = new PDFParse({ data: buffer })
    const result = await parser.getText()
    await parser.destroy()
    return result.text
  }
  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value
  }
  return null
}

function chunkText(text, sourceFile) {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks = []
  let start = 0
  while (start < words.length) {
    const end = Math.min(start + CHUNK_SIZE_WORDS, words.length)
    chunks.push({ source: sourceFile, text: words.slice(start, end).join(' ') })
    if (end === words.length) break
    start = end - CHUNK_OVERLAP_WORDS
  }
  return chunks
}

async function collectFiles() {
  const files = []
  for (const dir of KB_DIRS) {
    let entries
    try {
      entries = await readdir(dir)
    } catch {
      continue
    }
    for (const entry of entries) {
      if (SKIP_FILENAMES.includes(entry)) continue
      if (SKIP_EXTENSIONS.includes(extname(entry).toLowerCase())) {
        console.log(`  skipping (image, not indexed): ${entry}`)
        continue
      }
      files.push(join(dir, entry))
    }
  }
  return files
}

async function embedBatch(texts) {
  const response = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: texts })
  return response.data.map((d) => d.embedding)
}

async function classifyBatch(chunks) {
  const items = chunks.map((c, idx) => ({
    id: idx,
    preview: c.text.slice(0, CLASSIFY_PREVIEW_CHARS),
  }))

  const response = await openai.chat.completions.create({
    model: CLASSIFY_MODEL,
    messages: [
      {
        role: 'system',
        content: `You classify short excerpts of Scrum/Product Owner training material into exactly one of the 3 official PSPO I (Scrum.org) content domains:\n${DOMAIN_GUIDE}\n\nFor each excerpt, pick the single best-matching domain, even if it touches more than one.`,
      },
      { role: 'user', content: JSON.stringify(items) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'chunk_domains',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            classifications: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  domain: { type: 'string', enum: DOMAINS },
                },
                required: ['id', 'domain'],
                additionalProperties: false,
              },
            },
          },
          required: ['classifications'],
          additionalProperties: false,
        },
      },
    },
  })

  const { classifications } = JSON.parse(response.choices[0].message.content)
  const domainById = new Map(classifications.map((c) => [c.id, c.domain]))
  return chunks.map((c, idx) => domainById.get(idx) ?? DOMAINS[0])
}

async function main() {
  console.log('Collecting knowledge-base files...')
  const files = await collectFiles()
  console.log(`Found ${files.length} files to process.`)

  const allChunks = []
  for (const filePath of files) {
    console.log(`Extracting: ${filePath}`)
    let text
    try {
      text = await extractText(filePath)
    } catch (err) {
      console.warn(`  ! failed to extract ${filePath}: ${err.message}`)
      continue
    }
    if (!text || !text.trim()) {
      console.warn(`  ! no text extracted from ${filePath}, skipping`)
      continue
    }
    const chunks = chunkText(text, basename(filePath))
    console.log(`  -> ${chunks.length} chunks`)
    allChunks.push(...chunks)
  }

  console.log(`Total chunks to embed: ${allChunks.length}`)

  console.log('Classifying chunks by PSPO I domain...')
  const domains = new Array(allChunks.length)
  for (let i = 0; i < allChunks.length; i += CLASSIFY_BATCH_SIZE) {
    const batch = allChunks.slice(i, i + CLASSIFY_BATCH_SIZE)
    console.log(
      `  Classifying batch ${Math.floor(i / CLASSIFY_BATCH_SIZE) + 1} / ${Math.ceil(allChunks.length / CLASSIFY_BATCH_SIZE)}...`,
    )
    const batchDomains = await classifyBatch(batch)
    batchDomains.forEach((domain, idx) => {
      domains[i + idx] = domain
    })
  }

  const indexed = []
  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE)
    console.log(`Embedding batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(allChunks.length / BATCH_SIZE)}...`)
    const embeddings = await embedBatch(batch.map((c) => c.text))
    batch.forEach((chunk, idx) => {
      indexed.push({
        id: indexed.length,
        source: chunk.source,
        domain: domains[i + idx],
        text: chunk.text,
        embedding: embeddings[idx],
      })
    })
  }

  await mkdir('data', { recursive: true })
  await writeFile(
    OUTPUT_PATH,
    JSON.stringify({ model: EMBEDDING_MODEL, generatedAt: new Date().toISOString(), chunks: indexed }, null, 2),
  )

  const distribution = DOMAINS.map((d) => `${d}: ${indexed.filter((c) => c.domain === d).length}`).join(', ')
  console.log(`\nDomain distribution -> ${distribution}`)
  console.log(`Done. Wrote ${indexed.length} embedded chunks to ${OUTPUT_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
