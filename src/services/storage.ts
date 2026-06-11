import AsyncStorage from '@react-native-async-storage/async-storage';
import { Currency, DeletedExpenseFile, ExpenseFile } from '../types';
import { DEFAULT_CURRENCY } from '../constants/currencies';

const KEYS = {
  files:        '@quickexpenses/files',
  deletedFiles: '@quickexpenses/deleted_files',
  currency:     '@quickexpenses/currency',
  firstLaunch:  '@quickexpenses/first_launch',
} as const;

// ── Files ────────────────────────────────────────────────────────
export async function loadFiles(): Promise<ExpenseFile[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.files);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    if (__DEV__) console.warn('[storage] loadFiles:', e);
    return [];
  }
}

export async function saveFiles(files: ExpenseFile[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.files, JSON.stringify(files));
  } catch (e) {
    if (__DEV__) console.warn('[storage] saveFiles:', e);
  }
}

// ── Recently Deleted ─────────────────────────────────────────────
export async function loadDeletedFiles(): Promise<DeletedExpenseFile[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.deletedFiles);
    if (!data) return [];
    const parsed: DeletedExpenseFile[] = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    // Auto-prune files older than 30 days
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return parsed.filter(f => new Date(f.deletedAt).getTime() > cutoff);
  } catch (e) {
    if (__DEV__) console.warn('[storage] loadDeletedFiles:', e);
    return [];
  }
}

export async function saveDeletedFiles(files: DeletedExpenseFile[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.deletedFiles, JSON.stringify(files));
  } catch (e) {
    if (__DEV__) console.warn('[storage] saveDeletedFiles:', e);
  }
}

// ── Currency ─────────────────────────────────────────────────────
export async function loadCurrency(): Promise<Currency> {
  try {
    const data = await AsyncStorage.getItem(KEYS.currency);
    return data ? JSON.parse(data) : DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

export async function saveCurrency(currency: Currency): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.currency, JSON.stringify(currency));
  } catch (e) {
    if (__DEV__) console.warn('[storage] saveCurrency:', e);
  }
}

// ── First-launch flag ────────────────────────────────────────────
export async function isFirstLaunch(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(KEYS.firstLaunch);
    return val === null;
  } catch {
    return false;
  }
}

export async function markLaunched(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.firstLaunch, '1');
  } catch { /* non-critical */ }
}

// ── Nuclear option ───────────────────────────────────────────────
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch (e) {
    if (__DEV__) console.warn('[storage] clearAllData:', e);
  }
}
