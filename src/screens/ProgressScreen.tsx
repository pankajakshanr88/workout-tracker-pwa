/**
 * Progress Screen
 * 
 * Shows weight progression charts, personal records, and workout history
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProgressChart from '../components/charts/ProgressChart';
import { useExerciseStore } from '../stores/exerciseStore';
import { getBestPRs, getExercisePRs } from '../services/progression/prDetector';
import { getSetsByExercise } from '../services/database/sets';
import { getExerciseById } from '../services/database/exercises';
import type { Exercise, PersonalRecord, WorkoutSet } from '../types/database';

export default function ProgressScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const exerciseId = searchParams.get('exerciseId');
  
  const { defaultExercises, isLoaded, loadExercises } = useExerciseStore();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [prs, setPRs] = useState<{ weightPR?: PersonalRecord; volumePR?: PersonalRecord; repPR?: PersonalRecord }>({});
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) {
      loadExercises();
    }
  }, [isLoaded, loadExercises]);

  useEffect(() => {
    if (isLoaded) {
      // If exerciseId provided, use it; otherwise use first default exercise
      const exerciseIdNum = exerciseId ? parseInt(exerciseId) : defaultExercises[0]?.id;
      
      if (exerciseIdNum) {
        const exercise = getExerciseById(exerciseIdNum);
        setSelectedExercise(exercise);
        loadProgressData(exerciseIdNum);
      } else {
        setIsLoading(false);
      }
    }
  }, [exerciseId, isLoaded, defaultExercises]);

  const loadProgressData = (exId: number) => {
    setIsLoading(true);

    try {
      // Get workout history
      const sets = getSetsByExercise(exId, 50);
      setRecentWorkouts(sets.slice(0, 10)); // Keep only last 10 sets
      
      // Prepare chart data - group by workout and take first set of each workout
      const workoutMap = new Map<number, WorkoutSet>();
      sets.forEach(set => {
        if (!workoutMap.has(set.workout_id)) {
          workoutMap.set(set.workout_id, set);
        }
      });
      
      const chartPoints = Array.from(workoutMap.values())
        .map(set => ({
          date: set.created_at,
          weight: set.weight,
          reps: set.reps
        }))
        .slice(0, 20) // Last 20 workouts
        .reverse(); // Chronological order
      
      setChartData(chartPoints);

      // Get PRs
      const bestPRs = getBestPRs(exId);
      setPRs(bestPRs);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExerciseChange = (exId: number) => {
    const exercise = getExerciseById(exId);
    setSelectedExercise(exercise);
    loadProgressData(exId);
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!selectedExercise) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">No exercise data available</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-primary text-white px-6 py-6">
        <button 
          onClick={() => navigate('/')}
          className="text-blue-100 hover:text-white mb-3 flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-semibold mb-3">Progress Tracker</h1>
        
        {/* Exercise Selector */}
        <select
          value={selectedExercise.id}
          onChange={(e) => handleExerciseChange(parseInt(e.target.value))}
          className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {defaultExercises.map(ex => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Personal Records */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Personal Records 🏆</h2>
          
          <div className="grid grid-cols-3 gap-3">
            {/* Weight PR */}
            <div className="text-center p-4 bg-warning-light rounded-lg">
              <div className="text-3xl mb-1">🏋️</div>
              <div className="text-2xl font-bold text-gray-900">
                {prs.weightPR ? `${prs.weightPR.weight}lbs` : '—'}
              </div>
              <div className="text-xs text-gray-600 mt-1">Weight PR</div>
              {prs.weightPR && (
                <div className="text-xs text-gray-500 mt-1">
                  {format(parseISO(prs.weightPR.date), 'MMM d')}
                </div>
              )}
            </div>

            {/* Volume PR */}
            <div className="text-center p-4 bg-success-light rounded-lg">
              <div className="text-3xl mb-1">💪</div>
              <div className="text-2xl font-bold text-gray-900">
                {prs.volumePR ? prs.volumePR.volume : '—'}
              </div>
              <div className="text-xs text-gray-600 mt-1">Volume PR</div>
              {prs.volumePR && (
                <div className="text-xs text-gray-500 mt-1">
                  {prs.volumePR.weight}×{prs.volumePR.reps}
                </div>
              )}
            </div>

            {/* Rep PR */}
            <div className="text-center p-4 bg-error-light rounded-lg">
              <div className="text-3xl mb-1">🔥</div>
              <div className="text-2xl font-bold text-gray-900">
                {prs.repPR ? prs.repPR.reps : '—'}
              </div>
              <div className="text-xs text-gray-600 mt-1">Rep PR</div>
              {prs.repPR && (
                <div className="text-xs text-gray-500 mt-1">
                  @ {prs.repPR.weight}lbs
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Progress Chart */}
        <ProgressChart 
          data={chartData}
          exerciseName={selectedExercise.name}
          currentPR={prs.weightPR?.weight}
        />

        {/* Recent Workouts */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Recent Sets</h2>
          
          {recentWorkouts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No workout history yet. Start your first workout!
            </p>
          ) : (
            <div className="space-y-2">
              {recentWorkouts.map((set, index) => (
                <div 
                  key={set.id}
                  className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      Set {set.set_number}: {set.weight}lbs × {set.reps} reps
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(parseISO(set.created_at), 'MMM d, yyyy • h:mm a')}
                    </div>
                  </div>
                  
                  {set.rir_response && (
                    <div className={`text-xs px-2 py-1 rounded ${
                      set.rir_response === 'yes_maybe' 
                        ? 'bg-success text-white' 
                        : set.rir_response === 'yes_easily'
                        ? 'bg-warning text-white'
                        : 'bg-error text-white'
                    }`}>
                      {set.rir_response === 'yes_maybe' ? '✓ 1 RIR' : 
                       set.rir_response === 'yes_easily' ? '⚠ Too Easy' : 
                       '✗ Failure'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            variant="primary" 
            fullWidth 
            onClick={() => navigate('/')}
            className="text-lg py-4"
          >
            Start New Workout
          </Button>
        </div>
      </div>
    </div>
  );
}

