// Local smoke test for the question-generation logic, without needing Vercel CLI/account.
// Run with: npm run test-generate
// Uses small counts on purpose to keep the OpenAI cost of each test run trivial.
import 'dotenv/config'
import { generateQuestions } from '../lib/generateQuestions.mjs'
import { EXAMS } from '../shared/exams.mjs'

async function testExam(exam) {
  console.log(`\n=== ${exam.label} ===`)

  console.log(`--- Practice mode test (1 domain, 3 questions) ---`)
  const practice = await generateQuestions({ examId: exam.id, domains: [exam.domains[0]], count: 3 })
  console.log(JSON.stringify(practice, null, 2))

  console.log(`\n--- Simulation mode test (all domains, 6 questions total) ---`)
  const simulation = await generateQuestions({ examId: exam.id, domains: exam.domains, count: 6 })
  console.log(JSON.stringify(simulation, null, 2))

  console.log(`\n${exam.label} - Practice: ${practice.length} questions. Simulation: ${simulation.length} questions.`)
}

async function main() {
  for (const exam of Object.values(EXAMS)) {
    await testExam(exam)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
