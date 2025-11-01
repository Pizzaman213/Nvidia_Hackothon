// ============================================================================
// ActivitySelector - Choose different activity types
// ============================================================================

import React from 'react';
import { ActivityType, ActivityCard } from '../../types';
import { useSession } from '../../contexts/SessionContext';

interface ActivitySelectorProps {
  onSelectActivity: (type: ActivityType) => void;
  currentActivity?: ActivityType;
}

const activityCards: ActivityCard[] = [
  {
    type: ActivityType.STORY_TIME,
    title: 'Story Time',
    description: 'Listen to magical stories',
    icon: '📚',
    color: 'bg-purple-400',
    requiresCamera: false,
  },
  {
    type: ActivityType.I_SPY,
    title: 'I Spy Game',
    description: 'Play I Spy with pictures',
    icon: '🔍',
    color: 'bg-blue-400',
    requiresCamera: true,
  },
  {
    type: ActivityType.HOMEWORK_HELPER,
    title: 'Homework Help',
    description: 'Get help with schoolwork',
    icon: '✏️',
    color: 'bg-green-400',
    requiresCamera: true,
  },
  {
    type: ActivityType.FREE_CHAT,
    title: 'Free Chat',
    description: 'Talk about anything',
    icon: '💬',
    color: 'bg-pink-400',
    requiresCamera: false,
  },
];

export const ActivitySelector: React.FC<ActivitySelectorProps> = ({
  onSelectActivity,
  currentActivity,
}) => {
  const { session } = useSession();
  const isTeen = (session?.child_age ?? 0) >= 10;

  // Teen UI (10+) - Modern horizontal tab layout
  if (isTeen) {
    return (
      <div className="flex gap-2 p-4 overflow-x-auto">
        {activityCards.map((activity) => (
          <button
            key={activity.type}
            onClick={() => onSelectActivity(activity.type)}
            className={`
              group relative px-6 py-3 rounded-lg transition-all duration-200
              flex items-center gap-3 whitespace-nowrap
              ${
                currentActivity === activity.type
                  ? 'bg-white/10 border border-neon-cyan text-neon-cyan shadow-lg shadow-neon-cyan/20'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white'
              }
            `}
          >
            <span className={`text-2xl transition-transform duration-200 ${currentActivity === activity.type ? 'scale-110' : 'group-hover:scale-110'}`}>
              {activity.icon}
            </span>
            <div className="text-left">
              <div className="font-geometric text-sm font-medium">{activity.title}</div>
              {activity.requiresCamera && (
                <div className="text-xs opacity-60 font-mono">Camera</div>
              )}
            </div>
            {currentActivity === activity.type && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-neon-cyan to-neon-purple"></div>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Original child UI (under 10)
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {activityCards.map((activity) => (
        <button
          key={activity.type}
          onClick={() => onSelectActivity(activity.type)}
          className={`
            ${activity.color}
            ${currentActivity === activity.type ? 'ring-4 ring-yellow-400 scale-105' : ''}
            p-6 rounded-2xl shadow-lg
            transform transition-all duration-200
            hover:scale-105 hover:shadow-xl
            active:scale-95
            flex flex-col items-center gap-2
            text-white font-child
          `}
        >
          <div className="text-5xl mb-2">{activity.icon}</div>
          <h3 className="text-xl font-bold">{activity.title}</h3>
          <p className="text-sm opacity-90">{activity.description}</p>
          {activity.requiresCamera && (
            <div className="mt-2 px-2 py-1 bg-white bg-opacity-30 rounded-full text-xs">
              📸 Uses Camera
            </div>
          )}
        </button>
      ))}
    </div>
  );
};
