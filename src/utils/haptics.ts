/**
 * Trigger haptic feedback using Web Vibration API
 */
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'medium'): void {
  if (!('vibrate' in navigator)) return;

  const patterns: Record<string, number> = {
    light: 10,
    medium: 20,
    heavy: 50
  };

  navigator.vibrate(patterns[type]);
}

/**
 * Trigger success haptic pattern
 */
export function hapticSuccess(): void {
  if (!('vibrate' in navigator)) return;
  navigator.vibrate([20, 50, 20]);
}

/**
 * Trigger error haptic pattern
 */
export function hapticError(): void {
  if (!('vibrate' in navigator)) return;
  navigator.vibrate([50, 100, 50, 100, 50]);
}

