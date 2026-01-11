import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { Conversation, CreateConversationInput } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

/**
 * GET /api/conversations
 * List all conversations for the authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        // Get user from Basic Auth header
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const base64Credentials = authHeader.split(' ')[1]
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
        const [username] = credentials.split(':')

        // Fetch conversations using Admin client (bypassing RLS, but filtering by user_id)
        const { data, error } = await supabaseAdmin
            .from('conversations')
            .select('*')
            .eq('user_id', username)
            .order('updated_at', { ascending: false })

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ conversations: data as Conversation[] })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/conversations
 * Create a new conversation
 */
export async function POST(request: NextRequest) {
    try {
        // Get user from Basic Auth header
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const base64Credentials = authHeader.split(' ')[1]
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
        const [username] = credentials.split(':')

        // Parse request body
        const body = await request.json()
        const { title, domain, market, goals, notes, mode } = body

        // Generate session ID
        const sessionId = `${Date.now()}-${uuidv4()}`

        // Create conversation using Admin client
        const conversationData: CreateConversationInput = {
            user_id: username,
            title: title || 'New Chat',
            session_id: sessionId,
            domain: domain || null,
            market: market || null,
            goals: goals || null,
            notes: notes || null,
            mode: mode || 'quick',
        }

        const { data, error } = await supabaseAdmin
            .from('conversations')
            .insert(conversationData)
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ conversation: data as Conversation }, { status: 201 })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
