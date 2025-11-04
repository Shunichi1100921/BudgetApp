"use client";

import { useEffect, useState } from "react";
import { useBudgetStore } from "@/lib/store/useBudgetStore";
import { Budget, ExpenseCategory, PaymentMethod, PaymentMethodConfig } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// 支出カテゴリのリスト（支出フォームと同じ）
const expenseCategories: ExpenseCategory[] = [
  "食費",
  "交通費",
  "娯楽",
  "衣服",
  "医療費",
  "光熱費",
  "通信費",
  "貯金",
  "その他",
];

// ステップ1: 所持金入力のスキーマ
const balanceSchema = z.object({
  name: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().min(1, "支払い方法を選択してください")
  ),
  balance: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().min(0, "残高を入力してください")
  ),
  notes: z.string().optional().default(""),
});

// ステップ2: 予算分配のスキーマ
const budgetAllocationSchema = z.object({
  month: z.string().min(1, "月を選択してください"),
});

type BalanceFormData = z.infer<typeof balanceSchema>;
type BudgetAllocationFormData = z.infer<typeof budgetAllocationSchema>;

const paymentMethods: PaymentMethod[] = [
  "現金",
  "クレジットカード",
  "デビットカード",
  "PayPay",
  "その他",
];

const SAVINGS_CATEGORY: ExpenseCategory = "貯金";

