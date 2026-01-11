'use client'

import React, { useState, useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ErrorResponse,
  Conversation,
  Message,
} from '@/lib/types'

interface ChatProps {
  conversation: Conversation | null
  onConversationUpdate: () => void
}

export default function Chat({ conversation, onConversationUpdate }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation) {
      loadMessages()
    } else {
      setMessages([])
    }
  }, [conversation?.id])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const loadMessages = async () => {
    if (!conversation) return

    try {
      setIsLoadingMessages(true)
      const response = await fetch(`/api/conversations/${conversation.id}/messages`)

      if (!response.ok) {
        throw new Error('Failed to load messages')
      }

      const data = await response.json()
      const dbMessages: Message[] = data.messages || []

      // Convert DB messages to ChatMessage format
      const chatMessages: ChatMessage[] = dbMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at).getTime(),
      }))

      setMessages(chatMessages)
    } catch (err) {
      console.error('Error loading messages:', err)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!conversation) return

    try {
      await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, content }),
      })

      // Trigger conversation list refresh
      onConversationUpdate()
    } catch (err) {
      console.error('Error saving message:', err)
    }
  }

  const handleSend = async () => {
    const trimmedMessage = inputValue.trim()
    if (!trimmedMessage || isLoading || !conversation) return

    setError(null)

    // Add user message to UI
    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmedMessage,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Adjust textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Save user message to DB
    await saveMessage('user', trimmedMessage)

    try {
      const requestBody: ChatRequest = {
        sessionId: conversation.session_id,
        message: trimmedMessage,
        mode: conversation.mode,
        context: {
          domain: conversation.domain || '',
          market: conversation.market || '',
          goals: conversation.goals || [],
          notes: conversation.notes || '',
        },
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json()
        throw new Error(errorData.error.message || `HTTP ${response.status}`)
      }

      const data: ChatResponse = await response.json()

      // Add assistant message to UI
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Save assistant message to DB
      await saveMessage('assistant', data.reply)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleRetry = () => {
    // Remove the last user message and try again
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      const lastMessage = messages[messages.length - 1]
      setMessages((prev) => prev.slice(0, -1))
      setInputValue(lastMessage.content)
    }
    setError(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)

    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dark-bg">
        <div className="text-center max-w-md">
          <h3 className="text-xl font-semibold text-dark-text-primary mb-3">
            No Conversation Selected
          </h3>
          <p className="text-dark-text-secondary">
            Select a conversation from the sidebar or create a new one to start chatting.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-dark-bg">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-dark-text-tertiary">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <h3 className="text-xl font-semibold text-dark-text-primary mb-3">
                {conversation.title}
              </h3>
              <p className="text-dark-text-secondary mb-4">
                Ask me anything about SEO strategy, technical optimization, content planning, or
                competitive analysis.
              </p>
              <div className="space-y-2 text-sm text-dark-text-tertiary">
                <p>💡 Example: &quot;Analyze my site&apos;s current SEO performance&quot;</p>
                <p>💡 Example: &quot;What keywords should I target for my market?&quot;</p>
                <p>💡 Example: &quot;How can I improve my Core Web Vitals?&quot;</p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-dark-surface border border-dark-border rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-accent-primary rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-accent-primary rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-accent-primary rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span className="text-sm text-dark-text-secondary ml-2">
                  SEO analysis running...
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-950 border border-red-800 rounded-lg px-4 py-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-red-200 font-medium mb-1">Error</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
              <button
                onClick={handleRetry}
                className="ml-4 text-sm text-red-200 hover:text-red-100 underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-dark-border bg-dark-surface px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about SEO strategy, technical optimization, or content planning..."
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-dark-text-primary placeholder-dark-text-tertiary focus:outline-none focus:border-accent-primary disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="px-6 py-3 bg-accent-primary hover:bg-accent-hover text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-dark-text-tertiary mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
