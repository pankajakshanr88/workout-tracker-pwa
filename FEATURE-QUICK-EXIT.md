# Feature: Quick Exit from Workout

## Overview
Added the ability to quickly navigate back to home and discard workouts during active workout sessions.

## Changes Made

### 1. New Components

#### `ConfirmDialog.tsx`
- Reusable confirmation dialog component
- Supports different button variants (primary, error)
- Used for confirming destructive actions like discarding workouts

#### `WorkoutHeader.tsx`
- Unified header component for workout screens
- Features:
  - **Home button** (left side) - Quick exit with discard confirmation
  - **Menu button** (right side) - Contains "Discard Workout" option
  - Displays exercise name and current progress
  - Integrated confirmation dialog for safety

### 2. Enhanced Components

#### `Button.tsx`
- Added `error` variant for destructive actions
- Styling: Red background with dark red hover state

### 3. Store Updates

#### `workoutStore.ts`
- Added `discardWorkout()` action
  - Clears workout state without saving to database
  - Different from `endWorkout()` which saves the completed workout
  - Used when user wants to abandon the current workout session

### 4. Screen Updates

#### `WorkoutScreen.tsx`
- Replaced static header with `WorkoutHeader` component
- Now includes home button and discard menu

#### `RestScreen.tsx`
- Replaced static header with `WorkoutHeader` component
- Consistent navigation experience during rest periods

## User Experience

### Quick Exit Flow
1. User taps **home icon** in top-left corner during workout
2. Confirmation dialog appears: "Discard Workout?"
3. User can choose:
   - **"Keep Working Out"** - Returns to workout
   - **"Discard"** - Abandons workout and returns to home screen

### Discard Menu Flow
1. User taps **menu icon** (three dots) in top-right corner
2. Menu appears with "Discard Workout" option in red
3. Tapping it shows the same confirmation dialog
4. Provides alternative access to discard functionality

## Safety Features

- **Confirmation dialog** prevents accidental workout loss
- **Clear warning message** explains data will be lost
- **Visual distinction** using red color for destructive action
- **Two-step process** requires explicit confirmation

## Technical Details

- Uses Headless UI for accessible menu and dialog components
- Haptic feedback on button interactions
- Smooth transitions and animations
- Consistent with existing app design patterns
- Fully typed with TypeScript

## Testing Checklist

- [ ] Home button appears on WorkoutScreen
- [ ] Home button appears on RestScreen
- [ ] Menu button appears on both screens
- [ ] Clicking home shows confirmation dialog
- [ ] Clicking "Discard Workout" in menu shows confirmation
- [ ] Canceling dialog returns to workout
- [ ] Confirming discard returns to home screen
- [ ] Workout state is cleared after discard
- [ ] No workout data is saved when discarded

