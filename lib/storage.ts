import type { SessionData, ChatMessage, SEOContext, AnalysisMode } from './types'

const STORAGE_KEY = 'seo-chat-session'

export function saveSession(data: SessionData): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save session:', error)
  }
}

export function loadSession(): SessionData | null {
  if (typeof window === 'undefined') return null
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null
    return JSON.parse(data) as SessionData
  } catch (error) {
    console.error('Failed to load session:', error)
    return null
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear session:', error)
  }
}

export function createNewSession(context: SEOContext, mode: AnalysisMode): SessionData {
  return {
    sessionId: generateSessionId(),
    messages: [],
    context,
    mode,
  }
}

export function addMessage(session: SessionData, message: ChatMessage): SessionData {
  return {
    ...session,
    messages: [...session.messages, message],
  }
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}
