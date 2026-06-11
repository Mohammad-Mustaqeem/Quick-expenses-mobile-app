import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ExpenseFile } from '../types';
import { colors, typography, spacing, radius } from '../constants/theme';
import { fileTotal } from '../utils/helpers';
import { useStore } from '../store/useStore';
import { useCurrency } from '../hooks/useCurrency';

interface Props {
  file: ExpenseFile;
}

export function FileCard({ file }: Props) {
  const deleteFile = useStore((s) => s.deleteFile);
  const { formatAmount } = useCurrency();
  const total = fileTotal(file.expenses);

  const handleDelete = () => {
    Alert.alert('Delete File', `Delete "${file.name}" and all its expenses?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteFile(file.id) },
    ]);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/file/${file.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Ionicons name="document-text-outline" size={20} color={colors.textPrimary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {file.name}
          </Text>
          <Text style={styles.meta}>
            {file.expenses.length} expense{file.expenses.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.total}>{formatAmount(total)}</Text>
        <TouchableOpacity
          onPress={handleDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: { flex: 1 },
  name: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  meta: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  total: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
});
