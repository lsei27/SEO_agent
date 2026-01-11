'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
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

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-accent-primary text-white'
            : 'bg-dark-surface border border-dark-border text-dark-text-primary'
        }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
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
                p: ({ ...props }) => <p className="mb-2" {...props} />,
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
                      className="block bg-dark-bg p-3 rounded text-sm font-mono overflow-x-auto"
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
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <div
          className={`text-xs mt-2 ${
            isUser ? 'text-blue-100' : 'text-dark-text-tertiary'
          } opacity-0 group-hover:opacity-100 transition-opacity`}
        >
          {timestamp}
        </div>
      </div>
    </div>
  )
}
