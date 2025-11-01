// ============================================================================
// StoryTime - Interactive story generation component
// ============================================================================

import React, { useState } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { useVoice } from '../../contexts/VoiceContext';
import api from '../../services/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';

export const StoryTime: React.FC = () => {
  const { session } = useSession();
  const { speak, stopSpeaking, isSpeaking } = useVoice();

  const [theme, setTheme] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [story, setStory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Age-appropriate story themes
  const getThemesForAge = (age: number) => {
    // Ages 3-5: Simple, playful themes with familiar concepts
    if (age <= 5) {
      return [
        { emoji: '🐶', text: 'Friendly Puppy' },
        { emoji: '🚂', text: 'Train Ride' },
        { emoji: '🌈', text: 'Rainbow Colors' },
        { emoji: '🧸', text: 'Teddy Bear Friend' },
        { emoji: '🦆', text: 'Duck at the Pond' },
        { emoji: '🌟', text: 'Twinkle Star' },
        { emoji: '🎈', text: 'Balloon Adventure' },
        { emoji: '🍎', text: 'Fruit Party' },
      ];
    }

    // Ages 6-8: More adventurous with mild challenges
    if (age <= 8) {
      return [
        { emoji: '🐶', text: 'Brave Puppy Adventure' },
        { emoji: '🚀', text: 'Space Explorer' },
        { emoji: '🦄', text: 'Magical Unicorn' },
        { emoji: '🏰', text: 'Castle Mystery' },
        { emoji: '🦖', text: 'Dinosaur Discovery' },
        { emoji: '🌊', text: 'Ocean Journey' },
        { emoji: '🎪', text: 'Circus Fun' },
        { emoji: '🌈', text: 'Rainbow Quest' },
      ];
    }

    // Ages 9-12: Complex adventures with problem-solving
    if (age <= 12) {
      return [
        { emoji: '🗺️', text: 'Treasure Hunt' },
        { emoji: '🚀', text: 'Space Mission' },
        { emoji: '🧙', text: 'Wizard Academy' },
        { emoji: '🏰', text: 'Medieval Quest' },
        { emoji: '🦖', text: 'Time Travel to Dinosaurs' },
        { emoji: '🌊', text: 'Deep Sea Exploration' },
        { emoji: '🔬', text: 'Science Adventure' },
        { emoji: '🎭', text: 'Mystery Theatre' },
      ];
    }

    // Ages 13-14: More mature themes
    if (age <= 14) {
      return [
        { emoji: '🗺️', text: 'Epic Quest' },
        { emoji: '🚀', text: 'Interstellar Journey' },
        { emoji: '🧙', text: 'Fantasy Realm' },
        { emoji: '🏛️', text: 'Ancient Civilization' },
        { emoji: '🔮', text: 'Parallel Universe' },
        { emoji: '🌋', text: 'Survival Challenge' },
        { emoji: '🎯', text: 'Competition Champion' },
        { emoji: '🌌', text: 'Cosmic Mystery' },
      ];
    }

    // Ages 15+: No preset themes - encourage custom creativity
    return [];
  };

  const suggestedThemes = session ? getThemesForAge(session.child_age) : [];

  const handleGenerateStory = async (themeToUse: string) => {
    if (!session || !themeToUse.trim()) return;

    setIsLoading(true);
    setError(null);
    setStory(null);
    stopSpeaking();

    try {
      const response = await api.chat.generateStory({
        session_id: session.session_id,
        theme: themeToUse,
        child_age: session.child_age,
        length,
        voice_output: true,
      });

      setStory(response.response);
      setSelectedTheme(themeToUse);

      // Speak the story
      speak(response.response);
    } catch (err) {
      console.error('Failed to generate story:', err);
      setError('Oops! Could not generate a story. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomTheme = () => {
    if (theme.trim()) {
      handleGenerateStory(theme);
    }
  };

  const handleNewStory = () => {
    setStory(null);
    setSelectedTheme(null);
    setTheme('');
    stopSpeaking();
  };

  const handleStopReading = () => {
    stopSpeaking();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-4">
        <div className="text-8xl mb-6 animate-bounce">📚</div>
        <LoadingSpinner size="large" message="Creating your magical story..." />
        <p className="mt-4 text-purple-600 font-child text-lg animate-pulse">
          The AI is writing something special just for you!
        </p>
      </div>
    );
  }

  if (story) {
    return (
      <div className="flex-1 flex flex-col bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 overflow-hidden">
        {/* Story Display */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white bg-opacity-90 rounded-3xl shadow-2xl p-8 backdrop-blur-sm">
              {/* Story Header */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">📖</div>
                <h2 className="text-3xl font-bold text-purple-600 font-child mb-2">
                  {selectedTheme}
                </h2>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <span>A {length} story</span>
                  <span>•</span>
                  <span>By AI Babysitter</span>
                </div>
              </div>

              {/* Story Content */}
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-800 font-child text-xl leading-relaxed whitespace-pre-wrap">
                  {story}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border-t-4 border-purple-300 p-6">
          <div className="max-w-3xl mx-auto flex items-center justify-center gap-4">
            {isSpeaking ? (
              <button
                onClick={handleStopReading}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child"
              >
                🔇 Stop Reading
              </button>
            ) : (
              <button
                onClick={() => speak(story)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child"
              >
                🔊 Read Story Aloud
              </button>
            )}

            <button
              onClick={handleNewStory}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child"
            >
              ✨ New Story
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-8xl mb-4 animate-bounce">📚</div>
          <h1 className="text-5xl font-bold text-purple-600 font-child mb-3">
            Story Time!
          </h1>
          <p className="text-2xl text-gray-700 font-child">
            Choose a theme and I'll tell you a magical story
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border-4 border-red-400 rounded-2xl p-4 text-center">
            <p className="text-red-700 font-child text-lg">{error}</p>
          </div>
        )}

        {/* Story Length Selector */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h3 className="text-2xl font-bold text-gray-700 font-child mb-4 text-center">
            How long should the story be?
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {(['short', 'medium', 'long'] as const).map((len) => (
              <button
                key={len}
                onClick={() => setLength(len)}
                className={`
                  ${length === len ? 'bg-purple-500 text-white ring-4 ring-purple-300' : 'bg-gray-100 text-gray-700'}
                  py-4 px-6 rounded-2xl font-bold text-xl font-child
                  transform transition-all hover:scale-105 active:scale-95
                  shadow-lg
                `}
              >
                {len === 'short' && '⚡ Short'}
                {len === 'medium' && '📖 Medium'}
                {len === 'long' && '📚 Long'}
              </button>
            ))}
          </div>
        </div>

        {/* Suggested Themes - Only show for ages under 15 */}
        {suggestedThemes.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="text-2xl font-bold text-gray-700 font-child mb-4 text-center">
              Pick a story theme
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {suggestedThemes.map((themeItem) => (
                <button
                  key={themeItem.text}
                  onClick={() => handleGenerateStory(themeItem.text)}
                  className="bg-gradient-to-br from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white p-4 rounded-2xl shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child flex flex-col items-center justify-center"
                >
                  <div className="text-4xl mb-2">{themeItem.emoji}</div>
                  <div className="text-sm font-bold text-center leading-tight">{themeItem.text}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Theme Input */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h3 className="text-2xl font-bold text-gray-700 font-child mb-4 text-center">
            {suggestedThemes.length > 0 ? 'Or create your own theme' : 'Create your story theme'}
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCustomTheme();
              }}
              className="flex-1 px-6 py-4 border-4 border-purple-300 rounded-2xl text-xl font-child focus:outline-none focus:ring-4 focus:ring-purple-400"
              placeholder="Type your story idea..."
            />
            <button
              onClick={handleCustomTheme}
              disabled={!theme.trim()}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-2xl text-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child whitespace-nowrap"
            >
              ✨ Create Story
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
