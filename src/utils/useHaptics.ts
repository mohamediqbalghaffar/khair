/**
 * Web Vibration API micro-haptics hook for mobile touch feedback.
 * Provides subtle tactile feedback for tab navigation, donations,
 * aid distribution, and tactile form interactions.
 */

export type HapticFeedbackType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error';

const HAPTIC_PATTERNS: Record<HapticFeedbackType, number | number[]> = {
  light: 10,
  selection: 8,
  medium: 22,
  heavy: 35,
  success: [15, 50, 20],
  warning: [30, 40, 30],
  error: [50, 60, 50],
};

export const triggerHaptic = (type: HapticFeedbackType = 'light'): void => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      const pattern = HAPTIC_PATTERNS[type] ?? 10;
      navigator.vibrate(pattern);
    } catch {
      // Gracefully ignore if blocked by browser policy or inactive window
    }
  }
};

export const useHaptics = () => {
  return {
    trigger: triggerHaptic,
    light: () => triggerHaptic('light'),
    medium: () => triggerHaptic('medium'),
    heavy: () => triggerHaptic('heavy'),
    selection: () => triggerHaptic('selection'),
    success: () => triggerHaptic('success'),
    warning: () => triggerHaptic('warning'),
    error: () => triggerHaptic('error'),
  };
};

export default useHaptics;
