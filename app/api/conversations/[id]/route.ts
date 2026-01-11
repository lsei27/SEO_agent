import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Conversation, UpdateConversationInput } from '@/lib/types'

/**
 * GET /api/conversations/[id]
 * Get a specific conversation
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

        // Fetch conversation
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', id)
            .eq('user_id', username)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
            }
            console.error('Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ conversation: data as Conversation })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/conversations/[id]
 * Update a conversation
 */
export async function PATCH(
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
        const body: UpdateConversationInput = await request.json()

        // Set user context for RLS
        await supabase.rpc('set_config', {
            setting: 'app.user_id',
            value: username,
            is_local: false,
        })

        // Update conversation
        const { data, error } = await supabase
            .from('conversations')
            .update(body)
            .eq('id', id)
            .eq('user_id', username)
            .select()
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
            }
            console.error('Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ conversation: data as Conversation })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/conversations/[id]
 * Delete a conversation
 */
export async function DELETE(
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

        // Delete conversation (messages will cascade delete)
        const { error } = await supabase
            .from('conversations')
            .delete()
            .eq('id', id)
            .eq('user_id', username)

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
