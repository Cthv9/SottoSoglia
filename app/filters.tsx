import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Switch,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useExpenseStore, Filters } from '@/store/expenses';
import { PaymentMethod } from '@/db/database';

const PAYMENT_METHODS: Array<{ key: PaymentMethod | ''; label: string }> = [
  { key: '', label: 'filters.all' },
  { key: 'cash', label: 'paymentMethods.cash' },
  { key: 'card', label: 'paymentMethods.card' },
  { key: 'transfer', label: 'paymentMethods.transfer' },
  { key: 'other', label: 'paymentMethods.other' },
];

export default function FiltersScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { filters, setFilters, clearFilters, expenses, isUnlocked } = useExpenseStore();

  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  // Locked paywall
  if (!isUnlocked) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.accent }]}>‹ Indietro</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>{t('filters.title')}</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.lockedContainer}>
          <Text style={[styles.lockIcon, { color: colors.locked }]}>🔒</Text>
          <Text style={[styles.lockedTitle, { color: colors.text }]}>{t('filters.lockedTitle')}</Text>
          <Text style={[styles.lockedDesc, { color: colors.textSecondary }]}>{t('filters.lockedDesc')}</Text>
          <Pressable
            onPress={() => router.push('/paywall')}
            style={[styles.unlockBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.unlockBtnText}>{t('common.unlock')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // All unique tags from expenses
  const allTags = Array.from(new Set(expenses.map((e) => e.tag).filter(Boolean)));

  const apply = () => {
    setFilters(localFilters);
    router.back();
  };

  const handleClear = () => {
    clearFilters();
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.accent }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('filters.title')}</Text>
        <Pressable onPress={handleClear} style={styles.backBtn}>
          <Text style={[styles.clearText, { color: colors.danger }]}>{t('filters.clear')}</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Tag filter */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {t('filters.tag')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagRow}>
          <Pressable
            onPress={() => setLocalFilters({ ...localFilters, tag: '' })}
            style={[
              styles.chip,
              {
                backgroundColor: localFilters.tag === '' ? colors.accent : colors.surfaceSecondary,
                borderColor: localFilters.tag === '' ? colors.accent : colors.border,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: localFilters.tag === '' ? '#fff' : colors.textSecondary }]}>
              {t('filters.all')}
            </Text>
          </Pressable>
          {allTags.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => setLocalFilters({ ...localFilters, tag: tag === localFilters.tag ? '' : tag })}
              style={[
                styles.chip,
                {
                  backgroundColor: localFilters.tag === tag ? colors.accent : colors.surfaceSecondary,
                  borderColor: localFilters.tag === tag ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: localFilters.tag === tag ? '#fff' : colors.textSecondary }]}>
                {tag}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Payment method filter */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {t('filters.paymentMethod')}
        </Text>
        <View style={styles.methodGrid}>
          {PAYMENT_METHODS.map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => setLocalFilters({ ...localFilters, paymentMethod: key })}
              style={[
                styles.methodChip,
                {
                  backgroundColor: localFilters.paymentMethod === key ? colors.accent : colors.surfaceSecondary,
                  borderColor: localFilters.paymentMethod === key ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: localFilters.paymentMethod === key ? '#fff' : colors.textSecondary }]}>
                {t(label)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Toggle: only recurring */}
        <View style={[styles.toggleRow, { borderColor: colors.border }]}>
          <Text style={[styles.toggleLabel, { color: colors.text }]}>{t('filters.onlyRecurring')}</Text>
          <Switch
            value={localFilters.onlyRecurring}
            onValueChange={(v) => setLocalFilters({ ...localFilters, onlyRecurring: v })}
            trackColor={{ true: colors.accent, false: colors.border }}
          />
        </View>

        {/* Toggle: only excluded */}
        <View style={[styles.toggleRow, { borderColor: colors.border }]}>
          <Text style={[styles.toggleLabel, { color: colors.text }]}>{t('filters.onlyExcluded')}</Text>
          <Switch
            value={localFilters.onlyExcluded}
            onValueChange={(v) => setLocalFilters({ ...localFilters, onlyExcluded: v })}
            trackColor={{ true: colors.accent, false: colors.border }}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Pressable onPress={apply} style={[styles.applyBtn, { backgroundColor: colors.accent }]}>
          <Text style={styles.applyBtnText}>{t('filters.apply')}</Text>
        </Pressable>
      </View>
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
  backBtn: { width: 80 },
  backText: { fontSize: 18 },
  clearText: { fontSize: 14, textAlign: 'right' },
  title: { fontSize: 17, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  tagRow: { flexGrow: 0, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: { fontSize: 14, fontWeight: '500' },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: { fontSize: 16 },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applyBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  lockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  lockIcon: { fontSize: 48 },
  lockedTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  lockedDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  unlockBtn: { marginTop: 12, height: 50, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  unlockBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
