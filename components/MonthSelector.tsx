import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useExpenseStore } from '@/store/expenses';
import { useTheme } from '@/hooks/useTheme';
import { formatMonth, offsetMonth, currentMonth } from '@/utils/dates';
import * as Localization from 'expo-localization';

export default function MonthSelector() {
  const { i18n } = useTranslation();
  const { colors } = useTheme();
  const { month, loadMonth } = useExpenseStore();

  const locale = Localization.getLocales()[0]?.languageTag ?? 'en-US';
  const isCurrentMonth = month === currentMonth();

  const goToPrev = () => loadMonth(offsetMonth(month, -1));
  const goToNext = () => {
    if (!isCurrentMonth) loadMonth(offsetMonth(month, 1));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <Pressable onPress={goToPrev} style={styles.arrow}>
        <Text style={[styles.arrowText, { color: colors.textSecondary }]}>‹</Text>
      </Pressable>

      <Text style={[styles.monthText, { color: colors.text }]}>
        {formatMonth(month, locale)}
      </Text>

      <Pressable onPress={goToNext} style={styles.arrow} disabled={isCurrentMonth}>
        <Text style={[styles.arrowText, { color: isCurrentMonth ? colors.border : colors.textSecondary }]}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  arrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 28,
    fontWeight: '300',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
