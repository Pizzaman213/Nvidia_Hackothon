// ============================================================================
// ModeSelector - Choose activity mode after profile selection
// ============================================================================

import React from 'react';
import { ActivityType } from '../../types';
import { useSession } from '../../contexts/SessionContext';

interface ModeSelectorProps {
  onSelectMode: (mode: ActivityType) => void;
}

interface ModeCard {
  type: ActivityType;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  darkGradient?: string; // For teen theme
}

const modeCards: ModeCard[] = [
  {
    type: ActivityType.FREE_CHAT,
    title: 'Talk to Your Friend',
    description: 'Chat about anything!',
    icon: '💬',
    gradient: 'from-pink-400 to-pink-600',
    darkGradient: 'from-neon-pink to-pink-600',
  },
  {
    type: ActivityType.I_SPY,
    title: 'Play a Game',
    description: 'I Spy and more',
    icon: '🔍',
    gradient: 'from-blue-400 to-blue-600',
    darkGradient: 'from-neon-cyan to-blue-600',
  },
  {
    type: ActivityType.HOMEWORK_HELPER,
    title: 'Get Help',
    description: 'Homework assistance',
    icon: '✏️',
    gradient: 'from-green-400 to-green-600',
    darkGradient: 'from-green-400 to-emerald-600',
  },
  {
    type: ActivityType.STORY_TIME,
    title: 'Story Time',
    description: 'Listen to stories',
    icon: '📚',
    gradient: 'from-purple-400 to-purple-600',
    darkGradient: 'from-neon-purple to-purple-600',
  },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelectMode }) => {
  const { session } = useSession();
  const isTeen = (session?.child_age ?? 0) >= 10;

  // Teen Theme (10+) - Dark, Modern, Sleek
  if (isTeen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark via-dark-50 to-dark-100 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Ambient Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.2) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.2) 2%, transparent 0%)',
              backgroundSize: '100px 100px',
            }}
          ></div>
        </div>

        {/* Animated Glow Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-neon-cyan/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative max-w-6xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-5xl shadow-2xl shadow-neon-cyan/30 animate-glow">
                🤖
              </div>
            </div>
            <h1 className="text-5xl font-bold font-geometric text-white tracking-tight mb-3">
              Hey {session?.child_name}
            </h1>
            <p className="text-xl text-gray-400 font-geometric">What do you want to do?</p>
          </div>

          {/* Mode Grid - 2x2 for teen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {modeCards.map((mode) => (
              <button
                key={mode.type}
                onClick={() => onSelectMode(mode.type)}
                className="group relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-8 transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-neon-cyan hover:shadow-2xl hover:shadow-neon-cyan/20"
              >
                {/* Gradient Overlay on Hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${mode.darkGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                ></div>

                {/* Content */}
                <div className="relative flex flex-col items-center text-center gap-4">
                  {/* Icon */}
                  <div className="text-7xl transform group-hover:scale-110 transition-transform duration-300">
                    {mode.icon}
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold font-geometric text-white">{mode.title}</h2>

                  {/* Description */}
                  <p className="text-gray-400 font-geometric text-sm">{mode.description}</p>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neon-cyan/0 to-neon-purple/0 group-hover:from-neon-cyan/5 group-hover:to-neon-purple/5 transition-all duration-300"></div>
              </button>
            ))}
          </div>

          {/* Footer Hint */}
          <div className="text-center mt-12">
            <p className="text-gray-500 font-geometric text-sm">
              Click any option to get started
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Child Theme (Under 10) - Colorful, Playful, Fun
  return (
    <div className="min-h-screen bg-gradient-to-br from-child-bg via-pink-100 to-purple-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-5xl shadow-2xl animate-bounce-slow">
              🎨
            </div>
          </div>
          <h1 className="text-5xl font-bold text-child-primary font-child mb-2">
            Hi {session?.child_name}! 👋
          </h1>
          <p className="text-2xl text-gray-700 font-child">What do you want to do today?</p>
        </div>

        {/* Mode Grid - 2x2 colorful cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {modeCards.map((mode) => (
            <button
              key={mode.type}
              onClick={() => onSelectMode(mode.type)}
              className={`group bg-gradient-to-br ${mode.gradient} rounded-3xl shadow-xl p-10 transform transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:rotate-1 active:scale-95`}
            >
              <div className="flex flex-col items-center text-center gap-4 text-white">
                {/* Icon */}
                <div className="text-8xl mb-2 transform group-hover:scale-125 transition-transform duration-300">
                  {mode.icon}
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold font-child">{mode.title}</h2>

                {/* Description */}
                <p className="text-lg opacity-90 font-child">{mode.description}</p>

                {/* Sparkle Effect on Hover */}
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-2xl">
                  ✨
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-10">
          <p className="text-gray-600 font-child text-lg">Pick one to start having fun!</p>
        </div>
      </div>
    </div>
  );
};
