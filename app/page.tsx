'use client'

import { useState } from 'react'
import Chat from '@/components/Chat'
import ContextPanel from '@/components/ContextPanel'
import type { SEOContext, AnalysisMode } from '@/lib/types'

export default function Home() {
  const [context, setContext] = useState<SEOContext>({
    domain: '',
    market: '',
    goals: [],
    notes: '',
  })

  const [mode, setMode] = useState<AnalysisMode>('quick')

  return (
    <main className="h-full flex">
      <ContextPanel
        context={context}
        mode={mode}
        onContextChange={setContext}
        onModeChange={setMode}
      />
      <Chat context={context} mode={mode} />
    </main>
  )
}
