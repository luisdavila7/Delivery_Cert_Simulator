export default function Home({ onSelect }) {
  return (
    <div className="home">
      <h1>PSPO I Exam Simulator</h1>
      <p className="subtitle">Grounded in your own Scrum/Product Owner knowledge base.</p>
      <div className="home-actions">
        <button type="button" className="primary-button" onClick={() => onSelect('practice-setup')}>
          Practice Mode
        </button>
        <button type="button" className="primary-button" onClick={() => onSelect('simulation-intro')}>
          Full Simulation
        </button>
        <button type="button" className="secondary-button" onClick={() => onSelect('history')}>
          History
        </button>
      </div>
    </div>
  )
}
