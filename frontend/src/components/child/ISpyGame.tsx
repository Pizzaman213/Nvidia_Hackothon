// ============================================================================
// ISpyGame - Interactive I Spy game with camera
// ============================================================================

import React, { useState } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { useVoice } from '../../contexts/VoiceContext';
import { CameraCapture } from './CameraCapture';
import api from '../../services/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface GameState {
  imageData: string | null;
  detectedObjects: string[];
  currentChallenge: string | null;
  score: number;
  foundObjects: string[];
}

export const ISpyGame: React.FC = () => {
  const { session } = useSession();
  const { speak } = useVoice();

  const [gameState, setGameState] = useState<GameState>({
    imageData: null,
    detectedObjects: [],
    currentChallenge: null,
    score: 0,
    foundObjects: [],
  });

  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processingStage, setProcessingStage] = useState<'uploading' | 'analyzing' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoCapture = async (imageData: string) => {
    if (!session) return;

    setShowCamera(false);
    setIsAnalyzing(true);
    setUploadProgress(0);
    setProcessingStage('uploading');
    setError(null);

    try {
      const response = await api.image.analyze(
        {
          image: imageData,
          context: 'game',
          session_id: session.session_id,
          child_age: session.child_age,
          prompt: 'Identify all the objects you can see in this image for an I Spy game. List them clearly.',
        },
        (progress) => {
          setUploadProgress(progress);
          if (progress === 100) {
            setProcessingStage('analyzing');
          }
        }
      );

      // Use structured detected_objects from backend if available, otherwise fall back to parsing
      let objects: string[] = [];

      if (response.detected_objects && response.detected_objects.length > 0) {
        objects = response.detected_objects;
        console.log('Using detected_objects from backend:', objects);
      } else if (response.analysis) {
        objects = extractObjectsFromAnalysis(response.analysis);
        console.log('Extracted objects from analysis:', objects);
      }

      setGameState({
        imageData,
        detectedObjects: objects,
        currentChallenge: null,
        score: 0,
        foundObjects: [],
      });

      // Generate first challenge
      if (objects.length > 0) {
        const randomObject = objects[Math.floor(Math.random() * objects.length)];
        const challenge = `I spy with my little eye... something like a ${randomObject}!`;
        setGameState((prev) => ({ ...prev, currentChallenge: challenge }));
        speak(challenge);
      } else {
        const message = "I can see your picture! Let's try taking a photo of a room or area with more things in it - like your bedroom, living room, or a table with toys!";
        speak(message);
        setError(message);
      }
    } catch (err: any) {
      console.error('Failed to analyze image:', err);

      // Provide more specific error messages
      let errorMessage = 'Could not analyze the photo. Please try again.';

      if (err?.message) {
        if (err.message.includes('Vision analysis unavailable')) {
          errorMessage = 'The vision service is not configured yet. Please ask a parent to set up the vision API.';
        } else if (err.message.includes('503')) {
          errorMessage = 'The vision service is temporarily unavailable. Please try again in a moment.';
        } else if (err.message.includes('base64')) {
          errorMessage = 'There was a problem with the photo. Please try taking it again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      speak(errorMessage);
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
      setProcessingStage(null);
    }
  };

  const extractObjectsFromAnalysis = (analysis: string): string[] => {
    // Simple extraction - look for common object descriptions
    // In a real implementation, the backend would return structured data
    const objects: string[] = [];
    const commonObjects = [
      'ball', 'book', 'toy', 'car', 'doll', 'cup', 'phone', 'chair', 'table',
      'lamp', 'picture', 'plant', 'window', 'door', 'pillow', 'blanket',
      'stuffed animal', 'pencil', 'paper', 'bottle', 'shoe', 'bag', 'clock',
      'remote', 'controller', 'teddy bear', 'robot', 'dinosaur', 'truck',
    ];

    const lowerAnalysis = analysis.toLowerCase();
    commonObjects.forEach((obj) => {
      if (lowerAnalysis.includes(obj)) {
        objects.push(obj);
      }
    });

    return Array.from(new Set(objects)); // Remove duplicates
  };

  const handleObjectGuess = (object: string) => {
    const newFoundObjects = [...gameState.foundObjects, object];
    const newScore = gameState.score + 10;

    setGameState((prev) => ({
      ...prev,
      foundObjects: newFoundObjects,
      score: newScore,
    }));

    speak(`Great job! You found it! You now have ${newScore} points!`);

    // Generate new challenge if there are more objects
    const remainingObjects = gameState.detectedObjects.filter(
      (obj) => !newFoundObjects.includes(obj)
    );

    if (remainingObjects.length > 0) {
      setTimeout(() => {
        const randomObject = remainingObjects[Math.floor(Math.random() * remainingObjects.length)];
        const challenge = `I spy with my little eye... something like a ${randomObject}!`;
        setGameState((prev) => ({ ...prev, currentChallenge: challenge }));
        speak(challenge);
      }, 2000);
    } else {
      speak(`Amazing! You found everything! Your final score is ${newScore} points! Take a new picture to play again!`);
      setGameState((prev) => ({ ...prev, currentChallenge: null }));
    }
  };

  const handleNewGame = () => {
    setGameState({
      imageData: null,
      detectedObjects: [],
      currentChallenge: null,
      score: 0,
      foundObjects: [],
    });
    setShowCamera(false);
  };

  if (isAnalyzing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 p-4">
        <div className="text-8xl mb-6 animate-bounce">🔍</div>
        <LoadingSpinner
          size="large"
          message={
            processingStage === 'uploading'
              ? 'Uploading your picture...'
              : processingStage === 'analyzing'
              ? 'Looking at your picture...'
              : 'Processing...'
          }
        />

        {processingStage === 'uploading' && uploadProgress > 0 && (
          <div className="w-full max-w-md mt-6">
            <div className="bg-white rounded-full h-4 overflow-hidden shadow-lg">
              <div
                className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-center mt-2 text-blue-600 font-child font-bold">
              {uploadProgress}% uploaded
            </p>
          </div>
        )}

        <p className="mt-4 text-blue-600 font-child text-lg animate-pulse">
          {processingStage === 'analyzing'
            ? 'Finding all the fun things in your photo!'
            : processingStage === 'uploading'
            ? 'Sending your picture to me!'
            : 'Getting ready...'}
        </p>
      </div>
    );
  }

  if (showCamera) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 p-4">
        <div className="w-full max-w-2xl">
          <CameraCapture
            onPhotoCapture={handlePhotoCapture}
            context="game"
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

  if (gameState.imageData && gameState.detectedObjects.length > 0) {
    return (
      <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 overflow-hidden">
        {/* Game Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Score Display */}
            <div className="bg-white rounded-3xl shadow-xl p-4 mb-6 text-center">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-600 font-child">
                    Score: {gameState.score}
                  </div>
                  <div className="text-sm text-gray-600">
                    Found: {gameState.foundObjects.length} / {gameState.detectedObjects.length}
                  </div>
                </div>
                <div className="text-6xl">🔍</div>
              </div>
            </div>

            {/* Current Challenge */}
            {gameState.currentChallenge && (
              <div className="bg-gradient-to-r from-blue-400 to-cyan-400 rounded-3xl shadow-xl p-6 mb-6 text-center">
                <h2 className="text-3xl font-bold text-white font-child mb-2">
                  {gameState.currentChallenge}
                </h2>
                <p className="text-white text-lg">
                  Click the object when you find it!
                </p>
              </div>
            )}

            {/* Image Display */}
            <div className="bg-white rounded-3xl shadow-xl p-4 mb-6">
              <img
                src={gameState.imageData}
                alt="I Spy"
                className="w-full rounded-2xl"
              />
            </div>

            {/* Object Buttons */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h3 className="text-2xl font-bold text-gray-700 font-child mb-4 text-center">
                Things I Can See
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gameState.detectedObjects.map((object) => {
                  const isFound = gameState.foundObjects.includes(object);
                  return (
                    <button
                      key={object}
                      onClick={() => !isFound && handleObjectGuess(object)}
                      disabled={isFound}
                      className={`
                        ${isFound ? 'bg-green-500 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}
                        p-4 rounded-2xl font-bold text-lg font-child
                        transform transition-all hover:scale-105 active:scale-95
                        shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {isFound && '✓ '}
                      {object}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border-t-4 border-blue-300 p-6">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
            <button
              onClick={handleNewGame}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child"
            >
              📸 New Picture
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-bounce">🔍</div>
          <h1 className="text-5xl font-bold text-blue-600 font-child mb-3">
            I Spy Game!
          </h1>
          <p className="text-2xl text-gray-700 font-child">
            Take a picture and I'll spy things for you to find
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-100 border-4 border-red-400 rounded-2xl p-4 text-center">
            <p className="text-red-700 font-child text-lg">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
          <h3 className="text-3xl font-bold text-gray-700 font-child mb-4 text-center">
            How to Play
          </h3>
          <div className="space-y-4 text-lg font-child text-gray-600">
            <div className="flex items-start gap-3">
              <div className="text-3xl">1️⃣</div>
              <div>
                <strong className="text-blue-600">Take a Picture</strong>
                <br />
                Take a photo of a room or area with lots of things
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-3xl">2️⃣</div>
              <div>
                <strong className="text-blue-600">I'll Spy Something</strong>
                <br />
                I'll tell you what I spy in your picture
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-3xl">3️⃣</div>
              <div>
                <strong className="text-blue-600">Find It!</strong>
                <br />
                Click the object when you find it to score points
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={() => setShowCamera(true)}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-6 px-12 rounded-full text-3xl shadow-2xl transform transition-all hover:scale-105 active:scale-95 font-child"
          >
            📸 Take Picture & Play!
          </button>
        </div>
      </div>
    </div>
  );
};
