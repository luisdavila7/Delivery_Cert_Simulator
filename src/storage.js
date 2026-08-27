const STORAGE_KEY = 'pspo1-simulator-history'
const LAST_NAME_KEY = 'pspo1-simulator-last-name'

export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveSession(session) {
  const history = loadHistory()
  history.unshift(session) // most recent first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY)
}

export function getLastName() {
  try {
    return localStorage.getItem(LAST_NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveLastName(name) {
  try {
    localStorage.setItem(LAST_NAME_KEY, name)
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}
