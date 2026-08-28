import { useState } from 'react'
import { getLastName, saveLastName } from '../storage'

export default function SimulationIntro({ exam, onStart, onBack }) {
  const [name, setName] = useState(() => getLastName())
  const trimmedName = name.trim()
  const { questionCount, minutes, passThreshold, thresholdIsOfficial } = exam.simulation
  const passCount = Math.ceil(questionCount * passThreshold)

  function handleStart() {
    if (!trimmedName) return
    saveLastName(trimmedName)
    onStart({ name: trimmedName, count: questionCount })
  }

  return (
    <div className="setup-screen">
      <h2>Full Simulation &mdash; {exam.label}</h2>
      <ul className="intro-list">
        <li>
          {questionCount} questions across all {exam.domains.length} {exam.label} domains
        </li>
        <li>{minutes}-minute timer, starts as soon as you begin</li>
        <li>
          {Math.round(passThreshold * 100)}% ({passCount}/{questionCount}) required to pass
          {!thresholdIsOfficial && ' (estimated)'}
        </li>
        <li>No feedback until you submit or time runs out</li>
      </ul>

      {!thresholdIsOfficial && (
        <p className="intro-disclaimer">
          {exam.org} does not publish an official numeric passing score for {exam.label} &mdash; this
          threshold is a commonly-cited estimate, not an official cutoff.
        </p>
      )}

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
