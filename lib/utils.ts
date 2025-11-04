import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 金額をフォーマット（例: 1000 -> "¥1,000"）
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount);
}

// 日付をフォーマット（例: "2024-01-15" -> "2024年1月15日"）
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

// 月をフォーマット（例: "2024-01" -> "2024年1月"）
export function formatMonth(monthString: string): string {
  const [year, month] = monthString.split("-");
  return `${year}年${parseInt(month)}月`;
}