export default function BudgetsPage() {
  const {
    paymentMethods: methods,
    budgets,
    initialize,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    addBudget,
    updateBudget,
    deleteBudget,
    getCategoryTotalByMonth,
    isBudgetExceeded,
    getTotalBalance,
  } = useBudgetStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );
  const [editingBalanceId, setEditingBalanceId] = useState<string | null>(null);
  const [budgetAmounts, setBudgetAmounts] = useState<Partial<Record<ExpenseCategory, number>>>({});

  useEffect(() => {
    initialize();
  }, [initialize]);

  // ステップ1のフォーム
  const balanceForm = useForm<BalanceFormData>({
    resolver: zodResolver(balanceSchema) as any,
    defaultValues: {
      name: "",
      balance: undefined,
      notes: "",
    },
  });

  // ステップ2のフォーム
  const allocationForm = useForm<BudgetAllocationFormData>({
    resolver: zodResolver(budgetAllocationSchema),
    defaultValues: {
      month: selectedMonth,
    },
  });

  // ステップ1: 所持金入力の処理
  const onSubmitBalance = (data: BalanceFormData) => {
    if (editingBalanceId) {
      updatePaymentMethod(editingBalanceId, {
        name: data.name as PaymentMethod,
        balance: data.balance,
        notes: data.notes,
      });
      setEditingBalanceId(null);
    } else {
      addPaymentMethod({
        name: data.name as PaymentMethod,
        balance: data.balance,
        notes: data.notes,
      });
    }
    balanceForm.reset();
  };

  const handleEditBalance = (method: PaymentMethodConfig) => {
    setEditingBalanceId(method.id);
    balanceForm.setValue("name", method.name);
    balanceForm.setValue("balance", method.balance);
    balanceForm.setValue("notes", method.notes || "");
  };

  const handleCancelBalance = () => {
    setEditingBalanceId(null);
    balanceForm.reset();
  };

  const handleDeleteBalance = (id: string) => {
    if (confirm("この支払い方法を削除しますか？")) {
      deletePaymentMethod(id);
    }
  };

  // ステップ2: 予算分配の処理
  const totalBalance = getTotalBalance();
  const totalAllocated = Object.values(budgetAmounts).reduce(
    (sum, amount) => sum + (amount || 0),
    0
  );
  const remainingForSavings = totalBalance - totalAllocated;

  // 予算分配の保存
  const handleSaveBudgetAllocation = () => {
    // 既存の予算を削除
    const existingBudgets = budgets.filter((b) => b.month === selectedMonth);
    existingBudgets.forEach((b) => deleteBudget(b.id));

    // 新しい予算を追加（貯金以外）
    Object.entries(budgetAmounts).forEach(([category, amount]) => {
      if (category !== SAVINGS_CATEGORY && amount && amount > 0) {
        addBudget({
          category: category as ExpenseCategory,
          amount: amount,
          month: selectedMonth,
        });
      }
    });

    // 貯金カテゴリに残りを設定
    if (remainingForSavings > 0) {
      addBudget({
        category: SAVINGS_CATEGORY,
        amount: remainingForSavings,
        month: selectedMonth,
      });
    }

    alert("予算の分配を保存しました");
  };

  // 月変更時に予算を読み込む
  useEffect(() => {
    const monthBudgets = budgets.filter((b) => b.month === selectedMonth);
    const amounts: Record<ExpenseCategory, number> = {} as Record<ExpenseCategory, number>;
    monthBudgets.forEach((budget) => {
      amounts[budget.category] = budget.amount;
    });
    setBudgetAmounts(amounts);
  }, [selectedMonth, budgets]);

  const filteredBudgets = budgets.filter((b) => b.month === selectedMonth);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">予算管理</h1>
        <p className="text-gray-600">予算を設定・管理</p>
      </div>

      {/* ステップインジケーター */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div
            className={`flex items-center ${
              step >= 1 ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              1
            </div>
            <span className="ml-2 font-medium">所持金入力</span>
          </div>
          <div
            className={`w-16 h-1 ${
              step >= 2 ? "bg-blue-600" : "bg-gray-200"
            }`}
          />
          <div
            className={`flex items-center ${
              step >= 2 ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 2
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              2
            </div>
            <span className="ml-2 font-medium">予算分配</span>
          </div>
        </div>
      </div>

      {/* ステップ1: 所持金入力 */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingBalanceId ? "所持金を編集" : "所持金を追加"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={balanceForm.handleSubmit(onSubmitBalance)}
                  className="space-y-4"
                >
                  <Select
                    label="支払い方法"
                    {...balanceForm.register("name")}
                    error={balanceForm.formState.errors.name?.message}
                  >
                    <option value="">選択してください</option>
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </Select>

                  <Input
                    label="現在の残高"
                    type="number"
                    {...balanceForm.register("balance", {
                      valueAsNumber: true,
                    })}
                    error={balanceForm.formState.errors.balance?.message}
                  />

                  <Input
                    label="名称（例：三菱UFJ銀行、みずほ銀行など）"
                    {...balanceForm.register("notes")}
                    error={balanceForm.formState.errors.notes?.message}
                    placeholder="任意：具体的な名称を入力"
                  />

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingBalanceId ? "更新" : "追加"}
                    </Button>
                    {editingBalanceId && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCancelBalance}
                        className="flex-1"
                      >
                        キャンセル
                      </Button>
                    )}
                  </div>
                </form>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">合計所持金</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatCurrency(totalBalance)}
                  </div>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  className="w-full mt-4"
                  disabled={methods.length === 0}
                >
                  次へ：予算分配
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>登録済みの所持金</CardTitle>
              </CardHeader>
              <CardContent>
                {methods.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    所持金が登録されていません
                  </p>
                ) : (
                  <div className="space-y-4">
                    {methods.map((method) => {
                      const displayName = method.notes || method.name;
                      return (
                        <div
                          key={method.id}
                          className="p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">
                                {displayName}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                残高: {formatCurrency(method.balance)}
                              </p>
                              {method.notes && (
                                <p className="text-xs text-gray-500 mt-1">
                                  種類: {method.name}
                                </p>
                              )}
                            </div>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => handleEditBalance(method)}
                              className="text-sm"
                            >
                              編集
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => handleDeleteBalance(method.id)}
                              className="text-sm"
                            >
                              削除
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ステップ2: 予算分配 */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>予算の分配</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">合計所持金</span>
                    <span className="text-2xl font-bold text-blue-900">
                      {formatCurrency(totalBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">分配済み</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(totalAllocated)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-blue-300">
                    <span className="text-gray-900 font-medium">
                      残り（貯金カテゴリへ自動設定）
                    </span>
                    <span
                      className={`font-bold text-lg ${
                        remainingForSavings < 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {formatCurrency(remainingForSavings)}
                    </span>
                  </div>
                </div>

                <Input
                  label="対象月"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    allocationForm.setValue("month", e.target.value);
                  }}
                />

                <div className="space-y-4">
                  {expenseCategories
                    .filter((category) => category !== SAVINGS_CATEGORY)
                    .map((category) => (
                      <div
                        key={category}
                        className="p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <label className="font-medium text-gray-900">
                            {category}
                          </label>
                        </div>
                        <Input
                          type="number"
                          value={budgetAmounts[category] || ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? Number(e.target.value)
                              : 0;
                            setBudgetAmounts((prev) => ({
                              ...prev,
                              [category]: value,
                            }));
                          }}
                          placeholder="0"
                        />
                      </div>
                    ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    戻る：所持金入力
                  </Button>
                  <Button
                    onClick={handleSaveBudgetAllocation}
                    className="flex-1"
                    disabled={remainingForSavings < 0}
                  >
                    予算を保存
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 設定済み予算の表示 */}
          {filteredBudgets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {format(new Date(selectedMonth + "-01"), "yyyy年M月")}の予算
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredBudgets.map((budget) => {
                    const spent = getCategoryTotalByMonth(
                      budget.category,
                      selectedMonth
                    );
                    const remaining = budget.amount - spent;
                    const percentage = (spent / budget.amount) * 100;
                    const exceeded = isBudgetExceeded(
                      budget.category,
                      selectedMonth
                    );

                    return (
                      <div
                        key={budget.id}
                        className={`p-4 border rounded-lg ${
                          exceeded ? "border-red-300 bg-red-50" : "border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {budget.category}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              予算: {formatCurrency(budget.amount)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="danger"
                              onClick={() => deleteBudget(budget.id)}
                              className="text-sm"
                            >
                              削除
                            </Button>
                          </div>
                        </div>

                        <div className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">使用額</span>
                            <span
                              className={`font-semibold ${
                                exceeded ? "text-red-600" : "text-gray-900"
                              }`}
                            >
                              {formatCurrency(spent)} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all ${
                                exceeded
                                  ? "bg-red-500"
                                  : percentage > 80
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">残り</span>
                          <span
                            className={`font-semibold ${
                              remaining < 0 ? "text-red-600" : "text-gray-900"
                            }`}
                          >
                            {formatCurrency(remaining)}
                          </span>
                        </div>

                        {exceeded && (
                          <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-800">
                            ⚠️ 予算を超過しています
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
