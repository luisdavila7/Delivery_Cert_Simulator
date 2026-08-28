import { EXAMS } from '../../shared/exams.mjs'

export default function Home({ onSelect, examId, onSelectExam }) {
  return (
    <div className="home">
      <h1>Exam Simulator</h1>
      <p className="subtitle">Grounded in your own certification knowledge base.</p>

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
