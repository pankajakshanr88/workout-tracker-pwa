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
    if (currentExercise) {
      console.log(`Loading suggested weight for ${currentExercise.name} (ID: ${currentExercise.id})`);
      const suggested = suggestNextWeight(currentExercise.id);
      console.log(`Suggested weight calculated: ${suggested}lbs`);
      setSuggestedWeight(suggested);

      // Only auto-set weight for first set of first exercise
      if (currentSetNumber === 1) {
        const weightStr = suggested > 0 ? suggested.toString() : '';
        setWeight(weightStr);
        console.log(`Auto-setting weight input to: ${weightStr}`);
      }
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
        subtitle={`Set ${currentSetNumber} of ${targetSets}${currentExercise.superset_group ? ` • Superset ${currentExercise.superset_group}` : ''}`}
      />

      <div className="px-4 py-6 space-y-4">
        {/* Progress Indicator */}
        {currentSetNumber > 1 && (
          <Card variant="modern" shadow="medium" animate className="animate-scale-in">
            <div className="text-center mb-4">
              <div className="text-lg font-bold text-gray-900 mb-2">Workout Progress</div>
              <div className="text-sm text-gray-600 font-medium">Set {currentSetNumber - 1} of {targetSets} Complete</div>
            </div>
            <div className="flex gap-3 mb-4">
              {Array.from({ length: targetSets }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-3 rounded-full transition-all duration-300 ${
                    i < currentSetNumber - 1
                      ? 'bg-gradient-success shadow-success-glow'
                      : i === currentSetNumber - 1
                      ? 'bg-gradient-primary shadow-primary-glow animate-pulse'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-center gap-2">
              <span className="text-xs px-3 py-1 bg-success-light text-success-dark rounded-full font-medium">
                ✓ {currentSetNumber - 1} Complete
              </span>
              <span className="text-xs px-3 py-1 bg-primary-light text-primary-dark rounded-full font-medium">
                🔄 {targetSets - (currentSetNumber - 1)} Remaining
              </span>
            </div>
          </Card>
        )}

        {/* Last Workout */}
        <Card variant="elevated" shadow="medium" className="bg-gradient-warning animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-white font-bold text-lg">Last Performance</div>
          </div>
          <div className="text-white/90 text-lg font-medium bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            {lastWorkoutDisplay}
          </div>
        </Card>

        {/* Suggested Weight */}
        <Card variant="elevated" shadow="medium" className="bg-gradient-primary animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-white font-bold text-lg">AI Suggestion</div>
          </div>
          <div className="text-center">
            <div className="text-white/90 text-sm font-medium mb-2">Recommended Weight</div>
            <div className="text-4xl font-black text-white bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              {suggestedWeight > 0 ? suggestedWeight : '—'} <span className="text-xl">lbs</span>
            </div>
          </div>
        </Card>

        {/* Weight Input */}
        <Input
          variant="modern"
          size="lg"
          label="Weight (lbs)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="140"
          min="0"
          step="5"
          inputMode="decimal"
          leftIcon="⚖️"
          helperText="Enter the weight you lifted"
          className="animate-fade-in"
        />

        {/* Reps Input */}
        <Input
          variant="modern"
          size="lg"
          label="Reps Completed"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="5"
          min="1"
          step="1"
          inputMode="numeric"
          leftIcon="🔄"
          helperText="How many reps did you complete?"
          className="animate-fade-in"
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
            size="xl"
            fullWidth
            onClick={handleCompleteSet}
            disabled={!isFormValid || isSubmitting}
            loading={isSubmitting}
            icon={isSubmitting ? undefined : '💪'}
            className="btn-modern animate-pulse-glow"
          >
            {isSubmitting ? 'ANALYZING & SAVING...' : `COMPLETE SET • READY TO PROGRESS`}
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

