// ============================================================================
// ParentAssistant - AI-powered parenting advice based on child's conversations
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
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

export const ParentAssistant: React.FC<ParentAssistantProps> = ({
  sessionId,
  childName,
  childAge,
}) => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [conversationSummary, setConversationSummary] = useState<ConversationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeHistory, setIncludeHistory] = useState(true);

  const loadConversationSummary = useCallback(async () => {
    try {
      const summary = await api.parentAssistant.getConversationSummary(sessionId);
      setConversationSummary(summary);
    } catch (err) {
      console.error('Failed to load conversation summary:', err);
    }
  }, [sessionId]);

  // Load conversation summary on mount
  useEffect(() => {
    loadConversationSummary();
  }, [sessionId, loadConversationSummary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await api.parentAssistant.getAdvice({
        session_id: sessionId,
        parent_question: question,
        include_conversation_history: includeHistory,
      });

      setResponse(result);
    } catch (err) {
      console.error('Failed to get advice:', err);
      let errorMessage = 'Failed to get advice. Please try again.';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        errorMessage = axiosError.response?.data?.detail || errorMessage;
      }
      setError(errorMessage);
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="text-4xl">🤖</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">AI Parenting Assistant</h2>
            <p className="text-gray-600 mt-1">
              Get personalized parenting advice based on {childName}'s conversations
            </p>
          </div>
        </div>

        {/* Conversation Summary */}
        {conversationSummary && conversationSummary.message_count > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">📊 Conversation Overview</h3>
            <p className="text-sm text-blue-800 mb-2">{conversationSummary.summary}</p>
            <div className="flex gap-4 text-sm text-blue-700">
              <span>💬 {conversationSummary.message_count} messages</span>
              {conversationSummary.emotions_detected.length > 0 && (
                <span>
                  😊 Emotions: {conversationSummary.emotions_detected.join(', ')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Question Form */}
        <form onSubmit={handleSubmit} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What would you like to know about parenting {childName}?
          </label>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about parenting, supporting your child's development, or addressing concerns..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={4}
            disabled={loading}
          />

          <div className="flex items-center gap-4 mt-3">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={includeHistory}
                onChange={(e) => setIncludeHistory(e.target.checked)}
                className="rounded"
              />
              Include conversation history in analysis
            </label>

            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="ml-auto px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Getting advice...
                </span>
              ) : (
                'Get Advice'
              )}
            </button>
          </div>
        </form>

        {/* Suggested Questions */}
        {!response && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">💡 Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuestion(q)}
                  className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                  disabled={loading}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Response */}
      {response && (
        <div className="space-y-4">
          {/* Main Advice */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>💡</span>
              Personalized Advice
            </h3>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {response.advice}
            </div>
          </div>

          {/* Summary */}
          {response.conversation_summary && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-5">
              <h4 className="font-semibold text-blue-900 mb-2">📝 Observation</h4>
              <p className="text-blue-800">{response.conversation_summary}</p>
            </div>
          )}

          {/* Key Insights */}
          {response.key_insights.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow p-5">
              <h4 className="font-semibold text-purple-900 mb-3">🔍 Key Insights</h4>
              <ul className="space-y-2">
                {response.key_insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-purple-800">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Actions */}
          {response.suggested_actions.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow p-5">
              <h4 className="font-semibold text-green-900 mb-3">✅ Suggested Actions</h4>
              <ul className="space-y-2">
                {response.suggested_actions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-green-800">
                    <span className="text-green-500 font-bold">{idx + 1}.</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ask Another Question */}
          <div className="text-center">
            <button
              onClick={() => {
                setResponse(null);
                setQuestion('');
              }}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
            >
              Ask Another Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
