"use client";

import { useEffect, useState } from "react";
import { useBudgetStore } from "@/lib/store/useBudgetStore";
import { PaymentMethodConfig, PaymentMethod } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { formatCurrency } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const paymentMethodSchema = z.object({
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
  creditLimit: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().optional()
  ),
  billingDate: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().min(1).max(31).optional()
  ),
  notes: z.string().optional().default(""),
});

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

const paymentMethods: PaymentMethod[] = [
  "現金",
  "クレジットカード",
  "デビットカード",
  "PayPay",
  "その他",
];

export default function PaymentMethodsPage() {
  const {
    paymentMethods: methods,
    expenses,
    initialize,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  } = useBudgetStore();
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
    watch,
  } = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      balance: "",
      name: "",
      notes: "",
    },
    mode: "onSubmit",
  });

  const selectedMethod = watch("name");

  // 各支払い方法の使用額を計算
  const getUsageByMethod = (methodName: PaymentMethod) => {
    return expenses
      .filter((e) => e.paymentMethod === methodName)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  // クレジットカードの引き落とし予定額を計算
  const getCreditCardTotal = () => {
    const creditCards = methods.filter((m) => m.name === "クレジットカード");
    return creditCards.reduce((sum, card) => {
      const usage = getUsageByMethod("クレジットカード");
      return sum + usage;
    }, 0);
  };

  const onSubmit = (data: PaymentMethodFormData) => {
    if (editingId) {
      updatePaymentMethod(editingId, {
        name: data.name as PaymentMethod,
        balance: data.balance,
        creditLimit: data.creditLimit,
        billingDate: data.billingDate,
        notes: data.notes,
      });
      setEditingId(null);
    } else {
      addPaymentMethod({
        name: data.name as PaymentMethod,
        balance: data.balance,
        creditLimit: data.creditLimit,
        billingDate: data.billingDate,
        notes: data.notes,
      });
    }
    reset({ balance: 0 });
  };

  const handleEdit = (method: PaymentMethodConfig) => {
    setEditingId(method.id);
    setValue("name", method.name);
    setValue("balance", method.balance);
    setValue("creditLimit", method.creditLimit || undefined);
    setValue("billingDate", method.billingDate || undefined);
    setValue("notes", method.notes || "");
  };

  const handleCancel = () => {
    setEditingId(null);
    reset({ balance: 0 });
  };

  const handleDelete = (id: string) => {
    if (confirm("この支払い方法を削除しますか？")) {
      deletePaymentMethod(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">支払い方法管理</h1>
        <p className="text-gray-600">
          支払い方法ごとの残高・設定を管理し、使用状況を確認
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? "支払い方法を編集" : "支払い方法を追加"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Select
                  label="支払い方法"
                  {...register("name")}
                  error={errors.name?.message}
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
                  {...register("balance")}
                  error={errors.balance?.message}
                />

                {selectedMethod === "クレジットカード" && (
                  <>
                    <Input
                      label="利用限度額（任意）"
                      type="number"
                      {...register("creditLimit")}
                      error={errors.creditLimit?.message}
                    />
                    <Input
                      label="引き落とし日（1-31）"
                      type="number"
                      min="1"
                      max="31"
                      {...register("billingDate")}
                      error={errors.billingDate?.message}
                    />
                  </>
                )}

                <Input
                  label="メモ（任意）"
                  {...register("notes")}
                  error={errors.notes?.message}
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
        </div>

        <div className="lg:col-span-2">
          <div className="space-y-6">
            {methods.length === 0 ? (
              <Card>
                <CardContent>
                  <p className="text-gray-500 text-center py-8">
                    支払い方法が登録されていません
                  </p>
                </CardContent>
              </Card>
            ) : (
              methods.map((method) => {
                const usage = getUsageByMethod(method.name);
                const remaining = method.balance - usage;
                const isCreditCard = method.name === "クレジットカード";

                return (
                  <Card
                    key={method.id}
                    className={remaining < 0 ? "border-red-300" : ""}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>{method.name}</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => handleEdit(method)}
                            className="text-sm"
                          >
                            編集
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleDelete(method.id)}
                            className="text-sm"
                          >
                            削除
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">残高</span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(method.balance)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">使用額</span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(usage)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-900 font-medium">
                            残り
                          </span>
                          <span
                            className={`font-bold ${
                              remaining < 0 ? "text-red-600" : "text-gray-900"
                            }`}
                          >
                            {formatCurrency(remaining)}
                          </span>
                        </div>

                        {isCreditCard && method.creditLimit && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">利用限度額</span>
                              <span className="font-semibold text-gray-900">
                                {formatCurrency(method.creditLimit)}
                              </span>
                            </div>
                            {method.billingDate && (
                              <div className="text-sm text-gray-600">
                                引き落とし日: 毎月{method.billingDate}日
                              </div>
                            )}
                            <div className="mt-2 text-sm font-semibold text-blue-900">
                              引き落とし予定額: {formatCurrency(usage)}
                            </div>
                          </div>
                        )}

                        {method.notes && (
                          <div className="mt-2 text-sm text-gray-600">
                            メモ: {method.notes}
                          </div>
                        )}

                        {remaining < 0 && (
                          <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-800">
                            ⚠️ 残高が不足しています
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            {methods.some((m) => m.name === "クレジットカード") && (
              <Card className="bg-yellow-50 border-yellow-300">
                <CardHeader>
                  <CardTitle>クレジットカード引き落とし予定</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(getCreditCardTotal())}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    クレジットカードの引き落としを考慮した合計使用額
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

