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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <WorkoutHeader
        title={currentExercise.name}
        subtitle={`Rest Period • Set ${currentSetNumber} of ${targetSets}${currentExercise.superset_group ? ` • Superset ${currentExercise.superset_group}` : ''}`}
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
        <Card variant="elevated" shadow="medium" className="bg-gradient-success animate-scale-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div className="text-white font-bold text-lg">Set Complete!</div>
          </div>
          <div className="text-center mb-3">
            <div className="text-3xl font-black text-white mb-1">
              {lastCompletedSet.weight}<span className="text-xl">lbs</span>
            </div>
            <div className="text-white/90 text-lg font-medium">
              × {lastCompletedSet.reps} reps
            </div>
          </div>
          <div className={`text-center text-white font-bold text-lg bg-white/10 rounded-2xl p-3 backdrop-blur-sm`}>
            {rirFeedback.message}
          </div>
        </Card>

        {/* Expected Performance */}
        <Card variant="elevated" shadow="medium" className="bg-gradient-info animate-scale-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-white font-bold text-lg">AI Prediction</div>
          </div>
          <div className="text-center">
            <div className="text-white/90 text-sm font-medium mb-2">Set {currentSetNumber} Performance</div>
            <div className="text-2xl font-black text-white bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              {formatRepPrediction(prediction)}
            </div>
            <div className="text-white/80 text-sm font-medium mt-2">
              Based on your training pattern
            </div>
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
        <div className="space-y-4 pt-4">
          <Button
            variant="primary"
            size="xl"
            fullWidth
            onClick={handleStartNextSet}
            icon="🚀"
            className="btn-modern animate-pulse-glow"
          >
            START SET {currentSetNumber} • READY TO GO
          </Button>

          <Button
            variant="outline"
            fullWidth
            onClick={handleSkipRest}
            icon="⏭️"
            className="btn-modern"
          >
            SKIP REST • CONTINUE WORKOUT
          </Button>
        </div>
      </div>
    </div>
  );
}

