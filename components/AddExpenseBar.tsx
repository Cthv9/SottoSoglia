import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useExpenseStore } from '@/store/expenses';
import { parseAmount } from '@/utils/amounts';
import { PaymentMethod } from '@/db/database';

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'transfer', 'other'];
const COMMON_TAGS = ['Casa', 'Cibo', 'Trasporti', 'Salute', 'Sport', 'Svago', 'Abbigliamento'];

interface Props {
  onLimitReached: () => void;
}

export default function AddExpenseBar({ onLimitReached }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { addExpense, expenseCount, isUnlocked } = useExpenseStore();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isRecurring, setIsRecurring] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const amountRef = useRef<TextInput>(null);

  const FREE_LIMIT = 5;

  const handleAdd = async () => {
    const raw = parseAmount(amount);
    if (raw <= 0) return;

    // Check free limit
    if (!isUnlocked && expenseCount() >= FREE_LIMIT) {
      onLimitReached();
      return;
    }

    await addExpense({ rawAmount: raw, description, tag, paymentMethod, isRecurring });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAmount('');
    setDescription('');
    setTag('');
    setIsRecurring(false);
    setExpanded(false);
    amountRef.current?.focus();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {/* Expanded options */}
        {expanded && (
          <View style={styles.expandedSection}>
            {/* Description */}
            <TextInput
              style={[styles.descInput, { color: colors.text, backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              placeholder={t('addExpense.description')}
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              returnKeyType="next"
            />

            {/* Tags */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsRow}>
              {COMMON_TAGS.map((t_) => (
                <Pressable
                  key={t_}
                  onPress={() => setTag(tag === t_ ? '' : t_)}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: tag === t_ ? colors.accentLight : colors.surfaceSecondary,
                      borderColor: tag === t_ ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.tagChipText, { color: tag === t_ ? colors.accent : colors.textSecondary }]}>
                    {t_}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Payment method */}
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setPaymentMethod(m)}
                  style={[
                    styles.methodChip,
                    {
                      backgroundColor: paymentMethod === m ? colors.accent : colors.surfaceSecondary,
                      borderColor: paymentMethod === m ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.methodText, { color: paymentMethod === m ? '#fff' : colors.textSecondary }]}>
                    {t(`paymentMethods.${m}`)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Recurring toggle */}
            <Pressable
              onPress={() => setIsRecurring(!isRecurring)}
              style={[
                styles.recurringBtn,
                {
                  backgroundColor: isRecurring ? colors.recurringLight : colors.surfaceSecondary,
                  borderColor: isRecurring ? colors.recurring : colors.border,
                },
              ]}
            >
              <Text style={[styles.recurringText, { color: isRecurring ? colors.recurring : colors.textSecondary }]}>
                ↻ {t('addExpense.recurring')}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Main row */}
        <View style={styles.mainRow}>
          <Pressable
            onPress={() => setExpanded(!expanded)}
            style={[styles.expandBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
              {expanded ? '▼' : '▲'}
            </Text>
          </Pressable>

          <TextInput
            ref={amountRef}
            style={[styles.amountInput, { color: colors.text, backgroundColor: colors.surfaceSecondary }]}
            placeholder={t('addExpense.placeholder')}
            placeholderTextColor={colors.textTertiary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            inputMode="decimal"
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            selectTextOnFocus
          />

          <Pressable
            onPress={handleAdd}
            style={[
              styles.addBtn,
              { backgroundColor: amount && parseAmount(amount) > 0 ? colors.accent : colors.surfaceSecondary },
            ]}
          >
            <Text style={[styles.addBtnText, { color: amount && parseAmount(amount) > 0 ? '#fff' : colors.textTertiary }]}>
              {t('addExpense.add')}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  expandedSection: {
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 10,
  },
  descInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  tagsRow: {
    flexGrow: 0,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 6,
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  methodRow: {
    flexDirection: 'row',
    gap: 6,
  },
  methodChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  methodText: {
    fontSize: 12,
    fontWeight: '500',
  },
  recurringBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  recurringText: {
    fontSize: 13,
    fontWeight: '500',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  expandBtn: {
    width: 36,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIcon: {
    fontSize: 12,
  },
  amountInput: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 20,
    fontWeight: '600',
  },
  addBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
