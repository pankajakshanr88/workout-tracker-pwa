import { create } from 'zustand';
import type { Exercise } from '../types/database';
import { getAllExercises, getDefaultExercises } from '../services/database/exercises';

interface ExerciseState {
  exercises: Exercise[];
  defaultExercises: Exercise[];
  isLoaded: boolean;
  
  loadExercises: () => void;
  refreshExercises: () => void;
}

export const useExerciseStore = create<ExerciseState>((set) => ({
  exercises: [],
  defaultExercises: [],
  isLoaded: false,

  loadExercises: () => {
    try {
      const allExercises = getAllExercises();
      const defaults = getDefaultExercises();

      set({
        exercises: allExercises,
        defaultExercises: defaults,
        isLoaded: true
      });
    } catch (error) {
      console.error('Failed to load exercises:', error);
    }
  },

  refreshExercises: () => {
    try {
      const allExercises = getAllExercises();
      const defaults = getDefaultExercises();

      set({
        exercises: allExercises,
        defaultExercises: defaults
      });
    } catch (error) {
      console.error('Failed to refresh exercises:', error);
    }
  }
}));

