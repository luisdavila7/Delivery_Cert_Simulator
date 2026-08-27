import { PASS_THRESHOLD, isCorrect, scoreSession } from '../scoring'

export default function ResultsSummary({ mode, questions, answers, name, onDone }) {
  const { correct, total, percentage, byDomain } = scoreSession(questions, answers)
  const passed = percentage >= PASS_THRESHOLD
  const missed = questions.filter((q) => !isCorrect(q, answers[q.id]))

  return (
    <div className="results-summary">
      <h2>{mode === 'simulation' ? 'Simulation Results' : 'Practice Results'}</h2>
      {name && <p className="results-candidate">Results for {name}</p>}

      <div className="score-banner">
        <div className="score-number">
          {correct} / {total}
        </div>
        <div className="score-percentage">{Math.round(percentage * 100)}%</div>
        {mode === 'simulation' && (
          <div className={`pass-badge ${passed ? 'pass' : 'fail'}`}>{passed ? 'PASS' : 'FAIL'}</div>
        )}
      </div>

      <h3>By domain</h3>
      <table className="domain-table">
        <tbody>
          {Object.entries(byDomain).map(([domain, stats]) => (
            <tr key={domain}>
              <td>{domain}</td>
              <td>
                {stats.correct} / {stats.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {missed.length > 0 && (
        <>
          <h3>Review missed questions ({missed.length})</h3>
          <div className="review-list">
            {missed.map((q) => (
              <div key={q.id} className="review-item">
                <div className="question-domain">{q.domain}</div>
                <p className="question-text">{q.question}</p>
                <p>
                  <strong>Your answer:</strong>{' '}
                  {(answers[q.id] ?? []).map((i) => q.options[i]).join(', ') || '(none)'}
                </p>
                <p>
                  <strong>Correct answer:</strong> {q.correctAnswers.map((i) => q.options[i]).join(', ')}
                </p>
                <p className="explanation correct">{q.explanation}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <button type="button" className="primary-button" onClick={onDone}>
        Back to Home
      </button>
    </div>
  )
}
