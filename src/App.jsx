import { useState } from 'react'
import packageJson from '../package.json'
import { generateQuestions } from './api'
import { scoreSession } from './scoring'
import { loadHistory, saveSession } from './storage'
import Home from './components/Home'
import PracticeSetup from './components/PracticeSetup'
import SimulationIntro from './components/SimulationIntro'
import ExamRunner from './components/ExamRunner'
import ResultsSummary from './components/ResultsSummary'
import History from './components/History'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [mode, setMode] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState(null)
  const [historyVersion, setHistoryVersion] = useState(0)

  async function startExam(examMode, params) {
    setMode(examMode)
    setError(null)
    setScreen('loading')
    try {
      const generated = await generateQuestions({ mode: examMode, ...params })
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
      mode,
      correct,
      total,
      percentage,
      passed: percentage >= 0.85,
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

        {screen === 'home' && <Home onSelect={setScreen} />}

        {screen === 'practice-setup' && (
          <PracticeSetup onBack={goHome} onStart={(params) => startExam('practice', params)} />
        )}

        {screen === 'simulation-intro' && (
          <SimulationIntro onBack={goHome} onStart={(params) => startExam('simulation', params)} />
        )}

        {screen === 'loading' && (
          <div className="loading-screen">
            <p>Generating your {mode === 'simulation' ? '80-question simulation' : 'practice questions'}...</p>
            <p className="loading-hint">This calls OpenAI live and usually takes a bit longer for the full simulation.</p>
          </div>
        )}

        {screen === 'exam' && <ExamRunner mode={mode} questions={questions} onFinish={handleFinish} />}

        {screen === 'results' && (
          <ResultsSummary mode={mode} questions={questions} answers={answers} onDone={goHome} />
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
