import { create } from 'zustand';
import {
  Expense,
  PaymentMethod,
  deleteExpense as dbDelete,
  getExpensesByMonth,
  getSetting,
  insertExpense as dbInsert,
  setSetting,
  updateExpenseExcluded,
} from '@/db/database';
import { ceilToEuro } from '@/utils/amounts';
import { currentMonth, uuid } from '@/utils/dates';

export interface Filters {
  tag: string;
  paymentMethod: PaymentMethod | '';
  onlyRecurring: boolean;
  onlyExcluded: boolean;
}

const DEFAULT_FILTERS: Filters = {
  tag: '',
  paymentMethod: '',
  onlyRecurring: false,
  onlyExcluded: false,
};

interface ExpenseStore {
  expenses: Expense[];
  month: string;
  threshold: number;
  filters: Filters;
  filtersActive: boolean;
  selectedIds: Set<string>;
  lastDeleted: Expense | null;
  isUnlocked: boolean;

  // Actions
  loadMonth: (month: string) => Promise<void>;
  addExpense: (params: {
    rawAmount: number;
    description: string;
    tag: string;
    paymentMethod: PaymentMethod;
    isRecurring: boolean;
  }) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  undoDelete: () => Promise<void>;
  toggleExcluded: (id: string) => Promise<void>;
  setThreshold: (value: number) => Promise<void>;
  loadSettings: () => Promise<void>;
  setFilters: (filters: Filters) => void;
  clearFilters: () => void;
  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  setUnlocked: (value: boolean) => void;

  // Derived
  filteredExpenses: () => Expense[];
  total: () => number;
  recurringTotal: () => number;
  expenseCount: () => number;
}

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  expenses: [],
  month: currentMonth(),
  threshold: 1000,
  filters: DEFAULT_FILTERS,
  filtersActive: false,
  selectedIds: new Set(),
  lastDeleted: null,
  isUnlocked: false,

  loadMonth: async (month: string) => {
    const expenses = await getExpensesByMonth(month);
    set({ expenses, month });
  },

  addExpense: async ({ rawAmount, description, tag, paymentMethod, isRecurring }) => {
    const amount = ceilToEuro(rawAmount);
    const expense: Expense = {
      id: uuid(),
      amount,
      description,
      tag,
      paymentMethod,
      isRecurring,
      isExcluded: false,
      month: get().month,
      createdAt: Date.now(),
    };
    await dbInsert(expense);
    set((state) => ({ expenses: [expense, ...state.expenses] }));
  },

  removeExpense: async (id: string) => {
    const expense = get().expenses.find((e) => e.id === id);
    if (!expense) return;
    await dbDelete(id);
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
      lastDeleted: expense,
    }));
    // Clear lastDeleted after 5 seconds
    setTimeout(() => {
      set((state) => (state.lastDeleted?.id === id ? { lastDeleted: null } : {}));
    }, 5000);
  },

  undoDelete: async () => {
    const { lastDeleted } = get();
    if (!lastDeleted) return;
    await dbInsert(lastDeleted);
    set((state) => ({
      expenses: [lastDeleted, ...state.expenses].sort(
        (a, b) => b.createdAt - a.createdAt
      ),
      lastDeleted: null,
    }));
  },

  toggleExcluded: async (id: string) => {
    const expense = get().expenses.find((e) => e.id === id);
    if (!expense) return;
    const newValue = !expense.isExcluded;
    await updateExpenseExcluded(id, newValue);
    set((state) => ({
      expenses: state.expenses.map((e) =>
        e.id === id ? { ...e, isExcluded: newValue } : e
      ),
    }));
  },

  setThreshold: async (value: number) => {
    await setSetting('threshold', String(value));
    set({ threshold: value });
  },

  loadSettings: async () => {
    const thresholdStr = await getSetting('threshold');
    if (thresholdStr) {
      set({ threshold: parseInt(thresholdStr, 10) });
    }
  },

  setFilters: (filters: Filters) => {
    const active =
      filters.tag !== '' ||
      filters.paymentMethod !== '' ||
      filters.onlyRecurring ||
      filters.onlyExcluded;
    set({ filters, filtersActive: active });
  },

  clearFilters: () => {
    set({ filters: DEFAULT_FILTERS, filtersActive: false });
  },

  toggleSelected: (id: string) => {
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedIds: next };
    });
  },

  clearSelection: () => set({ selectedIds: new Set() }),

  setUnlocked: (value: boolean) => set({ isUnlocked: value }),

  filteredExpenses: () => {
    const { expenses, filters, filtersActive, isUnlocked } = get();
    if (!isUnlocked) {
      // In free mode, no filters
      return expenses;
    }
    if (!filtersActive) return expenses;
    return expenses.filter((e) => {
      if (filters.tag && e.tag !== filters.tag) return false;
      if (filters.paymentMethod && e.paymentMethod !== filters.paymentMethod) return false;
      if (filters.onlyRecurring && !e.isRecurring) return false;
      if (filters.onlyExcluded && !e.isExcluded) return false;
      return true;
    });
  },

  total: () => {
    return get()
      .expenses.filter((e) => !e.isExcluded)
      .reduce((sum, e) => sum + e.amount, 0);
  },

  recurringTotal: () => {
    return get()
      .expenses.filter((e) => e.isRecurring && !e.isExcluded)
      .reduce((sum, e) => sum + e.amount, 0);
  },

  expenseCount: () => get().expenses.length,
}));
