import { create } from 'zustand';

interface SettingsState {
  // Rest timer defaults (in seconds)
  compoundRestTime: number;
  accessoryRestTime: number;
  
  // Weight unit
  weightUnit: 'lbs' | 'kg';
  
  // Notifications
  restTimerNotifications: boolean;
  
  // Actions
  setRestTimes: (compound: number, accessory: number) => void;
  setWeightUnit: (unit: 'lbs' | 'kg') => void;
  setRestTimerNotifications: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  compoundRestTime: 180, // 3 minutes
  accessoryRestTime: 90,  // 1.5 minutes
  weightUnit: 'lbs',
  restTimerNotifications: true,

  setRestTimes: (compound: number, accessory: number) => {
    set({ compoundRestTime: compound, accessoryRestTime: accessory });
  },

  setWeightUnit: (unit: 'lbs' | 'kg') => {
    set({ weightUnit: unit });
  },

  setRestTimerNotifications: (enabled: boolean) => {
    set({ restTimerNotifications: enabled });
  }
}));

