import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useExpenseStore } from '@/store/expenses';
import { formatAmount } from '@/utils/amounts';
import { Expense } from '@/db/database';

interface Props {
  expense: Expense;
  isSelected: boolean;
  isMultiSelectMode: boolean;
  onLongPress: (id: string) => void;
  onPress: (id: string) => void;
  onSwipeDelete: (id: string) => void;
  onToggleExcluded: (id: string) => void;
}

export default function ExpenseItem({
  expense,
  isSelected,
  isMultiSelectMode,
  onLongPress,
  onPress,
  onSwipeDelete,
  onToggleExcluded,
}: Props) {
  const { colors } = useTheme();
  const touchStart = useRef<{ x: number; time: number } | null>(null);

  const handleTouchStart = (e: GestureResponderEvent) => {
    touchStart.current = { x: e.nativeEvent.pageX, time: Date.now() };
  };

  const handleTouchEnd = (e: GestureResponderEvent) => {
    if (!touchStart.current) return;
    const dx = e.nativeEvent.pageX - touchStart.current.x;
    const dt = Date.now() - touchStart.current.time;
    touchStart.current = null;

    // Swipe left to delete (>60px, <400ms)
    if (dx < -60 && dt < 400) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onSwipeDelete(expense.id);
    }
  };

  const bgColor = isSelected
    ? colors.accentLight
    : expense.isExcluded
    ? colors.surfaceSecondary
    : colors.surface;

  return (
    <Pressable
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onPress={() => onPress(expense.id)}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress(expense.id);
      }}
      delayLongPress={420}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: bgColor,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {/* Left: amount */}
        <View style={styles.amountCol}>
          <Text
            style={[
              styles.amount,
              {
                color: expense.isExcluded ? colors.excluded : colors.text,
                textDecorationLine: expense.isExcluded ? 'line-through' : 'none',
              },
            ]}
          >
            {formatAmount(expense.amount)}
          </Text>
        </View>

        {/* Center: description + badges */}
        <View style={styles.centerCol}>
          {expense.description ? (
            <Text
              style={[styles.description, { color: expense.isExcluded ? colors.textTertiary : colors.textSecondary }]}
              numberOfLines={1}
            >
              {expense.description}
            </Text>
          ) : null}
          <View style={styles.badges}>
            {expense.tag ? (
              <View style={[styles.badge, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.badgeText, { color: colors.accent }]}>{expense.tag}</Text>
              </View>
            ) : null}
            {expense.isRecurring ? (
              <View style={[styles.badge, { backgroundColor: colors.recurringLight }]}>
                <Text style={[styles.badgeText, { color: colors.recurring }]}>↻</Text>
              </View>
            ) : null}
            {expense.paymentMethod !== 'cash' ? (
              <View style={[styles.badge, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                  {paymentIcon(expense.paymentMethod)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Right: selection checkbox or excluded indicator */}
        {isMultiSelectMode ? (
          <View
            style={[
              styles.checkbox,
              {
                borderColor: isSelected ? colors.accent : colors.border,
                backgroundColor: isSelected ? colors.accent : 'transparent',
              },
            ]}
          />
        ) : expense.isExcluded ? (
          <Text style={[styles.excludedIcon, { color: colors.excluded }]}>⊘</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function paymentIcon(method: string): string {
  switch (method) {
    case 'card': return '💳';
    case 'transfer': return '🔁';
    default: return '•';
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  amountCol: {
    minWidth: 64,
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  centerCol: {
    flex: 1,
    gap: 4,
  },
  description: {
    fontSize: 13,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  excludedIcon: {
    fontSize: 18,
  },
});
