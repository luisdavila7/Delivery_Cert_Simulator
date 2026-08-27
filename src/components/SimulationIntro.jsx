import { useState } from 'react'
import { getLastName, saveLastName } from '../storage'

export default function SimulationIntro({ onStart, onBack }) {
  const [name, setName] = useState(() => getLastName())
  const trimmedName = name.trim()

  function handleStart() {
    if (!trimmedName) return
    saveLastName(trimmedName)
    onStart({ name: trimmedName, count: 80 })
  }

  return (
    <div className="setup-screen">
      <h2>Full Simulation</h2>
      <ul className="intro-list">
        <li>80 questions across all 3 PSPO I domains</li>
        <li>60-minute timer, starts as soon as you begin</li>
        <li>85% (68/80) required to pass</li>
        <li>No feedback until you submit or time runs out</li>
      </ul>

      <label className="field">
        Your name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
      </label>

      <div className="setup-actions">
        <button type="button" className="secondary-button" onClick={onBack}>
          Back
        </button>
        <button type="button" className="primary-button" onClick={handleStart} disabled={!trimmedName}>
          Start Simulation
        </button>
      </div>
    </div>
  )
}
