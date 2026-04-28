import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format price from minor units (cents/paisa) to display string */
export function formatPrice(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

/** Time elapsed in human-readable form */
export function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

/** Minutes elapsed since date */
export function minutesSince(dateStr: string): number {
  return Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Generate a random ID */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const roleLabels: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  kitchen: "Kitchen",
  waiter: "Waiter",
  cashier: "Cashier",
  read_only: "Read-only",
};

export const planLabels: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  business: "Business",
};

export const statusLabels: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const statusColors: Record<string, string> = {
  pending:          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted:         "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400",
  preparing:        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  ready:            "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
  out_for_delivery: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  completed:        "bg-zinc-100   text-zinc-600   dark:bg-zinc-800      dark:text-zinc-400",
  cancelled:        "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400",
};
