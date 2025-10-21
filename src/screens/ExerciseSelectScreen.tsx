/**
 * Exercise Selection Screen
 * 
 * Lets user choose which exercise to do next
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useExerciseStore } from '../stores/exerciseStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { suggestNextWeight, getLastWeight } from '../services/progression/weightSuggestion';

export default function ExerciseSelectScreen() {
  const navigate = useNavigate();
  const { defaultExercises, isLoaded } = useExerciseStore();
  const { exercises: currentWorkoutExercises, workoutId } = useWorkoutStore();
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);

  const handleSelectExercise = (exerciseId: number) => {
    setSelectedExerciseId(exerciseId);
  };

  const handleContinue = () => {
    if (!selectedExerciseId) return;

    const selectedExercise = defaultExercises.find(e => e.id === selectedExerciseId);
    if (!selectedExercise) return;

    // TODO: Add this exercise to the current workout
    // For now, just navigate to workout screen
    // This would require adding a new action to workoutStore
    
    navigate('/workout');
  };

  const handleCancel = () => {
    if (workoutId) {
      navigate('/exercise-complete');
    } else {
      navigate('/');
    }
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-primary text-white px-6 py-6">
        <button 
          onClick={handleCancel}
          className="text-blue-100 hover:text-white mb-3 flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-semibold">Choose Exercise</h1>
        <p className="text-blue-100 mt-1">Select your next exercise</p>
      </div>

      <div className="px-4 py-6 space-y-3">
        {defaultExercises.map((exercise) => {
          const lastWeight = getLastWeight(exercise.id);
          const suggestedWeight = suggestNextWeight(exercise.id);
          const isSelected = selectedExerciseId === exercise.id;
          const alreadyInWorkout = currentWorkoutExercises.some(e => e.id === exercise.id);

          return (
            <div
              key={exercise.id}
              onClick={() => !alreadyInWorkout && handleSelectExercise(exercise.id)}
            >
              <Card
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-2 border-primary bg-primary-light' 
                    : alreadyInWorkout
                    ? 'opacity-50 border border-success bg-success-light'
                    : 'border border-gray-200 hover:border-primary'
                }`}
              >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'border-primary bg-primary' 
                        : alreadyInWorkout
                        ? 'border-success bg-success'
                        : 'border-gray-300'
                    }`}>
                      {(isSelected || alreadyInWorkout) && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {exercise.name}
                      </div>
                      {alreadyInWorkout && (
                        <div className="text-xs text-success">
                          Already in today's workout
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right text-sm">
                  {lastWeight !== null ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">{lastWeight}lbs</span>
                      <span className="text-success font-bold">→</span>
                      <span className="text-success font-semibold">{suggestedWeight}lbs</span>
                    </div>
                  ) : (
                    <span className="text-primary font-semibold">{suggestedWeight}lbs</span>
                  )}
                </div>
              </div>
            </Card>
            </div>
          );
        })}
      </div>

      {/* Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <Button
          variant="primary"
          fullWidth
          onClick={handleContinue}
          disabled={!selectedExerciseId}
          className="text-lg py-4"
        >
          {selectedExerciseId ? 'START EXERCISE' : 'SELECT AN EXERCISE'}
        </Button>
      </div>
    </div>
  );
}

