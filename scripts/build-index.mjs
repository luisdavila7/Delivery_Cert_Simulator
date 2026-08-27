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
const CHUNK_SIZE_WORDS = 180
const CHUNK_OVERLAP_WORDS = 30
const BATCH_SIZE = 50
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

  const indexed = []
  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE)
    console.log(`Embedding batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(allChunks.length / BATCH_SIZE)}...`)
    const embeddings = await embedBatch(batch.map((c) => c.text))
    batch.forEach((chunk, idx) => {
      indexed.push({ id: indexed.length, source: chunk.source, text: chunk.text, embedding: embeddings[idx] })
    })
  }

  await mkdir('data', { recursive: true })
  await writeFile(
    OUTPUT_PATH,
    JSON.stringify({ model: EMBEDDING_MODEL, generatedAt: new Date().toISOString(), chunks: indexed }, null, 2),
  )

  console.log(`\nDone. Wrote ${indexed.length} embedded chunks to ${OUTPUT_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
