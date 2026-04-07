import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useExpenseStore } from '@/store/expenses';
import { useIAP } from '@/hooks/useIAP';

export default function PaywallScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isUnlocked } = useExpenseStore();
  const { product, loading, error, purchase, restore } = useIAP();

  // If already unlocked, go back
  if (isUnlocked) {
    router.back();
    return null;
  }

  const features = t('paywall.features', { returnObjects: true }) as string[];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
      </Pressable>

      <View style={styles.content}>
        {/* Icon */}
        <Text style={styles.icon}>⚡</Text>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>{t('paywall.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('paywall.subtitle')}</Text>

        {/* Features */}
        <View style={[styles.featuresCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {features.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={[styles.checkmark, { color: colors.success }]}>✓</Text>
              <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Error */}
        {error && (
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        )}

        {/* Price */}
        {product && (
          <Text style={[styles.priceText, { color: colors.textSecondary }]}>
            {product.localizedPrice} · {t('paywall.subtitle')}
          </Text>
        )}

        {/* Buy button */}
        <Pressable
          onPress={purchase}
          disabled={loading || !product}
          style={[
            styles.buyBtn,
            { backgroundColor: colors.accent, opacity: loading || !product ? 0.6 : 1 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buyBtnText}>
              {product ? `${t('paywall.buy')} · ${product.localizedPrice}` : t('paywall.loading')}
            </Text>
          )}
        </Pressable>

        {/* Restore */}
        <Pressable onPress={restore} disabled={loading} style={styles.restoreBtn}>
          <Text style={[styles.restoreText, { color: colors.textSecondary }]}>
            {t('paywall.restore')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    top: 54,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeText: { fontSize: 14 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  icon: { fontSize: 56 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center' },
  featuresCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
    marginVertical: 8,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkmark: { fontSize: 18, fontWeight: '700', width: 24 },
  featureText: { fontSize: 16 },
  errorText: { fontSize: 14, textAlign: 'center' },
  priceText: { fontSize: 13 },
  buyBtn: {
    width: '100%',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  restoreBtn: { height: 40, alignItems: 'center', justifyContent: 'center' },
  restoreText: { fontSize: 14 },
});
