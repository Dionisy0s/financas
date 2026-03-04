import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date + "T12:00:00") : date;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatMonthYear(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function formatMonthShort(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    pix: "PIX",
    credit: "Crédito",
    debit: "Débito",
    cash: "Dinheiro",
    boleto: "Boleto",
  };
  return labels[method] ?? method;
}

export function getExpenseTypeLabel(type: string): string {
  return type === "fixed" ? "Fixo" : "Variável";
}

export function getTransactionTypeLabel(type: string): string {
  return type === "income" ? "Entrada" : "Saída";
}

export function percentOf(part: number, total: number): string {
  if (total === 0) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}
