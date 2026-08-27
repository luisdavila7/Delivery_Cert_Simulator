export const PASS_THRESHOLD = 0.85

function sameSet(a, b) {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((v, i) => v === sortedB[i])
}

export function isCorrect(question, selected) {
  return sameSet(question.correctAnswers, selected ?? [])
}

// answers: { [questionId]: number[] } selected option indices per question
export function scoreSession(questions, answers) {
  const byDomain = {}
  let correct = 0

  for (const q of questions) {
    if (!byDomain[q.domain]) byDomain[q.domain] = { correct: 0, total: 0 }
    byDomain[q.domain].total += 1

    const ok = isCorrect(q, answers[q.id])
    if (ok) {
      correct += 1
      byDomain[q.domain].correct += 1
    }
  }

  const total = questions.length
  const percentage = total === 0 ? 0 : correct / total

  return { correct, total, percentage, byDomain }
}
