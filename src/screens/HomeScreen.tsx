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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-white px-6 py-8 text-center shadow-strong animate-slide-down">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm animate-float">
            <span className="text-2xl">💪</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Today</h1>
            <p className="text-blue-100 text-lg font-medium">{format(today, 'EEEE, MMMM d')}</p>
          </div>
        </div>
        <div className="text-blue-100/80 text-sm font-medium">
          Ready to crush your workout? 🚀
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Workout Card */}
        <Card variant="modern" shadow="medium" hover className="animate-scale-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">WORKOUT A</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCustomizing(!isCustomizing)}
              className="animate-bounce-soft"
            >
              {isCustomizing ? '✓ Done' : '✏️ Customize'}
            </Button>
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
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 animate-slide-up ${
                      isSelected
                        ? 'border-primary bg-gradient-primary text-white shadow-medium scale-[1.02]'
                        : 'border-gray-200 bg-white hover:border-primary/50 hover:shadow-soft hover:scale-[1.01]'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'bg-white border-white' : 'border-gray-300 bg-gray-50'
                    }`}>
                      {isSelected && <span className="text-primary text-sm">✓</span>}
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold text-lg ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {exercise.name}
                      </div>
                      <div className={`text-sm mt-1 font-medium ${
                        isSelected ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                        {lastWeight !== null ? (
                          <>
                            {lastWeight}lbs →{' '}
                            <span className={`font-bold ${isSelected ? 'text-white' : 'text-success'}`}>
                              {suggestedWeight}lbs
                            </span>
                          </>
                        ) : (
                          <span className={`font-bold ${isSelected ? 'text-white' : 'text-primary'}`}>
                            {suggestedWeight}lbs
                          </span>
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
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200/50 hover:border-primary/30 hover:shadow-soft transition-all duration-200 animate-fade-in"
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className={`w-8 h-8 p-0 ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-primary hover:text-white'}`}
                      >
                        ▲
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === selectedExercises.length - 1}
                        className={`w-8 h-8 p-0 ${index === selectedExercises.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-primary hover:text-white'}`}
                      >
                        ▼
                      </Button>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-gray-900">{exercise.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                          Set {index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {lastWeight !== null ? (
                        <div className="space-y-1">
                          <div className="text-sm text-gray-500">{lastWeight}lbs</div>
                          <div className="flex items-center gap-1">
                            <span className="text-success font-bold">→</span>
                            <span className="text-success font-bold text-lg">{suggestedWeight}lbs</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-primary font-bold text-lg">{suggestedWeight}lbs</div>
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
          <Card variant="elevated" shadow="medium" className="bg-gradient-success text-center animate-bounce-soft">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">📈</span>
              <div className="text-white font-bold text-lg">
                {selectedExercises.length} exercise{selectedExercises.length > 1 ? 's' : ''} selected • Ready to progress!
              </div>
            </div>
          </Card>
        )}

        {/* Alerts Badge */}
        {alertCount > 0 && (
          <Card
            variant="elevated"
            shadow="medium"
            className={`text-center animate-pulse-glow ${alertCount > 1 ? 'bg-gradient-warning' : 'bg-gradient-info'}`}
          >
            <div className={`flex items-center justify-center gap-2 ${alertCount > 1 ? 'text-white' : 'text-white'}`}>
              <span className="text-2xl animate-bounce">⚠️</span>
              <div className="font-bold text-lg">
                {alertCount} smart alert{alertCount > 1 ? 's' : ''} • Check recommendations
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            variant="primary"
            size="xl"
            fullWidth
            onClick={handleStartWorkout}
            disabled={selectedExercises.length === 0}
            icon={selectedExercises.length === 0 ? '🎯' : '🚀'}
            className="btn-modern animate-pulse-glow"
            data-testid="start-workout"
          >
            {selectedExercises.length === 0
              ? 'SELECT EXERCISES TO START'
              : `START WORKOUT • ${selectedExercises.length} ${selectedExercises.length === 1 ? 'EXERCISE' : 'EXERCISES'}`
            }
          </Button>

          {alertCount > 0 && (
            <Button
              variant="glass"
              fullWidth
              onClick={() => navigate('/alerts')}
              icon="⚠️"
              className={`btn-modern ${alertCount > 1 ? 'animate-pulse' : ''}`}
              data-testid="smart-alerts"
            >
              SMART ALERTS • {alertCount} INSIGHT{alertCount > 1 ? 'S' : ''}
            </Button>
          )}

          <Button
            variant="outline"
            fullWidth
            onClick={() => navigate('/progress')}
            icon="📈"
            className="btn-modern"
            data-testid="view-progress"
          >
            VIEW PROGRESS & STATS
          </Button>
        </div>
      </div>
    </div>
  );
}

