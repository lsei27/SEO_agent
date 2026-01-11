import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import type { ChatRequest, ChatResponse, ErrorResponse, N8NWebhookResponse } from '@/lib/types'
import { validateChatRequest } from '@/lib/validation'
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit'
import { pollExecutionResult } from '@/lib/n8nApi'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL
const N8N_WEBHOOK_TOKEN = process.env.N8N_WEBHOOK_TOKEN
const N8N_API_URL = process.env.N8N_API_URL
const N8N_API_KEY = process.env.N8N_API_KEY
const REQUEST_TIMEOUT_MS = 120000 // 120 seconds

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = uuidv4()
  const startTime = Date.now()

  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(clientId)

    if (!rateLimitResult.allowed) {
      const resetDate = new Date(rateLimitResult.resetAt).toISOString()
      const errorResponse: ErrorResponse = {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Try again after ${resetDate}`,
        },
        meta: { requestId },
      }
      return NextResponse.json(errorResponse, {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
        },
      })
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'INVALID_JSON',
          message: 'Request body must be valid JSON',
        },
        meta: { requestId },
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const validation = validateChatRequest(body)
    if (!validation.valid) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.errors.map((e) => `${e.field}: ${e.message}`).join('; '),
        },
        meta: { requestId },
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const chatRequest = validation.data!

    // Check if mock mode
    if (!N8N_WEBHOOK_URL) {
      console.log('[MOCK MODE] Returning mock response')
      const mockReply = generateMockResponse(chatRequest)
      const response: ChatResponse = {
        reply: mockReply,
        meta: {
          requestId,
          durationMs: Date.now() - startTime,
        },
      }
      return NextResponse.json(response, {
        headers: {
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        },
      })
    }

    // Call n8n webhook - now with polling support
    const reply = await callN8NWebhookWithPolling(chatRequest, requestId)

    const response: ChatResponse = {
      reply,
      meta: {
        requestId,
        durationMs: Date.now() - startTime,
      },
    }

    return NextResponse.json(response, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      },
    })
  } catch (error) {
    console.error('[API ERROR]', error)

    const errorResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      meta: { requestId },
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

/**
 * Call n8n webhook with polling support for async executions
 */
async function callN8NWebhookWithPolling(
  chatRequest: ChatRequest,
  _requestId: string
): Promise<string> {
  // Check if polling mode is enabled
  const usePolling = N8N_API_URL && N8N_API_KEY

  if (!usePolling) {
    console.warn(
      '[N8N] API credentials not configured, falling back to synchronous mode (may not work with async workflows)'
    )
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s for initial webhook call

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (N8N_WEBHOOK_TOKEN) {
      headers['Authorization'] = `Bearer ${N8N_WEBHOOK_TOKEN}`
    }

    // Transform to n8n Embedded Chat protocol
    const n8nChatRequest = {
      action: 'sendMessage' as const,
      chatInput: chatRequest.message,
      sessionId: chatRequest.sessionId,
      // Additional fields for SEO context (n8n will pass them through)
      mode: chatRequest.mode,
      context: chatRequest.context,
    }

    console.log('[N8N REQUEST] Sending Embedded Chat format:', {
      action: n8nChatRequest.action,
      chatInput: n8nChatRequest.chatInput.substring(0, 50) + '...',
      sessionId: n8nChatRequest.sessionId,
      mode: n8nChatRequest.mode,
    })

    const response = await fetch(N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers,
      body: JSON.stringify(n8nChatRequest),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`n8n webhook returned status ${response.status}`)
    }

    const contentType = response.headers.get('content-type')
    let webhookResponse: N8NWebhookResponse

    if (contentType?.includes('application/json')) {
      webhookResponse = (await response.json()) as N8NWebhookResponse
    } else {
      const text = await response.text()
      webhookResponse = { reply: text }
    }

    console.log('[N8N RESPONSE] Webhook response:', {
      hasExecutionId: !!webhookResponse.executionId,
      executionStarted: webhookResponse.executionStarted,
      hasOutput: !!webhookResponse.output,
    })

    // Check if it's an async execution
    if (webhookResponse.executionStarted && webhookResponse.executionId) {
      if (!usePolling) {
        throw new Error(
          'Workflow returned async execution but N8N_API_URL/N8N_API_KEY are not configured for polling'
        )
      }

      console.log(`[N8N POLLING] Starting poll for execution ${webhookResponse.executionId}`)

      // Poll for results
      const result = await pollExecutionResult(webhookResponse.executionId, {
        maxAttempts: 60,
        pollIntervalMs: 2000,
        timeoutMs: REQUEST_TIMEOUT_MS,
      })

      if (!result.success) {
        throw new Error(result.error || 'Workflow execution failed')
      }

      if (!result.output) {
        throw new Error('Workflow execution succeeded but no output was found')
      }

      console.log(`[N8N POLLING] Completed! Output length: ${result.output.length}`)

      return result.output
    }

    // Synchronous response - extract reply
    return extractReplyFromN8NResponse(webhookResponse)
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Initial request to n8n webhook timed out')
    }

    throw error
  }
}

function extractReplyFromN8NResponse(response: N8NWebhookResponse): string {
  console.log('[N8N RESPONSE] Extracting synchronous response')

  // Note: async executions are now handled by polling, so this should not happen
  if (response.executionStarted === true && response.executionId) {
    console.warn(
      '[N8N RESPONSE] Received async execution response but polling was not triggered. This should not happen.'
    )
  }

  // Try different field names that n8n might return
  if (response.output && typeof response.output === 'string') {
    return response.output
  }

  if (response.reply && typeof response.reply === 'string') {
    return response.reply
  }

  if (response.message && typeof response.message === 'string') {
    return response.message
  }

  if (response.text && typeof response.text === 'string') {
    return response.text
  }

  if (response.response && typeof response.response === 'string') {
    return response.response
  }

  // If response is a simple object with only one string field, use that
  const keys = Object.keys(response)
  if (keys.length === 1 && typeof response[keys[0]] === 'string') {
    return response[keys[0]] as string
  }

  // If we got here, the response format is unexpected
  console.warn('[n8n] Unexpected response format:', response)
  throw new Error(
    'Unexpected response format from n8n. Expected a field like "output", "reply", "message", or "text". ' +
    'Received: ' +
    JSON.stringify(response)
  )
}

function generateMockResponse(request: ChatRequest): string {
  const { message, mode, context } = request

  const intro = `**Mock Response** (n8n webhook not configured)\n\n`

  const analysis = `## SEO Analysis - ${mode === 'full' ? 'Full' : 'Quick'} Mode\n\n`

  const contextSection = `### Context\n- **Domain:** ${context.domain || 'Not specified'}\n- **Market:** ${context.market || 'Not specified'}\n- **Goals:** ${context.goals.length > 0 ? context.goals.join(', ') : 'None specified'}\n\n`

  const userQuery = `### Your Question\n> ${message}\n\n`

  const mockFindings = `### Key Findings\n\n1. **Technical SEO:** Your site structure appears solid. Consider implementing schema markup for better rich snippets.\n\n2. **Content Strategy:** Focus on long-tail keywords related to "${context.market || 'your market'}" to capture niche audiences.\n\n3. **Competitive Analysis:** Monitor competitor backlink profiles and identify gap opportunities.\n\n4. **Performance:** Optimize Core Web Vitals, particularly LCP and CLS metrics.\n\n### Recommended Actions\n\n- [ ] Conduct comprehensive keyword research for ${context.market || 'target market'}\n- [ ] Audit existing content and update underperforming pages\n- [ ] Build high-quality backlinks from industry-relevant sources\n- [ ] Implement structured data across key pages\n- [ ] Monitor and improve page speed metrics\n\n### Next Steps\n\nBased on your goals (${context.goals.join(', ') || 'not specified'}), I recommend starting with a technical audit followed by content optimization.\n\n---\n\n*This is a mock response. Configure N8N_WEBHOOK_URL in your environment to get real SEO analysis.*`

  return intro + analysis + contextSection + userQuery + mockFindings
}
