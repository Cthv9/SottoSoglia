import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/hooks/useTheme';
import { useExpenseStore } from '@/store/expenses';
import { useSettingsStore, ThemeMode } from '@/store/settings';
import { expensesToCsv, csvToExpenses } from '@/utils/csv';
import { getAllExpenses, insertExpensesBatch } from '@/db/database';

const THEME_OPTIONS: Array<{ key: ThemeMode; label: string }> = [
  { key: 'auto', label: 'settings.themeAuto' },
  { key: 'light', label: 'settings.themeLight' },
  { key: 'dark', label: 'settings.themeDark' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { threshold, setThreshold, isUnlocked } = useExpenseStore();
  const { theme, setTheme } = useSettingsStore();

  const [thresholdInput, setThresholdInput] = useState(String(threshold));

  const handleSaveThreshold = async () => {
    const value = parseInt(thresholdInput, 10);
    if (isNaN(value) || value <= 0) return;
    await setThreshold(value);
    Alert.alert('', 'Soglia aggiornata');
  };

  const handleExportCsv = async () => {
    if (!isUnlocked) {
      router.push('/paywall');
      return;
    }
    const all = await getAllExpenses();
    const csv = expensesToCsv(all);
    const path = FileSystem.cacheDirectory + 'sottosoglia_export.csv';
    await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(path, { mimeType: 'text/csv' });
  };

  const handleImportCsv = async () => {
    if (!isUnlocked) {
      router.push('/paywall');
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({ type: 'text/comma-separated-values' });
    if (result.canceled || !result.assets[0]) return;
    const content = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
    const imported = csvToExpenses(content);
    await insertExpensesBatch(imported);
    Alert.alert('', t('csv.importSuccess'));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.accent }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Threshold */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {t('settings.threshold')}
        </Text>
        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.thresholdInput, { color: colors.text }]}
            value={thresholdInput}
            onChangeText={setThresholdInput}
            keyboardType="number-pad"
            onBlur={handleSaveThreshold}
            returnKeyType="done"
            onSubmitEditing={handleSaveThreshold}
          />
          <Text style={[styles.euro, { color: colors.textSecondary }]}>€</Text>
        </View>

        {/* Theme */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {t('settings.theme')}
        </Text>
        <View style={[styles.themeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {THEME_OPTIONS.map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => setTheme(key)}
              style={[
                styles.themeChip,
                {
                  backgroundColor: theme === key ? colors.accent : 'transparent',
                },
              ]}
            >
              <Text style={[styles.themeChipText, { color: theme === key ? '#fff' : colors.textSecondary }]}>
                {t(label)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* CSV */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Dati
        </Text>

        <Pressable
          onPress={handleExportCsv}
          style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.listItemText, { color: isUnlocked ? colors.text : colors.locked }]}>
            {t('csv.export')}
          </Text>
          {!isUnlocked && <Text style={[styles.lockBadge, { color: colors.locked }]}>🔒</Text>}
        </Pressable>

        <Pressable
          onPress={handleImportCsv}
          style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.listItemText, { color: isUnlocked ? colors.text : colors.locked }]}>
            {t('csv.import')}
          </Text>
          {!isUnlocked && <Text style={[styles.lockBadge, { color: colors.locked }]}>🔒</Text>}
        </Pressable>

        {/* Unlock / about */}
        {!isUnlocked && (
          <Pressable
            onPress={() => router.push('/paywall')}
            style={[styles.unlockRow, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.unlockText}>{t('settings.unlock')}</Text>
          </Pressable>
        )}

        <Text style={[styles.version, { color: colors.textTertiary }]}>
          SottoSoglia v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 44 },
  backText: { fontSize: 24 },
  title: { fontSize: 17, fontWeight: '600' },
  content: { padding: 16, gap: 10 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    height: 50,
  },
  thresholdInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
  },
  euro: { fontSize: 18 },
  themeRow: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    gap: 4,
  },
  themeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 7,
    alignItems: 'center',
  },
  themeChipText: { fontSize: 14, fontWeight: '500' },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  listItemText: { fontSize: 16 },
  lockBadge: { fontSize: 16 },
  unlockRow: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  unlockText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  version: { fontSize: 12, textAlign: 'center', marginTop: 24 },
});
