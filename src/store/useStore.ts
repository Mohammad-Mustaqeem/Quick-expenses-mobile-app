import { create } from 'zustand';
import { Currency, DeletedExpenseFile, Expense, ExpenseFile } from '../types';
import {
  loadFiles, saveFiles,
  loadDeletedFiles, saveDeletedFiles,
  loadCurrency, saveCurrency,
  isFirstLaunch, markLaunched,
} from '../services/storage';
import { DEFAULT_CURRENCY } from '../constants/currencies';
import { uid } from '../utils/helpers';

interface StoreState {
  files: ExpenseFile[];
  deletedFiles: DeletedExpenseFile[];
  currency: Currency;
  isLoading: boolean;
  showCurrencyPickerOnLaunch: boolean;

  loadData: () => Promise<void>;
  getFile: (id: string) => ExpenseFile | undefined;

  // ── Files ──────────────────────────────────────────────────────
  addFile: (name: string) => void;
  /** Soft-deletes: moves to Recently Deleted (kept for 30 days). */
  deleteFile: (id: string) => void;
  restoreFile: (id: string) => void;
  permanentlyDeleteFile: (id: string) => void;
  clearDeletedFiles: () => void;
  renameFile: (id: string, name: string) => void;

  // ── Expenses ───────────────────────────────────────────────────
  addExpense: (fileId: string, particular: string, amount: number) => void;
  updateExpense: (fileId: string, expId: string, particular: string, amount: number) => void;
  deleteExpense: (fileId: string, expId: string) => void;

  // ── Currency ───────────────────────────────────────────────────
  setCurrency: (currency: Currency) => void;
  markCurrencyPickerShown: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  files: [],
  deletedFiles: [],
  currency: DEFAULT_CURRENCY,
  isLoading: true,
  showCurrencyPickerOnLaunch: false,

  loadData: async () => {
    const [files, deletedFiles, currency, firstLaunch] = await Promise.all([
      loadFiles(),
      loadDeletedFiles(),
      loadCurrency(),
      isFirstLaunch(),
    ]);
    if (firstLaunch) markLaunched(); // fire-and-forget; don't await
    set({ files, deletedFiles, currency, isLoading: false, showCurrencyPickerOnLaunch: firstLaunch });
  },

  getFile: (id) => get().files.find(f => f.id === id),

  addFile: (name) => {
    const file: ExpenseFile = {
      id: uid(),
      name: name.trim() || 'Untitled',
      expenses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const files = [file, ...get().files];
    set({ files });
    saveFiles(files);
  },

  deleteFile: (id) => {
    const file = get().files.find(f => f.id === id);
    if (!file) return;
    const deleted: DeletedExpenseFile = { ...file, deletedAt: new Date().toISOString() };
    const files = get().files.filter(f => f.id !== id);
    const deletedFiles = [deleted, ...get().deletedFiles];
    set({ files, deletedFiles });
    saveFiles(files);
    saveDeletedFiles(deletedFiles);
  },

  restoreFile: (id) => {
    const file = get().deletedFiles.find(f => f.id === id);
    if (!file) return;
    const { deletedAt, ...restored } = file;
    const files = [restored, ...get().files];
    const deletedFiles = get().deletedFiles.filter(f => f.id !== id);
    set({ files, deletedFiles });
    saveFiles(files);
    saveDeletedFiles(deletedFiles);
  },

  permanentlyDeleteFile: (id) => {
    const deletedFiles = get().deletedFiles.filter(f => f.id !== id);
    set({ deletedFiles });
    saveDeletedFiles(deletedFiles);
  },

  clearDeletedFiles: () => {
    set({ deletedFiles: [] });
    saveDeletedFiles([]);
  },

  renameFile: (id, name) => {
    const files = get().files.map(f =>
      f.id === id
        ? { ...f, name: name.trim() || f.name, updatedAt: new Date().toISOString() }
        : f
    );
    set({ files });
    saveFiles(files);
  },

  addExpense: (fileId, particular, amount) => {
    const expense: Expense = {
      id: uid(),
      particular: particular.trim(),
      amount,
      createdAt: new Date().toISOString(),
    };
    const files = get().files.map(f =>
      f.id === fileId
        ? { ...f, expenses: [...f.expenses, expense], updatedAt: new Date().toISOString() }
        : f
    );
    set({ files });
    saveFiles(files);
  },

  updateExpense: (fileId, expId, particular, amount) => {
    const files = get().files.map(f =>
      f.id === fileId
        ? {
            ...f,
            expenses: f.expenses.map(e =>
              e.id === expId ? { ...e, particular: particular.trim(), amount } : e
            ),
            updatedAt: new Date().toISOString(),
          }
        : f
    );
    set({ files });
    saveFiles(files);
  },

  deleteExpense: (fileId, expId) => {
    const files = get().files.map(f =>
      f.id === fileId
        ? {
            ...f,
            expenses: f.expenses.filter(e => e.id !== expId),
            updatedAt: new Date().toISOString(),
          }
        : f
    );
    set({ files });
    saveFiles(files);
  },

  setCurrency: (currency) => {
    set({ currency });
    saveCurrency(currency);
  },

  markCurrencyPickerShown: () => {
    set({ showCurrencyPickerOnLaunch: false });
  },
}));
