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
import VolumeChart from '../components/charts/VolumeChart';
import {
  getActiveTemplate,
  getDefaultExercises,
  getTemplates,
  saveTemplateExercises,
  setActiveTemplate,
  createTemplate,
  getTemplateExercisesWithDetails
} from '../services/database/exercises';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import type { WorkoutTemplate } from '../types/database';
import type { Exercise } from '../types/database';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { defaultExercises, isLoaded, loadExercises } = useExerciseStore();
  const { startWorkout } = useWorkoutStore();
  
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  useEffect(() => {
    if (!isLoaded) {
      loadExercises();
      return;
    }

    // Load templates and active template
    const all = getTemplates();
    if (all.length === 0) {
      // Seed a default template A
      const id = createTemplate('Workout A');
      setActiveTemplate(id);
      setTemplates(getTemplates());
      setSelectedExercises([...defaultExercises]);
      saveTemplateExercises(id, defaultExercises.map((e, idx) => ({ exercise_id: e.id, order_index: idx, superset_group: null })));
      return;
    }

    setTemplates(all);
    const active = getActiveTemplate() || all[0];
    if (active) {
      // Load exercises from this template
      const templateExercises = getTemplateExercisesWithDetails(active.id);
      if (templateExercises.length > 0) {
        // Template has exercises - use them
        setSelectedExercises(templateExercises);
      } else {
        // Template is empty - seed with defaults
        const defaults = getDefaultExercises();
        setSelectedExercises(defaults.map(e => ({ ...e, superset_group: null, order_index: 0 } as Exercise)));
        saveTemplateExercises(active.id, defaults.map((e, idx) => ({ exercise_id: e.id, order_index: idx, superset_group: null })));
      }
    }
  }, [isLoaded, loadExercises, defaultExercises]);

  // Refresh templates when active template changes
  useEffect(() => {
    setTemplates(getTemplates());
  }, []);

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

  const handleTemplateSwitch = (templateId: number) => {
    setActiveTemplate(templateId);
    setTemplates(getTemplates());
    const templateExercises = getTemplateExercisesWithDetails(templateId);
    if (templateExercises.length > 0) {
      setSelectedExercises(templateExercises);
    } else {
      // Seed with defaults if empty
      const defaults = getDefaultExercises();
      setSelectedExercises(defaults.map(e => ({ ...e, superset_group: null, order_index: 0 } as Exercise)));
      saveTemplateExercises(templateId, defaults.map((e, idx) => ({ exercise_id: e.id, order_index: idx, superset_group: null })));
    }
  };


  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = selectedExercises.findIndex(e => e.id === Number(active.id));
    const newIndex = selectedExercises.findIndex(e => e.id === Number(over.id));
    const reordered = arrayMove(selectedExercises, oldIndex, newIndex);
    setSelectedExercises(reordered);
    const activeTemplate = getActiveTemplate();
    if (activeTemplate) {
      saveTemplateExercises(activeTemplate.id, reordered.map((e, idx) => ({ exercise_id: e.id, order_index: idx, superset_group: e.superset_group || null })));
    }
  };

  const handleStartWorkout = () => {
    if (selectedExercises.length === 0) {
      alert('Please select at least one exercise');
      return;
    }
    // Load from active template (new behavior)
    startWorkout();
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

      {/* Template Selector */}
      <div className="px-4 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-600">Workout Templates:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/templates')}
            className="text-xs"
          >
            Manage
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => handleTemplateSwitch(template.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                template.is_active
                  ? 'bg-primary text-white shadow-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {template.name}
            </button>
          ))}
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
              <h2 className="text-2xl font-bold text-gray-900">{getActiveTemplate()?.name || 'WORKOUT'}</h2>
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
              /* Display Mode with Drag-and-Drop */
              <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={selectedExercises.map(e => String(e.id))} strategy={verticalListSortingStrategy}>
                  {selectedExercises.map((exercise) => {
                const lastWeight = getLastWeight(exercise.id);
                const suggestedWeight = suggestNextWeight(exercise.id);

                return (
                  <div
                    key={exercise.id}
                    id={String(exercise.id)}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200/50 hover:border-primary/30 hover:shadow-soft transition-all duration-200 animate-fade-in"
                  >
                    <div className="w-8 h-8 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center select-none">≡</div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-gray-900">{exercise.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {exercise.superset_group && (
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                            Superset {exercise.superset_group}
                          </span>
                        )}
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                          5×5 StrongLifts
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {lastWeight !== null ? (
                        <div className="space-y-1">
                          <div className="text-sm text-gray-500 line-through">{lastWeight}lbs</div>
                          <div className="flex items-center gap-1">
                            <span className="text-success font-bold text-lg">→</span>
                            <span className="text-success font-bold text-xl">{suggestedWeight}lbs</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-primary font-bold text-xl">{suggestedWeight}lbs</div>
                      )}
                    </div>
                  </div>
                );
                  })}
                </SortableContext>
              </DndContext>
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

        {/* Weekly Volume Chart */}
        <VolumeChart onViewDetails={() => navigate('/volume')} />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/volume')}
            icon="📊"
            className="btn-modern"
          >
            Volume Analysis
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/progress')}
            icon="📈"
            className="btn-modern"
          >
            Progress Charts
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/templates')}
            icon="🧩"
            className="btn-modern"
          >
            Manage Templates
          </Button>
        </div>

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

