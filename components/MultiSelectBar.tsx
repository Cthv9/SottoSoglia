import React from 'react';
import { View, Text, Pressable, StyleSheet, Clipboard } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useExpenseStore } from '@/store/expenses';
import { useTheme } from '@/hooks/useTheme';
import { formatAmount } from '@/utils/amounts';

export default function MultiSelectBar() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { expenses, selectedIds, clearSelection } = useExpenseStore();

  if (selectedIds.size === 0) return null;

  const selectedExpenses = expenses.filter((e) => selectedIds.has(e.id));
  const selectedTotal = selectedExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleCopy = () => {
    Clipboard.setString(String(selectedTotal));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.accent }]}>
      <Pressable onPress={clearSelection} style={styles.closeBtn}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      <Text style={styles.countText}>
        {selectedIds.size} {t('multiSelect.selected')} · {formatAmount(selectedTotal)}
      </Text>

      <Pressable onPress={handleCopy} style={[styles.copyBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
        <Text style={styles.copyText}>{t('multiSelect.copy')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
  },
  countText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  copyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
