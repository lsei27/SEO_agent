'use client'

import React, { useState, useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import type { ChatMessage, ChatRequest, ChatResponse, ErrorResponse, SEOContext, AnalysisMode } from '@/lib/types'
import { saveSession, loadSession, createNewSession } from '@/lib/storage'

interface ChatProps {
  context: SEOContext
  mode: AnalysisMode
}

export default function Chat({ context, mode }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load session on mount
  useEffect(() => {
    const saved = loadSession()
    if (saved) {
      setMessages(saved.messages)
      setSessionId(saved.sessionId)
    } else {
      const newSession = createNewSession(context, mode)
      setSessionId(newSession.sessionId)
      saveSession(newSession)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Save session when messages change
  useEffect(() => {
    if (sessionId) {
      saveSession({
        sessionId,
        messages,
        context,
        mode,
      })
    }
  }, [messages, sessionId, context, mode])

  const handleSend = async () => {
    const trimmedMessage = inputValue.trim()
    if (!trimmedMessage || isLoading) return

    setError(null)

    // Add user message
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

    try {
      const requestBody: ChatRequest = {
        sessionId,
        message: trimmedMessage,
        mode,
        context,
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

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMessage])
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

  return (
    <div className="flex-1 flex flex-col bg-dark-bg">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <h3 className="text-xl font-semibold text-dark-text-primary mb-3">
                SEO Specialist Chat
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
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-dark-surface border border-dark-border rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
