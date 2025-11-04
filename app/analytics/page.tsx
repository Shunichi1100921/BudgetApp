"use client";

import { useEffect, useState } from "react";
import { useBudgetStore } from "@/lib/store/useBudgetStore";
import { ExpenseCategory, PaymentMethod } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatMonth } from "@/lib/utils";
import { format, subMonths } from "date-fns";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
];

export default function AnalyticsPage() {
  const {
    expenses,
    budgets,
    initialize,
    getExpensesByMonth,
    getBudgetsByMonth,
    getCategoryTotalByMonth,
  } = useBudgetStore();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );

  useEffect(() => {
    initialize();
  }, [initialize]);

  const currentMonthExpenses = getExpensesByMonth(selectedMonth);
  const currentMonthBudgets = getBudgetsByMonth(selectedMonth);

  // カテゴリ別の支出データ
  const categoryData = (() => {
    // 予算と支出から動的にカテゴリを取得
    const budgetCategories = currentMonthBudgets.map((b) => b.category);
    const expenseCategories = currentMonthExpenses.map((e) => e.category);
    const categories = Array.from(
      new Set([...budgetCategories, ...expenseCategories])
    ).sort();

    return categories
      .map((category) => {
        const total = getCategoryTotalByMonth(category, selectedMonth);
        const budget = currentMonthBudgets.find((b) => b.category === category);
        return {
          category,
          amount: total,
          budget: budget?.amount || 0,
          remaining: budget ? budget.amount - total : 0,
        };
      })
      .filter((item) => item.amount > 0 || item.budget > 0);
  })();

  // 支払い方法別の支出データ
  const paymentMethodData = (() => {
    const methods: PaymentMethod[] = [
      "現金",
      "クレジットカード",
      "デビットカード",
      "PayPay",
      "その他",
    ];

    return methods
      .map((method) => {
        const total = currentMonthExpenses
          .filter((e) => e.paymentMethod === method)
          .reduce((sum, e) => sum + e.amount, 0);
        return {
          method,
          amount: total,
        };
      })
      .filter((item) => item.amount > 0);
  })();

  // 月別の支出推移（過去6ヶ月）
  const monthlyTrendData = (() => {
    const months = Array.from({ length: 6 }, (_, i) =>
      format(subMonths(new Date(), 5 - i), "yyyy-MM")
    );

    return months.map((month) => {
      const monthExpenses = getExpensesByMonth(month);
      const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        month: format(new Date(month + "-01"), "M月"),
        amount: total,
      };
    });
  })();

  const totalExpenses = currentMonthExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">分析・グラフ</h1>
        <p className="text-gray-600">支出の可視化と詳細な分析</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          月を選択
        </label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">
                {formatMonth(selectedMonth)}の合計支出
              </p>
              <p className="text-4xl font-bold text-gray-900">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>カテゴリ別支出</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                データがありません
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) =>
                      `${category} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>支払い方法別支出</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethodData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                データがありません
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentMethodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="method" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>カテゴリ別詳細（予算との比較）</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                データがありません
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Legend />
                  <Bar dataKey="amount" fill="#8884d8" name="支出" />
                  <Bar dataKey="budget" fill="#82ca9d" name="予算" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>月別支出推移（過去6ヶ月）</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="amount" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>カテゴリ別詳細データ</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">データがありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      カテゴリ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      支出
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      予算
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      残り
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryData.map((item) => (
                    <tr key={item.category}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.budget > 0
                          ? formatCurrency(item.budget)
                          : "-"}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                          item.remaining < 0
                            ? "text-red-600"
                            : item.budget > 0
                            ? "text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        {item.budget > 0
                          ? formatCurrency(item.remaining)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

