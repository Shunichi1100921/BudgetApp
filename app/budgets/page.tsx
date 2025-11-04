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
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState<string>("");
  const [newBudgetAmount, setNewBudgetAmount] = useState<number>(0);
  const [editingBudgetAmount, setEditingBudgetAmount] = useState<number>(0);

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
  const filteredBudgets = budgets.filter((b) => b.month === selectedMonth);
  const totalAllocated = filteredBudgets.reduce(
    (sum, budget) => sum + budget.amount,
    0
  );
  const remainingForSavings = totalBalance - totalAllocated;

  // 既に設定されているカテゴリを取得（表示用）
  const allocatedCategories = new Set(
    filteredBudgets.map((b) => b.category)
  );

  // 予算の追加
  const handleAddBudget = () => {
    if (!newBudgetCategory.trim() || newBudgetAmount <= 0) {
      alert("カテゴリと金額を入力してください");
      return;
    }

    if (totalAllocated + newBudgetAmount > totalBalance) {
      alert("合計所持金を超える予算を設定できません");
      return;
    }

    addBudget({
      category: newBudgetCategory.trim(),
      amount: newBudgetAmount,
      month: selectedMonth,
    });

    setNewBudgetCategory("");
    setNewBudgetAmount(0);
    setIsAddingBudget(false);
  };

  // 予算の編集開始
  const handleStartEditBudget = (budget: Budget) => {
    setEditingBudgetId(budget.id);
    setEditingBudgetAmount(budget.amount);
  };

  // 予算の更新
  const handleUpdateBudget = (budgetId: string) => {
    if (editingBudgetAmount <= 0) {
      alert("金額を入力してください");
      return;
    }

    const budget = filteredBudgets.find((b) => b.id === budgetId);
    if (!budget) return;

    const otherBudgetsTotal = filteredBudgets
      .filter((b) => b.id !== budgetId)
      .reduce((sum, b) => sum + b.amount, 0);

    if (otherBudgetsTotal + editingBudgetAmount > totalBalance) {
      alert("合計所持金を超える予算を設定できません");
      return;
    }

    updateBudget(budgetId, {
      amount: editingBudgetAmount,
    });

    setEditingBudgetId(null);
    setEditingBudgetAmount(0);
  };

  // 予算の編集キャンセル
  const handleCancelEditBudget = () => {
    setEditingBudgetId(null);
    setEditingBudgetAmount(0);
  };

  // 追加キャンセル
  const handleCancelAddBudget = () => {
    setIsAddingBudget(false);
    setNewBudgetCategory("");
    setNewBudgetAmount(0);
  };

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
        <div className="relative">
          {/* 合計金額を右側に固定表示 */}
          <div className="fixed top-20 right-4 z-10 w-64">
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">合計所持金</span>
                  <span className="text-xl font-bold text-blue-900">
                    {formatCurrency(totalBalance)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">分配済み</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(totalAllocated)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-900 font-medium text-xs">
                    残り（貯金へ）
                  </span>
                  <span
                    className={`font-bold ${
                      remainingForSavings < 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {formatCurrency(remainingForSavings)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 pr-72">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {format(new Date(selectedMonth + "-01"), "yyyy年M月")}の予算
                  </CardTitle>
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      allocationForm.setValue("month", e.target.value);
                      setEditingBudgetId(null);
                      setIsAddingBudget(false);
                    }}
                    className="w-40"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                      const isEditing = editingBudgetId === budget.id;

                      return (
                        <div
                          key={budget.id}
                          className={`p-3 border rounded-lg ${
                            exceeded ? "border-red-300 bg-red-50" : "border-gray-200"
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="font-bold text-sm text-gray-900 mb-2">
                                {budget.category}
                              </div>
                              <Input
                                type="number"
                                label="予算額"
                                value={editingBudgetAmount || ""}
                                onChange={(e) =>
                                  setEditingBudgetAmount(
                                    e.target.value ? Number(e.target.value) : 0
                                  )
                                }
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleUpdateBudget(budget.id)}
                                  className="flex-1 text-xs"
                                >
                                  保存
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={handleCancelEditBudget}
                                  className="flex-1 text-xs"
                                >
                                  キャンセル
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <h3 className="font-bold text-sm text-gray-900 truncate">
                                      {budget.category}
                                    </h3>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="secondary"
                                        onClick={() => handleStartEditBudget(budget)}
                                        className="text-xs px-2 py-1 flex-shrink-0"
                                      >
                                        編集
                                      </Button>
                                      <Button
                                        variant="danger"
                                        onClick={() => deleteBudget(budget.id)}
                                        className="text-xs px-2 py-1 flex-shrink-0"
                                      >
                                        削除
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-600">
                                    予算: {formatCurrency(budget.amount)}
                                  </p>
                                </div>
                              </div>

                              <div className="mb-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600">使用額</span>
                                  <span
                                    className={`font-semibold ${
                                      exceeded ? "text-red-600" : "text-gray-900"
                                    }`}
                                  >
                                    {formatCurrency(spent)} ({percentage.toFixed(1)}%)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
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

                              <div className="flex justify-between text-xs">
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
                                <div className="mt-2 p-1.5 bg-red-100 border border-red-300 rounded text-xs text-red-800">
                                  ⚠️ 超過
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}

                  {/* 追加カード */}
                  {isAddingBudget ? (
                    <div className="p-3 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                      <div className="space-y-2">
                        <Input
                          label="カテゴリ"
                          value={newBudgetCategory}
                          onChange={(e) => setNewBudgetCategory(e.target.value)}
                          placeholder="例：食費、交通費など"
                          className="text-sm"
                        />
                        <Input
                          type="number"
                          label="予算額"
                          value={newBudgetAmount || ""}
                          onChange={(e) =>
                            setNewBudgetAmount(
                              e.target.value ? Number(e.target.value) : 0
                            )
                          }
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleAddBudget}
                            className="flex-1 text-xs"
                          >
                            追加
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={handleCancelAddBudget}
                            className="flex-1 text-xs"
                          >
                            キャンセル
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingBudget(true)}
                      className="p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-500 hover:text-blue-600 min-h-[120px] flex items-center justify-center"
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-1">+</div>
                        <div className="text-sm">追加</div>
                      </div>
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setStep(1);
                  setEditingBudgetId(null);
                  setIsAddingBudget(false);
                }}
                className="flex-1"
              >
                戻る：所持金入力
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
