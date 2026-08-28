import { generateQuestions } from '../lib/generateQuestions.mjs'
import { getExam } from '../shared/exams.mjs'

// Vercel serverless function - POST { examId, mode: 'practice' | 'simulation', domain?, count? }
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { examId, mode = 'practice', domain, count } = req.body ?? {}
    const exam = getExam(examId)
    const domains = mode === 'simulation' ? exam.domains : domain ? [domain] : exam.domains
    const total = count ?? (mode === 'simulation' ? exam.simulation.questionCount : 10)

    const questions = await generateQuestions({ examId: exam.id, domains, count: total })
    res.status(200).json({ questions })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate questions' })
  }
}
