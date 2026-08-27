import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const INDEX_PATH = join(__dirname, '..', 'data', 'vector-index.json')

let cached = null

export async function loadVectorIndex() {
  if (!cached) {
    const raw = await readFile(INDEX_PATH, 'utf8')
    cached = JSON.parse(raw)
  }
  return cached
}

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Random stratified sample of k chunks tagged with the given domain.
// (There's no user "query" to retrieve against here - we just want a fresh,
// varied slice of grounded content per domain on every generation call.)
export async function sampleChunksByDomain(domain, k) {
  const { chunks } = await loadVectorIndex()
  const domainChunks = chunks.filter((c) => c.domain === domain)
  return shuffle(domainChunks).slice(0, k)
}
