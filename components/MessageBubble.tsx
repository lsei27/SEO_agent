'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import type { ChatMessage } from '@/lib/types'

interface MessageBubbleProps {
  message: ChatMessage
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Function to strip outer code blocks if the entire message is wrapped
  const preprocessContent = (content: string) => {
    const trimmed = content.trim()
    // Check if starts with ``` and ends with ```
    // Simplistic check to avoid regex complexity issues with large inputs
    if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
      const lines = trimmed.split('\n')
      // Remove first line (```language)
      // Remove last line (```)
      if (lines.length >= 2) {
        return lines.slice(1, -1).join('\n')
      }
    }
    return content
  }

  const displayContent = isUser ? message.content : preprocessContent(message.content)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${isUser
            ? 'bg-accent-primary text-white'
            : 'bg-dark-surface border border-dark-border text-dark-text-primary'
          }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{displayContent}</div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={{
                // Customize markdown rendering
                h1: ({ ...props }) => (
                  <h1 className="text-xl font-bold mt-4 mb-2" {...props} />
                ),
                h2: ({ ...props }) => (
                  <h2 className="text-lg font-semibold mt-3 mb-2" {...props} />
                ),
                h3: ({ ...props }) => (
                  <h3 className="text-base font-semibold mt-2 mb-1" {...props} />
                ),
                p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                ul: ({ ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
                ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                li: ({ ...props }) => <li className="mb-1" {...props} />,
                a: ({ ...props }) => (
                  <a
                    className="text-accent-primary hover:text-accent-hover underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  />
                ),
                code: ({ className, children, ...props }) => {
                  const isInline = !className
                  return isInline ? (
                    <code
                      className="bg-dark-bg px-1.5 py-0.5 rounded text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code
                      className="block bg-dark-bg p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap"
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                blockquote: ({ ...props }) => (
                  <blockquote
                    className="border-l-4 border-dark-border pl-4 italic text-dark-text-secondary"
                    {...props}
                  />
                ),
                // Table styling
                table: ({ ...props }) => (
                  <div className="overflow-x-auto my-4 border border-dark-border rounded-lg">
                    <table className="w-full text-left border-collapse text-sm" {...props} />
                  </div>
                ),
                thead: ({ ...props }) => (
                  <thead className="bg-dark-surface border-b border-dark-border" {...props} />
                ),
                tbody: ({ ...props }) => (
                  <tbody className="divide-y divide-dark-border" {...props} />
                ),
                tr: ({ ...props }) => (
                  <tr className="hover:bg-dark-surface/50 transition-colors" {...props} />
                ),
                th: ({ ...props }) => (
                  <th className="py-3 px-4 font-semibold text-dark-text-primary whitespace-nowrap" {...props} />
                ),
                td: ({ ...props }) => (
                  <td className="py-3 px-4 text-dark-text-secondary" {...props} />
                ),
              }}
            >
              {displayContent}
            </ReactMarkdown>
          </div>
        )}
        <div
          className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'text-dark-text-tertiary'
            } opacity-0 group-hover:opacity-100 transition-opacity`}
        >
          {timestamp}
        </div>
      </div>
    </div>
  )
}
