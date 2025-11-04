"use client";

import { useEffect, useState, useMemo } from "react";
import { useBudgetStore } from "@/lib/store/useBudgetStore";
import { Expense, ExpenseCategory, PaymentMethod } from "@/lib/types";
import ExpenseForm from "@/components/ExpenseForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { format } from "date-fns";

export default function ExpensesPage() {
  const { expenses, budgets, initialize, deleteExpense } = useBudgetStore();
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    let filtered = expenses;

    if (filterMonth) {
      filtered = filtered.filter((e) => e.date.startsWith(filterMonth));
    }

    if (filterCategory) {
      filtered = filtered.filter((e) => e.category === filterCategory);
    }

    if (filterPaymentMethod) {
      filtered = filtered.filter((e) => e.paymentMethod === filterPaymentMethod);
    }

    setFilteredExpenses(
      filtered.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    );
  }, [expenses, filterMonth, filterCategory, filterPaymentMethod]);

  // Get unique categories from budgets and existing expenses
  const categories = useMemo(() => {
    const budgetCategories = Array.from(
      new Set(budgets.map((budget) => budget.category))
    );
    const expenseCategories = Array.from(
      new Set(expenses.map((expense) => expense.category))
    );
    const allCategories = Array.from(
      new Set([...budgetCategories, ...expenseCategories])
    );
    return allCategories.sort();
  }, [budgets, expenses]);

  const paymentMethods: PaymentMethod[] = [
    "現金",
    "クレジットカード",
    "デビットカード",
    "PayPay",
    "その他",
  ];

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleDelete = (id: string) => {
    if (confirm("この支出を削除しますか？")) {
      deleteExpense(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">支出管理</h1>
        <p className="text-gray-600">支出の追加・閲覧・削除</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <ExpenseForm />
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>支出一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    label="月"
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                  />
                  <Select
                    label="カテゴリ"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">すべて</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="支払い方法"
                    value={filterPaymentMethod}
                    onChange={(e) => setFilterPaymentMethod(e.target.value)}
                  >
                    <option value="">すべて</option>
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600">
                    {filteredExpenses.length}件の支出
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    合計: {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredExpenses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    支出がありません
                  </p>
                ) : (
                  filteredExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex justify-between items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {expense.description || "（説明なし）"}
                        </p>
                        <div className="flex gap-2 mt-1 text-sm text-gray-600">
                          <span>{formatDate(expense.date)}</span>
                          <span>·</span>
                          <span>{expense.category}</span>
                          <span>·</span>
                          <span>{expense.paymentMethod}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(expense.amount)}
                        </span>
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(expense.id)}
                          className="text-sm"
                        >
                          削除
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

