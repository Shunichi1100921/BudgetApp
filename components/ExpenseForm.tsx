"use client";

import { useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBudgetStore } from "@/lib/store/useBudgetStore";
import { ExpenseCategory, PaymentMethod, Expense } from "@/lib/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { format } from "date-fns";

const expenseSchema = z.object({
  amount: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().min(1, "金額は1円以上である必要があります")
  ),
  category: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().min(1, "カテゴリを選択してください")
  ),
  paymentMethod: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().min(1, "支払い方法を選択してください")
  ),
  description: z.string().optional().default(""),
  date: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().min(1, "日付を選択してください")
  ),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const paymentMethods: PaymentMethod[] = [
  "現金",
  "クレジットカード",
  "デビットカード",
  "PayPay",
  "その他",
];

interface ExpenseFormProps {
  editingExpense?: Expense | null;
  onCancel?: () => void;
}

export default function ExpenseForm({ editingExpense, onCancel }: ExpenseFormProps) {
  const { addExpense, updateExpense, budgets } = useBudgetStore();
  
  // Get unique categories from budgets
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(budgets.map((budget) => budget.category))
    );
    return uniqueCategories.sort();
  }, [budgets]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      category: "",
      paymentMethod: "",
      description: "",
      amount: undefined,
    },
    mode: "onSubmit",
  });

  // Populate form when editing
  useEffect(() => {
    if (editingExpense) {
      setValue("amount", editingExpense.amount);
      setValue("category", editingExpense.category);
      setValue("paymentMethod", editingExpense.paymentMethod);
      setValue("description", editingExpense.description || "");
      setValue("date", editingExpense.date);
    } else {
      reset({
        date: format(new Date(), "yyyy-MM-dd"),
        category: "",
        paymentMethod: "",
        description: "",
        amount: undefined,
      });
    }
  }, [editingExpense, setValue, reset]);

  const onSubmit = (data: ExpenseFormData) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, {
        amount: data.amount,
        category: data.category as ExpenseCategory,
        paymentMethod: data.paymentMethod as PaymentMethod,
        description: data.description || "",
        date: data.date,
      });
      alert("支出を更新しました");
      if (onCancel) {
        onCancel();
      }
    } else {
      addExpense({
        amount: data.amount,
        category: data.category as ExpenseCategory,
        paymentMethod: data.paymentMethod as PaymentMethod,
        description: data.description || "",
        date: data.date,
      });
      alert("支出を追加しました");
    }
    reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingExpense ? "支出を編集" : "支出を追加"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="金額"
              type="number"
              step="1"
              {...register("amount")}
              error={errors.amount?.message}
            />

            <Input
              label="日付"
              type="date"
              {...register("date")}
              error={errors.date?.message}
            />
          </div>

          <Select
            label="カテゴリ"
            {...register("category")}
            error={errors.category?.message}
            disabled={categories.length === 0}
          >
            <option value="">
              {categories.length === 0
                ? "予算を先に作成してください"
                : "選択してください"}
            </option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
          {categories.length === 0 && (
            <p className="text-sm text-amber-600">
              カテゴリを選択するには、まず予算管理ページで予算を作成してください。
            </p>
          )}

          <Select
            label="支払い方法"
            {...register("paymentMethod")}
            error={errors.paymentMethod?.message}
          >
            <option value="">選択してください</option>
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>

          <Input
            label="説明（任意）"
            {...register("description")}
            error={errors.description?.message}
          />

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {editingExpense ? "更新" : "追加"}
            </Button>
            {editingExpense && onCancel && (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                className="flex-1"
              >
                キャンセル
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

