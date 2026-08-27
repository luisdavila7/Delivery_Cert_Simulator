import { useEffect, useState } from 'react'

export default function LoadingScreen({ mode }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="loading-screen">
      <div className="spinner" aria-hidden="true" />
      <p>Generating your {mode === 'simulation' ? '80-question simulation' : 'practice questions'}...</p>
      <p className="loading-hint">
        This calls OpenAI live and usually takes a bit longer for the full simulation.
      </p>
      <p className="loading-elapsed">{elapsed}s</p>
    </div>
  )
}
