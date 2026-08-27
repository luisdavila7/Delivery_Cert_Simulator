// Local smoke test for the question-generation logic, without needing Vercel CLI/account.
// Run with: npm run test-generate
// Uses small counts on purpose to keep the OpenAI cost of each test run trivial.
import 'dotenv/config'
import { generateQuestions } from '../lib/generateQuestions.mjs'

const DOMAINS = ['Scrum Framework', 'Developing People and Teams', 'Managing Products with Agility']

async function main() {
  console.log('--- Practice mode test (1 domain, 3 questions) ---')
  const practice = await generateQuestions({ domains: ['Scrum Framework'], count: 3 })
  console.log(JSON.stringify(practice, null, 2))

  console.log('\n--- Simulation mode test (all 3 domains, 6 questions total) ---')
  const simulation = await generateQuestions({ domains: DOMAINS, count: 6 })
  console.log(JSON.stringify(simulation, null, 2))

  console.log(`\nPractice: ${practice.length} questions. Simulation: ${simulation.length} questions.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
