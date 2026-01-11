'use client'

import React, { useState, useEffect } from 'react'
import ConversationItem from './ConversationItem'
import type { Conversation } from '@/lib/types'

interface ConversationSidebarProps {
    activeConversationId: string | null
    onConversationSelect: (conversation: Conversation) => void
    onNewConversation: () => void
}

export default function ConversationSidebar({
    activeConversationId,
    onConversationSelect,
    onNewConversation,
}: ConversationSidebarProps) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Load conversations
    useEffect(() => {
        loadConversations()
    }, [])

    const loadConversations = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/conversations')

            if (!response.ok) {
                throw new Error('Failed to load conversations')
            }

            const data = await response.json()
            setConversations(data.conversations || [])
            setError(null)
        } catch (err) {
            console.error('Error loading conversations:', err)
            setError(err instanceof Error ? err.message : 'Failed to load conversations')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/conversations/${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete conversation')
            }

            // Remove from list
            setConversations((prev) => prev.filter((c) => c.id !== id))

            // If deleted conversation was active, create new one
            if (id === activeConversationId) {
                onNewConversation()
            }
        } catch (err) {
            console.error('Error deleting conversation:', err)
            alert('Failed to delete conversation')
        }
    }

    const handleRename = async (id: string, newTitle: string) => {
        try {
            const response = await fetch(`/api/conversations/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: newTitle }),
            })

            if (!response.ok) {
                throw new Error('Failed to rename conversation')
            }

            const data = await response.json()

            // Update in list
            setConversations((prev) =>
                prev.map((c) => (c.id === id ? data.conversation : c))
            )
        } catch (err) {
            console.error('Error renaming conversation:', err)
            alert('Failed to rename conversation')
        }
    }

    // Refresh conversations when a new one is created
    useEffect(() => {
        if (activeConversationId) {
            loadConversations()
        }
    }, [activeConversationId])

    return (
        <div className="w-64 bg-dark-surface border-r border-dark-border flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-dark-border">
                <button
                    onClick={onNewConversation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-hover text-white font-medium rounded-lg transition-colors"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    New Chat
                </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-2">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-dark-text-tertiary text-sm">Loading...</div>
                    </div>
                ) : error ? (
                    <div className="px-3 py-2 text-red-400 text-sm">{error}</div>
                ) : conversations.length === 0 ? (
                    <div className="px-3 py-8 text-center text-dark-text-tertiary text-sm">
                        No conversations yet.
                        <br />
                        Click "New Chat" to start.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {conversations.map((conversation) => (
                            <ConversationItem
                                key={conversation.id}
                                conversation={conversation}
                                isActive={conversation.id === activeConversationId}
                                onClick={() => onConversationSelect(conversation)}
                                onDelete={handleDelete}
                                onRename={handleRename}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-dark-border">
                <p className="text-xs text-dark-text-tertiary text-center">
                    {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
    )
}
