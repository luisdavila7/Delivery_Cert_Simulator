import { EXAMS } from '../../shared/exams.mjs'

export default function Home({ onSelect, examId, onSelectExam }) {
  return (
    <div className="home">
      <h1>Delivery Cert Simulator</h1>
      <p className="subtitle">Agile, project, and product delivery certifications — grounded in your own knowledge base.</p>

      <div className="value-props">
        <span className="value-prop-chip">🎯 Exam-accurate blueprints</span>
        <span className="value-prop-chip">📚 Grounded in your own knowledge base</span>
        <span className="value-prop-chip">📊 Track your progress</span>
      </div>

      <div className="exam-picker">
        {Object.values(EXAMS).map((exam) => (
          <button
            key={exam.id}
            type="button"
            className={`exam-picker-option ${exam.id === examId ? 'selected' : ''}`}
            onClick={() => onSelectExam(exam.id)}
          >
            {exam.label}
          </button>
        ))}
      </div>

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
