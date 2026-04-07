import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useExpenseStore } from '@/store/expenses';
import { useTheme } from '@/hooks/useTheme';
import { formatAmount } from '@/utils/amounts';

interface Props {
  onPressThreshold?: () => void;
}

export default function ThresholdBar({ onPressThreshold }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { threshold, total, recurringTotal } = useExpenseStore();
  const totalAmount = total();
  const recurringAmount = recurringTotal();

  const ratio = threshold > 0 ? Math.min(totalAmount / threshold, 1) : 0;
  const isOver = totalAmount > threshold;
  const barColor = isOver ? colors.progressBarOver : colors.progressBar;

  return (
    <Pressable onPress={onPressThreshold}>
      <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.row}>
          <Text style={[styles.totalText, { color: isOver ? colors.danger : colors.text }]}>
            {formatAmount(totalAmount)}
          </Text>
          <Text style={[styles.thresholdText, { color: colors.textSecondary }]}>
            {t('home.of')} {formatAmount(threshold)}
          </Text>
        </View>

        <View style={[styles.barBg, { backgroundColor: colors.progressBg }]}>
          <View
            style={[
              styles.barFill,
              { width: `${ratio * 100}%`, backgroundColor: barColor },
            ]}
          />
        </View>

        {recurringAmount > 0 && (
          <Text style={[styles.recurringText, { color: colors.textTertiary }]}>
            {formatAmount(recurringAmount)} {t('home.recurring')}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  totalText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  thresholdText: {
    fontSize: 14,
    fontWeight: '400',
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  recurringText: {
    fontSize: 12,
  },
});
