/**
 * Exercise Complete Screen
 * 
 * Shows between exercises - gives user control over what to do next
 */

import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useWorkoutStore } from '../stores/workoutStore';
import { getLastWorkoutSets } from '../services/database/sets';

export default function ExerciseCompleteScreen() {
  const navigate = useNavigate();
  const {
    exercises,
    currentExerciseIndex,
    completedSets,
    nextExercise,
    endWorkout
  } = useWorkoutStore();

  const completedExercise = exercises[currentExerciseIndex];
  const nextExerciseData = exercises[currentExerciseIndex + 1];
  const isLastExercise = currentExerciseIndex >= exercises.length - 1;

  // Get sets for the completed exercise
  const exerciseSets = completedSets.filter(s => s.exercise_id === completedExercise?.id);

  const handleNextExercise = () => {
    if (isLastExercise) {
      endWorkout();
      navigate('/');
    } else {
      nextExercise();
      navigate('/workout');
    }
  };

  const handleChooseDifferentExercise = () => {
    navigate('/exercise-select');
  };

  const handleFinishWorkout = () => {
    endWorkout();
    navigate('/');
  };

  if (!completedExercise) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-success text-white px-6 py-8 text-center">
        <div className="text-6xl mb-4">✓</div>
        <h1 className="text-2xl font-bold mb-2">Exercise Complete!</h1>
        <p className="text-green-100 text-lg">{completedExercise.name}</p>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Performance Summary */}
        <Card className="bg-success-light border-l-4 border-success">
          <div className="text-xs font-semibold text-success-dark uppercase tracking-wide mb-3">
            Today's Performance
          </div>
          
          <div className="space-y-2">
            {exerciseSets.map((set) => (
              <div key={set.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Set {set.set_number}:</span>
                <span className="font-semibold text-gray-900">
                  {set.weight}lbs × {set.reps} reps
                  {set.rir_response === 'yes_maybe' ? ' ✓' : 
                   set.rir_response === 'yes_easily' ? ' ⚠️' : ' ❌'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-success">
            <div className="text-center">
              <div className="text-2xl font-bold text-success-dark">
                {exerciseSets.length} Sets Complete
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {format(new Date(), 'h:mm a')}
              </div>
            </div>
          </div>
        </Card>

        {/* Workout Progress */}
        <Card>
          <div className="text-sm text-gray-600 mb-3 font-medium">Workout Progress</div>
          
          <div className="space-y-2">
            {exercises.map((exercise, index) => (
              <div 
                key={exercise.id}
                className={`flex items-center gap-3 py-2 ${
                  index < currentExerciseIndex + 1 ? '' : 'opacity-50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  index < currentExerciseIndex + 1
                    ? 'bg-success text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {index < currentExerciseIndex + 1 ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${
                    index === currentExerciseIndex ? 'text-success' : 'text-gray-900'
                  }`}>
                    {exercise.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Next Exercise Preview */}
        {!isLastExercise && nextExerciseData && (
          <Card className="bg-primary-light border-l-4 border-primary">
            <div className="text-xs font-semibold text-primary-dark uppercase tracking-wide mb-2">
              Up Next
            </div>
            <div className="text-xl font-bold text-gray-900 mb-1">
              {nextExerciseData.name}
            </div>
            <div className="text-sm text-gray-600">
              {(() => {
                const lastSets = getLastWorkoutSets(nextExerciseData.id);
                if (lastSets.length > 0) {
                  return `Last workout: ${lastSets[0].weight}lbs × ${lastSets.map(s => s.reps).join(', ')} reps`;
                }
                return 'First time doing this exercise';
              })()}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          {!isLastExercise ? (
            <>
              <Button 
                variant="primary" 
                fullWidth 
                onClick={handleNextExercise}
                className="text-lg py-5"
              >
                CONTINUE TO NEXT EXERCISE →
              </Button>

              <Button 
                variant="secondary" 
                fullWidth
                onClick={handleChooseDifferentExercise}
              >
                Choose Different Exercise
              </Button>

              <Button 
                variant="ghost" 
                fullWidth
                onClick={handleFinishWorkout}
              >
                Finish Workout Early
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="primary" 
                fullWidth 
                onClick={handleFinishWorkout}
                className="text-lg py-5"
              >
                🎉 COMPLETE WORKOUT
              </Button>

              <Button 
                variant="secondary" 
                fullWidth
                onClick={handleChooseDifferentExercise}
              >
                Add Another Exercise
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

