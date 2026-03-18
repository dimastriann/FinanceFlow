import { create } from 'zustand';
import * as LocalAuthentication from 'expo-local-authentication';
import { db } from '../db/client';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Expense {
  id: string;
  amount: number;
  merchant: string;
  note: string | null;
  categoryId: string;
  date: number;
}

export interface UserSettings {
  userName: string;
  theme: string;
  currency: string;
  isBiometricEnabled: boolean;
  isAmountHidden: boolean;
}

export interface BudgetLog {
  id: string;
  amount: number;
  previousAmount: number | null;
  categoryId: string | null;
  period: string;
  date: number;
}

interface ExpenseState {
  expenses: Expense[];
  categories: Category[];
  monthlyBudget: number;
  categoryBudgets: Record<string, number>;
  budgetLogs: BudgetLog[];
  userSettings: UserSettings;
  loading: boolean;
  initialize: () => Promise<void>;
  addExpense: (data: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (
    id: string,
    data: Partial<Omit<Expense, 'id'>>
  ) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setMonthlyBudget: (amount: number) => Promise<void>;
  setCategoryBudget: (categoryId: string, amount: number) => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  setCurrency: (code: string) => Promise<void>;
  formatCurrency: (amount: number) => string;
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
  toggleBiometric: (enabled: boolean) => Promise<void>;
  toggleAmountVisibility: () => Promise<void>;
}

const DEFAULT_SETTINGS: UserSettings = {
  userName: 'John Doe',
  theme: 'dark',
  currency: 'USD',
  isBiometricEnabled: false,
  isAmountHidden: false,
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Food', icon: '🍔', color: '#FF9500' },
  { id: '2', name: 'Transport', icon: '🚗', color: '#007AFF' },
  { id: '3', name: 'Shopping', icon: '🛍️', color: '#5856D6' },
  { id: '4', name: 'Housing', icon: '🏠', color: '#FF3B30' },
  { id: '5', name: 'Utilities', icon: '⚡', color: '#34C759' },
  { id: '6', name: 'Entertainment', icon: '🎮', color: '#AF52DE' },
  { id: '7', name: 'Health', icon: '🏥', color: '#FF2D55' },
  { id: '8', name: 'Other', icon: '📦', color: '#8E8E93' },
];

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  categories: [],
  monthlyBudget: 0,
  categoryBudgets: {},
  budgetLogs: [],
  userSettings: DEFAULT_SETTINGS,
  loading: true,

  initialize: async () => {
    set({ loading: true });
    try {
      // Fetch categories
      let dbCategories = await db.select().from(schema.categories);

      // Seed defaults if empty
      if (dbCategories.length === 0) {
        await db.insert(schema.categories).values(DEFAULT_CATEGORIES);
        dbCategories = await db.select().from(schema.categories);
      }

      // Fetch expenses
      const dbExpenses = await db.select().from(schema.expenses);

      // Fetch budgets
      const dbBudgets = await db
        .select()
        .from(schema.budgets)
        .where(eq(schema.budgets.period, 'current'));

      const dbBudgetLogs = await db.select().from(schema.budgetLogs);

      const monthlyBudget =
        dbBudgets.find((b: any) => !b.categoryId)?.amount || 2500;
      const categoryBudgets = dbBudgets.reduce(
        (acc: Record<string, number>, b: any) => {
          if (b.categoryId) acc[b.categoryId] = b.amount;
          return acc;
        },
        {} as Record<string, number>
      );

      // Fetch settings
      let dbSettingsList = await db.select().from(schema.userSettings);
      let settings = DEFAULT_SETTINGS;

      if (dbSettingsList.length === 0) {
        await db.insert(schema.userSettings).values({
          id: 'current',
          ...DEFAULT_SETTINGS,
        });
      } else {
        settings = {
          userName: dbSettingsList[0].userName,
          theme: dbSettingsList[0].theme,
          currency: dbSettingsList[0].currency,
          isBiometricEnabled: dbSettingsList[0].isBiometricEnabled,
          isAmountHidden: dbSettingsList[0].isAmountHidden || false,
        };
      }

      set({
        categories: dbCategories,
        expenses: dbExpenses.sort((a: any, b: any) => b.date - a.date),
        monthlyBudget,
        categoryBudgets,
        budgetLogs: dbBudgetLogs.sort((a: any, b: any) => b.date - a.date),
        userSettings: settings,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ loading: false });
    }
  },

  addExpense: async (data) => {
    const id = Math.random().toString(36).substring(7);
    const newExpense = { ...data, id };

    await db.insert(schema.expenses).values(newExpense);

    set((state) => ({
      expenses: [newExpense, ...state.expenses],
    }));
  },

