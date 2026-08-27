import { generateQuestions } from '../lib/generateQuestions.mjs'

const DOMAINS = ['Scrum Framework', 'Developing People and Teams', 'Managing Products with Agility']

// Vercel serverless function - POST { mode: 'practice' | 'simulation', domain?, count? }
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { mode = 'practice', domain, count } = req.body ?? {}
    const domains = mode === 'simulation' ? DOMAINS : domain ? [domain] : DOMAINS
    const total = count ?? (mode === 'simulation' ? 80 : 10)

    const questions = await generateQuestions({ domains, count: total })
    res.status(200).json({ questions })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate questions' })
  }
}
