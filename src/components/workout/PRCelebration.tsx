/**
 * PR Celebration Modal
 * 
 * Shows an animated celebration when user hits a personal record
 */

import { useEffect } from 'react';
import { hapticFeedback } from '../../utils/haptics';

interface PRCelebrationProps {
  isVisible: boolean;
  prTypes: string[]; // ['weight', 'volume', 'reps']
  exerciseName: string;
  weight: number;
  reps: number;
  onClose: () => void;
}

export default function PRCelebration({
  isVisible,
  prTypes,
  exerciseName,
  weight,
  reps,
  onClose
}: PRCelebrationProps) {
  useEffect(() => {
    if (isVisible) {
      // Haptic feedback on PR
      hapticFeedback('heavy');
      
      // Auto-close after 4 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible || prTypes.length === 0) return null;

  const getPRMessage = () => {
    if (prTypes.includes('weight')) {
      return `New Weight PR! 🏆`;
    } else if (prTypes.includes('volume')) {
      return `New Volume PR! 💪`;
    } else if (prTypes.includes('reps')) {
      return `New Rep PR! 🔥`;
    }
    return 'Personal Record!';
  };

  const getSubMessage = () => {
    const messages = [];
    if (prTypes.includes('weight')) messages.push('Heaviest weight ever');
    if (prTypes.includes('volume')) messages.push('Most volume in one set');
    if (prTypes.includes('reps')) messages.push('Most reps at this weight');
    return messages.join(' • ');
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center animate-scale-in pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Emoji Animation */}
          <div className="text-7xl mb-4 animate-bounce-in">
            {prTypes.includes('weight') ? '🏆' : prTypes.includes('volume') ? '💪' : '🔥'}
          </div>

          {/* Main Message */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {getPRMessage()}
          </h2>

          {/* Exercise Name */}
          <p className="text-lg text-gray-600 mb-4">
            {exerciseName}
          </p>

          {/* Stats */}
          <div className="bg-primary-light rounded-xl p-4 mb-4">
            <div className="text-4xl font-bold text-primary mb-1">
              {weight}lbs × {reps}
            </div>
            <div className="text-sm text-primary-dark">
              {getSubMessage()}
            </div>
          </div>

          {/* Multiple PR Badges */}
          {prTypes.length > 1 && (
            <div className="flex justify-center gap-2 mb-4">
              {prTypes.includes('weight') && (
                <span className="px-3 py-1 bg-warning text-white text-xs font-semibold rounded-full">
                  WEIGHT PR
                </span>
              )}
              {prTypes.includes('volume') && (
                <span className="px-3 py-1 bg-success text-white text-xs font-semibold rounded-full">
                  VOLUME PR
                </span>
              )}
              {prTypes.includes('reps') && (
                <span className="px-3 py-1 bg-error text-white text-xs font-semibold rounded-full">
                  REP PR
                </span>
              )}
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-primary font-semibold hover:text-primary-dark transition-colors"
          >
            Continue Workout →
          </button>
        </div>
      </div>

      {/* Confetti-like Animation (pure CSS) */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scale-in {
          from { 
            opacity: 0;
            transform: scale(0.8);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes bounce-in {
          0% { 
            transform: scale(0);
          }
          50% { 
            transform: scale(1.2);
          }
          100% { 
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </>
  );
}

