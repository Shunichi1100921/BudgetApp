"use client";

import { useEffect, useState } from "react";
import { useBudgetStore } from "@/lib/store/useBudgetStore";
import { Budget, ExpenseCategory } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const budgetSchema = z.object({
  category: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z
      .string({ required_error: "カテゴリを選択してください" })
      .min(1, "カテゴリを選択してください")
  ),
  amount: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z
      .number({ invalid_type_error: "金額を入力してください" })
      .min(1, "金額は1円以上である必要があります")
  ),
  month: z
    .string({ required_error: "月を選択してください" })
    .min(1, "月を選択してください"),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

const categories: ExpenseCategory[] = [
  "食費",
  "交通費",
  "娯楽",
  "衣服",
  "医療費",
  "光熱費",
  "通信費",
  "その他",
];

export default function BudgetsPage() {
  const {
    budgets,
    initialize,
    addBudget,
    updateBudget,
    deleteBudget,
    getCategoryTotalByMonth,
    isBudgetExceeded,
  } = useBudgetStore();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      month: selectedMonth,
      category: "",
      amount: undefined,
    },
    mode: "onChange",
  });

  const filteredBudgets = budgets.filter((b) => b.month === selectedMonth);

  const onSubmit = (data: BudgetFormData) => {
    if (editingId) {
      updateBudget(editingId, {
        category: data.category as ExpenseCategory,
        amount: data.amount,
        month: data.month,
      });
      setEditingId(null);
    } else {
      addBudget({
        category: data.category as ExpenseCategory,
        amount: data.amount,
        month: data.month,
      });
    }
    reset({ month: selectedMonth });
  };

  const handleEdit = (budget: Budget) => {
    setEditingId(budget.id);
    setValue("category", budget.category);
    setValue("amount", budget.amount);
    setValue("month", budget.month);
  };

  const handleCancel = () => {
    setEditingId(null);
    reset({ month: selectedMonth });
  };

  const handleDelete = (id: string) => {
    if (confirm("この予算を削除しますか？")) {
      deleteBudget(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">予算管理</h1>
        <p className="text-gray-600">カテゴリごとの月次予算を設定・管理</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? "予算を編集" : "予算を追加"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="月"
                  type="month"
                  {...register("month")}
                  error={errors.month?.message}
                />

                <Select
                  label="カテゴリ"
                  {...register("category")}
                  error={errors.category?.message}
                >
                  <option value="">選択してください</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>

                <Input
                  label="予算額"
                  type="number"
                  {...register("amount", { valueAsNumber: true })}
                  error={errors.amount?.message}
                />

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingId ? "更新" : "追加"}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCancel}
                      className="flex-1"
                    >
                      キャンセル
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>月を選択</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                label=""
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setValue("month", e.target.value);
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {format(new Date(selectedMonth + "-01"), "yyyy年M月")}の予算
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredBudgets.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  予算が設定されていません
                </p>
              ) : (
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
                              variant="secondary"
                              onClick={() => handleEdit(budget)}
                              className="text-sm"
                            >
                              編集
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => handleDelete(budget.id)}
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

