import { useState } from 'react'
import QuestionView from './QuestionView'
import Timer from './Timer'

export default function ExamRunner({ mode, exam, questions, name, onFinish }) {
  const simulationSeconds = exam.simulation.minutes * 60
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [revealed, setRevealed] = useState({})

  const isPractice = mode === 'practice'
  const question = questions[index]
  const selected = answers[question.id] ?? []
  const isLast = index === questions.length - 1
  const isRevealed = Boolean(revealed[question.id])
  const answeredCount = Object.keys(answers).length
  const progressPct = Math.round(((index + 1) / questions.length) * 100)

  function setSelected(next) {
    setAnswers((prev) => ({ ...prev, [question.id]: next }))
  }

  function handleCheck() {
    setRevealed((prev) => ({ ...prev, [question.id]: true }))
  }

  function goNext() {
    if (isLast) {
      onFinish(answers)
    } else {
      setIndex((i) => i + 1)
    }
  }

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1))
  }

  function handleSubmit() {
    if (answeredCount < questions.length) {
      const missing = questions.length - answeredCount
      const proceed = window.confirm(
        `You still have ${missing} unanswered question(s). Submit anyway?`,
      )
      if (!proceed) return
    }
    onFinish(answers)
  }

  return (
    <div className="exam-runner">
      <div className="exam-header">
        <div className="exam-header-top">
          {name && <span className="exam-candidate">{name}</span>}
          {!isPractice && <Timer totalSeconds={simulationSeconds} onExpire={() => onFinish(answers)} />}
        </div>
        <div className="exam-header-bottom">
          <span className="exam-progress">
            Question {index + 1} of {questions.length}
          </span>
          {!isPractice && (
            <span className="exam-answered">
              {answeredCount} answered / {questions.length} total
            </span>
          )}
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <QuestionView
        question={question}
        selected={selected}
        onChange={setSelected}
        revealed={isPractice && isRevealed}
        showDomain={!isPractice}
      />

      <div className="exam-nav">
        {isPractice ? (
          <>
            {!isRevealed ? (
              <button
                type="button"
                className="primary-button"
                onClick={handleCheck}
                disabled={selected.length === 0}
              >
                Check Answer
              </button>
            ) : (
              <button type="button" className="primary-button" onClick={goNext}>
                {isLast ? 'Finish' : 'Next'}
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" className="secondary-button" onClick={goPrev} disabled={index === 0}>
              Previous
            </button>
            {!isLast ? (
              <button type="button" className="secondary-button" onClick={goNext}>
                Next
              </button>
            ) : null}
            <button type="button" className="primary-button" onClick={handleSubmit}>
              Submit Exam
            </button>
          </>
        )}
      </div>
    </div>
  )
}
