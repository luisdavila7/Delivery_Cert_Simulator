// Minimal local stand-in for Vercel's serverless runtime, so `npm run dev` has a working
// /api/generate-questions during local development without needing the Vercel CLI or an account.
// Run with: npm run dev:api (alongside `npm run dev` for the Vite frontend)
import 'dotenv/config'
import { createServer } from 'node:http'
import handler from '../api/generate-questions.js'

const PORT = 3001

const server = createServer(async (req, res) => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const rawBody = Buffer.concat(chunks).toString('utf8')

  try {
    req.body = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    req.body = {}
  }

  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.json = (payload) => {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(payload))
  }

  await handler(req, res)
})

server.listen(PORT, () => {
  console.log(`Local API dev server listening on http://localhost:${PORT}`)
})
