import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import RIRButtons from '../components/workout/RIRButtons';
import PRCelebration from '../components/workout/PRCelebration';
import WorkoutHeader from '../components/workout/WorkoutHeader';
import { useWorkoutStore } from '../stores/workoutStore';
import { suggestNextWeight } from '../services/progression/weightSuggestion';
import { getLastWorkoutSets } from '../services/database/sets';
import { detectAndSavePRs } from '../services/progression/prDetector';
import type { RIRResponse } from '../types/database';

export default function WorkoutScreen() {
  const navigate = useNavigate();
  const {
    exercises,
    currentExerciseIndex,
    currentSetNumber,
    completeSet,
    startRest
  } = useWorkoutStore();

  const currentExercise = exercises[currentExerciseIndex];
  const targetSets = 5; // StrongLifts 5x5
  const targetReps = 5;

  const [weight, setWeight] = useState<string>('');
  const [suggestedWeight, setSuggestedWeight] = useState<number>(0);
  const [reps, setReps] = useState<string>('');
  const [rirResponse, setRirResponse] = useState<RIRResponse | null>(null);
  const [showPRCelebration, setShowPRCelebration] = useState(false);
  const [prTypes, setPrTypes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load suggested weight and last workout data
  useEffect(() => {
    if (currentExercise && currentSetNumber === 1) {
      const suggested = suggestNextWeight(currentExercise.id);
      setSuggestedWeight(suggested);
      setWeight(suggested.toString());
    }
  }, [currentExercise, currentSetNumber]);

  const lastSets = currentExercise ? getLastWorkoutSets(currentExercise.id) : [];
  const lastWorkoutDisplay = lastSets.length > 0
    ? `${lastSets[0].weight}lbs × ${lastSets.map(s => s.reps).join(', ')} reps`
    : 'First time doing this exercise';

  const isFormValid = weight && reps && rirResponse && parseFloat(weight) > 0 && parseInt(reps) > 0;

  const handleCompleteSet = () => {
    if (!isFormValid || !currentExercise || isSubmitting) return;

    setIsSubmitting(true);

    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);

    // Complete the set and get the IDs
    const { workoutId, setId } = completeSet(weightNum, repsNum, rirResponse!, targetReps);

    // Check for personal records
    const achievedPRs = detectAndSavePRs(
      currentExercise.id,
      workoutId,
      setId,
      weightNum,
      repsNum
    );

    // Reset form
    setReps('');
    setRirResponse(null);

    // Show PR celebration if any PRs were achieved
    if (achievedPRs.length > 0) {
      setPrTypes(achievedPRs);
      setShowPRCelebration(true);
      setIsSubmitting(false);
      // Navigation will happen after PR celebration closes
    } else {
      // No PR, proceed normally
      proceedAfterSet();
      // Reset after navigation
      setTimeout(() => setIsSubmitting(false), 500);
    }
  };

  const proceedAfterSet = () => {
    if (currentSetNumber >= targetSets) {
      // Exercise complete - go to staging screen
      navigate('/exercise-complete');
    } else {
      // Start rest period
      startRest();
      navigate('/workout/rest');
    }
  };

  const handlePRCelebrationClose = () => {
    setShowPRCelebration(false);
    setPrTypes([]);
    proceedAfterSet();
  };

  if (!currentExercise) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <WorkoutHeader
        title={currentExercise.name}
        subtitle={`Working Set ${currentSetNumber} of ${targetSets}`}
      />

      <div className="px-4 py-6 space-y-4">
        {/* Progress Indicator */}
        {currentSetNumber > 1 && (
          <Card className="bg-gray-50">
            <div className="text-sm text-gray-600 mb-2 font-medium">Sets Completed</div>
            <div className="flex gap-2">
              {Array.from({ length: targetSets }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded ${
                    i < currentSetNumber - 1
                      ? 'bg-success'
                      : i === currentSetNumber - 1
                      ? 'bg-primary'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {currentSetNumber - 1} of {targetSets} complete
            </div>
          </Card>
        )}

        {/* Last Workout */}
        <Card className="bg-warning-light border-l-4 border-warning">
          <div className="text-xs font-semibold text-warning-dark uppercase tracking-wide mb-1">
            Last Workout
          </div>
          <div className="text-gray-900 font-medium">
            {lastWorkoutDisplay}
          </div>
        </Card>

        {/* Suggested Weight */}
        <Card className="bg-primary-light border-l-4 border-primary">
          <div className="text-xs font-semibold text-primary-dark uppercase tracking-wide mb-1">
            Suggested
          </div>
          <div className="text-2xl text-primary font-bold">
            {suggestedWeight || '—'} lbs
          </div>
        </Card>

        {/* Weight Input */}
        <Input
          type="number"
          label="Weight (lbs)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="140"
          min="0"
          step="5"
          inputMode="decimal"
        />

        {/* Reps Input */}
        <Input
          type="number"
          label="Reps Completed"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="10"
          min="1"
          step="1"
          inputMode="numeric"
        />

        {/* RIR Buttons */}
        <RIRButtons
          value={rirResponse}
          onChange={setRirResponse}
        />

        {/* Complete Set Button */}
        <div className="pt-4">
          <Button
            variant="primary"
            fullWidth
            onClick={handleCompleteSet}
            disabled={!isFormValid || isSubmitting}
            className="text-lg py-5"
          >
            {isSubmitting ? 'SAVING...' : 'COMPLETE SET'}
          </Button>
        </div>

        {/* Help Text */}
        {!isFormValid && (
          <p className="text-sm text-gray-500 text-center">
            Fill in all fields to continue
          </p>
        )}
      </div>

      {/* PR Celebration Modal */}
      <PRCelebration
        isVisible={showPRCelebration}
        prTypes={prTypes}
        exerciseName={currentExercise.name}
        weight={parseFloat(weight) || 0}
        reps={parseInt(reps) || 0}
        onClose={handlePRCelebrationClose}
      />
    </div>
  );
}

