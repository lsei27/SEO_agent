import { NextRequest, NextResponse } from 'next/server'
import { getExecution, extractOutputFromExecution, extractErrorFromExecution } from '@/lib/n8nApi'
import type { ErrorResponse } from '@/lib/types'

/**
 * GET /api/chat/status/[id]
 * Check the status of an n8n execution and return results if finished
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const executionId = params.id
    const requestId = request.headers.get('x-request-id') || 'internal'

    try {
        const execution = await getExecution(executionId)

        if (execution.finished) {
            if (execution.status === 'success') {
                const output = extractOutputFromExecution(execution)
                return NextResponse.json({
                    status: 'success',
                    output: output || 'Execution finished successfully but no output was found.',
                })
            } else {
                const errorMessage = extractErrorFromExecution(execution)
                return NextResponse.json({
                    status: 'error',
                    error: errorMessage || 'Workflow execution failed',
                })
            }
        }

        // Still running
        return NextResponse.json({
            status: 'running',
        })
    } catch (error) {
        console.error(`[STATUS API ERROR] ${executionId}:`, error)

        const errorResponse: ErrorResponse = {
            error: {
                code: 'STATUS_CHECK_FAILED',
                message: error instanceof Error ? error.message : 'Failed to check execution status',
            },
            meta: { requestId },
        }

        return NextResponse.json(errorResponse, { status: 500 })
    }
}
