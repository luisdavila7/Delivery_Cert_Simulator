import { DEFAULT_EXAM_ID } from '../shared/exams.mjs'

const STORAGE_KEY = 'exam-simulator-history'
const LAST_NAME_KEY = 'exam-simulator-last-name'
const LAST_EXAM_KEY = 'exam-simulator-last-exam-id'

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

export function getLastExamId() {
  try {
    return localStorage.getItem(LAST_EXAM_KEY) ?? DEFAULT_EXAM_ID
  } catch {
    return DEFAULT_EXAM_ID
  }
}

export function saveLastExamId(examId) {
  try {
    localStorage.setItem(LAST_EXAM_KEY, examId)
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}
