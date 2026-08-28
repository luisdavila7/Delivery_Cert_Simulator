import { useState } from 'react'
import packageJson from '../package.json'
import { getExam } from '../shared/exams.mjs'
import { generateQuestions } from './api'
import { scoreSession } from './scoring'
import { loadHistory, saveSession, getLastExamId, saveLastExamId } from './storage'
import Home from './components/Home'
import PracticeSetup from './components/PracticeSetup'
import SimulationIntro from './components/SimulationIntro'
import ExamRunner from './components/ExamRunner'
import ResultsSummary from './components/ResultsSummary'
import History from './components/History'
import LoadingScreen from './components/LoadingScreen'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [mode, setMode] = useState(null)
  const [examId, setExamId] = useState(() => getLastExamId())
  const [candidateName, setCandidateName] = useState('')
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState(null)
  const [historyVersion, setHistoryVersion] = useState(0)

  const exam = getExam(examId)

  function selectExam(nextExamId) {
    setExamId(nextExamId)
    saveLastExamId(nextExamId)
  }

  async function startExam(examMode, params) {
    const { name, ...rest } = params
    setMode(examMode)
    setCandidateName(name ?? '')
    setError(null)
    setScreen('loading')
    try {
      const generated = await generateQuestions({ examId, mode: examMode, ...rest })
      setQuestions(generated)
      setScreen('exam')
    } catch (err) {
      console.error(err)
      setError(err.message ?? 'Something went wrong generating questions.')
      setScreen('home')
    }
  }

  function handleFinish(finalAnswers) {
    setAnswers(finalAnswers)
    const { correct, total, percentage } = scoreSession(questions, finalAnswers)
    saveSession({
      timestamp: Date.now(),
      name: candidateName,
      examId,
      mode,
      correct,
      total,
      percentage,
      passed: percentage >= exam.simulation.passThreshold,
    })
    setHistoryVersion((v) => v + 1)
    setScreen('results')
  }

  function goHome() {
    setScreen('home')
    setError(null)
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        {error && <div className="error-banner">{error}</div>}

        {screen === 'home' && <Home onSelect={setScreen} examId={examId} onSelectExam={selectExam} />}

        {screen === 'practice-setup' && (
          <PracticeSetup exam={exam} onBack={goHome} onStart={(params) => startExam('practice', params)} />
        )}

        {screen === 'simulation-intro' && (
          <SimulationIntro exam={exam} onBack={goHome} onStart={(params) => startExam('simulation', params)} />
        )}

        {screen === 'loading' && <LoadingScreen mode={mode} exam={exam} />}

        {screen === 'exam' && (
          <ExamRunner mode={mode} exam={exam} questions={questions} name={candidateName} onFinish={handleFinish} />
        )}

        {screen === 'results' && (
          <ResultsSummary
            mode={mode}
            exam={exam}
            questions={questions}
            answers={answers}
            name={candidateName}
            onDone={goHome}
          />
        )}

        {screen === 'history' && (
          // eslint-disable-next-line react-hooks/exhaustive-deps
          <History
            key={historyVersion}
            sessions={loadHistory()}
            onBack={goHome}
            onRefresh={() => setHistoryVersion((v) => v + 1)}
          />
        )}
      </main>
      <footer className="version-footer">v{packageJson.version}</footer>
    </div>
  )
}
