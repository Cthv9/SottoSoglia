import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useExpenseStore } from '@/store/expenses';
import { useTheme } from '@/hooks/useTheme';

export default function UndoBar() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { lastDeleted, undoDelete } = useExpenseStore();

  if (!lastDeleted) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border, shadowColor: colors.shadow }]}>
      <Text style={[styles.message, { color: colors.text }]}>
        {t('expense.deleted')}
      </Text>
      <Pressable onPress={undoDelete} style={[styles.undoBtn, { backgroundColor: colors.accent }]}>
        <Text style={styles.undoText}>{t('expense.undoDelete')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  message: {
    fontSize: 14,
  },
  undoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  undoText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
