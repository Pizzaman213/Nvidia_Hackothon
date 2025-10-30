// ============================================================================
// MessageDisplay - Shows chat history with child and AI
// ============================================================================

import React, { useRef, useEffect } from 'react';
import { Message } from '../../types';

interface MessageDisplayProps {
  messages: Message[];
}

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
              font-child text-lg
            `}
          >
            {/* Message Content */}
            <p className="whitespace-pre-wrap break-words">{message.content}</p>

            {/* Timestamp */}
            <p
              className={`
                text-xs mt-2
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
