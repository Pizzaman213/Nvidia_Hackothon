// ============================================================================
// AudioPlayer - For playing AI voice responses
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  autoPlay = true,
  onEnded,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };
    const handleError = () => {
      setError('Failed to play audio');
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    if (autoPlay) {
      audio.play().catch((err) => {
        console.error('Audio autoplay failed:', err);
        setError('Could not autoplay audio');
      });
    }

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, autoPlay, onEnded]);

  return (
    <div className="flex items-center gap-2">
      <audio ref={audioRef} src={audioUrl} />

      {isPlaying && (
        <div className="flex gap-1">
          <div className="w-1 h-4 bg-child-primary animate-waveform" />
          <div className="w-1 h-4 bg-child-primary animate-waveform delay-75" />
          <div className="w-1 h-4 bg-child-primary animate-waveform delay-150" />
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
