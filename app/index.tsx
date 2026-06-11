import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/useStore';
import { FileCard } from '@/components/FileCard';
import { EmptyState } from '@/components/EmptyState';
import { CurrencyPicker } from '@/components/CurrencyPicker';
import { colors, typography, spacing, radius } from '@/constants/theme';
import { Currency } from '@/types';

export default function HomeScreen() {
  const files          = useStore(s => s.files);
  const deletedFiles   = useStore(s => s.deletedFiles);
  const addFile        = useStore(s => s.addFile);
  const setCurrency    = useStore(s => s.setCurrency);
  const currency       = useStore(s => s.currency);
  const showOnLaunch   = useStore(s => s.showCurrencyPickerOnLaunch);
  const markPickerShown = useStore(s => s.markCurrencyPickerShown);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  // Show currency picker on first launch
  useEffect(() => {
    if (showOnLaunch) {
      setIsFirstLaunch(true);
      setShowCurrencyPicker(true);
      markPickerShown();
    }
  }, [showOnLaunch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter(f => f.name.toLowerCase().includes(q));
  }, [files, query]);

  const handleCreate = () => {
    if (name.trim()) {
      addFile(name.trim());
      setName('');
      setShowModal(false);
    }
  };

  const closeModal = () => { setName(''); setShowModal(false); };

  const handleCurrencySelect = (c: Currency) => {
    setCurrency(c);
    if (isFirstLaunch) {
      setIsFirstLaunch(false);
      setShowCurrencyPicker(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>QuickExpenses</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search files…"
          placeholderTextColor={colors.textLabel}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && Platform.OS === 'android' && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Recently Deleted row ── */}
      <TouchableOpacity
        style={styles.deletedRow}
        onPress={() => router.push('/recently-deleted')}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={15} color={colors.textMuted} />
        <Text style={styles.deletedText}>Recently Deleted</Text>
        {deletedFiles.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{deletedFiles.length}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={14} color={colors.textLabel} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      {/* ── File list ── */}
      {files.length === 0 ? (
        <EmptyState
          icon="folder-open-outline"
          title="No expense files"
          subtitle="Tap + to create a file and start tracking your expenses"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No results"
          subtitle={`No files match "${query}"`}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <FileCard file={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* ── Floating action button ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowModal(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* ── New file modal ── */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.overlay} onPress={closeModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.kav}
          >
            <Pressable style={styles.dialog} onPress={() => {}}>
              <Text style={styles.dialogTitle}>New Expense File</Text>
              <Text style={styles.label}>File Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. January 2025"
                placeholderTextColor={colors.textLabel}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreate}
              />
              <View style={styles.buttons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                  <Text style={styles.createText}>Create</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* ── Currency picker (first-launch + settings) ── */}
      <CurrencyPicker
        visible={showCurrencyPicker}
        selectedCode={currency.code}
        onSelect={handleCurrencySelect}
        onClose={() => setShowCurrencyPicker(false)}
        isFirstLaunch={isFirstLaunch}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },

  // ── Header ──────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: { width: 36, height: 36, borderRadius: 10 },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  iconBtn: { padding: spacing.xs },

  // ── Search ──────────────────────────────────────────────────
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    height: 42,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    paddingVertical: 0,
  },

  // ── Recently Deleted row ─────────────────────────────────────
  deletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  deletedText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  badge: {
    backgroundColor: colors.danger,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },

  // ── List ─────────────────────────────────────────────────────
  list: { paddingHorizontal: spacing.base, paddingBottom: 96 },

  // ── FAB ──────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: 72,
    right: spacing.base + 4,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

  // ── Modal ─────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  kav: { width: '100%', maxWidth: 400 },
  dialog: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  dialogTitle: {
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
  },
  input: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
  },
  buttons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
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
  createBtn: {
    flex: 1,
    backgroundColor: colors.textPrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  createText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
});
