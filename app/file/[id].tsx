import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/useStore';
import { ExpenseForm } from '@/components/ExpenseForm';
import { UndoToast } from '@/components/UndoToast';
import { colors, typography, spacing, radius } from '@/constants/theme';
import { formatDateTime, fileTotal } from '@/utils/helpers';
import { useCurrency } from '@/hooks/useCurrency';
import { exportToPDF, exportToCSV } from '@/services/export';
import { Expense } from '@/types';

// ── Column widths ─────────────────────────────────────────────
const COL_NO     = 36;   // S.NO — wider to fit label
const COL_AMOUNT = 96;   // Amount
const COL_PENCIL = 28;   // Edit icon
const COL_DELETE = 26;   // Delete icon

export default function FileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const file              = useStore(s => s.getFile(id));
  const renameFile        = useStore(s => s.renameFile);
  const addExpense        = useStore(s => s.addExpense);
  const updateExpense     = useStore(s => s.updateExpense);
  const deleteExpense     = useStore(s => s.deleteExpense);
  const { currency, formatAmount } = useCurrency();

  // New-entry inputs
  const [particular, setParticular] = useState('');
  const [amount, setAmount]         = useState('');
  const particularRef = useRef<TextInput>(null);
  const amountRef     = useRef<TextInput>(null);
  const scrollRef     = useRef<ScrollView>(null);

  // Rename
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput]   = useState('');

  // Export
  const [exporting, setExporting] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Edit modal
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Undo delete
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [undoVisible, setUndoVisible]         = useState(false);
  const [undoMessage, setUndoMessage]         = useState('');
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus the description input when the screen first loads
  useEffect(() => {
    const timer = setTimeout(() => particularRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard visibility — drives the dismiss arrow
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide  = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // ── Derived ───────────────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!file || !q) return file?.expenses ?? [];
    return file.expenses.filter((e) =>
      e.particular.toLowerCase().includes(q)
    );
  }, [file?.expenses, searchQuery]);

  // Newest first — reverse without mutating; hide any pending-undo item
  const displayExpenses = useMemo(
    () => [...filteredExpenses].reverse().filter(e => e.id !== pendingDeleteId),
    [filteredExpenses, pendingDeleteId]
  );

  // Real 1-based position of each expense in the full chronological list
  const expenseIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    file?.expenses.forEach((e, i) => map.set(e.id, i + 1));
    return map;
  }, [file?.expenses]);

  if (!file) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.notFoundText}>File not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const total      = fileTotal(file.expenses);
  const subtotal   = fileTotal(filteredExpenses);
  const isSearching = searchQuery.trim().length > 0;

  // When searching, export only the filtered rows
  const exportFile = isSearching
    ? { ...file, name: `${file.name} — ${searchQuery}`, expenses: filteredExpenses }
    : file;

  // ── Handlers ──────────────────────────────────────────────────
  const handleAdd = () => {
    const trimmed = particular.trim();
    const parsed  = parseFloat(amount);
    if (!trimmed)                    { particularRef.current?.focus(); return; }
    if (isNaN(parsed) || parsed <= 0){ amountRef.current?.focus();    return; }
    addExpense(file.id, trimmed, parsed);
    setParticular('');
    setAmount('');
    setTimeout(() => particularRef.current?.focus(), 50);
  };

  const handleEditOpen = (expense: Expense) => setEditingExpense(expense);

  const handleEditSave = (p: string, a: number) => {
    if (!editingExpense) return;
    updateExpense(file.id, editingExpense.id, p, a);
    setEditingExpense(null);
  };

  const handleDelete = (expId: string, name: string) => {
    // Commit any still-pending previous delete first
    if (pendingDeleteId) {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      deleteExpense(file.id, pendingDeleteId);
    }
    setPendingDeleteId(expId);
    setUndoMessage(`"${name}" removed`);
    setUndoVisible(true);
    undoTimerRef.current = setTimeout(() => {
      deleteExpense(file.id, expId);
      setPendingDeleteId(null);
      setUndoVisible(false);
    }, 5000);
  };

  const handleUndo = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setPendingDeleteId(null);
    setUndoVisible(false);
  };

  const handleUndoDismiss = () => {
    if (pendingDeleteId) {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      deleteExpense(file.id, pendingDeleteId);
      setPendingDeleteId(null);
    }
    setUndoVisible(false);
  };

  const requireExpenses = () => {
    const target = isSearching ? filteredExpenses : file.expenses;
    if (target.length === 0) {
      Alert.alert(
        'No Expenses',
        isSearching ? `No results for "${searchQuery}" to export.` : 'Add at least one expense first.'
      );
      return false;
    }
    return true;
  };

  const runExport = async (type: 'pdf' | 'csv') => {
    setExporting(true);
    try {
      // Pass the full expense list as originalExpenses so the export
      // functions can look up each entry's real serial number.
      if (type === 'pdf') await exportToPDF(exportFile, file.expenses, currency);
      else await exportToCSV(exportFile, file.expenses, currency);
    } catch {
      Alert.alert('Failed', 'Something went wrong. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const promptDownload = () => {
    if (!requireExpenses()) return;
    const title = isSearching ? `Download "${searchQuery}" results` : 'Download as';
    Alert.alert(title, 'Choose a format', [
      { text: 'PDF',         onPress: () => runExport('pdf') },
      { text: 'Excel (CSV)', onPress: () => runExport('csv') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const promptShare = () => {
    if (!requireExpenses()) return;
    const title = isSearching ? `Share "${searchQuery}" results` : 'Share as';
    Alert.alert(title, 'Choose a format', [
      { text: 'PDF',         onPress: () => runExport('pdf') },
      { text: 'Excel (CSV)', onPress: () => runExport('csv') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleStartRename = () => { setNameInput(file.name); setIsRenaming(true); };
  const handleFinishRename = () => {
    if (nameInput.trim()) renameFile(file.id, nameInput.trim());
    setIsRenaming(false);
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        {isRenaming ? (
          <TextInput
            style={styles.nameInput}
            value={nameInput}
            onChangeText={setNameInput}
            onBlur={handleFinishRename}
            onSubmitEditing={handleFinishRename}
            autoFocus
            returnKeyType="done"
          />
        ) : (
          <TouchableOpacity onPress={handleStartRename} style={styles.nameTouchable} activeOpacity={0.7}>
            <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
            <Ionicons name="pencil-outline" size={13} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        <View style={styles.headerActions}>
          {exporting ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <>
              <TouchableOpacity onPress={promptDownload} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <Ionicons name="download-outline" size={21} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={promptShare} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <Ionicons name="share-social-outline" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by particulars…"
          placeholderTextColor={colors.textLabel}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && Platform.OS === 'android' && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/*
        ── KeyboardAvoidingView ──────────────────────────────────
        Wraps the scroll list + the fixed bottom bar together.
        On iOS: adds padding equal to keyboard height so the bottom
        bar lifts up above the keyboard.
        On Android: the OS resizes the window (adjustResize) so the
        bar stays visible automatically — no extra behavior needed.
      */}
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >

        {/* ── Scrollable expense list ── */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Table — data rows only; input row lives below in the fixed bar */}
          <View style={styles.table}>

            <View style={styles.tableHead}>
              <Text style={[styles.headCell, { width: COL_NO }]}>S.NO</Text>
              <Text style={[styles.headCell, styles.grow]}>Particulars</Text>
              <Text style={[styles.headCell, { width: COL_AMOUNT, textAlign: 'right' }]}>Amount</Text>
              <View style={{ width: COL_PENCIL + COL_DELETE }} />
            </View>

            {filteredExpenses.length === 0 && isSearching && (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No results for "{searchQuery}"</Text>
              </View>
            )}

            {displayExpenses.map((expense) => (
              <Pressable
                key={expense.id}
                style={({ pressed }) => [styles.dataRow, pressed && styles.dataRowPressed]}
                onLongPress={() => handleEditOpen(expense)}
                delayLongPress={400}
              >
                <Text style={[styles.indexText, { width: COL_NO }]}>
                  {expenseIndexMap.get(expense.id) ?? '—'}
                </Text>

                <View style={styles.grow}>
                  <Text style={styles.particularText} numberOfLines={1}>
                    {expense.particular}
                  </Text>
                  <Text style={styles.dateTimeText}>{formatDateTime(expense.createdAt)}</Text>
                </View>

                <Text style={[styles.amountText, { width: COL_AMOUNT }]}>
                  {formatAmount(expense.amount)}
                </Text>

                <TouchableOpacity
                  style={[styles.actionBtn, { width: COL_PENCIL }]}
                  onPress={() => handleEditOpen(expense)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Ionicons name="pencil-outline" size={14} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { width: COL_DELETE }]}
                  onPress={() => handleDelete(expense.id, expense.particular)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.danger} />
                </TouchableOpacity>
              </Pressable>
            ))}
          </View>

          {/* Subtotal — search mode only */}
          {isSearching && filteredExpenses.length > 0 && (
            <View style={styles.subtotalCard}>
              <View>
                <Text style={styles.subtotalLabel}>Subtotal</Text>
                <Text style={styles.subtotalMeta}>
                  {filteredExpenses.length} result{filteredExpenses.length !== 1 ? 's' : ''} for "{searchQuery}"
                </Text>
              </View>
              <Text style={styles.subtotalAmount}>{formatAmount(subtotal)}</Text>
            </View>
          )}
        </ScrollView>

        {/*
          ── Fixed bottom bar ──────────────────────────────────────
          Always stays above the keyboard. Contains:
            • New-entry input row  (hidden while searching)
            • Grand Total          (hidden while searching)
          Drag the list down to dismiss the keyboard at any time.
        */}
        {/* Undo toast — appears above the input bar */}
        <UndoToast
          visible={undoVisible}
          message={undoMessage}
          onUndo={handleUndo}
          onDismiss={handleUndoDismiss}
        />

        {!isSearching && (
          <View style={styles.bottomBar}>

            {/* Input row */}
            <View style={styles.inputRow}>
              <Text style={[styles.indexText, styles.inputIndex]}>
                {file.expenses.length + 1}
              </Text>

              <TextInput
                ref={particularRef}
                style={[styles.inputCell, styles.grow]}
                value={particular}
                onChangeText={setParticular}
                placeholder="Description"
                placeholderTextColor={colors.textLabel}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => amountRef.current?.focus()}
              />

              <TextInput
                ref={amountRef}
                style={[styles.inputCell, styles.amountInput, { width: COL_AMOUNT }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textLabel}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />

              <TouchableOpacity
                style={[styles.actionBtn, { width: COL_PENCIL + COL_DELETE }]}
                onPress={handleAdd}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="return-down-back-outline"
                  size={15}
                  color={particular.trim() ? colors.textPrimary : colors.textLabel}
                />
              </TouchableOpacity>
            </View>

            {/* Grand Total */}
            {file.expenses.length > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalAmount}>{formatAmount(total)}</Text>
              </View>
            )}

            {/* Keyboard dismiss — tap to close keyboard */}
            {keyboardVisible && (
              <TouchableOpacity
                style={styles.kbDismiss}
                onPress={() => Keyboard.dismiss()}
                activeOpacity={0.75}
              >
                <Ionicons name="chevron-down" size={15} color={colors.textMuted} />
                <Text style={styles.kbDismissText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

      </KeyboardAvoidingView>

      {/* ── Edit Modal ── */}
      <ExpenseForm
        visible={editingExpense !== null}
        editingExpense={editingExpense}
        onSubmit={handleEditSave}
        onClose={() => setEditingExpense(null)}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.bgApp },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText:  { fontSize: typography.sizes.base, color: colors.textMuted },
  backLink:      { fontSize: typography.sizes.base, color: colors.accent, marginTop: spacing.sm },

  // ── Header ──────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  nameTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fileName: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  nameInput: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 56,
    justifyContent: 'flex-end',
  },
  iconBtn: { padding: spacing.xs },

  // ── Search ──────────────────────────────────────────────────
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    height: 42,
  },
  searchIcon:  { marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: typography.sizes.base, color: colors.textPrimary, paddingVertical: 0 },

  // ── KeyboardAvoidingView ────────────────────────────────────
  kav: { flex: 1 },

  // ── Fixed bottom bar ────────────────────────────────────────
  bottomBar: {
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingBottom: spacing.sm,
  },

  // ── Content ─────────────────────────────────────────────────
  content: { padding: spacing.base, paddingBottom: spacing.xxl },

  // ── Table ───────────────────────────────────────────────────
  table: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },

  // Header row
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headCell: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Data row
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dataRowPressed: {
    backgroundColor: colors.bgSurface,
  },
  indexText: {
    fontSize: typography.sizes.xs,
    color: colors.textLabel,
  },
  particularText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  dateTimeText: {
    fontSize: 10,
    color: colors.textLabel,
    letterSpacing: 0.1,
  },
  amountText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    textAlign: 'right',
    paddingHorizontal: spacing.xs,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // No results
  noResults:     { paddingVertical: spacing.lg, alignItems: 'center' },
  noResultsText: { fontSize: typography.sizes.sm, color: colors.textMuted },

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgSurface,
  },
  inputCell: {
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  inputIndex: { width: COL_NO },
  amountInput: { textAlign: 'right' },

  // Shared
  grow: { flex: 1 },

  // ── Grand Total ─────────────────────────────────────────────
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },

  // ── Keyboard dismiss ─────────────────────────────────────────
  kbDismiss: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  kbDismissText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },

  // ── Subtotal (search) ────────────────────────────────────────
  subtotalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.base,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  subtotalLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  subtotalMeta: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  subtotalAmount: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
});
