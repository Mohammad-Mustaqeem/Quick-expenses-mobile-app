import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useStore } from '@/store/useStore';
import { CurrencyPicker } from '@/components/CurrencyPicker';
import { colors, typography, spacing, radius } from '@/constants/theme';
import { Currency } from '@/types';

export default function SettingsScreen() {
  const currency    = useStore(s => s.currency);
  const setCurrency = useStore(s => s.setCurrency);

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const handleCurrencySelect = (c: Currency) => {
    setCurrency(c);
    setShowCurrencyPicker(false);
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.body}>

        {/* Currency */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => setShowCurrencyPicker(true)} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={styles.iconWrap}>
                <Text style={styles.currencySymbol}>{currency.symbol}</Text>
              </View>
              <View>
                <Text style={styles.rowTitle}>Currency</Text>
                <Text style={styles.rowSub}>{currency.name} ({currency.code})</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* App info */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>ABOUT</Text>
        <View style={styles.card}>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
              </View>
              <Text style={styles.rowTitle}>Version</Text>
            </View>
            <Text style={styles.rowValue}>{version}</Text>
          </View>
        </View>

      </View>

      {/* Currency picker */}
      <CurrencyPicker
        visible={showCurrencyPicker}
        selectedCode={currency.code}
        onSelect={handleCurrencySelect}
        onClose={() => setShowCurrencyPicker(false)}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },

  body: { flex: 1, padding: spacing.base },

  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  rowTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  rowSub: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowValue: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});
