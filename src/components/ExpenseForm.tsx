import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Expense } from '../types';
import { colors, typography, spacing, radius } from '../constants/theme';

interface Props {
  visible: boolean;
  editingExpense: Expense | null;
  onSubmit: (particular: string, amount: number) => void;
  onClose: () => void;
}

export function ExpenseForm({ visible, editingExpense, onSubmit, onClose }: Props) {
  const [particular, setParticular] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setParticular(editingExpense?.particular ?? '');
      setAmount(editingExpense ? String(editingExpense.amount) : '');
      setError('');
    }
  }, [visible, editingExpense]);

  const handleSubmit = () => {
    const trimmed = particular.trim();
    const parsed = parseFloat(amount);
    if (!trimmed) return setError('Please enter a description.');
    if (isNaN(parsed) || parsed <= 0) return setError('Please enter a valid amount.');
    setError('');
    onSubmit(trimmed, parsed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <Pressable style={styles.dialog} onPress={() => {}}>
            <Text style={styles.title}>{editingExpense ? 'Edit Expense' : 'Add Expense'}</Text>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={particular}
              onChangeText={setParticular}
              placeholder="e.g. Office supplies"
              placeholderTextColor={colors.textLabel}
              autoFocus
              returnKeyType="next"
            />

            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.textLabel}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitText}>{editingExpense ? 'Save' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  kav: {
    width: '100%',
    maxWidth: 400,
  },
  dialog: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
  },
  error: {
    fontSize: typography.sizes.sm,
    color: colors.danger,
    marginTop: spacing.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.textMuted,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: colors.textPrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
});
