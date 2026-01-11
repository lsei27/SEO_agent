'use client'

import React from 'react'
import type { Conversation } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

interface ConversationItemProps {
    conversation: Conversation
    isActive: boolean
    onClick: () => void
    onDelete: (id: string) => void
    onRename: (id: string, newTitle: string) => void
}

export default function ConversationItem({
    conversation,
    isActive,
    onClick,
    onDelete,
    onRename,
}: ConversationItemProps) {
    const [isEditing, setIsEditing] = React.useState(false)
    const [editTitle, setEditTitle] = React.useState(conversation.title)
    const [showMenu, setShowMenu] = React.useState(false)

    const handleRename = () => {
        if (editTitle.trim() && editTitle !== conversation.title) {
            onRename(conversation.id, editTitle.trim())
        }
        setIsEditing(false)
        setShowMenu(false)
    }

    const handleDelete = () => {
        if (confirm(`Delete "${conversation.title}"?`)) {
            onDelete(conversation.id)
        }
        setShowMenu(false)
    }

    const timeAgo = conversation.last_message_at
        ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })
        : formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })

    return (
        <div
            className={`group relative px-3 py-2 rounded-lg cursor-pointer transition-colors ${isActive
                    ? 'bg-accent-primary text-white'
                    : 'hover:bg-dark-hover text-dark-text-primary'
                }`}
            onClick={!isEditing ? onClick : undefined}
        >
            {isEditing ? (
                <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename()
                        if (e.key === 'Escape') {
                            setEditTitle(conversation.title)
                            setIsEditing(false)
                        }
                    }}
                    autoFocus
                    className="w-full bg-dark-bg text-dark-text-primary px-2 py-1 rounded border border-accent-primary focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <>
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <h3
                                className={`font-medium text-sm truncate ${isActive ? 'text-white' : 'text-dark-text-primary'
                                    }`}
                            >
                                {conversation.title}
                            </h3>
                            <p
                                className={`text-xs mt-1 ${isActive ? 'text-white/70' : 'text-dark-text-tertiary'
                                    }`}
                            >
                                {timeAgo} • {conversation.message_count} msg
                            </p>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowMenu(!showMenu)
                            }}
                            className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-dark-border transition-opacity ${isActive ? 'text-white' : 'text-dark-text-secondary'
                                }`}
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                />
                            </svg>
                        </button>
                    </div>

                    {showMenu && (
                        <div className="absolute right-2 top-10 bg-dark-surface border border-dark-border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsEditing(true)
                                    setShowMenu(false)
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-dark-text-primary hover:bg-dark-hover"
                            >
                                Rename
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete()
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-dark-hover"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
