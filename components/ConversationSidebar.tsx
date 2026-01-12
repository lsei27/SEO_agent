'use client'

import React, { useState, useEffect } from 'react'
import ConversationItem from './ConversationItem'
import type { Conversation } from '@/lib/types'

interface ConversationSidebarProps {
    activeConversationId: string | null
    onConversationSelect: (conversation: Conversation | null) => void
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
    const [searchTerm, setSearchTerm] = useState('')
    const [sortMode, setSortMode] = useState<'updated' | 'created' | 'title'>('updated')

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
            const remaining = conversations.filter((c) => c.id !== id)
            setConversations(remaining)

            // If deleted conversation was active, select another one or deselect
            if (id === activeConversationId) {
                if (remaining.length > 0) {
                    onConversationSelect(remaining[0])
                } else {
                    onConversationSelect(null)
                }
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
        if (activeConversationId && !conversations.find(c => c.id === activeConversationId)) {
            loadConversations()
        }
    }, [activeConversationId]) // eslint-disable-line react-hooks/exhaustive-deps

    // Derived state for filtered and sorted conversations
    const filteredConversations = conversations
        .filter(c =>
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.domain?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (sortMode === 'updated') {
                return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            } else if (sortMode === 'created') {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            } else {
                return a.title.localeCompare(b.title)
            }
        })

    return (
        <div className="w-72 bg-dark-surface border-r border-dark-border flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-dark-border space-y-3">
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

                <div className="space-y-2">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-dark-text-primary placeholder-dark-text-tertiary focus:outline-none focus:border-accent-primary transition-colors"
                        />
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2 px-1">
                        <span className="text-[10px] uppercase font-bold text-dark-text-tertiary tracking-wider">Sort by:</span>
                        <select
                            value={sortMode}
                            onChange={(e) => setSortMode(e.target.value as any)}
                            className="bg-transparent text-xs text-dark-text-secondary focus:outline-none cursor-pointer hover:text-dark-text-primary transition-colors"
                        >
                            <option value="updated">Recent Activity</option>
                            <option value="created">Recently Created</option>
                            <option value="title">Alphabetical</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-2">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-dark-text-tertiary text-sm">Loading...</div>
                    </div>
                ) : error ? (
                    <div className="px-3 py-2 text-red-400 text-sm">{error}</div>
                ) : filteredConversations.length === 0 ? (
                    <div className="px-3 py-8 text-center text-dark-text-tertiary text-sm">
                        {searchTerm ? 'No results found.' : 'No conversations yet.'}
                        {!searchTerm && (
                            <>
                                <br />
                                Click &quot;New Chat&quot; to start.
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredConversations.map((conversation) => (
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
