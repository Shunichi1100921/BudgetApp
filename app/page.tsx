"use client";

import { useEffect } from "react";
import { useBudgetStore } from "@/lib/store/useBudgetStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatMonth, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function Home() {
  const {
    expenses,
    budgets,
    paymentMethods,
    initialize,
    getExpensesByMonth,
    getBudgetsByMonth,
    getCategoryTotalByMonth,
    isBudgetExceeded,
  } = useBudgetStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const currentMonth = format(new Date(), "yyyy-MM");
  const currentMonthExpenses = getExpensesByMonth(currentMonth);
  const currentMonthBudgets = getBudgetsByMonth(currentMonth);
  const totalExpenses = currentMonthExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  const budgetStatus = currentMonthBudgets.map((budget) => {
    const spent = getCategoryTotalByMonth(budget.category, currentMonth);
    const remaining = budget.amount - spent;
    const percentage = (spent / budget.amount) * 100;
    return {
      ...budget,
      spent,
      remaining,
      percentage,
      exceeded: isBudgetExceeded(budget.category, currentMonth),
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ダッシュボード
        </h1>
        <p className="text-gray-600">{formatMonth(currentMonth)}の概要</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>今月の支出</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(totalExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>予算数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">
              {currentMonthBudgets.length}
            </p>
            <p className="text-sm text-gray-600 mt-1">カテゴリ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>支払い方法</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">
              {paymentMethods.length}
            </p>
            <p className="text-sm text-gray-600 mt-1">登録済み</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>予算状況</CardTitle>
          </CardHeader>
          <CardContent>
            {budgetStatus.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                予算が設定されていません
              </p>
            ) : (
              <div className="space-y-4">
                {budgetStatus.map((status) => (
                  <div key={status.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">
                        {status.category}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          status.exceeded ? "text-red-600" : "text-gray-600"
                        }`}
                      >
                        {formatCurrency(status.spent)} /{" "}
                        {formatCurrency(status.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div
                        className={`h-2 rounded-full ${
                          status.exceeded
                            ? "bg-red-500"
                            : status.percentage > 80
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${Math.min(status.percentage, 100)}%` }}
                      />
                    </div>
                    {status.exceeded && (
                      <p className="text-sm text-red-600 font-medium mt-1">
                        ⚠️ 予算を超過しています
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link href="/budgets">
                <Button variant="outline" className="w-full">
                  予算を設定・編集
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近の支出</CardTitle>
          </CardHeader>
          <CardContent>
            {currentMonthExpenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                今月の支出はありません
              </p>
            ) : (
              <div className="space-y-3">
                {currentMonthExpenses
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .slice(0, 5)
                  .map((expense) => (
                    <div
                      key={expense.id}
                      className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {expense.description || "（説明なし）"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {expense.category} · {expense.paymentMethod}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                  ))}
              </div>
            )}
            <div className="mt-4">
              <Link href="/expenses">
                <Button variant="outline" className="w-full">
                  すべての支出を見る
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Link href="/expenses">
          <Button>支出を追加</Button>
        </Link>
        <Link href="/analytics">
          <Button variant="secondary">詳細な分析を見る</Button>
        </Link>
      </div>
    </div>
  );
}
