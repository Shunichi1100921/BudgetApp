"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBudgetStore } from "@/lib/store/useBudgetStore";
import { ExpenseCategory, PaymentMethod } from "@/lib/types";
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

const paymentMethods: PaymentMethod[] = [
  "現金",
  "クレジットカード",
  "デビットカード",
  "PayPay",
  "その他",
];

export default function ExpenseForm() {
  const { addExpense } = useBudgetStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      category: "",
      paymentMethod: "",
      description: "",
      amount: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = (data: ExpenseFormData) => {
    addExpense({
      amount: data.amount,
      category: data.category as ExpenseCategory,
      paymentMethod: data.paymentMethod as PaymentMethod,
      description: data.description || "",
      date: data.date,
    });
    reset();
    alert("支出を追加しました");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>支出を追加</CardTitle>
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
          >
            <option value="">選択してください</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>

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

          <Button type="submit" className="w-full">
            追加
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

