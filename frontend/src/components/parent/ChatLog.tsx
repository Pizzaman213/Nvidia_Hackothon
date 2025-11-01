// ============================================================================
// ChatLog - Display conversation history for parent monitoring
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import { ChatMessage } from '../../types';
import api from '../../services/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { useTheme } from '../../contexts/ThemeContext';

interface ChatLogProps {
  sessionId: string;
}

export const ChatLog: React.FC<ChatLogProps> = ({ sessionId }) => {
  const { parentTheme } = useTheme();
  const isLight = parentTheme === 'light';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      setError(null);
      const messagesData = await api.session.getMessages(sessionId, 100);
      setMessages(messagesData);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chat history';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Auto-refresh every 5 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchMessages]);

  const getEmotionColor = (emotion?: string) => {
    if (!emotion) return isLight ? 'bg-gray-100' : 'bg-gray-700/40';

    if (isLight) {
      switch (emotion.toLowerCase()) {
        case 'happy':
        case 'excited':
          return 'bg-green-100';
        case 'sad':
        case 'scared':
          return 'bg-yellow-100';
        case 'angry':
        case 'frustrated':
          return 'bg-red-100';
        default:
          return 'bg-gray-100';
      }
    } else {
      // Dark mode colors
      switch (emotion.toLowerCase()) {
        case 'happy':
        case 'excited':
          return 'bg-green-900/40';
        case 'sad':
        case 'scared':
          return 'bg-yellow-900/40';
        case 'angry':
        case 'frustrated':
          return 'bg-red-900/40';
        default:
          return 'bg-gray-700/40';
      }
    }
  };

  const getEmotionEmoji = (emotion?: string) => {
    if (!emotion) return '';

    switch (emotion.toLowerCase()) {
      case 'happy':
        return '😊';
      case 'excited':
        return '🤩';
      case 'sad':
        return '😢';
      case 'scared':
        return '😰';
      case 'angry':
        return '😠';
      case 'frustrated':
        return '😤';
      default:
        return '';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading && messages.length === 0) {
    return (
      <div className={`${isLight ? 'bg-white' : 'bg-dark-100 border border-white/10'} rounded-lg shadow-lg p-6`}>
        <LoadingSpinner message="Loading chat history..." />
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className={`${isLight ? 'bg-red-100 border-red-400' : 'bg-red-900/20 border-red-500/30'} border-2 rounded-lg p-6`}>
        <p className={`${isLight ? 'text-red-700' : 'text-red-400'} font-semibold`}>{error}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={`${isLight ? 'bg-gray-50 border-gray-300' : 'bg-dark-100 border-white/10'} border-2 rounded-lg p-6 text-center`}>
        <div className="text-5xl mb-3">💬</div>
        <p className={`${isLight ? 'text-gray-700' : 'text-white'} font-semibold`}>No messages yet</p>
        <p className={`${isLight ? 'text-gray-500' : 'text-gray-400'} text-sm mt-2`}>Chat history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
          Chat History ({messages.length} messages)
        </h2>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchMessages}
            disabled={loading}
            className={`${
              isLight
                ? 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400'
                : 'bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700'
            } text-white font-semibold py-2 px-4 rounded-lg transition-colors`}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className={`text-sm ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Auto-refresh</span>
          </label>
        </div>
      </div>

      <div className={`${isLight ? 'bg-white' : 'bg-dark-100 border border-white/10'} rounded-lg shadow-lg p-6 max-h-[600px] overflow-y-auto`}>
        <div className="space-y-4">
          {messages.map((message) => {
            const isChild = message.role === 'child';
            const isAssistant = message.role === 'assistant';

            return (
              <div
                key={message.id}
                className={`
                  flex gap-3
                  ${isAssistant ? 'flex-row' : 'flex-row-reverse'}
                `}
              >
                {/* Avatar */}
                <div
                  className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl
                    ${isLight
                      ? (isChild ? 'bg-blue-500' : 'bg-purple-500')
                      : (isChild ? 'bg-blue-700' : 'bg-purple-700')
                    }
                  `}
                >
                  {isChild ? '👦' : '🤖'}
                </div>

                {/* Message Content */}
                <div className={`flex-1 max-w-[70%] ${isChild ? 'text-right' : 'text-left'}`}>
                  {/* Sender and Time */}
                  <div className={`flex items-center gap-2 mb-1 ${isChild ? 'justify-end' : 'justify-start'}`}>
                    <span className={`font-semibold text-sm ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                      {isChild ? 'Child' : 'AI Assistant'}
                    </span>
                    <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                      {formatTime(message.timestamp)}
                    </span>
                    {message.emotion && isChild && (
                      <span className="text-sm" title={message.emotion}>
                        {getEmotionEmoji(message.emotion)}
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`
                      inline-block rounded-lg px-4 py-2
                      ${isChild
                        ? `${getEmotionColor(message.emotion)} ${isLight ? 'text-gray-800' : 'text-gray-100'}`
                        : isLight
                          ? 'bg-purple-100 text-gray-800'
                          : 'bg-purple-900/40 text-purple-100'
                      }
                    `}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>

                    {/* Additional Indicators */}
                    <div className="flex gap-2 mt-2 text-xs">
                      {message.has_image && (
                        <span className={`${isLight ? 'bg-white/50' : 'bg-white/10'} px-2 py-1 rounded`}>
                          📸 Image
                        </span>
                      )}
                      {message.audio_url && (
                        <span className={`${isLight ? 'bg-white/50' : 'bg-white/10'} px-2 py-1 rounded`}>
                          🔊 Audio
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className={`${isLight ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300'} border-2 rounded-lg p-4`}>
          <p className="text-sm">
            ⚠️ {error} - Showing cached messages
          </p>
        </div>
      )}
    </div>
  );
};