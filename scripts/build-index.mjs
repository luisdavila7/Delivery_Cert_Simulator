// Builds one static embedding index per exam from its knowledge-base directories (see shared/exams.mjs).
// Run with: npm run build-index
// Re-run this whenever you add/change files under any exam's knowledge-base directories.
import 'dotenv/config'
import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'
import OpenAI from 'openai'
import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import { EXAMS } from '../shared/exams.mjs'

const OUTPUT_DIR = 'data'
const EMBEDDING_MODEL = 'text-embedding-3-small'
const CLASSIFY_MODEL = 'gpt-4o-mini'
const CHUNK_SIZE_WORDS = 180
const CHUNK_OVERLAP_WORDS = 30
const BATCH_SIZE = 50
const CLASSIFY_BATCH_SIZE = 25
const CLASSIFY_PREVIEW_CHARS = 500
const SKIP_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif']
const SKIP_FILENAMES = ['README.md']

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

// Non-recursive: each exam explicitly lists the directories it wants scanned
// (e.g. PMP's own subfolder), so sibling subdirectories belonging to other
// exams are simply not walked into.
async function collectFiles(dirs) {
  const files = []
  for (const dir of dirs) {
    let entries
    try {
      entries = await readdir(dir)
    } catch {
      continue
    }
    for (const entry of entries) {
      if (SKIP_FILENAMES.includes(entry)) continue
      const entryPath = join(dir, entry)
      if ((await stat(entryPath)).isDirectory()) continue
      if (SKIP_EXTENSIONS.includes(extname(entry).toLowerCase())) {
        console.log(`  skipping (image, not indexed): ${entry}`)
        continue
      }
      files.push(entryPath)
    }
  }
  return files
}

async function embedBatch(texts) {
  const response = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: texts })
  return response.data.map((d) => d.embedding)
}

async function classifyBatch(chunks, exam) {
  const items = chunks.map((c, idx) => ({
    id: idx,
    preview: c.text.slice(0, CLASSIFY_PREVIEW_CHARS),
  }))

  const response = await openai.chat.completions.create({
    model: CLASSIFY_MODEL,
    messages: [
      {
        role: 'system',
        content: `You classify short excerpts of ${exam.fullName} (${exam.org}) training material into exactly one of the official ${exam.label} content domains:\n${exam.domainGuide}\n\nFor each excerpt, pick the single best-matching domain, even if it touches more than one.`,
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
                  domain: { type: 'string', enum: exam.domains },
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
  return chunks.map((c, idx) => domainById.get(idx) ?? exam.domains[0])
}

async function buildIndexForExam(exam) {
  console.log(`\n=== ${exam.label} (${exam.fullName}) ===`)
  console.log('Collecting knowledge-base files...')
  const files = await collectFiles(exam.kbDirs)
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

  console.log(`Classifying chunks by ${exam.label} domain...`)
  const domains = new Array(allChunks.length)
  for (let i = 0; i < allChunks.length; i += CLASSIFY_BATCH_SIZE) {
    const batch = allChunks.slice(i, i + CLASSIFY_BATCH_SIZE)
    console.log(
      `  Classifying batch ${Math.floor(i / CLASSIFY_BATCH_SIZE) + 1} / ${Math.ceil(allChunks.length / CLASSIFY_BATCH_SIZE)}...`,
    )
    const batchDomains = await classifyBatch(batch, exam)
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

  const outputPath = join(OUTPUT_DIR, `vector-index.${exam.id}.json`)
  await mkdir(OUTPUT_DIR, { recursive: true })
  await writeFile(
    outputPath,
    JSON.stringify({ model: EMBEDDING_MODEL, generatedAt: new Date().toISOString(), chunks: indexed }, null, 2),
  )

  const distribution = exam.domains.map((d) => `${d}: ${indexed.filter((c) => c.domain === d).length}`).join(', ')
  console.log(`Domain distribution -> ${distribution}`)
  console.log(`Done. Wrote ${indexed.length} embedded chunks to ${outputPath}`)
}

async function main() {
  for (const exam of Object.values(EXAMS)) {
    await buildIndexForExam(exam)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
