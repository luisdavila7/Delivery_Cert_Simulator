import { useState } from 'react'
import { getPracticeSeconds } from '../../shared/exams.mjs'
import { getLastName, saveLastName } from '../storage'

export default function PracticeSetup({ exam, onStart, onBack }) {
  const [name, setName] = useState(() => getLastName())
  const [domain, setDomain] = useState('all')
  const [count, setCount] = useState(exam.practiceCountOptions[1] ?? exam.practiceCountOptions[0])

  const trimmedName = name.trim()
  const practiceMinutes = Math.round(getPracticeSeconds(exam, count) / 60)

  function handleStart() {
    if (!trimmedName) return
    saveLastName(trimmedName)
    onStart({ name: trimmedName, domain: domain === 'all' ? undefined : domain, count })
  }

  return (
    <div className="setup-screen">
      <h2>Practice Mode</h2>
      <p>
        {exam.label} &middot; {practiceMinutes} min time limit for {count} questions. Instant
        feedback and explanations after each question.
      </p>

      <label className="field">
        Your name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
      </label>

      <label className="field">
        Domain
        <select value={domain} onChange={(e) => setDomain(e.target.value)}>
          <option value="all">All domains</option>
          {exam.domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        Number of questions
        <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
          {exam.practiceCountOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <div className="setup-actions">
        <button type="button" className="secondary-button" onClick={onBack}>
          Back
        </button>
        <button type="button" className="primary-button" onClick={handleStart} disabled={!trimmedName}>
          Start Practice
        </button>
      </div>
    </div>
  )
}
