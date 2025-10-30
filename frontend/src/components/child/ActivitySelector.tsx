// ============================================================================
// ActivitySelector - Choose different activity types
// ============================================================================

import React from 'react';
import { ActivityType, ActivityCard } from '../../types';

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
