// ============================================================================
// ParentAssistant - AI-powered parenting advice chat interface
// ============================================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api';
import { useParallelAsyncData } from '../../hooks/useAsyncData';

interface ParentAssistantProps {
  sessionId: string;
  childName: string;
  childAge: number;
}

interface Citation {
  source: string;
  url: string;
  relevance: number;
  source_type: string;
}

interface AssistantResponse {
  advice: string;
  conversation_summary: string | null;
  key_insights: string[];
  suggested_actions: string[];
  citations: Citation[];  // Now required - backend always provides this (empty array if no citations)
}

interface ChatMessage {
  id: string;
  role: 'parent' | 'assistant';
  content: string;
  timestamp: Date;
  response?: AssistantResponse;
  isReasoningExpanded?: boolean;
  isThinkingExpanded?: boolean;
  thinkingContent?: string;
  cleanContent?: string;
}

export const ParentAssistant: React.FC<ParentAssistantProps> = ({
  sessionId,
  childName,
  childAge,
}) => {
  const [question, setQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChildConversation, setShowChildConversation] = useState(false);
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

  // Extract <think> tags from content
  const extractThinkingContent = (content: string): { cleanContent: string; thinkingContent: string | null } => {
    const thinkRegex = /<think>([\s\S]*?)<\/think>/i;
    const match = content.match(thinkRegex);

    if (match) {
      return {
        cleanContent: content.replace(thinkRegex, '').trim(),
        thinkingContent: match[1].trim()
      };
    }

    return {
      cleanContent: content,
      thinkingContent: null
    };
  };

  // Load all data in parallel using custom hook - prevents race conditions
  const asyncFunctions = useMemo(() => ({
    conversationSummary: async () => {
      if (!sessionId) return null;
      return await api.parentAssistant.getConversationSummary(sessionId);
    },
    conversationHistory: async () => {
      if (!sessionId) return { messages: [] };
      const history = await api.parentAssistant.getConversationHistory(sessionId);

      // Convert history messages to chat messages
      const loadedMessages: ChatMessage[] = history.messages.map(msg => {
        const { cleanContent, thinkingContent } = extractThinkingContent(msg.content);
        return {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          cleanContent,
          thinkingContent: thinkingContent || undefined,
          timestamp: new Date(msg.timestamp),
          response: msg.response,
          isReasoningExpanded: false,
          isThinkingExpanded: false,
        };
      });

      return { messages: loadedMessages };
    },
    childMessages: async () => {
      if (!sessionId) return [];
      return await api.session.getMessages(sessionId);
    }
  }), [sessionId]);

  const { data: assistantData } = useParallelAsyncData(
    asyncFunctions,
    { deps: [sessionId], autoFetch: !!sessionId }
  );

  // Update local state when data loads
  useEffect(() => {
    if (assistantData.conversationHistory?.messages) {
      setChatMessages(assistantData.conversationHistory.messages);
    }
  }, [assistantData.conversationHistory]);

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
          parent_question: parentMessage.content,
          include_conversation_history: false,
          child_name: childName,
          child_age: childAge,
        });

        // Add assistant response to chat
        const fullContent = result.advice + "\n\n💡 Note: For more personalized advice based on your child's recent conversations, have them chat with the AI assistant first!";
        const { cleanContent, thinkingContent } = extractThinkingContent(fullContent);
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fullContent,
          cleanContent,
          thinkingContent: thinkingContent || undefined,
          timestamp: new Date(),
          response: {
            ...result,
            citations: result.citations || []  // Ensure citations array is always present
          },
          isReasoningExpanded: false,
          isThinkingExpanded: false,
        };

        setChatMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Normal flow with session
        const result = await api.parentAssistant.getAdvice({
          session_id: sessionId,
          parent_question: parentMessage.content,
          include_conversation_history: includeHistory,
          child_name: childName,
          child_age: childAge,
        });

        // Add assistant response to chat
        const { cleanContent, thinkingContent } = extractThinkingContent(result.advice);
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.advice,
          cleanContent,
          thinkingContent: thinkingContent || undefined,
          timestamp: new Date(),
          response: {
            ...result,
            citations: result.citations || []  // Ensure citations array is always present
          },
          isReasoningExpanded: false,
          isThinkingExpanded: false,
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

  const toggleReasoning = (messageId: string) => {
    setChatMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, isReasoningExpanded: !msg.isReasoningExpanded }
        : msg
    ));
  };

  const toggleThinking = (messageId: string) => {
    setChatMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, isThinkingExpanded: !msg.isThinkingExpanded }
        : msg
    ));
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

        {/* Conversation Summary - Enhanced */}
        {assistantData.conversationSummary && assistantData.conversationSummary.message_count > 0 && (
          <div className="glass rounded-xl p-5 border border-neon-cyan/20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-neon-cyan mb-1 flex items-center gap-2">
                  <span>📊</span>
                  <span>{childName}'s Conversation Summary</span>
                </h3>
                <p className="text-xs text-gray-400">What {childName} has been talking about with the AI</p>
              </div>
              <button
                onClick={() => setShowChildConversation(!showChildConversation)}
                className="px-3 py-1.5 text-xs bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan rounded-lg transition-all border border-neon-cyan/30 hover:border-neon-cyan/50 flex items-center gap-1"
              >
                <span>{showChildConversation ? '👁️‍🗨️' : '👁️'}</span>
                <span>{showChildConversation ? 'Hide' : 'View'} Full Chat</span>
              </button>
            </div>

            {/* Summary Text */}
            <div className="bg-white/5 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-200 leading-relaxed">{assistantData.conversationSummary.summary}</p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-2 bg-neon-cyan/10 px-3 py-1.5 rounded-lg">
                <span className="text-neon-cyan">💬</span>
                <span className="text-gray-300">{assistantData.conversationSummary.message_count} messages</span>
              </div>
              {assistantData.conversationSummary.emotions_detected.length > 0 && (
                <div className="flex items-center gap-2 bg-neon-pink/10 px-3 py-1.5 rounded-lg">
                  <span className="text-neon-pink">😊</span>
                  <span className="text-gray-300">Emotions: {assistantData.conversationSummary.emotions_detected.join(', ')}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-neon-purple/10 px-3 py-1.5 rounded-lg">
                <span className="text-neon-purple">👤</span>
                <span className="text-gray-300">{childName}, {childAge} years old</span>
              </div>
            </div>

            {/* Full Child Conversation - Collapsible */}
            {showChildConversation && assistantData.childMessages && assistantData.childMessages.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in">
                <h4 className="text-sm font-semibold text-neon-purple mb-3 flex items-center gap-2">
                  <span>💬</span>
                  <span>Full Conversation History</span>
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {assistantData.childMessages.map((msg: any, idx: number) => (
                    <div
                      key={msg.id || idx}
                      className={`text-xs p-3 rounded-lg ${
                        msg.role === 'child'
                          ? 'bg-neon-purple/10 border border-neon-purple/20 ml-4'
                          : 'bg-white/5 border border-white/10 mr-4'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">
                          {msg.role === 'child' ? '👧' : '🤖'}
                        </span>
                        <span className="font-semibold text-gray-300">
                          {msg.role === 'child' ? childName : 'AI Assistant'}
                        </span>
                        {msg.emotion && (
                          <span className="text-neon-pink text-xs px-2 py-0.5 bg-neon-pink/10 rounded">
                            {msg.emotion}
                          </span>
                        )}
                        <span className="text-gray-500 text-xs ml-auto">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

                  {/* Message Content - Show clean content without <think> tags */}
                  <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                    {message.role === 'assistant' ? (
                      <ReactMarkdown
                        components={{
                          // Custom styling for markdown elements
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars, jsx-a11y/heading-has-content
                          h3: ({ node, ...props }: any) => <h3 className="text-base font-bold text-neon-cyan mt-4 mb-2" {...props} />,
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars, jsx-a11y/heading-has-content
                          h4: ({ node, ...props }: any) => <h4 className="text-sm font-semibold text-neon-purple mt-3 mb-1" {...props} />,
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          strong: ({ node, ...props }: any) => <strong className="font-semibold text-white" {...props} />,
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          ul: ({ node, ...props }: any) => <ul className="list-disc ml-5 my-2 space-y-1" {...props} />,
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          ol: ({ node, ...props }: any) => <ol className="list-decimal ml-5 my-2 space-y-1" {...props} />,
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          li: ({ node, ...props }: any) => <li className="text-gray-200" {...props} />,
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          p: ({ node, ...props }: any) => <p className="mb-3 last:mb-0" {...props} />,
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          code: ({ node, ...props }: any) => <code className="bg-white/10 px-1 py-0.5 rounded text-neon-cyan text-xs" {...props} />,
                        }}
                      >
                        {message.cleanContent || message.content}
                      </ReactMarkdown>
                    ) : (
                      <div className="whitespace-pre-wrap">{message.cleanContent || message.content}</div>
                    )}
                  </div>

                  {/* Thinking Process Dropdown - Only for assistant messages with thinking content */}
                  {message.role === 'assistant' && message.thinkingContent && (
                    <div className="mt-4">
                      {/* Toggle Button for Thinking */}
                      <button
                        onClick={() => toggleThinking(message.id)}
                        className="flex items-center gap-2 text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition-colors group w-full"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${message.isThinkingExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="group-hover:underline">
                          {message.isThinkingExpanded ? 'Hide AI Thinking Process' : 'Show AI Thinking Process'}
                        </span>
                      </button>

                      {/* Collapsible Thinking Content */}
                      {message.isThinkingExpanded && (
                        <div className="mt-3 glass rounded-lg p-3 border border-yellow-400/20 animate-fade-in">
                          <h4 className="font-semibold text-yellow-400 text-xs mb-2 flex items-center gap-1">
                            <span>🧠</span>
                            <span>Internal Reasoning</span>
                          </h4>
                          <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {message.thinkingContent}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detailed Response Sections - Collapsible */}
                  {message.response && (message.response.conversation_summary || message.response.key_insights.length > 0 || message.response.suggested_actions.length > 0) && (
                    <div className="mt-4">
                      {/* Toggle Button */}
                      <button
                        onClick={() => toggleReasoning(message.id)}
                        className="flex items-center gap-2 text-xs font-semibold text-neon-cyan hover:text-neon-purple transition-colors group w-full"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${message.isReasoningExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="group-hover:underline">
                          {message.isReasoningExpanded ? 'Hide Reasoning & Insights' : 'Show Reasoning & Insights'}
                        </span>
                      </button>

                      {/* Collapsible Content */}
                      {message.isReasoningExpanded && (
                        <div className="mt-3 space-y-3 animate-fade-in">
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

                          {/* Citations - Evidence-Based Sources */}
                          {message.response.citations && message.response.citations.length > 0 && (
                            <div className="glass rounded-lg p-3 border border-blue-400/20">
                              <h4 className="font-semibold text-blue-400 text-xs mb-2 flex items-center gap-1">
                                <span>📚</span>
                                <span>Evidence-Based Sources</span>
                              </h4>
                              <div className="space-y-2">
                                {message.response.citations.map((citation: Citation, idx: number) => (
                                  <div key={idx} className="text-xs text-gray-300 bg-white/5 rounded p-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        {citation.url ? (
                                          <a
                                            href={citation.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                                          >
                                            {citation.source}
                                          </a>
                                        ) : (
                                          <span className="text-blue-400 font-medium">{citation.source}</span>
                                        )}
                                        <span className="text-gray-500 ml-2">
                                          ({citation.source_type.toUpperCase()})
                                        </span>
                                      </div>
                                      <span className="text-gray-500 text-xs whitespace-nowrap">
                                        {citation.relevance}% relevant
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
