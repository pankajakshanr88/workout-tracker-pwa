import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import RestTimer from '../components/workout/RestTimer';
import SetList from '../components/workout/SetList';
import WorkoutHeader from '../components/workout/WorkoutHeader';
import { useWorkoutStore } from '../stores/workoutStore';
import { useSettingsStore } from '../stores/settingsStore';
import { predictReps, formatRepPrediction, getRIRFeedback } from '../services/progression/repPrediction';

export default function RestScreen() {
  const navigate = useNavigate();
  const {
    exercises,
    currentExerciseIndex,
    currentSetNumber,
    completedSets,
    lastCompletedSet,
    endRest
  } = useWorkoutStore();

  const { compoundRestTime } = useSettingsStore();

  const currentExercise = exercises[currentExerciseIndex];
  const targetSets = 5;

  useEffect(() => {
    // Request notification permission on first rest
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleStartNextSet = () => {
    endRest();
    navigate('/workout');
  };

  const handleSkipRest = () => {
    handleStartNextSet();
  };

  if (!currentExercise || !lastCompletedSet) {
    navigate('/workout');
    return null;
  }

  // Get rep prediction for next set
  const prediction = predictReps(
    lastCompletedSet.reps,
    lastCompletedSet.rir_response!,
    currentSetNumber
  );

  // Get RIR feedback
  const rirFeedback = getRIRFeedback(lastCompletedSet.rir_response!);

  // Filter completed sets for current exercise
  const exerciseSets = completedSets.filter(s => s.exercise_id === currentExercise.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <WorkoutHeader
        title={currentExercise.name}
        subtitle={`Rest Period • Next: Working Set ${currentSetNumber} of ${targetSets}`}
      />

      <div className="px-4 py-6 space-y-4">
        {/* Rest Timer */}
        <RestTimer
          duration={compoundRestTime}
          onComplete={() => {
            // Timer complete, but user can still choose when to start
          }}
        />

        {/* Completed Set Performance */}
        <Card className="bg-success-light border-l-4 border-success">
          <div className="text-xs font-semibold text-success-dark uppercase tracking-wide mb-2">
            ✓ Set {currentSetNumber - 1} Complete
          </div>
          <div className="text-gray-900 font-semibold text-lg mb-2">
            {lastCompletedSet.weight}lbs × {lastCompletedSet.reps} reps
          </div>
          <div
            className={`text-sm font-medium ${
              rirFeedback.type === 'success'
                ? 'text-success-dark'
                : rirFeedback.type === 'warning'
                ? 'text-warning-dark'
                : 'text-error-dark'
            }`}
          >
            {rirFeedback.message}
          </div>
        </Card>

        {/* Expected Performance */}
        <Card className="bg-info-light border-l-4 border-info">
          <div className="text-xs font-semibold text-info-dark uppercase tracking-wide mb-2">
            💡 Next Set Prediction
          </div>
          <div className="text-gray-900">
            For Set {currentSetNumber}, expect{' '}
            <strong className="text-info-dark">{formatRepPrediction(prediction)}</strong> based on your last set
          </div>
        </Card>

        {/* Set Progress */}
        <SetList
          completedSets={exerciseSets}
          currentSetNumber={currentSetNumber}
          totalSets={targetSets}
          weight={lastCompletedSet.weight}
        />

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            variant="primary"
            fullWidth
            onClick={handleStartNextSet}
            className="text-lg py-5"
          >
            START SET {currentSetNumber}
          </Button>

          <Button
            variant="secondary"
            fullWidth
            onClick={handleSkipRest}
          >
            Skip Rest
          </Button>
        </div>
      </div>
    </div>
  );
}

