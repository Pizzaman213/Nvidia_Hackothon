// ============================================================================
// MessageDisplay - Shows chat history with child and AI
// ============================================================================

import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { Message } from '../../types';

interface MessageDisplayProps {
  messages: Message[];
}

interface FormattedMessage {
  thinking?: string;
  response: string;
}

// Parse message to extract thinking section if present
const parseMessage = (content: string): FormattedMessage => {
  // Check for thinking tags
  const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/i);

  if (thinkingMatch) {
    return {
      thinking: thinkingMatch[1].trim(),
      response: content.replace(/<thinking>[\s\S]*?<\/thinking>/i, '').trim()
    };
  }

  return { response: content };
};

const AIMessageContent: React.FC<{ content: string }> = ({ content }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const parsed = parseMessage(content);

  return (
    <div className="space-y-3">
      {/* Thinking Section (Collapsible) */}
      {parsed.thinking && (
        <div className="border-l-4 border-purple-300 bg-purple-50 rounded-lg overflow-hidden">
          <button
            onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-purple-600">💭</span>
              <span className="font-semibold text-purple-700 text-sm">
                My Thinking Process
              </span>
            </div>
            <span className="text-purple-600 text-lg">
              {isThinkingExpanded ? '▼' : '▶'}
            </span>
          </button>

          {isThinkingExpanded && (
            <div className="px-4 pb-3 pt-1">
              <div className="prose prose-sm max-w-none prose-purple">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {parsed.thinking}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Response */}
      <div className="prose prose-lg max-w-none prose-headings:font-child prose-p:font-child prose-li:font-child">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Customize heading styles
            h1: (props: React.ComponentPropsWithoutRef<'h1'>) => <h1 className="text-2xl font-bold mb-3 text-purple-800" {...props} />,
            h2: (props: React.ComponentPropsWithoutRef<'h2'>) => <h2 className="text-xl font-bold mb-2 text-purple-700" {...props} />,
            h3: (props: React.ComponentPropsWithoutRef<'h3'>) => <h3 className="text-lg font-bold mb-2 text-purple-600" {...props} />,
            // Customize list styles
            ul: (props: React.ComponentPropsWithoutRef<'ul'>) => <ul className="list-disc pl-6 space-y-1 my-2" {...props} />,
            ol: (props: React.ComponentPropsWithoutRef<'ol'>) => <ol className="list-decimal pl-6 space-y-1 my-2" {...props} />,
            li: (props: React.ComponentPropsWithoutRef<'li'>) => <li className="text-gray-800" {...props} />,
            // Customize paragraph styles
            p: (props: React.ComponentPropsWithoutRef<'p'>) => <p className="mb-2 leading-relaxed" {...props} />,
            // Customize code blocks
            code: (props: React.ComponentPropsWithoutRef<'code'>) => {
              const { className, children } = props;
              const inline = !className;
              return inline ? (
                <code className="bg-purple-100 px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ) : (
                <code className="block bg-gray-100 p-3 rounded-lg my-2 text-sm font-mono overflow-x-auto">
                  {children}
                </code>
              );
            },
            // Customize blockquotes
            blockquote: (props: React.ComponentPropsWithoutRef<'blockquote'>) => (
              <blockquote className="border-l-4 border-purple-300 pl-4 italic my-2 text-gray-700" {...props} />
            ),
            // Customize strong text
            strong: (props: React.ComponentPropsWithoutRef<'strong'>) => <strong className="font-bold text-gray-900" {...props} />,
            // Customize links
            a: (props: React.ComponentPropsWithoutRef<'a'>) => (
              <a className="text-purple-600 hover:text-purple-800 underline" target="_blank" rel="noopener noreferrer" {...props} />
            ),
          } as Components}
        >
          {parsed.response}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export const MessageDisplay: React.FC<MessageDisplayProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-gray-400">
        <div className="text-center font-child">
          <div className="text-6xl mb-4">👋</div>
          <p className="text-xl">Hi! Start talking to me!</p>
          <p className="text-sm mt-2">Press the microphone button below</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.sender === 'child' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`
              max-w-[80%] p-4 rounded-2xl shadow-md
              ${
                message.sender === 'child'
                  ? 'bg-child-primary text-white rounded-br-none'
                  : 'bg-white text-gray-800 rounded-bl-none'
              }
              font-child
            `}
          >
            {/* Message Content */}
            {message.sender === 'ai' ? (
              <AIMessageContent content={message.content} />
            ) : (
              <p className="whitespace-pre-wrap break-words text-lg">{message.content}</p>
            )}

            {/* Timestamp */}
            <p
              className={`
                text-xs mt-3
                ${message.sender === 'child' ? 'text-white opacity-70' : 'text-gray-500'}
              `}
            >
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>

            {/* Camera Required Indicator */}
            {message.requires_camera && (
              <div className="mt-2 flex items-center gap-2 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                <span>📸</span>
                <span>Picture needed</span>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};
