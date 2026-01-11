'use client'

import { useState, useEffect } from 'react'
import Chat from '@/components/Chat'
import ContextPanel from '@/components/ContextPanel'
import ConversationSidebar from '@/components/ConversationSidebar'
import type { SEOContext, AnalysisMode, Conversation } from '@/lib/types'

export default function Home() {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [context, setContext] = useState<SEOContext>({
    domain: '',
    market: '',
    goals: [],
    notes: '',
  })
  const [mode, setMode] = useState<AnalysisMode>('quick')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Load context from active conversation
  useEffect(() => {
    if (activeConversation) {
      setContext({
        domain: activeConversation.domain || '',
        market: activeConversation.market || '',
        goals: activeConversation.goals || [],
        notes: activeConversation.notes || '',
      })
      setMode(activeConversation.mode)
    }
  }, [activeConversation])

  // Update conversation context when changed
  useEffect(() => {
    if (activeConversation) {
      updateConversationContext()
    }
  }, [context, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateConversationContext = async () => {
    if (!activeConversation) return

    try {
      await fetch(`/api/conversations/${activeConversation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: context.domain,
          market: context.market,
          goals: context.goals,
          notes: context.notes,
          mode,
        }),
      })
    } catch (err) {
      console.error('Error updating conversation context:', err)
    }
  }

  const handleNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `New Chat ${new Date().toLocaleString()}`,
          domain: '',
          market: '',
          goals: [],
          notes: '',
          mode: 'quick',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create conversation')
      }

      const data = await response.json()
      setActiveConversation(data.conversation)
      setRefreshTrigger((prev) => prev + 1)
    } catch (err) {
      console.error('Error creating conversation:', err)
      alert('Failed to create new conversation')
    }
  }

  const handleConversationSelect = (conversation: Conversation) => {
    setActiveConversation(conversation)
  }

  const handleConversationUpdate = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <main className="h-full flex">
      <ConversationSidebar
        key={refreshTrigger}
        activeConversationId={activeConversation?.id || null}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
      />
      <ContextPanel
        context={context}
        mode={mode}
        onContextChange={setContext}
        onModeChange={setMode}
        disabled={!activeConversation}
      />
      <Chat conversation={activeConversation} onConversationUpdate={handleConversationUpdate} />
    </main>
  )
}
