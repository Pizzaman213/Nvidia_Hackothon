// ============================================================================
// HomeworkHelper - Educational assistance with worksheet scanning
// ============================================================================

import React, { useState } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { useVoice } from '../../contexts/VoiceContext';
import { CameraCapture } from './CameraCapture';
import api from '../../services/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';

type Subject = 'math' | 'reading' | 'science' | 'writing' | 'other';

interface HomeworkSession {
  subject: Subject | null;
  worksheetImage: string | null;
  question: string;
  aiResponse: string | null;
  conversationHistory: Array<{ role: 'child' | 'ai'; content: string }>;
}

export const HomeworkHelper: React.FC = () => {
  const { session } = useSession();
  const { speak, stopSpeaking } = useVoice();

  const [homeworkSession, setHomeworkSession] = useState<HomeworkSession>({
    subject: null,
    worksheetImage: null,
    question: '',
    aiResponse: null,
    conversationHistory: [],
  });

  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processingStage, setProcessingStage] = useState<'uploading' | 'analyzing' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subjects = [
    { id: 'math' as Subject, emoji: '🔢', name: 'Math', color: 'from-blue-400 to-cyan-400' },
    { id: 'reading' as Subject, emoji: '📖', name: 'Reading', color: 'from-purple-400 to-pink-400' },
    { id: 'science' as Subject, emoji: '🔬', name: 'Science', color: 'from-green-400 to-teal-400' },
    { id: 'writing' as Subject, emoji: '✏️', name: 'Writing', color: 'from-orange-400 to-red-400' },
    { id: 'other' as Subject, emoji: '📚', name: 'Other', color: 'from-gray-400 to-gray-500' },
  ];

  const handleSelectSubject = (subject: Subject) => {
    setHomeworkSession((prev) => ({
      ...prev,
      subject,
    }));

    const greeting = `Great! Let's work on ${subject === 'other' ? 'your homework' : subject} together. You can show me your worksheet by taking a picture, or just ask me a question!`;
    speak(greeting);
  };

  const handlePhotoCapture = async (imageData: string) => {
    if (!session || !homeworkSession.subject) return;

    // Validate image data before processing
    if (!imageData || imageData.trim() === '') {
      setError('No image captured. Please try taking a photo again.');
      setShowCamera(false);
      return;
    }

    // Check if it's a valid data URL
    if (!imageData.startsWith('data:image/')) {
      setError('Invalid image format. Please try taking the photo again.');
      setShowCamera(false);
      return;
    }

    setShowCamera(false);
    setIsProcessing(true);
    setUploadProgress(0);
    setProcessingStage('uploading');
    setError(null);

    try {
      const response = await api.image.analyze(
        {
          image: imageData,
          context: 'homework',
          session_id: session.session_id,
          child_age: session.child_age,
          prompt: `This is a ${homeworkSession.subject} homework worksheet. Analyze it and help the student understand the concepts. Provide guidance, not direct answers. Be encouraging and age-appropriate for a ${session.child_age}-year-old.`,
        },
        (progress) => {
          setUploadProgress(progress);
          if (progress === 100) {
            setProcessingStage('analyzing');
          }
        }
      );

      // Use ai_response for child-friendly explanation, analysis for technical details
      const displayMessage = response.ai_response || response.analysis;

      setHomeworkSession((prev) => ({
        ...prev,
        worksheetImage: imageData,
        aiResponse: displayMessage,
        conversationHistory: [
          ...prev.conversationHistory,
          { role: 'ai', content: displayMessage },
        ],
      }));

      speak(displayMessage);
    } catch (err: any) {
      console.error('Failed to analyze worksheet:', err);

      // Extract detailed error message from API response
      let errorMessage = 'Could not analyze the worksheet. Please try again.';

      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
      setProcessingStage(null);
    }
  };

  const handleAskQuestion = async () => {
    if (!session || !homeworkSession.subject || !homeworkSession.question.trim()) return;

    setIsProcessing(true);
    setError(null);

    const questionText = homeworkSession.question;
    setHomeworkSession((prev) => ({
      ...prev,
      question: '',
      conversationHistory: [
        ...prev.conversationHistory,
        { role: 'child', content: questionText },
      ],
    }));

    try {
      const contextMessage = homeworkSession.worksheetImage
        ? `This is a ${homeworkSession.subject} question about a worksheet the student showed earlier.`
        : `This is a ${homeworkSession.subject} homework question.`;

      const response = await api.chat.sendMessage({
        message: `${contextMessage}\n\nStudent's question: ${questionText}\n\nProvide helpful guidance to help them learn, but don't give direct answers. Be encouraging and age-appropriate for a ${session.child_age}-year-old.`,
        session_id: session.session_id,
        child_age: session.child_age,
      });

      setHomeworkSession((prev) => ({
        ...prev,
        aiResponse: response.response,
        conversationHistory: [
          ...prev.conversationHistory,
          { role: 'ai', content: response.response },
        ],
      }));

      speak(response.response);
    } catch (err) {
      console.error('Failed to get help:', err);
      setError('Could not get an answer. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewQuestion = () => {
    setHomeworkSession({
      subject: homeworkSession.subject,
      worksheetImage: null,
      question: '',
      aiResponse: null,
      conversationHistory: [],
    });
    stopSpeaking();
  };

  const handleChangeSubject = () => {
    setHomeworkSession({
      subject: null,
      worksheetImage: null,
      question: '',
      aiResponse: null,
      conversationHistory: [],
    });
    stopSpeaking();
  };

  if (isProcessing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-teal-100 to-blue-100 p-4">
        <div className="text-8xl mb-6 animate-bounce">✏️</div>
        <LoadingSpinner
          size="large"
          message={
            processingStage === 'uploading'
              ? 'Uploading your worksheet...'
              : processingStage === 'analyzing'
              ? 'Analyzing your worksheet...'
              : 'Thinking about your question...'
          }
        />

        {processingStage === 'uploading' && uploadProgress > 0 && (
          <div className="w-full max-w-md mt-6">
            <div className="bg-white rounded-full h-4 overflow-hidden shadow-lg">
              <div
                className="bg-gradient-to-r from-green-400 to-teal-400 h-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-center mt-2 text-green-600 font-child font-bold">
              {uploadProgress}% uploaded
            </p>
          </div>
        )}

        <p className="mt-4 text-green-600 font-child text-lg animate-pulse">
          {processingStage === 'analyzing'
            ? "I'm reading your worksheet carefully!"
            : "I'm working on helping you understand this!"}
        </p>
      </div>
    );
  }

  if (showCamera) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-teal-100 to-blue-100 p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-4 text-center">
            <h3 className="text-2xl font-bold text-gray-700 font-child">
              Take a picture of your worksheet
            </h3>
            <p className="text-gray-600 mt-2">
              Make sure the worksheet is clear and readable
            </p>
          </div>
          <CameraCapture
            onPhotoCapture={handlePhotoCapture}
            context="homework"
          />
          <button
            onClick={() => setShowCamera(false)}
            className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl font-child text-lg"
          >
            ← Cancel
          </button>
        </div>
      </div>
    );
  }

  // Subject selection screen
  if (!homeworkSession.subject) {
    return (
      <div className="flex-1 flex flex-col bg-gradient-to-br from-green-100 via-teal-100 to-blue-100 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-8xl mb-4 animate-bounce">✏️</div>
            <h1 className="text-5xl font-bold text-green-600 font-child mb-3">
              Homework Helper
            </h1>
            <p className="text-2xl text-gray-700 font-child">
              What subject do you need help with?
            </p>
          </div>

          {/* Subject Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => handleSelectSubject(subject.id)}
                className={`
                  bg-gradient-to-br ${subject.color}
                  text-white p-8 rounded-3xl shadow-xl
                  transform transition-all hover:scale-105 active:scale-95
                  font-child
                `}
              >
                <div className="text-6xl mb-3">{subject.emoji}</div>
                <div className="text-3xl font-bold">{subject.name}</div>
              </button>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-8 bg-white rounded-3xl shadow-xl p-6">
            <h3 className="text-2xl font-bold text-gray-700 font-child mb-4 text-center">
              How I Can Help
            </h3>
            <div className="space-y-3 text-lg font-child text-gray-600">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <span>I'll guide you through problems step-by-step</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📸</span>
                <span>Show me your worksheet and I'll explain it</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">❓</span>
                <span>Ask me questions about what you don't understand</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🌟</span>
                <span>I'll help you learn, not just give you answers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Homework session screen
  const selectedSubject = subjects.find((s) => s.id === homeworkSession.subject);

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-green-100 via-teal-100 to-blue-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b-4 border-green-300 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{selectedSubject?.emoji}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-700 font-child">
                {selectedSubject?.name} Help
              </h2>
              <p className="text-sm text-gray-600">I'm here to guide you!</p>
            </div>
          </div>
          <button
            onClick={handleChangeSubject}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl font-child text-sm"
          >
            Change Subject
          </button>
        </div>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Worksheet Image */}
          {homeworkSession.worksheetImage && (
            <div className="bg-white rounded-3xl shadow-xl p-4">
              <h3 className="text-xl font-bold text-gray-700 font-child mb-3">
                Your Worksheet
              </h3>
              <img
                src={homeworkSession.worksheetImage}
                alt="Worksheet"
                className="w-full rounded-2xl"
              />
            </div>
          )}

          {/* Conversation History */}
          {homeworkSession.conversationHistory.map((msg, index) => (
            <div
              key={index}
              className={`
                ${msg.role === 'child' ? 'ml-auto bg-blue-500 text-white' : 'mr-auto bg-white text-gray-800'}
                max-w-3xl rounded-3xl shadow-lg p-6
              `}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">
                  {msg.role === 'child' ? '👦' : '🤖'}
                </div>
                <div className="font-child text-lg whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {homeworkSession.conversationHistory.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👋</div>
              <p className="text-2xl text-gray-600 font-child mb-6">
                Ready to help you learn!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowCamera(true)}
                  className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child"
                >
                  📸 Show Worksheet
                </button>
                <div className="text-gray-500 font-child text-xl self-center">or</div>
                <div className="text-gray-600 font-child text-xl self-center">
                  Ask a question below
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mb-2 bg-red-100 border-4 border-red-400 rounded-2xl p-3 text-center">
          <p className="text-red-700 font-child text-lg">{error}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t-4 border-green-300 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <button
              onClick={() => setShowCamera(true)}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child"
              title="Take picture of worksheet"
            >
              📸
            </button>

            <input
              type="text"
              value={homeworkSession.question}
              onChange={(e) =>
                setHomeworkSession((prev) => ({ ...prev, question: e.target.value }))
              }
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAskQuestion();
              }}
              className="flex-1 px-6 py-4 border-4 border-green-300 rounded-2xl text-xl font-child focus:outline-none focus:ring-4 focus:ring-green-400"
              placeholder="Ask me a question about your homework..."
            />

            <button
              onClick={handleAskQuestion}
              disabled={!homeworkSession.question.trim()}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-2xl shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child text-xl"
            >
              Ask
            </button>
          </div>

          {homeworkSession.conversationHistory.length > 0 && (
            <button
              onClick={handleNewQuestion}
              className="mt-3 w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-2xl font-child"
            >
              ✨ Start New Question
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
