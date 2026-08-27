import packageJson from '../package.json'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <main className="placeholder">
        <h1>PSPO I Exam Simulator</h1>
        <p>Project scaffold in place. Practice &amp; Full Simulation modes coming next.</p>
      </main>
      <footer className="version-footer">v{packageJson.version}</footer>
    </div>
  )
}

export default App
