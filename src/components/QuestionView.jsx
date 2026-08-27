// Renders a single question. In "practice" review state, shows correct/incorrect + explanation.
// In "exam" state (simulation, or practice before checking), just lets the user select answers.
import { isCorrect } from '../scoring'

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export default function QuestionView({ question, selected, onChange, revealed, showDomain }) {
  const isMultiple = question.type === 'multiple'
  const correctSet = new Set(question.correctAnswers)

  function handlePick(index) {
    if (revealed) return
    if (isMultiple) {
      onChange(toggle(selected, index))
    } else {
      onChange([index])
    }
  }

  return (
    <div className="question-card">
      {showDomain && <div className="question-domain">{question.domain}</div>}
      <p className="question-text">{question.question}</p>
      {isMultiple && <div className="multi-select-badge">Select all that apply</div>}
      <ul className="options-list">
        {question.options.map((option, index) => {
          const isSelected = selected.includes(index)
          let stateClass = ''
          if (revealed) {
            if (correctSet.has(index)) stateClass = 'option-correct'
            else if (isSelected) stateClass = 'option-incorrect'
          } else if (isSelected) {
            stateClass = 'option-selected'
          }
          return (
            <li key={index}>
              <button
                type="button"
                className={`option-button ${stateClass}`}
                onClick={() => handlePick(index)}
                disabled={revealed}
              >
                <span className="option-marker">{isMultiple ? '☐' : '○'}</span>
                {option}
              </button>
            </li>
          )
        })}
      </ul>
      {revealed && (
        <div className={`explanation ${correctSet.size && isCorrect(question, selected) ? 'correct' : 'incorrect'}`}>
          <strong>{isCorrect(question, selected) ? 'Correct.' : 'Incorrect.'}</strong> {question.explanation}
        </div>
      )}
    </div>
  )
}
