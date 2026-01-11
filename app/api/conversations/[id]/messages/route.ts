import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Message } from '@/lib/types'

/**
 * GET /api/conversations/[id]/messages
 * Get all messages for a conversation
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        // Get user from Basic Auth header
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const base64Credentials = authHeader.split(' ')[1]
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
        const [username] = credentials.split(':')

        // Set user context for RLS
        await supabase.rpc('set_config', {
            setting: 'app.user_id',
            value: username,
            is_local: false,
        })

        // Verify conversation belongs to user
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('id')
            .eq('id', id)
            .eq('user_id', username)
            .single()

        if (convError || !conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        // Fetch messages
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ messages: data as Message[] })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/conversations/[id]/messages
 * Add a message to a conversation
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        // Get user from Basic Auth header
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const base64Credentials = authHeader.split(' ')[1]
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
        const [username] = credentials.split(':')

        // Parse request body
        const { role, content } = await request.json()

        if (!role || !content) {
            return NextResponse.json({ error: 'Missing role or content' }, { status: 400 })
        }

        if (role !== 'user' && role !== 'assistant') {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }

        // Set user context for RLS
        await supabase.rpc('set_config', {
            setting: 'app.user_id',
            value: username,
            is_local: false,
        })

        // Verify conversation belongs to user
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('id')
            .eq('id', id)
            .eq('user_id', username)
            .single()

        if (convError || !conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        // Insert message
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: id,
                role,
                content,
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ message: data as Message }, { status: 201 })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
