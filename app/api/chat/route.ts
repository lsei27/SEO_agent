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
  // Increase timeout to 110s. 
  // Note: Vercel Hobby has a 10s limit, Pro has 300s. 
  // If you are on Hobby, this 110s won't help as Vercel will kill the function at 10s.
  const timeoutId = setTimeout(() => controller.abort(), 110000)

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (N8N_WEBHOOK_TOKEN) {
      headers['Authorization'] = `Bearer ${N8N_WEBHOOK_TOKEN}`
    }

    // Transform to n8n Embedded Chat protocol
    // We send context both nested and flattened to ensure maximum compatibility with different n8n expressions
    const n8nChatRequest = {
      action: 'sendMessage' as const,
      chatInput: chatRequest.message,
      sessionId: chatRequest.sessionId,
      mode: chatRequest.mode,
      // Nested context for backward compatibility
      context: chatRequest.context,
      // Flattened context for easier n8n expressions (e.g. {{ $json.domain }} vs {{ $json.context.domain }})
      domain: chatRequest.context.domain,
      market: chatRequest.context.market,
      goals: chatRequest.context.goals,
      notes: chatRequest.context.notes,
    }

    console.log('[N8N REQUEST] Full payload:', JSON.stringify(n8nChatRequest, null, 2))

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
      headerExecutionId: response.headers.get('x-n8n-execution-id'),
    })

    // Priority 1: Check x-n8n-execution-id header (most robust for "Respond Immediately")
    const headerExecutionId = response.headers.get('x-n8n-execution-id')
    if (headerExecutionId && !webhookResponse.output) {
      console.log(`[N8N ASYNC] Found execution ID in header: ${headerExecutionId}`)
      return `__N8N_ASYNC_ID__:${headerExecutionId}`
    }

    // Priority 2: Check body for executionId (if Respond to Webhook node was used correctly)
    if (webhookResponse.executionStarted && webhookResponse.executionId) {
      // Basic sanity check to ensure it's not a literal expression string like "{{ $execution.id }}"
      if (webhookResponse.executionId.includes('{{')) {
        console.warn(`[N8N ASYNC] Received literal expression string instead of ID: ${webhookResponse.executionId}`)
        // If we also have it in header, use that
        if (headerExecutionId) return `__N8N_ASYNC_ID__:${headerExecutionId}`
        throw new Error('n8n returned an invalid execution ID format. Please ensure the expression is correctly evaluated.')
      }

      console.log(`[N8N ASYNC] Workflow started with ID ${webhookResponse.executionId}. Returning to client for polling.`)

      // Return a special string that identifies this as an async ID
      // The Chat component will recognize this and start polling
      return `__N8N_ASYNC_ID__:${webhookResponse.executionId}`
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
