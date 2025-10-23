import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import type { WorkoutTemplate, Exercise } from '../types/database';
import {
  getTemplates,
  createTemplate,
  setActiveTemplate,
  getDefaultExercises,
  saveTemplateExercises,
  getTemplateExercisesWithDetails,
  getAllExercises
} from '../services/database/exercises';

export default function WorkoutTemplatesScreen() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [templateExercises, setTemplateExercises] = useState<Exercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  useEffect(() => {
    setTemplates(getTemplates());
    setAllExercises(getAllExercises());
  }, []);

  const handleCreate = () => {
    if (!newTemplateName.trim()) return;
    const id = createTemplate(newTemplateName.trim());
    // Seed with default exercises
    const defaults = getDefaultExercises();
    saveTemplateExercises(id, defaults.map((e, idx) => ({ exercise_id: e.id, order_index: idx, superset_group: null })));
    setTemplates(getTemplates());
    setNewTemplateName('');
    setShowCreateForm(false);
  };

  const handleSelectTemplate = (template: WorkoutTemplate) => {
    setSelectedTemplate(template);
    const exercises = getTemplateExercisesWithDetails(template.id);
    setTemplateExercises(exercises.length > 0 ? exercises : getDefaultExercises());
  };

  const handleSetActive = (template: WorkoutTemplate) => {
    setActiveTemplate(template.id);
    setTemplates(getTemplates());
  };

  const handleBackToList = () => {
    setSelectedTemplate(null);
    setTemplates(getTemplates());
  };

  if (selectedTemplate) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleBackToList}>← Back</Button>
            <h1 className="text-2xl font-bold text-gray-900">{selectedTemplate.name}</h1>
          </div>
          <Button onClick={() => handleSetActive(selectedTemplate)}>
            {selectedTemplate.is_active ? 'Active' : 'Set Active'}
          </Button>
        </div>

        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Exercises ({templateExercises.length})</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Simple superset creation: pair consecutive exercises
                const updated = templateExercises.map((exercise, index) => {
                  // Create pairs: A/B, C/D, etc.
                  const pairLetter = String.fromCharCode(65 + Math.floor(index / 2));
                  const positionInPair = (index % 2) + 1;
                  return {
                    ...exercise,
                    superset_group: positionInPair === 1 ? pairLetter : pairLetter
                  };
                });
                setTemplateExercises(updated);
                saveTemplateExercises(selectedTemplate.id, updated.map((e, idx) => ({ exercise_id: e.id, order_index: idx, superset_group: e.superset_group || null })));
              }}
            >
              Create Pairs
            </Button>
          </div>

          <div className="space-y-2">
            {templateExercises.map((exercise, index) => (
              <div key={exercise.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{exercise.name}</span>
                    {exercise.superset_group && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                        {exercise.superset_group}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Clear superset group for this exercise
                      const updated = templateExercises.map(e =>
                        e.id === exercise.id ? { ...e, superset_group: null } : e
                      );
                      setTemplateExercises(updated);
                      saveTemplateExercises(selectedTemplate.id, updated.map((e, idx) => ({ exercise_id: e.id, order_index: idx, superset_group: e.superset_group || null })));
                    }}
                  >
                    Clear Group
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newExercises = templateExercises.filter(e => e.id !== exercise.id);
                      setTemplateExercises(newExercises);
                      saveTemplateExercises(selectedTemplate.id, newExercises.map((e, idx) => ({ exercise_id: e.id, order_index: idx, superset_group: e.superset_group || null })));
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-2">Add Exercise</h4>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {allExercises
                .filter(ex => !templateExercises.some(te => te.id === ex.id))
                .map(exercise => (
                  <Button
                    key={exercise.id}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newExercises = [...templateExercises, { ...exercise, superset_group: null, order_index: templateExercises.length }];
                      setTemplateExercises(newExercises);
                      saveTemplateExercises(selectedTemplate.id, newExercises.map((e, idx) => ({ exercise_id: e.id, order_index: idx, superset_group: e.superset_group || null })));
                    }}
                  >
                    {exercise.name}
                  </Button>
                ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Workout Templates</h1>
        <Button onClick={() => setShowCreateForm(true)}>New Template</Button>
      </div>

      {/* Create Template Form */}
      {showCreateForm && (
        <Card className="p-4 mb-4">
          <h3 className="font-semibold mb-3">Create New Template</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Template name (e.g., Workout B)"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={handleCreate}>Create</Button>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {templates.map(t => (
          <Card key={t.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">{t.name}</span>
                {t.is_active && <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">Active</span>}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handleSelectTemplate(t)}>Edit</Button>
                {!t.is_active && (
                  <Button variant="outline" onClick={() => handleSetActive(t)}>Set Active</Button>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Click Edit to modify exercises and create supersets
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Button variant="outline" fullWidth onClick={() => navigate('/')}>
          Back to Workouts
        </Button>
      </div>
    </div>
  );
}


