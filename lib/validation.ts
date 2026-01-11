import type { ChatRequest } from './types'

const MAX_MESSAGE_LENGTH = 4000
const MAX_CONTEXT_LENGTH = 2000

export interface ValidationError {
  field: string
  message: string
}

export function validateChatRequest(body: unknown): {
  valid: boolean
  errors: ValidationError[]
  data?: ChatRequest
} {
  const errors: ValidationError[] = []

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: [{ field: 'body', message: 'Invalid request body' }] }
  }

  const req = body as Partial<ChatRequest>

  // Validate sessionId
  if (!req.sessionId || typeof req.sessionId !== 'string' || req.sessionId.trim() === '') {
    errors.push({ field: 'sessionId', message: 'sessionId is required' })
  }

  // Validate message
  if (!req.message || typeof req.message !== 'string') {
    errors.push({ field: 'message', message: 'message is required and must be a string' })
  } else if (req.message.trim() === '') {
    errors.push({ field: 'message', message: 'message cannot be empty' })
  } else if (req.message.length > MAX_MESSAGE_LENGTH) {
    errors.push({
      field: 'message',
      message: `message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
    })
  }

  // Validate mode
  if (!req.mode || !['quick', 'full'].includes(req.mode)) {
    errors.push({ field: 'mode', message: 'mode must be either "quick" or "full"' })
  }

  // Validate context
  if (!req.context || typeof req.context !== 'object') {
    errors.push({ field: 'context', message: 'context is required' })
  } else {
    const ctx = req.context

    if (typeof ctx.domain !== 'string') {
      errors.push({ field: 'context.domain', message: 'domain must be a string' })
    } else if (ctx.domain.length > MAX_CONTEXT_LENGTH) {
      errors.push({ field: 'context.domain', message: 'domain is too long' })
    }

    if (typeof ctx.market !== 'string') {
      errors.push({ field: 'context.market', message: 'market must be a string' })
    } else if (ctx.market.length > MAX_CONTEXT_LENGTH) {
      errors.push({ field: 'context.market', message: 'market is too long' })
    }

    if (!Array.isArray(ctx.goals)) {
      errors.push({ field: 'context.goals', message: 'goals must be an array' })
    } else if (ctx.goals.some((g) => typeof g !== 'string')) {
      errors.push({ field: 'context.goals', message: 'all goals must be strings' })
    }

    if (typeof ctx.notes !== 'string') {
      errors.push({ field: 'context.notes', message: 'notes must be a string' })
    } else if (ctx.notes.length > MAX_CONTEXT_LENGTH) {
      errors.push({ field: 'context.notes', message: 'notes is too long' })
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return {
    valid: true,
    errors: [],
    data: req as ChatRequest,
  }
}
