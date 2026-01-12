export type AnalysisMode = 'quick' | 'full'

export interface SEOContext {
  domain: string
  market?: string
  goals?: string[]
  notes?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ChatRequest {
  sessionId: string
  message: string
  mode: AnalysisMode
  context: SEOContext
}

export interface ChatResponse {
  reply: string
  meta: {
    requestId: string
    durationMs: number
  }
}

export interface ErrorResponse {
  error: {
    code: string
    message: string
  }
  meta: {
    requestId: string
  }
}

export interface N8NWebhookResponse {
  output?: string
  reply?: string
  message?: string
  text?: string
  response?: string
  executionStarted?: boolean
  executionId?: string
  [key: string]: unknown
}

// N8N Embedded Chat protocol
export interface N8NChatRequest {
  action: 'sendMessage' | 'loadPreviousSession'
  chatInput: string
  sessionId: string
  // Optional: additional context fields
  metadata?: {
    mode?: string
    context?: SEOContext
  }
}

export interface SessionData {
  sessionId: string
  messages: ChatMessage[]
  context: SEOContext
  mode: AnalysisMode
}

// Supabase Database Types
export interface Conversation {
  id: string
  user_id: string
  title: string
  session_id: string
  domain: string | null
  market: string | null
  goals: string[] | null
  notes: string | null
  mode: AnalysisMode
  created_at: string
  updated_at: string
  last_message_at: string | null
  message_count: number
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface CreateConversationInput {
  user_id: string
  title: string
  session_id: string
  domain?: string
  market?: string
  goals?: string[]
  notes?: string
  mode?: AnalysisMode
}

export interface UpdateConversationInput {
  title?: string
  domain?: string
  market?: string
  goals?: string[]
  notes?: string
  mode?: AnalysisMode
}

