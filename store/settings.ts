import { create } from 'zustand';
import { getSetting, setSetting } from '@/db/database';

export type ThemeMode = 'auto' | 'light' | 'dark';

interface SettingsStore {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: 'auto',

  setTheme: async (theme: ThemeMode) => {
    await setSetting('theme', theme);
    set({ theme });
  },

  loadTheme: async () => {
    const stored = await getSetting('theme');
    if (stored === 'auto' || stored === 'light' || stored === 'dark') {
      set({ theme: stored });
    }
  },
}));
