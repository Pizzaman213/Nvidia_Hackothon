// ============================================================================
// ParentAssistant - AI-powered parenting advice chat interface
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';

interface ParentAssistantProps {
  sessionId: string;
  childName: string;
  childAge: number;
}

interface ConversationSummary {
  summary: string;
  message_count: number;
  emotions_detected: string[];
  child_name: string;
  child_age: number;
}

interface AssistantResponse {
  advice: string;
  conversation_summary: string | null;
  key_insights: string[];
  suggested_actions: string[];
}

interface ChatMessage {
  id: string;
  role: 'parent' | 'assistant';
  content: string;
  timestamp: Date;
  response?: AssistantResponse;
}

export const ParentAssistant: React.FC<ParentAssistantProps> = ({
  sessionId,
  childName,
  childAge,
}) => {
  const [question, setQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [conversationSummary, setConversationSummary] = useState<ConversationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeHistory, setIncludeHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Theme-aware classes (currently using light theme defaults)
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const loadConversationSummary = useCallback(async () => {
    if (!sessionId) return; // Skip if no session
    try {
      const summary = await api.parentAssistant.getConversationSummary(sessionId);
      setConversationSummary(summary);
    } catch (err) {
      console.error('Failed to load conversation summary:', err);
    }
  }, [sessionId]);

  // Load conversation history on mount
  const loadConversationHistory = useCallback(async () => {
    if (!sessionId) return; // Skip if no session
    try {
      const history = await api.parentAssistant.getConversationHistory(sessionId);

      // Convert history messages to chat messages
      const loadedMessages: ChatMessage[] = history.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        response: msg.response,
      }));

      setChatMessages(loadedMessages);
    } catch (err) {
      console.error('Failed to load conversation history:', err);
    }
  }, [sessionId]);

  // Load conversation summary and history on mount
  useEffect(() => {
    if (sessionId) {
      loadConversationSummary();
      loadConversationHistory();
    }
  }, [sessionId, loadConversationSummary, loadConversationHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    // Add parent message to chat
    const parentMessage: ChatMessage = {
      id: `parent-${Date.now()}`,
      role: 'parent',
      content: question.trim(),
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, parentMessage]);
    setQuestion('');
    setLoading(true);
    setError(null);

    try {
      // If no session, provide general parenting advice
      if (!sessionId) {
        // Use a dummy session ID to get general advice
        const result = await api.parentAssistant.getAdvice({
          session_id: 'general-advice',
          parent_question: `I have a question about parenting my ${childAge}-year-old child named ${childName}. ${parentMessage.content}`,
          include_conversation_history: false,
        });

        // Add assistant response to chat
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.advice + "\n\n💡 Note: For more personalized advice based on your child's recent conversations, have them chat with the AI assistant first!",
          timestamp: new Date(),
          response: result,
        };

        setChatMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Normal flow with session
        const result = await api.parentAssistant.getAdvice({
          session_id: sessionId,
          parent_question: parentMessage.content,
          include_conversation_history: includeHistory,
        });

        // Add assistant response to chat
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.advice,
          timestamp: new Date(),
          response: result,
        };

        setChatMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error('Failed to get advice:', err);
      let errorMessage = 'Failed to get advice. Please try again.';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        errorMessage = axiosError.response?.data?.detail || errorMessage;
      }
      setError(errorMessage);

      // Add error message to chat
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${errorMessage}`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    `How can I help ${childName} with their emotions?`,
    `What activities would be good for ${childName}?`,
    `How can I support ${childName}'s learning?`,
    `Are there any concerns I should address with ${childName}?`,
    `How can I encourage ${childName} to open up more?`,
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] max-w-5xl mx-auto">
      {/* Header with Summary */}
      <div className="glass-dark rounded-2xl p-6 mb-4 animate-fade-in">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-neon-purple to-neon-pink rounded-xl flex items-center justify-center text-3xl glow-purple">
            🤖
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold font-geometric text-white mb-1">
              AI Parenting Assistant
            </h2>
            <p className="text-gray-400">
              Get personalized parenting advice about {childName}
            </p>
          </div>

          {/* Settings Toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={includeHistory}
              onChange={(e) => setIncludeHistory(e.target.checked)}
              className="rounded bg-white/10 border-white/20 text-neon-purple focus:ring-neon-purple"
            />
            Include conversation history
          </label>
        </div>

        {/* Conversation Summary */}
        {conversationSummary && conversationSummary.message_count > 0 && (
          <div className="glass rounded-xl p-4 border border-neon-cyan/20">
            <h3 className="font-semibold text-neon-cyan mb-2 flex items-center gap-2">
              <span>📊</span>
              <span>Conversation Overview</span>
            </h3>
            <p className="text-sm text-gray-300 mb-2">{conversationSummary.summary}</p>
            <div className="flex gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <span className="text-neon-cyan">💬</span>
                {conversationSummary.message_count} messages
              </span>
              {conversationSummary.emotions_detected.length > 0 && (
                <span className="flex items-center gap-1">
                  <span className="text-neon-pink">😊</span>
                  Emotions: {conversationSummary.emotions_detected.join(', ')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 glass-dark rounded-2xl p-6 mb-4 overflow-y-auto space-y-4 animate-fade-in"
        style={{ minHeight: '400px' }}
      >
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 rounded-3xl flex items-center justify-center text-5xl mb-6">
              💬
            </div>
            <h3 className="text-xl font-bold font-geometric text-white mb-3">
              Start a Conversation
            </h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Ask me anything about parenting {childName}. I'll remember our conversation and provide personalized advice.
            </p>

            {/* Suggested Questions */}
            <div className="w-full max-w-2xl">
              <p className="text-sm font-medium text-gray-400 mb-3">💡 Suggested questions:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuestion(q)}
                    className="text-sm px-4 py-2 glass rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all hover-glow-cyan"
                    disabled={loading}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'parent' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-3xl ${
                    message.role === 'parent'
                      ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-2xl rounded-tr-sm'
                      : 'glass border border-white/10 text-gray-200 rounded-2xl rounded-tl-sm'
                  } p-4 shadow-lg`}
                >
                  {/* Message Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {message.role === 'parent' ? '👤' : '🤖'}
                    </span>
                    <span className="text-xs font-mono text-gray-300">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Message Content */}
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>

                  {/* Detailed Response Sections */}
                  {message.response && (
                    <div className="mt-4 space-y-3">
                      {/* Conversation Summary */}
                      {message.response.conversation_summary && (
                        <div className="glass rounded-lg p-3 border border-neon-cyan/20">
                          <h4 className="font-semibold text-neon-cyan text-xs mb-1 flex items-center gap-1">
                            <span>📝</span>
                            <span>Observation</span>
                          </h4>
                          <p className="text-xs text-gray-300">{message.response.conversation_summary}</p>
                        </div>
                      )}

                      {/* Key Insights */}
                      {message.response.key_insights.length > 0 && (
                        <div className="glass rounded-lg p-3 border border-neon-purple/20">
                          <h4 className="font-semibold text-neon-purple text-xs mb-2 flex items-center gap-1">
                            <span>🔍</span>
                            <span>Key Insights</span>
                          </h4>
                          <ul className="space-y-1">
                            {message.response.key_insights.map((insight: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                                <span className="text-neon-purple mt-0.5">•</span>
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Suggested Actions */}
                      {message.response.suggested_actions.length > 0 && (
                        <div className="glass rounded-lg p-3 border border-terminal-green/20">
                          <h4 className="font-semibold text-terminal-green text-xs mb-2 flex items-center gap-1">
                            <span>✅</span>
                            <span>Suggested Actions</span>
                          </h4>
                          <ul className="space-y-1">
                            {message.response.suggested_actions.map((action: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                                <span className="text-terminal-green font-bold">{idx + 1}.</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="glass border border-white/10 rounded-2xl rounded-tl-sm p-4 max-w-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-neon-pink rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-gray-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input Bar - Fixed at Bottom */}
      <div className="glass-dark rounded-2xl p-4 animate-fade-in">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`Ask about parenting ${childName}...`}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all"
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl font-semibold font-geometric hover:shadow-lg hover-glow-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>💬</span>
                <span>Send</span>
              </>
            )}
          </button>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mt-3 glass rounded-lg p-3 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
