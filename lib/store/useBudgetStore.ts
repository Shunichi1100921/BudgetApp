import { create } from "zustand";
import { Expense, Budget, PaymentMethodConfig, BudgetCategory } from "../types";
import {
  expenseStorage,
  budgetStorage,
  paymentMethodStorage,
  budgetCategoryStorage,
} from "../storage";
import { format } from "date-fns";

interface BudgetState {
  expenses: Expense[];
  budgets: Budget[];
  paymentMethods: PaymentMethodConfig[];
  budgetCategories: BudgetCategory[];
  
  // 初期化
  initialize: () => void;
  
  // 支出関連
  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  
  // 予算関連
  addBudget: (budget: Omit<Budget, "id" | "createdAt">) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  
  // 支払い方法関連
  addPaymentMethod: (paymentMethod: Omit<PaymentMethodConfig, "id">) => void;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethodConfig>) => void;
  deletePaymentMethod: (id: string) => void;
  
  // 予算カテゴリ関連
  addBudgetCategory: (category: Omit<BudgetCategory, "id" | "createdAt">) => void;
  updateBudgetCategory: (id: string, updates: Partial<BudgetCategory>) => void;
  deleteBudgetCategory: (id: string) => void;
  
  // 計算・取得メソッド
  getExpensesByMonth: (month: string) => Expense[];
  getBudgetsByMonth: (month: string) => Budget[];
  getCategoryTotalByMonth: (category: string, month: string) => number;
  isBudgetExceeded: (category: string, month: string) => boolean;
  getTotalBalance: () => number; // 全支払い方法の合計残高
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  expenses: [],
  budgets: [],
  paymentMethods: [],
  budgetCategories: [],

  initialize: () => {
    if (typeof window === "undefined") return;
    set({
      expenses: expenseStorage.getAll(),
      budgets: budgetStorage.getAll(),
      paymentMethods: paymentMethodStorage.getAll(),
      budgetCategories: budgetCategoryStorage.getAll(),
    });
  },

  addExpense: (expenseData) => {
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    expenseStorage.add(newExpense);
    set((state) => ({
      expenses: [...state.expenses, newExpense],
    }));
  },

  updateExpense: (id, updates) => {
    expenseStorage.update(id, updates);
    set((state) => ({
      expenses: state.expenses.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
  },

  deleteExpense: (id) => {
    expenseStorage.delete(id);
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    }));
  },

  addBudget: (budgetData) => {
    const newBudget: Budget = {
      ...budgetData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    budgetStorage.add(newBudget);
    set((state) => ({
      budgets: [...state.budgets, newBudget],
    }));
  },

  updateBudget: (id, updates) => {
    budgetStorage.update(id, updates);
    set((state) => ({
      budgets: state.budgets.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    }));
  },

  deleteBudget: (id) => {
    budgetStorage.delete(id);
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }));
  },

  addPaymentMethod: (paymentMethodData) => {
    const newPaymentMethod: PaymentMethodConfig = {
      ...paymentMethodData,
      id: crypto.randomUUID(),
    };
    paymentMethodStorage.add(newPaymentMethod);
    set((state) => ({
      paymentMethods: [...state.paymentMethods, newPaymentMethod],
    }));
  },

  updatePaymentMethod: (id, updates) => {
    paymentMethodStorage.update(id, updates);
    set((state) => ({
      paymentMethods: state.paymentMethods.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },

  deletePaymentMethod: (id) => {
    paymentMethodStorage.delete(id);
    set((state) => ({
      paymentMethods: state.paymentMethods.filter((p) => p.id !== id),
    }));
  },

  addBudgetCategory: (categoryData) => {
    const newCategory: BudgetCategory = {
      ...categoryData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    budgetCategoryStorage.add(newCategory);
    set((state) => ({
      budgetCategories: [...state.budgetCategories, newCategory],
    }));
  },

  updateBudgetCategory: (id, updates) => {
    budgetCategoryStorage.update(id, updates);
    set((state) => ({
      budgetCategories: state.budgetCategories.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  deleteBudgetCategory: (id) => {
    budgetCategoryStorage.delete(id);
    set((state) => ({
      budgetCategories: state.budgetCategories.filter((c) => c.id !== id),
    }));
  },

  getExpensesByMonth: (month) => {
    return get().expenses.filter((e) => e.date.startsWith(month));
  },

  getBudgetsByMonth: (month) => {
    return get().budgets.filter((b) => b.month === month);
  },

  getCategoryTotalByMonth: (category, month) => {
    return get()
      .getExpensesByMonth(month)
      .filter((e) => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
  },

  isBudgetExceeded: (category, month) => {
    const budget = get()
      .getBudgetsByMonth(month)
      .find((b) => b.category === category);
    if (!budget) return false;
    const total = get().getCategoryTotalByMonth(category, month);
    return total > budget.amount;
  },

  getTotalBalance: () => {
    return get().paymentMethods.reduce((sum, method) => sum + method.balance, 0);
  },
}));

