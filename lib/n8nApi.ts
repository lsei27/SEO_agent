/**
 * N8N API Client for polling execution results
 */

const N8N_API_URL = process.env.N8N_API_URL
const N8N_API_KEY = process.env.N8N_API_KEY

export interface N8NExecution {
  id: string
  finished: boolean
  mode: string
  retryOf?: string
  retrySuccessId?: string
  startedAt: string
  stoppedAt?: string
  workflowId: string
  status: 'running' | 'success' | 'error' | 'waiting' | 'canceled' | 'crashed'
  data?: {
    resultData?: {
      runData?: Record<string, any[]>
      lastNodeExecuted?: string
      error?: any
    }
  }
}

export interface N8NExecutionResult {
  success: boolean
  output?: string
  error?: string
  executionId: string
  status: string
}

/**
 * Get execution details from n8n API
 */
export async function getExecution(executionId: string): Promise<N8NExecution> {
  if (!N8N_API_URL || !N8N_API_KEY) {
    throw new Error('N8N_API_URL and N8N_API_KEY must be configured in environment')
  }

  const url = `${N8N_API_URL}/executions/${executionId}?includeData=true`

  console.log(`[N8N API] Fetching execution ${executionId}`)

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`n8n API returned ${response.status}: ${await response.text()}`)
  }

  const data = await response.json()
  return data as N8NExecution
}

/**
 * Poll execution until it's finished or timeout
 */
export async function pollExecutionResult(
  executionId: string,
  options: {
    maxAttempts?: number
    pollIntervalMs?: number
    timeoutMs?: number
  } = {}
): Promise<N8NExecutionResult> {
  const maxAttempts = options.maxAttempts || 60 // 60 attempts
  const pollIntervalMs = options.pollIntervalMs || 2000 // 2 seconds
  const timeoutMs = options.timeoutMs || 120000 // 120 seconds

  const startTime = Date.now()
  let attempts = 0

  console.log(
    `[N8N POLLING] Starting poll for execution ${executionId} (max ${maxAttempts} attempts, ${pollIntervalMs}ms interval)`
  )

  while (attempts < maxAttempts) {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(
        `Polling timeout after ${timeoutMs}ms. Execution ${executionId} may still be running.`
      )
    }

    attempts++

    try {
      const execution = await getExecution(executionId)

      console.log(
        `[N8N POLLING] Attempt ${attempts}/${maxAttempts} - Status: ${execution.status}, Finished: ${execution.finished}`
      )

      // Check if execution is finished
      if (execution.finished) {
        if (execution.status === 'success') {
          // Extract output from execution data
          const output = extractOutputFromExecution(execution)

          if (!output) {
            console.warn('[N8N POLLING] Execution succeeded but no output found')
            return {
              success: false,
              error: 'No output found in execution result',
              executionId,
              status: execution.status,
            }
          }

          console.log(`[N8N POLLING] Success! Output length: ${output.length} characters`)

          return {
            success: true,
            output,
            executionId,
            status: execution.status,
          }
        } else if (execution.status === 'error' || execution.status === 'crashed') {
          // Execution failed
          const errorMessage = extractErrorFromExecution(execution)

          console.error(`[N8N POLLING] Execution failed: ${errorMessage}`)

          return {
            success: false,
            error: errorMessage || 'Workflow execution failed',
            executionId,
            status: execution.status,
          }
        } else if (execution.status === 'canceled') {
          return {
            success: false,
            error: 'Workflow execution was canceled',
            executionId,
            status: execution.status,
          }
        }
      }

      // Still running, wait and retry
      if (attempts < maxAttempts) {
        await sleep(pollIntervalMs)
      }
    } catch (error) {
      console.error(`[N8N POLLING] Error fetching execution: ${error}`)
      // Continue polling even if one request fails
      if (attempts < maxAttempts) {
        await sleep(pollIntervalMs)
      }
    }
  }

  // Max attempts reached
  throw new Error(
    `Max polling attempts (${maxAttempts}) reached for execution ${executionId}. Workflow may still be running.`
  )
}

/**
 * Extract output from execution data
 */
export function extractOutputFromExecution(execution: N8NExecution): string | null {
  try {
    const runData = execution.data?.resultData?.runData

    if (!runData) {
      console.warn('[EXTRACT] No runData found')
      return null
    }

    // Get last node executed
    const lastNodeName = execution.data?.resultData?.lastNodeExecuted

    if (!lastNodeName) {
      console.warn('[EXTRACT] No lastNodeExecuted found')
      // Try to find any node with data
      const nodeNames = Object.keys(runData)
      if (nodeNames.length === 0) {
        return null
      }
      // Use last node in list
      const fallbackNode = nodeNames[nodeNames.length - 1]
      console.log(`[EXTRACT] Using fallback node: ${fallbackNode}`)
      return extractOutputFromNode(runData[fallbackNode])
    }

    console.log(`[EXTRACT] Extracting from node: ${lastNodeName}`)

    const nodeData = runData[lastNodeName]
    return extractOutputFromNode(nodeData)
  } catch (error) {
    console.error('[EXTRACT] Error extracting output:', error)
    return null
  }
}

/**
 * Extract output from node data
 */
function extractOutputFromNode(nodeData: any[]): string | null {
  if (!nodeData || nodeData.length === 0) {
    return null
  }

  // Get last execution of the node
  const lastRun = nodeData[nodeData.length - 1]

  if (!lastRun || !lastRun.data || !lastRun.data.main) {
    return null
  }

  const mainData = lastRun.data.main[0]

  if (!mainData || mainData.length === 0) {
    return null
  }

  // Get first item
  const item = mainData[0]

  if (!item || !item.json) {
    return null
  }

  const json = item.json

  // Try different field names
  const possibleFields = ['output', 'reply', 'message', 'text', 'response', 'result']

  for (const field of possibleFields) {
    if (json[field] && typeof json[field] === 'string') {
      console.log(`[EXTRACT] Found output in field: ${field}`)
      return json[field]
    }
  }

  // If no standard field found, try to stringify the whole object
  console.warn('[EXTRACT] No standard output field found, using full JSON')
  return JSON.stringify(json, null, 2)
}

/**
 * Extract error from execution data
 */
export function extractErrorFromExecution(execution: N8NExecution): string | null {
  try {
    const error = execution.data?.resultData?.error

    if (error) {
      if (typeof error === 'string') {
        return error
      }
      if (error.message) {
        return error.message
      }
      return JSON.stringify(error)
    }

    return null
  } catch (_err) {
    return 'Unknown error'
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
