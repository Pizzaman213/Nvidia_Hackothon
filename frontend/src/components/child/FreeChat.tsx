// ============================================================================
// FreeChat - Enhanced conversational chat interface
// ============================================================================

import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { useSession } from '../../contexts/SessionContext';
import { useVoice } from '../../contexts/VoiceContext';
import { Message, ChatRequest } from '../../types';
import api from '../../services/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';

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
              <span className="font-semibold text-white text-sm">
                My Thinking Process
              </span>
            </div>
            <span className="text-white text-lg">
              {isThinkingExpanded ? '▼' : '▶'}
            </span>
          </button>

          {isThinkingExpanded && (
            <div className="px-4 pb-3 pt-1">
              <div className="prose prose-sm max-w-none prose-purple text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {parsed.thinking}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Response */}
      <div className="prose prose-base max-w-none prose-headings:font-child prose-p:font-child prose-li:font-child text-white">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Customize heading styles
            // eslint-disable-next-line jsx-a11y/heading-has-content
            h1: (props: React.ComponentPropsWithoutRef<'h1'>) => <h1 className="text-2xl font-bold mb-3 text-white" {...props} />,
            // eslint-disable-next-line jsx-a11y/heading-has-content
            h2: (props: React.ComponentPropsWithoutRef<'h2'>) => <h2 className="text-xl font-bold mb-2 text-white" {...props} />,
            // eslint-disable-next-line jsx-a11y/heading-has-content
            h3: (props: React.ComponentPropsWithoutRef<'h3'>) => <h3 className="text-lg font-bold mb-2 text-white" {...props} />,
            // Customize list styles
            ul: (props: React.ComponentPropsWithoutRef<'ul'>) => <ul className="list-disc pl-6 space-y-1 my-2 text-white" {...props} />,
            ol: (props: React.ComponentPropsWithoutRef<'ol'>) => <ol className="list-decimal pl-6 space-y-1 my-2 text-white" {...props} />,
            li: (props: React.ComponentPropsWithoutRef<'li'>) => <li className="text-white" {...props} />,
            // Customize paragraph styles
            p: (props: React.ComponentPropsWithoutRef<'p'>) => <p className="mb-2 leading-relaxed text-white" {...props} />,
            // Customize code blocks
            code: (props: React.ComponentPropsWithoutRef<'code'>) => {
              const { className, children } = props;
              const inline = !className;
              return inline ? (
                <code className="bg-purple-900/30 px-1.5 py-0.5 rounded text-sm font-mono text-white">
                  {children}
                </code>
              ) : (
                <code className="block bg-gray-900/30 p-3 rounded-lg my-2 text-sm font-mono overflow-x-auto text-white">
                  {children}
                </code>
              );
            },
            // Customize blockquotes
            blockquote: (props: React.ComponentPropsWithoutRef<'blockquote'>) => (
              <blockquote className="border-l-4 border-purple-300 pl-4 italic my-2 text-white" {...props} />
            ),
            // Customize strong text
            strong: (props: React.ComponentPropsWithoutRef<'strong'>) => <strong className="font-bold text-white" {...props} />,
            // Customize links
            // eslint-disable-next-line jsx-a11y/anchor-has-content
            a: (props: React.ComponentPropsWithoutRef<'a'>) => (
              // eslint-disable-next-line jsx-a11y/anchor-has-content
              <a className="text-cyan-300 hover:text-cyan-100 underline" target="_blank" rel="noopener noreferrer" {...props} />
            ),
          } as Components}
        >
          {parsed.response}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export const FreeChat: React.FC = () => {
  const { session } = useSession();
  const {
    isListening,
    isSpeaking,
    currentTranscript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    error: voiceError,
  } = useVoice();

  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSpoken, setHasSpoken] = useState(false);
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if teen (10+) for different UI
  const isTeen = (session?.child_age ?? 0) >= 10;

  const quickTopics = [
    { emoji: '😂', text: 'Tell me a joke' },
    { emoji: '🎮', text: 'Let\'s play a game' },
    { emoji: '🦖', text: 'Tell me about dinosaurs' },
    { emoji: '🚀', text: 'Tell me about space' },
    { emoji: '🎨', text: 'Let\'s be creative' },
    { emoji: '🌍', text: 'Tell me fun facts' },
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(
    async (messageText: string) => {
      if (!session || !messageText.trim() || isProcessing) return;

      setIsProcessing(true);
      setError(null);
      setTextInput('');

      // Add child's message to chat
      const childMessage: Message = {
        id: Date.now().toString(),
        content: messageText,
        sender: 'child',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, childMessage]);

      try {
        // Send to backend
        const request: ChatRequest = {
          message: messageText,
          session_id: session.session_id,
          child_age: session.child_age,
        };

        const response = await api.chat.sendMessage(request);

        // Add AI response to chat
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.response,
          sender: 'ai',
          timestamp: new Date(),
          audio_url: response.audio_url,
        };
        setMessages((prev) => [...prev, aiMessage]);

        // Speak the response
        speak(response.response);

        // Check for safety concerns
        if (response.safety_status && !['none', 'low'].includes(response.safety_status)) {
          console.warn('Safety concern detected:', response.safety_status, 'for message:', messageText);
        }
      } catch (err) {
        console.error('Failed to send message:', err);
        const errMsg = err instanceof Error ? err.message : 'Failed to send message';
        setError(errMsg);

        // Add error message
        const aiErrorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "I'm sorry, I couldn't understand that. Can you try again?",
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiErrorMessage]);
      } finally {
        setIsProcessing(false);
      }
    },
    [session, isProcessing, speak]
  );

  // When user stops speaking (transcript complete), send to AI
  useEffect(() => {
    if (
      currentTranscript &&
      hasSpoken &&
      !isListening &&
      !isProcessing &&
      currentTranscript !== lastProcessedTranscript
    ) {
      setLastProcessedTranscript(currentTranscript);
      handleSendMessage(currentTranscript);
    }
  }, [currentTranscript, isListening, hasSpoken, isProcessing, lastProcessedTranscript, handleSendMessage]);

  const handleStartListening = () => {
    setHasSpoken(false);
    setLastProcessedTranscript(''); // Reset to allow new transcript
    startListening();
    setTimeout(() => setHasSpoken(true), 200); // Reduced delay for faster response
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      handleSendMessage(textInput);
    }
  };

  const handleQuickTopic = (topic: string) => {
    handleSendMessage(topic);
  };

  // Teen UI (10+) - Modern Terminal/Claude Code style
  if (isTeen) {
    return (
      <div className="flex-1 flex flex-col bg-dark relative overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-purple/5 pointer-events-none"></div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 relative z-10">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Welcome State */}
            {messages.length === 0 && (
              <div className="text-center py-16 animate-fade-in">
                <div className="inline-block relative mb-8">
                  <div className="absolute inset-0 blur-3xl bg-neon-cyan/20 animate-pulse"></div>
                  <div className="relative text-8xl animate-float">💬</div>
                </div>
                <h2 className="text-5xl font-bold font-geometric text-white mb-4 tracking-tight">
                  Hey {session?.child_name}!
                </h2>
                <p className="text-xl text-gray-400 font-geometric mb-12">
                  What's on your mind?
                </p>

                {/* Quick Topics - Bento Grid Style */}
                <div className="max-w-3xl mx-auto">
                  <p className="text-sm text-gray-500 font-geometric mb-6 uppercase tracking-wider">
                    Quick Start
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {quickTopics.map((topic) => (
                      <button
                        key={topic.text}
                        onClick={() => handleQuickTopic(topic.text)}
                        className="group relative backdrop-blur-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-cyan/50 p-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-neon-cyan/20 hover:scale-105"
                      >
                        <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                          {topic.emoji}
                        </div>
                        <div className="text-sm font-geometric text-gray-300 group-hover:text-white transition-colors">
                          {topic.text}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`
                  flex items-start gap-4 animate-slide-up
                  ${message.sender === 'child' ? 'flex-row-reverse' : 'flex-row'}
                `}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div
                    className={`
                      w-12 h-12 rounded-lg flex items-center justify-center text-2xl backdrop-blur-lg border
                      ${message.sender === 'child'
                        ? 'bg-neon-cyan/10 border-neon-cyan/30 shadow-lg shadow-neon-cyan/20'
                        : 'bg-neon-purple/10 border-neon-purple/30 shadow-lg shadow-neon-purple/20'
                      }
                    `}
                  >
                    {message.sender === 'child' ? '👤' : '🤖'}
                  </div>
                </div>

                {/* Message Bubble - Glassmorphic */}
                <div
                  className={`
                    max-w-2xl rounded-2xl backdrop-blur-xl border p-6
                    ${
                      message.sender === 'child'
                        ? 'bg-neon-cyan/10 border-neon-cyan/30 shadow-lg shadow-neon-cyan/10'
                        : 'bg-white/5 border-white/10 shadow-lg'
                    }
                  `}
                >
                  {/* Message Content */}
                  {message.sender === 'ai' ? (
                    <div className="text-white">
                      <AIMessageContent content={message.content} />
                    </div>
                  ) : (
                    <p className="font-geometric text-base text-white whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`
                      text-xs mt-3 font-mono
                      ${message.sender === 'child' ? 'text-cyan-300/60' : 'text-gray-500'}
                    `}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex items-start gap-4 animate-fade-in">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl backdrop-blur-lg bg-neon-purple/10 border border-neon-purple/30 shadow-lg shadow-neon-purple/20 animate-pulse">
                    🤖
                  </div>
                </div>
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm font-mono text-gray-400">Processing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error Display */}
        {(error || voiceError) && (
          <div className="mx-6 mb-3 backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-300 font-geometric text-sm">{error || voiceError}</p>
          </div>
        )}

        {/* Current Transcript Display */}
        {isListening && currentTranscript && (
          <div className="mx-6 mb-3 backdrop-blur-xl bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-4 animate-pulse">
            <p className="text-cyan-300 font-mono text-sm">
              <span className="text-gray-400">▸</span> {currentTranscript}
            </p>
          </div>
        )}

        {/* Input Area - Terminal Style */}
        <div className="backdrop-blur-xl bg-dark-50/90 border-t border-white/10 p-6 relative z-20">
          <div className="max-w-5xl mx-auto">
            {/* Voice Controls */}
            <div className="flex items-center justify-center gap-4 mb-4">
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="px-6 py-3 rounded-lg backdrop-blur-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 font-geometric text-sm font-medium transition-all hover:shadow-lg hover:shadow-yellow-500/20"
                >
                  🔇 Stop Speaking
                </button>
              )}

              {!isListening && !isSpeaking && !isProcessing && (
                <button
                  onClick={handleStartListening}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple hover:scale-110 active:scale-95 shadow-lg shadow-neon-cyan/50 transition-all duration-200 flex items-center justify-center animate-glow"
                  aria-label="Start talking"
                >
                  <span className="text-3xl">🎤</span>
                </button>
              )}

              {isListening && (
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={stopListening}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:scale-110 shadow-lg shadow-red-500/50 animate-pulse transition-all duration-200 flex items-center justify-center"
                    aria-label="Stop talking"
                  >
                    <span className="text-3xl">⏹</span>
                  </button>

                  {/* Animated Waveform */}
                  <div className="flex gap-1 h-8 items-end">
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gradient-to-t from-neon-cyan to-neon-purple rounded-t animate-waveform"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-gray-400 font-mono uppercase tracking-wider animate-pulse">
                    Listening...
                  </p>
                </div>
              )}
            </div>

            {/* Text Input - Terminal Style */}
            {!isListening && !isSpeaking && (
              <div className="relative">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTextSubmit();
                      }}
                      disabled={isProcessing}
                      className="w-full px-6 py-4 backdrop-blur-xl bg-white/5 border border-white/10 focus:border-neon-cyan/50 rounded-xl font-geometric text-white placeholder-gray-500 focus:outline-none focus:shadow-lg focus:shadow-neon-cyan/20 transition-all disabled:opacity-50"
                      placeholder="Type a message or use voice..."
                    />
                  </div>
                  <button
                    onClick={handleTextSubmit}
                    disabled={!textInput.trim() || isProcessing}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple hover:shadow-lg hover:shadow-neon-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed text-white font-geometric font-medium transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100"
                  >
                    Send
                  </button>
                </div>

                {/* Help Text */}
                {!isProcessing && messages.length === 0 && (
                  <p className="text-center text-xs text-gray-600 mt-3 font-mono uppercase tracking-wider">
                    Press Enter to send • Click mic for voice
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Original child UI (under 10)
  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-8xl mb-4 animate-bounce">💬</div>
              <h2 className="text-4xl font-bold text-purple-600 font-child mb-4">
                Hi {session?.child_name}!
              </h2>
              <p className="text-2xl text-gray-600 font-child mb-8">
                What would you like to talk about today?
              </p>

              {/* Quick Topics */}
              <div className="max-w-2xl mx-auto">
                <p className="text-lg text-gray-600 font-child mb-4">
                  Try one of these topics:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {quickTopics.map((topic) => (
                    <button
                      key={topic.text}
                      onClick={() => handleQuickTopic(topic.text)}
                      className="bg-white hover:bg-purple-50 text-gray-700 p-4 rounded-2xl shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child"
                    >
                      <div className="text-3xl mb-2">{topic.emoji}</div>
                      <div className="text-sm font-bold">{topic.text}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`
                flex items-start gap-3
                ${message.sender === 'child' ? 'flex-row-reverse' : 'flex-row'}
              `}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-2xl
                    ${message.sender === 'child' ? 'bg-blue-400' : 'bg-purple-400'}
                  `}
                >
                  {message.sender === 'child' ? '👦' : '🤖'}
                </div>
              </div>

              {/* Message Bubble */}
              <div
                className={`
                  max-w-2xl rounded-3xl shadow-lg p-6
                  ${
                    message.sender === 'child'
                      ? 'bg-blue-500 text-white rounded-tr-none'
                      : 'bg-purple-600 text-white rounded-tl-none'
                  }
                  animate-fadeIn
                `}
              >
                {/* Message Content */}
                {message.sender === 'ai' ? (
                  <AIMessageContent content={message.content} />
                ) : (
                  <p className="font-child text-lg whitespace-pre-wrap text-white">
                    {message.content}
                  </p>
                )}

                <div
                  className={`
                    text-xs mt-2
                    ${message.sender === 'child' ? 'text-blue-100' : 'text-purple-200'}
                  `}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-purple-400">
                  🤖
                </div>
              </div>
              <div className="bg-white rounded-3xl rounded-tl-none shadow-lg p-6">
                <LoadingSpinner size="small" message="Thinking..." />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error Display */}
      {(error || voiceError) && (
        <div className="mx-6 mb-2 bg-red-100 border-4 border-red-400 rounded-2xl p-3 text-center">
          <p className="text-red-700 font-child">{error || voiceError}</p>
        </div>
      )}

      {/* Current Transcript Display */}
      {isListening && currentTranscript && (
        <div className="mx-6 mb-2 bg-blue-100 border-4 border-blue-400 rounded-2xl p-3">
          <p className="text-blue-700 font-child text-sm">
            You're saying: <span className="font-bold">{currentTranscript}</span>
          </p>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t-4 border-purple-300 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Voice Controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* Stop Speaking Button */}
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child"
              >
                🔇 Stop Talking
              </button>
            )}

            {/* Microphone Button */}
            {!isListening && !isSpeaking && !isProcessing && (
              <button
                onClick={handleStartListening}
                className="w-16 h-16 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-xl transform transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                aria-label="Start talking"
              >
                <span className="text-3xl">🎤</span>
              </button>
            )}

            {/* Listening Indicator */}
            {isListening && (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={stopListening}
                  className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-xl animate-pulse flex items-center justify-center"
                  aria-label="Stop talking"
                >
                  <span className="text-3xl">🎤</span>
                </button>

                {/* Animated Waveform */}
                <div className="flex gap-1 h-8 items-end">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 bg-purple-500 rounded-t animate-waveform"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>

                <p className="text-sm text-gray-600 font-child animate-pulse">
                  Listening...
                </p>
              </div>
            )}
          </div>

          {/* Text Input */}
          {!isListening && !isSpeaking && (
            <>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTextSubmit();
                  }}
                  disabled={isProcessing}
                  className="flex-1 px-6 py-4 border-4 border-purple-300 rounded-2xl text-xl font-child focus:outline-none focus:ring-4 focus:ring-purple-400 disabled:bg-gray-100"
                  placeholder="Type a message or press the microphone..."
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || isProcessing}
                  className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-2xl shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child text-xl"
                >
                  Send
                </button>
              </div>

              {/* Help Text */}
              {!isProcessing && messages.length === 0 && (
                <p className="text-center text-sm text-gray-500 mt-3 font-child">
                  You can type or press the microphone to talk
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
