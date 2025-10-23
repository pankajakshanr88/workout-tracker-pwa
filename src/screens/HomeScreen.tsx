import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useExerciseStore } from '../stores/exerciseStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { suggestNextWeight, getLastWeight } from '../services/progression/weightSuggestion';
import { getActiveAlerts } from '../services/database/alerts';
import { analyzeAllExercisesStagnation } from '../services/alerts/stagnationDetector';
import { analyzeAllExercisesSandbagging } from '../services/alerts/sandbaggingDetector';
import type { Exercise } from '../types/database';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { defaultExercises, isLoaded, loadExercises } = useExerciseStore();
  const { startWorkout } = useWorkoutStore();
  
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (!isLoaded) {
      loadExercises();
    } else if (selectedExercises.length === 0) {
      // Initialize with all exercises selected
      setSelectedExercises([...defaultExercises]);
    }
  }, [isLoaded, loadExercises, defaultExercises, selectedExercises.length]);

  useEffect(() => {
    // Check for alerts when component mounts or exercises change
    const checkAlerts = () => {
      const dbAlerts = getActiveAlerts();
      const stagnationAlerts = analyzeAllExercisesStagnation();
      const sandbaggingAlerts = analyzeAllExercisesSandbagging();
      const totalAlerts = dbAlerts.length + stagnationAlerts.length + sandbaggingAlerts.length;
      setAlertCount(totalAlerts);
    };

    checkAlerts();
  }, [defaultExercises]);

  const handleToggleExercise = (exercise: Exercise) => {
    setSelectedExercises(prev => {
      const isSelected = prev.some(e => e.id === exercise.id);
      if (isSelected) {
        return prev.filter(e => e.id !== exercise.id);
      } else {
        return [...prev, exercise];
      }
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...selectedExercises];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setSelectedExercises(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedExercises.length - 1) return;
    const newOrder = [...selectedExercises];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setSelectedExercises(newOrder);
  };

  const handleStartWorkout = () => {
    if (selectedExercises.length === 0) {
      alert('Please select at least one exercise');
      return;
    }
    startWorkout(selectedExercises);
    navigate('/workout');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const today = new Date();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Today</h1>
        <p className="text-gray-600">{format(today, 'EEEE, MMMM d')}</p>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Workout Card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">WORKOUT A</h2>
            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              className="text-sm text-primary font-semibold hover:text-primary-dark"
            >
              {isCustomizing ? '✓ Done' : '✏️ Customize'}
            </button>
          </div>
          
          <div className="space-y-2">
            {isCustomizing ? (
              /* Customizing Mode */
              defaultExercises.map((exercise) => {
                const isSelected = selectedExercises.some(e => e.id === exercise.id);
                const lastWeight = getLastWeight(exercise.id);
                const suggestedWeight = suggestNextWeight(exercise.id);

                return (
                  <div
                    key={exercise.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isSelected ? 'border-primary bg-primary-light' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleExercise(exercise)}
                      className="w-5 h-5 text-primary focus:ring-primary cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{exercise.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {lastWeight !== null ? (
                          <>{lastWeight}lbs → <span className="text-success font-semibold">{suggestedWeight}lbs</span></>
                        ) : (
                          <span className="text-primary font-semibold">{suggestedWeight}lbs</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Display Mode with Reordering */
              selectedExercises.map((exercise, index) => {
                const lastWeight = getLastWeight(exercise.id);
                const suggestedWeight = suggestNextWeight(exercise.id);

                return (
                  <div
                    key={exercise.id}
                    className="flex items-center gap-3 py-3 border-b border-gray-200 last:border-0"
                  >
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className={`text-gray-400 hover:text-primary ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === selectedExercises.length - 1}
                        className={`text-gray-400 hover:text-primary ${index === selectedExercises.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        ▼
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{exercise.name}</div>
                    </div>
                    <div className="text-sm">
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
                );
              })
            )}
          </div>

          {selectedExercises.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Select at least one exercise to start your workout
            </div>
          )}
        </Card>

        {/* Progress Badge */}
        {selectedExercises.length > 0 && (
          <Card className="bg-success-light border-success text-center">
            <div className="text-success-dark font-medium">
              📈 {selectedExercises.length} exercise{selectedExercises.length > 1 ? 's' : ''} selected • Ready to progress!
            </div>
          </Card>
        )}

        {/* Alerts Badge */}
        {alertCount > 0 && (
          <Card className={`text-center ${alertCount > 1 ? 'bg-warning-light border-warning' : 'bg-info-light border-info'}`}>
            <div className={`font-medium ${alertCount > 1 ? 'text-warning-dark' : 'text-info-dark'}`}>
              ⚠️ {alertCount} smart alert{alertCount > 1 ? 's' : ''} • Check recommendations
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            variant="primary" 
            fullWidth 
            onClick={handleStartWorkout}
            disabled={selectedExercises.length === 0}
            className="text-lg py-5"
          >
            {selectedExercises.length === 0 
              ? 'SELECT EXERCISES TO START'
              : `START WORKOUT (${selectedExercises.length} ${selectedExercises.length === 1 ? 'EXERCISE' : 'EXERCISES'})`
            }
          </Button>
          
          {alertCount > 0 && (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => navigate('/alerts')}
              className={`${alertCount > 1 ? 'border-warning text-warning-dark bg-warning-light' : 'border-info text-info-dark bg-info-light'}`}
            >
              ⚠️ View Alerts ({alertCount})
            </Button>
          )}

          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/progress')}
          >
            📊 View Progress
          </Button>
        </div>
      </div>
    </div>
  );
}

