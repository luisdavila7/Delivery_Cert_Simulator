import { useState } from 'react'
import { DOMAINS } from '../api'

const COUNT_OPTIONS = [5, 10, 20]

export default function PracticeSetup({ onStart, onBack }) {
  const [domain, setDomain] = useState('all')
  const [count, setCount] = useState(10)

  return (
    <div className="setup-screen">
      <h2>Practice Mode</h2>
      <p>Untimed. Instant feedback and explanations after each question.</p>

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
        <button
          type="button"
          className="primary-button"
          onClick={() => onStart({ domain: domain === 'all' ? undefined : domain, count })}
        >
          Start Practice
        </button>
      </div>
    </div>
  )
}
