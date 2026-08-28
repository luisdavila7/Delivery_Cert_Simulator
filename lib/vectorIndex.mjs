import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const cache = new Map() // examId -> parsed index

function indexPath(examId) {
  return join(__dirname, '..', 'data', `vector-index.${examId}.json`)
}

export async function loadVectorIndex(examId) {
  if (!cache.has(examId)) {
    const raw = await readFile(indexPath(examId), 'utf8')
    cache.set(examId, JSON.parse(raw))
  }
  return cache.get(examId)
}

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Random stratified sample of k chunks tagged with the given domain, within one exam's index.
// (There's no user "query" to retrieve against here - we just want a fresh,
// varied slice of grounded content per domain on every generation call.)
export async function sampleChunksByDomain(examId, domain, k) {
  const { chunks } = await loadVectorIndex(examId)
  const domainChunks = chunks.filter((c) => c.domain === domain)
  return shuffle(domainChunks).slice(0, k)
}