  updateExpense: async (id, data) => {
    await db
      .update(schema.expenses)
      .set(data)
      .where(eq(schema.expenses.id, id));

    set((state) => ({
      expenses: state.expenses.map((e) =>
        e.id === id ? { ...e, ...data } : e
      ),
    }));
  },

  deleteExpense: async (id) => {
    await db.delete(schema.expenses).where(eq(schema.expenses.id, id));

    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    }));
  },

  setMonthlyBudget: async (amount) => {
    // Upsert overall budget
    const existing = await db
      .select()
      .from(schema.budgets)
      .where(eq(schema.budgets.period, 'current'));
    const overall = existing.find((b) => !b.categoryId);

    if (overall) {
      await db
        .update(schema.budgets)
        .set({ amount })
        .where(eq(schema.budgets.id, overall.id));

      // Log change
      const log = {
        id: Math.random().toString(36).substring(7),
        amount,
        previousAmount: overall.amount,
        categoryId: null,
        period: 'current',
        date: Date.now(),
      };
      await db.insert(schema.budgetLogs).values(log);
      set((state) => ({ budgetLogs: [log, ...state.budgetLogs] }));
    } else {
      await db.insert(schema.budgets).values({
        id: Math.random().toString(36).substring(7),
        amount,
        period: 'current',
        categoryId: null,
      });

      // Log initial set
      const log = {
        id: Math.random().toString(36).substring(7),
        amount,
        previousAmount: 0,
        categoryId: null,
        period: 'current',
        date: Date.now(),
      };
      await db.insert(schema.budgetLogs).values(log);
      set((state) => ({ budgetLogs: [log, ...state.budgetLogs] }));
    }

    set({ monthlyBudget: amount });
  },

  setCategoryBudget: async (categoryId, amount) => {
    const existing = await db
      .select()
      .from(schema.budgets)
      .where(eq(schema.budgets.categoryId, categoryId));

    if (existing.length > 0) {
      await db
        .update(schema.budgets)
        .set({ amount })
        .where(eq(schema.budgets.id, existing[0].id));

      // Log change
      const log = {
        id: Math.random().toString(36).substring(7),
        amount,
        previousAmount: existing[0].amount,
        categoryId,
        period: 'current',
        date: Date.now(),
      };
      await db.insert(schema.budgetLogs).values(log);
      set((state) => ({ budgetLogs: [log, ...state.budgetLogs] }));
    } else {
      await db.insert(schema.budgets).values({
        id: Math.random().toString(36).substring(7),
        amount,
        period: 'current',
        categoryId,
      });

      // Log initial set
      const log = {
        id: Math.random().toString(36).substring(7),
        amount,
        previousAmount: 0,
        categoryId,
        period: 'current',
        date: Date.now(),
      };
      await db.insert(schema.budgetLogs).values(log);
      set((state) => ({ budgetLogs: [log, ...state.budgetLogs] }));
    }

    set((state) => ({
      categoryBudgets: {
        ...state.categoryBudgets,
        [categoryId]: amount,
      },
    }));
  },

  updateProfile: async (name) => {
    await db
      .update(schema.userSettings)
      .set({ userName: name })
      .where(eq(schema.userSettings.id, 'current'));

    set((state) => ({
      userSettings: {
        ...state.userSettings,
        userName: name,
      },
    }));
  },

  setCurrency: async (code) => {
    await db
      .update(schema.userSettings)
      .set({ currency: code })
      .where(eq(schema.userSettings.id, 'current'));

    set((state) => ({
      userSettings: {
        ...state.userSettings,
        currency: code,
      },
    }));
  },

  formatCurrency: (amount) => {
    const { currency } = get().userSettings;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  },

  setTheme: async (theme) => {
    await db
      .update(schema.userSettings)
      .set({ theme })
      .where(eq(schema.userSettings.id, 'current'));

    set((state) => ({
      userSettings: {
        ...state.userSettings,
        theme,
      },
    }));
  },

  toggleBiometric: async (enabled) => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (enabled && (!hasHardware || !isEnrolled)) {
      throw new Error('Biometrics not available or enrolled');
    }

    await db
      .update(schema.userSettings)
      .set({ isBiometricEnabled: enabled })
      .where(eq(schema.userSettings.id, 'current'));

    set((state) => ({
      userSettings: {
        ...state.userSettings,
        isBiometricEnabled: enabled,
      },
    }));
  },

  toggleAmountVisibility: async () => {
    const newValue = !get().userSettings.isAmountHidden;
    await db
      .update(schema.userSettings)
      .set({ isAmountHidden: newValue })
      .where(eq(schema.userSettings.id, 'current'));

    set((state) => ({
      userSettings: {
        ...state.userSettings,
        isAmountHidden: newValue,
      },
    }));
  },
}));
