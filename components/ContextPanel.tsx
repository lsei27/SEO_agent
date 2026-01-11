'use client'

import React, { useState } from 'react'
import type { SEOContext, AnalysisMode } from '@/lib/types'

interface ContextPanelProps {
  context: SEOContext
  mode: AnalysisMode
  onContextChange: (context: SEOContext) => void
  onModeChange: (mode: AnalysisMode) => void
  disabled?: boolean
}

export default function ContextPanel({
  context,
  mode,
  onContextChange,
  onModeChange,
  disabled = false,
}: ContextPanelProps) {
  const [goalsInput, setGoalsInput] = useState(context.goals.join(', '))

  const handleGoalsBlur = () => {
    const goals = goalsInput
      .split(',')
      .map((g) => g.trim())
      .filter((g) => g.length > 0)
    onContextChange({ ...context, goals })
  }

  return (
    <div className="w-80 bg-dark-surface border-r border-dark-border p-6 flex flex-col">
      <h2 className="text-lg font-semibold text-dark-text-primary mb-6">SEO Context</h2>

      <div className="space-y-5 flex-1">
        {/* Domain */}
        <div>
          <label className="block text-sm font-medium text-dark-text-secondary mb-2">
            Domain
          </label>
          <input
            type="text"
            value={context.domain}
            onChange={(e) => onContextChange({ ...context, domain: e.target.value })}
            placeholder="example.com"
            disabled={disabled}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary placeholder-dark-text-tertiary focus:outline-none focus:border-accent-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        {/* Market */}
        <div>
          <label className="block text-sm font-medium text-dark-text-secondary mb-2">
            Market
          </label>
          <input
            type="text"
            value={context.market}
            onChange={(e) => onContextChange({ ...context, market: e.target.value })}
            placeholder="e.g., e-commerce, SaaS, local services"
            disabled={disabled}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary placeholder-dark-text-tertiary focus:outline-none focus:border-accent-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        {/* Goals */}
        <div>
          <label className="block text-sm font-medium text-dark-text-secondary mb-2">
            Goals
            <span className="text-dark-text-tertiary text-xs ml-2">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={goalsInput}
            onChange={(e) => setGoalsInput(e.target.value)}
            onBlur={handleGoalsBlur}
            placeholder="increase traffic, improve rankings"
            disabled={disabled}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary placeholder-dark-text-tertiary focus:outline-none focus:border-accent-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-dark-text-secondary mb-2">
            Notes
          </label>
          <textarea
            value={context.notes}
            onChange={(e) => onContextChange({ ...context, notes: e.target.value })}
            placeholder="Additional context or specific focus areas..."
            disabled={disabled}
            rows={4}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary placeholder-dark-text-tertiary focus:outline-none focus:border-accent-primary disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-colors"
          />
        </div>

        {/* Mode Switch */}
        <div>
          <label className="block text-sm font-medium text-dark-text-secondary mb-3">Mode</label>
          <div className="flex gap-2">
            <button
              onClick={() => onModeChange('quick')}
              disabled={disabled}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === 'quick'
                  ? 'bg-accent-primary text-white'
                  : 'bg-dark-bg text-dark-text-secondary hover:bg-dark-hover border border-dark-border'
              }`}
            >
              Quick
            </button>
            <button
              onClick={() => onModeChange('full')}
              disabled={disabled}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === 'full'
                  ? 'bg-accent-primary text-white'
                  : 'bg-dark-bg text-dark-text-secondary hover:bg-dark-hover border border-dark-border'
              }`}
            >
              Full
            </button>
          </div>
          <p className="text-xs text-dark-text-tertiary mt-2">
            {mode === 'quick'
              ? 'Fast analysis with key recommendations'
              : 'Comprehensive deep-dive analysis'}
          </p>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-6 pt-4 border-t border-dark-border">
        <p className="text-xs text-dark-text-tertiary">
          Your conversation history is saved locally in this browser.
        </p>
      </div>
    </div>
  )
}
