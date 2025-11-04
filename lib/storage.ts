import { Expense, Budget, PaymentMethodConfig, BudgetCategory } from "./types";

const STORAGE_KEYS = {
  expenses: "budget-app-expenses",
  budgets: "budget-app-budgets",
  paymentMethods: "budget-app-payment-methods",
  budgetCategories: "budget-app-budget-categories",
} as const;

// 支出の保存・取得
export const expenseStorage = {
  getAll: (): Expense[] => {
    if (typeof window === "undefined" || !localStorage) return [];
    const data = localStorage.getItem(STORAGE_KEYS.expenses);
    return data ? JSON.parse(data) : [];
  },
  save: (expenses: Expense[]): void => {
    if (typeof window === "undefined" || !localStorage) return;
    localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
  },
  add: (expense: Expense): void => {
    const expenses = expenseStorage.getAll();
    expenses.push(expense);
    expenseStorage.save(expenses);
  },
  update: (id: string, updates: Partial<Expense>): void => {
    const expenses = expenseStorage.getAll();
    const index = expenses.findIndex((e) => e.id === id);
    if (index !== -1) {
      expenses[index] = { ...expenses[index], ...updates };
      expenseStorage.save(expenses);
    }
  },
  delete: (id: string): void => {
    const expenses = expenseStorage.getAll();
    expenseStorage.save(expenses.filter((e) => e.id !== id));
  },
};

// 予算の保存・取得
export const budgetStorage = {
  getAll: (): Budget[] => {
    if (typeof window === "undefined" || !localStorage) return [];
    const data = localStorage.getItem(STORAGE_KEYS.budgets);
    return data ? JSON.parse(data) : [];
  },
  save: (budgets: Budget[]): void => {
    if (typeof window === "undefined" || !localStorage) return;
    localStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify(budgets));
  },
  add: (budget: Budget): void => {
    const budgets = budgetStorage.getAll();
    budgets.push(budget);
    budgetStorage.save(budgets);
  },
  update: (id: string, updates: Partial<Budget>): void => {
    const budgets = budgetStorage.getAll();
    const index = budgets.findIndex((b) => b.id === id);
    if (index !== -1) {
      budgets[index] = { ...budgets[index], ...updates };
      budgetStorage.save(budgets);
    }
  },
  delete: (id: string): void => {
    const budgets = budgetStorage.getAll();
    budgetStorage.save(budgets.filter((b) => b.id !== id));
  },
};

// 支払い方法の保存・取得
export const paymentMethodStorage = {
  getAll: (): PaymentMethodConfig[] => {
    if (typeof window === "undefined" || !localStorage) return [];
    const data = localStorage.getItem(STORAGE_KEYS.paymentMethods);
    return data ? JSON.parse(data) : [];
  },
  save: (paymentMethods: PaymentMethodConfig[]): void => {
    if (typeof window === "undefined" || !localStorage) return;
    localStorage.setItem(STORAGE_KEYS.paymentMethods, JSON.stringify(paymentMethods));
  },
  add: (paymentMethod: PaymentMethodConfig): void => {
    const paymentMethods = paymentMethodStorage.getAll();
    paymentMethods.push(paymentMethod);
    paymentMethodStorage.save(paymentMethods);
  },
  update: (id: string, updates: Partial<PaymentMethodConfig>): void => {
    const paymentMethods = paymentMethodStorage.getAll();
    const index = paymentMethods.findIndex((p) => p.id === id);
    if (index !== -1) {
      paymentMethods[index] = { ...paymentMethods[index], ...updates };
      paymentMethodStorage.save(paymentMethods);
    }
  },
  delete: (id: string): void => {
    const paymentMethods = paymentMethodStorage.getAll();
    paymentMethodStorage.save(paymentMethods.filter((p) => p.id !== id));
  },
};

// 予算カテゴリの保存・取得
export const budgetCategoryStorage = {
  getAll: (): BudgetCategory[] => {
    if (typeof window === "undefined" || !localStorage) return [];
    const data = localStorage.getItem(STORAGE_KEYS.budgetCategories);
    return data ? JSON.parse(data) : [];
  },
  save: (categories: BudgetCategory[]): void => {
    if (typeof window === "undefined" || !localStorage) return;
    localStorage.setItem(STORAGE_KEYS.budgetCategories, JSON.stringify(categories));
  },
  add: (category: BudgetCategory): void => {
    const categories = budgetCategoryStorage.getAll();
    categories.push(category);
    budgetCategoryStorage.save(categories);
  },
  update: (id: string, updates: Partial<BudgetCategory>): void => {
    const categories = budgetCategoryStorage.getAll();
    const index = categories.findIndex((c) => c.id === id);
    if (index !== -1) {
      categories[index] = { ...categories[index], ...updates };
      budgetCategoryStorage.save(categories);
    }
  },
  delete: (id: string): void => {
    const categories = budgetCategoryStorage.getAll();
    budgetCategoryStorage.save(categories.filter((c) => c.id !== id));
  },
};

