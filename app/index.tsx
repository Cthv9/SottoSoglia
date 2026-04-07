import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useExpenseStore } from '@/store/expenses';
import ThresholdBar from '@/components/ThresholdBar';
import ExpenseItem from '@/components/ExpenseItem';
import AddExpenseBar from '@/components/AddExpenseBar';
import MonthSelector from '@/components/MonthSelector';
import UndoBar from '@/components/UndoBar';
import MultiSelectBar from '@/components/MultiSelectBar';
import { Expense } from '@/db/database';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    filteredExpenses,
    removeExpense,
    toggleExcluded,
    toggleSelected,
    clearSelection,
    selectedIds,
    filtersActive,
    isUnlocked,
  } = useExpenseStore();

  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const expenses = filteredExpenses();

  const handleLongPress = useCallback(
    (id: string) => {
      if (!isMultiSelectMode) {
        setIsMultiSelectMode(true);
      }
      toggleSelected(id);
    },
    [isMultiSelectMode, toggleSelected]
  );

  const handlePress = useCallback(
    (id: string) => {
      if (isMultiSelectMode) {
        toggleSelected(id);
        // Auto-exit multi-select when none selected
        const next = new Set(selectedIds);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        if (next.size === 0) setIsMultiSelectMode(false);
      } else {
        // Single tap: show action sheet to exclude/include
        const expense = expenses.find((e) => e.id === id);
        if (!expense) return;
        Alert.alert(
          expense.description || `${expense.amount} €`,
          undefined,
          [
            {
              text: expense.isExcluded ? t('expense.include') : t('expense.exclude'),
              onPress: () => toggleExcluded(id),
            },
            {
              text: t('common.delete'),
              style: 'destructive',
              onPress: () => removeExpense(id),
            },
            { text: t('common.cancel'), style: 'cancel' },
          ]
        );
      }
    },
    [isMultiSelectMode, selectedIds, expenses, t, toggleExcluded, removeExpense, toggleSelected]
  );

  const handleSwipeDelete = useCallback(
    (id: string) => {
      removeExpense(id);
    },
    [removeExpense]
  );

  const handleClearSelection = useCallback(() => {
    clearSelection();
    setIsMultiSelectMode(false);
  }, [clearSelection]);

  const renderExpense = ({ item }: { item: Expense }) => (
    <ExpenseItem
      expense={item}
      isSelected={selectedIds.has(item.id)}
      isMultiSelectMode={isMultiSelectMode}
      onLongPress={handleLongPress}
      onPress={handlePress}
      onSwipeDelete={handleSwipeDelete}
      onToggleExcluded={toggleExcluded}
    />
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
        {t('home.noExpenses')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
        {t('home.addFirst')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <MonthSelector />
        <ThresholdBar onPressThreshold={() => router.push('/settings')} />
      </View>

      {/* Filter indicator */}
      {filtersActive && isUnlocked && (
        <Pressable
          onPress={() => router.push('/filters')}
          style={[styles.filterBanner, { backgroundColor: colors.accentLight }]}
        >
          <Text style={[styles.filterBannerText, { color: colors.accent }]}>
            Filtri attivi · Tocca per modificare
          </Text>
        </Pressable>
      )}

      {/* Multi-select bar */}
      {isMultiSelectMode && selectedIds.size > 0 && (
        <MultiSelectBar />
      )}

      {/* Expense list */}
      <FlashList
        data={expenses}
        renderItem={renderExpense}
        estimatedItemSize={60}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.list}
      />

      {/* Undo bar */}
      <UndoBar />

      {/* Add expense bar */}
      {!isMultiSelectMode && (
        <AddExpenseBar onLimitReached={() => setShowLimitModal(true)} />
      )}

      {/* Settings button */}
      {!isMultiSelectMode && (
        <View style={[styles.fabRow, { pointerEvents: 'box-none' }]}>
          <Pressable
            onPress={() => router.push('/filters')}
            style={[styles.fab, { backgroundColor: filtersActive && isUnlocked ? colors.accent : colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
          >
            <Text style={[styles.fabText, { color: filtersActive && isUnlocked ? '#fff' : colors.textSecondary }]}>
              ⊟
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/settings')}
            style={[styles.fab, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
          >
            <Text style={[styles.fabText, { color: colors.textSecondary }]}>⚙</Text>
          </Pressable>
        </View>
      )}

      {/* Limit reached modal */}
      <Modal
        visible={showLimitModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLimitModal(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setShowLimitModal(false)}
        >
          <View
            style={[styles.limitModal, { backgroundColor: colors.surface }]}
            // Prevent closing when tapping inside
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.limitTitle, { color: colors.text }]}>
              {t('limit.title')}
            </Text>
            <Text style={[styles.limitDesc, { color: colors.textSecondary }]}>
              {t('limit.desc')}
            </Text>
            <Pressable
              onPress={() => {
                setShowLimitModal(false);
                router.push('/paywall');
              }}
              style={[styles.unlockBtn, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.unlockBtnText}>{t('limit.unlock')}</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowLimitModal(false)}
              style={styles.laterBtn}
            >
              <Text style={[styles.laterText, { color: colors.textSecondary }]}>
                {t('limit.later')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterBanner: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  filterBannerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  list: {
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtitle: {
    fontSize: 14,
  },
  fabRow: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    gap: 10,
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  fabText: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  limitModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },
  limitTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  limitDesc: {
    fontSize: 15,
    lineHeight: 22,
  },
  unlockBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  unlockBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  laterBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterText: {
    fontSize: 14,
  },
});
