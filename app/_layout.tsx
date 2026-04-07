import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { initDb } from '@/db/database';
import { useExpenseStore } from '@/store/expenses';
import { useSettingsStore } from '@/store/settings';
import '@/i18n';

export default function RootLayout() {
  const { loadMonth, loadSettings, month } = useExpenseStore();
  const { loadTheme, theme } = useSettingsStore();
  const systemScheme = useColorScheme();

  const isDark =
    theme === 'dark' || (theme === 'auto' && systemScheme === 'dark');

  useEffect(() => {
    async function bootstrap() {
      await initDb();
      await loadSettings();
      await loadTheme();
      await loadMonth(month);
    }
    bootstrap();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
