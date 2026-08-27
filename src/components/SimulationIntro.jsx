export default function SimulationIntro({ onStart, onBack }) {
  return (
    <div className="setup-screen">
      <h2>Full Simulation</h2>
      <ul className="intro-list">
        <li>80 questions across all 3 PSPO I domains</li>
        <li>60-minute timer, starts as soon as you begin</li>
        <li>85% (68/80) required to pass</li>
        <li>No feedback until you submit or time runs out</li>
      </ul>
      <div className="setup-actions">
        <button type="button" className="secondary-button" onClick={onBack}>
          Back
        </button>
        <button type="button" className="primary-button" onClick={() => onStart({ count: 80 })}>
          Start Simulation
        </button>
      </div>
    </div>
  )
}
