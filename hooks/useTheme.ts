import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/settings';

export const colors = {
  light: {
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceSecondary: '#f0f0f0',
    text: '#111111',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#e0e0e0',
    accent: '#2563eb',
    accentLight: '#dbeafe',
    danger: '#dc2626',
    dangerLight: '#fee2e2',
    success: '#16a34a',
    successLight: '#dcfce7',
    warning: '#d97706',
    warningLight: '#fef3c7',
    progressBar: '#2563eb',
    progressBarOver: '#dc2626',
    progressBg: '#e5e7eb',
    excluded: '#9ca3af',
    recurring: '#7c3aed',
    recurringLight: '#ede9fe',
    inputBg: '#ffffff',
    shadow: 'rgba(0,0,0,0.08)',
    overlay: 'rgba(0,0,0,0.4)',
    locked: '#9ca3af',
    lockedBg: '#f3f4f6',
  },
  dark: {
    background: '#0a0a0a',
    surface: '#1a1a1a',
    surfaceSecondary: '#252525',
    text: '#f0f0f0',
    textSecondary: '#a0a0a0',
    textTertiary: '#666666',
    border: '#2a2a2a',
    accent: '#3b82f6',
    accentLight: '#1e3a5f',
    danger: '#ef4444',
    dangerLight: '#450a0a',
    success: '#22c55e',
    successLight: '#052e16',
    warning: '#f59e0b',
    warningLight: '#451a03',
    progressBar: '#3b82f6',
    progressBarOver: '#ef4444',
    progressBg: '#2a2a2a',
    excluded: '#555555',
    recurring: '#8b5cf6',
    recurringLight: '#2e1065',
    inputBg: '#1a1a1a',
    shadow: 'rgba(0,0,0,0.3)',
    overlay: 'rgba(0,0,0,0.6)',
    locked: '#555555',
    lockedBg: '#1a1a1a',
  },
} as const;

export type Colors = typeof colors.light;

export function useTheme(): { colors: Colors; isDark: boolean } {
  const { theme } = useSettingsStore();
  const systemScheme = useColorScheme();

  const isDark =
    theme === 'dark' || (theme === 'auto' && systemScheme === 'dark');

  return {
    colors: isDark ? colors.dark : colors.light,
    isDark,
  };
}
