export async function generateQuestions({ examId, mode, domain, count }) {
  const response = await fetch('/api/generate-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ examId, mode, domain, count }),
  })

  if (!response.ok) {
    throw new Error(`Question generation failed (${response.status})`)
  }

  const data = await response.json()
  return data.questions
}
