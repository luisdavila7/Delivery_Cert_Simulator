import { useState } from 'react'
import { DOMAINS } from '../api'
import { getLastName, saveLastName } from '../storage'

const COUNT_OPTIONS = [5, 10, 20]

export default function PracticeSetup({ onStart, onBack }) {
  const [name, setName] = useState(() => getLastName())
  const [domain, setDomain] = useState('all')
  const [count, setCount] = useState(10)

  const trimmedName = name.trim()

  function handleStart() {
    if (!trimmedName) return
    saveLastName(trimmedName)
    onStart({ name: trimmedName, domain: domain === 'all' ? undefined : domain, count })
  }

  return (
    <div className="setup-screen">
      <h2>Practice Mode</h2>
      <p>Untimed. Instant feedback and explanations after each question.</p>

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
          {DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        Number of questions
        <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
          {COUNT_OPTIONS.map((n) => (
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
