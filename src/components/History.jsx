import { getExam } from '../../shared/exams.mjs'
import { clearHistory } from '../storage'

export default function History({ sessions, onBack, onRefresh }) {
  function handleClear() {
    if (window.confirm('Clear all saved session history? This cannot be undone.')) {
      clearHistory()
      onRefresh()
    }
  }

  return (
    <div className="history-screen">
      <h2>History</h2>
      {sessions.length === 0 ? (
        <p>No saved sessions yet.</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Exam</th>
              <th>Mode</th>
              <th>Score</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.timestamp}>
                <td>{new Date(s.timestamp).toLocaleString()}</td>
                <td>{s.name ?? '—'}</td>
                <td>{s.examId ? getExam(s.examId).label : '—'}</td>
                <td>{s.mode}</td>
                <td>
                  {s.correct} / {s.total} ({Math.round(s.percentage * 100)}%)
                </td>
                <td>{s.mode === 'simulation' ? (s.passed ? 'PASS' : 'FAIL') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="setup-actions">
        <button type="button" className="secondary-button" onClick={onBack}>
          Back
        </button>
        {sessions.length > 0 && (
          <button type="button" className="secondary-button" onClick={handleClear}>
            Clear History
          </button>
        )}
      </div>
    </div>
  )
}
