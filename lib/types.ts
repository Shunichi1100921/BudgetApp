// 支出カテゴリ
export type ExpenseCategory =
  | "食費"
  | "交通費"
  | "娯楽"
  | "衣服"
  | "医療費"
  | "光熱費"
  | "通信費"
  | "その他";

// 支払い方法
export type PaymentMethod = "現金" | "クレジットカード" | "デビットカード" | "PayPay" | "その他";

// 支出
export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  description: string;
  date: string; // YYYY-MM-DD形式
  createdAt: string; // ISO形式
}

// 予算
export interface Budget {
  id: string;
  category: ExpenseCategory;
  amount: number;
  month: string; // YYYY-MM形式
  createdAt: string;
}

// 支払い方法の残高・設定
export interface PaymentMethodConfig {
  id: string;
  name: PaymentMethod;
  balance: number; // 現在の残高
  creditLimit?: number; // クレジットカードの場合の限度額
  billingDate?: number; // クレジットカードの引き落とし日（1-31）
  notes?: string;
}

// 月次サマリー
export interface MonthlySummary {
  month: string; // YYYY-MM形式
  totalExpenses: number;
  expensesByCategory: Record<ExpenseCategory, number>;
  expensesByPaymentMethod: Record<PaymentMethod, number>;
  budgets: Budget[];
}

