"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ShoppingBag, TrendingUp, QrCode,
  ArrowUpRight, ArrowDownRight, Clock,
  Flame, Leaf, Star,
  Plus, ChefHat, Calendar, UtensilsCrossed, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockTenant } from "@/mock/tenant";
import { mockOrders, mockOrderStats } from "@/mock/orders";
import { mockItems } from "@/mock/menu";
import { formatPrice, minutesSince, statusColors, statusLabels } from "@/lib/utils";
import { RevenueChart, OrderStatusChart } from "@/components/dashboard/overview-charts";
import { useT } from "@/lib/i18n";
import { useLanguageStore } from "@/store/language";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(a: number, b: number) {
  if (b === 0) return 0;
  return Math.round(((a - b) / b) * 100 * 10) / 10;
}

function greet(t: ReturnType<typeof useT>) {
  const h = new Date().getHours();
  if (h < 12) return t.goodMorning;
  if (h < 18) return t.goodAfternoon;
  return t.goodEvening;
}

function getKpis(t: ReturnType<typeof useT>, today: typeof mockOrderStats.today, yesterday: typeof mockOrderStats.yesterday) {
  return [
    { label: t.kpiOrdersToday,   value: today.orders.toString(),   delta: pct(today.orders,  yesterday.orders),  icon: ShoppingBag, color: "text-blue-500",   bg: "bg-blue-500/10"   },
    { label: t.kpiRevenueToday,  value: formatPrice(today.revenue), delta: pct(today.revenue, yesterday.revenue), icon: TrendingUp,  color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: t.kpiAvgOrderValue, value: formatPrice(today.aov),     delta: pct(today.aov,     yesterday.aov),     icon: Star,        color: "text-amber-500",  bg: "bg-amber-500/10"  },
    { label: t.kpiQrScans,       value: "213",                      delta: -4,                                    icon: QrCode,      color: "text-green-500",  bg: "bg-green-500/10"  },
  ];
}

// ─── Static data ──────────────────────────────────────────────────────────────

const { today, yesterday } = mockOrderStats;

const TOP_ITEMS = [
  { id: "i1", orders: 89, revenue: 115711 },
  { id: "i4", orders: 78, revenue:  38922 },
  { id: "i2", orders: 54, revenue:  64746 },
  { id: "i6", orders: 41, revenue:  28659 },
  { id: "i3", orders: 38, revenue:  53162 },
];

const maxOrders = Math.max(...TOP_ITEMS.map((t) => t.orders));

const ORDER_TYPE_LABEL: Record<string, string> = {
  dine_in:    "Dine-in",
  takeaway:   "Takeaway",
  delivery:   "Delivery",
  drive_thru: "Drive-thru",
};

const INITIAL_ALERTS = [
  { id: "a1", dot: "bg-red-500",    message: "Low stock: French Fries (3 portions remaining)",     ago: "5 min ago"  },
  { id: "a2", dot: "bg-yellow-400", message: "New reservation: Ahmed K. — party of 4 at 7:30 PM", ago: "12 min ago" },
  { id: "a3", dot: "bg-green-500",  message: "WhatsApp message limit: 94% used this month",        ago: "1 hr ago"   },
  { id: "a4", dot: "bg-blue-500",   message: "New 5-star review on Google",                        ago: "2 hrs ago"  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const t = useT();
  const lang = useLanguageStore((s) => s.lang);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);

  const KPIS = getKpis(t, today, yesterday);

  const todayDate = new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  function dismissAlert(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greet(t)}, {mockTenant.name}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{todayDate}</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          {t.headerLiveData}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map(({ label, value, delta, icon: Icon, color, bg }) => {
          const up = delta >= 0;
          return (
            <div key={label} className="rounded-xl border border-border bg-card p-4 space-y-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {up
                    ? <ArrowUpRight className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    : <ArrowDownRight className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                  }
                  <span className={`text-xs font-semibold ${up ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {up ? "+" : ""}{delta}%
                  </span>
                  <span className="text-xs text-muted-foreground">{t.vsYesterday}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">{t.revenueChartTitle}</h2>
              <p className="text-xs text-muted-foreground">{t.last7Days}</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-violet-500 inline-block" />
                {t.revenueChartTitle}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-px w-4 border-t-2 border-dashed border-cyan-500 inline-block" />
                {t.navOrders}
              </span>
            </div>
          </div>
          <RevenueChart />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold">{t.todaysOrdersTitle}</h2>
            <p className="text-xs text-muted-foreground">{t.byStatus}</p>
          </div>
          <OrderStatusChart />
        </div>
      </div>

      {/* Live orders + Top items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">{t.liveOrdersTitle}</h2>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {mockOrders.filter((o) => !["completed", "cancelled"].includes(o.status)).length}
              </span>
            </div>
            <a href="/dashboard/orders" className="text-xs text-primary hover:underline">
              {t.viewAll}
            </a>
          </div>
          <div className="divide-y divide-border">
            {mockOrders.map((order) => {
              const mins = minutesSince(order.created_at);
              const agingColor =
                mins >= 15 ? "text-red-500" :
                mins >= 10 ? "text-orange-500" :
                mins >= 5  ? "text-yellow-600 dark:text-yellow-400" :
                             "text-muted-foreground";
              return (
                <div key={order.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{order.order_number}</span>
                      <span className="text-xs text-muted-foreground">
                        {order.table_number ?? ORDER_TYPE_LABEL[order.order_type]}
                      </span>
                      {order.customer_name && (
                        <span className="text-xs text-muted-foreground truncate">· {order.customer_name}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                    <div suppressHydrationWarning className={`flex items-center gap-1 text-[11px] font-medium ${agingColor}`}>
                      <Clock className="h-3 w-3" />
                      {mins}m
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold">{t.topItemsTitle}</h2>
              <p className="text-xs text-muted-foreground">{t.thisWeekByOrders}</p>
            </div>
            <a href="/dashboard/menu" className="text-xs text-primary hover:underline">
              {t.viewMenuLink}
            </a>
          </div>
          <div className="divide-y divide-border">
            {TOP_ITEMS.map(({ id, orders, revenue }, rank) => {
              const item = mockItems.find((i) => i.id === id);
              if (!item) return null;
              const barWidth = Math.round((orders / maxOrders) * 100);
              const hasVegan = item.dietary.includes("vegan");
              const isSpicy = item.tags.includes("spicy");
              const isPopular = item.tags.includes("popular") || item.tags.includes("bestseller");
              return (
                <div key={id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="text-xs font-bold text-muted-foreground/60 w-4 flex-shrink-0 text-center">
                    {rank + 1}
                  </span>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      {isPopular && <Flame className="h-3 w-3 flex-shrink-0 text-orange-500" />}
                      {hasVegan  && <Leaf className="h-3 w-3 flex-shrink-0 text-green-500" />}
                      {isSpicy   && <span className="text-[10px] text-red-500 font-bold flex-shrink-0">HOT</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60" style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-end space-y-0.5">
                    <p className="text-sm font-semibold">{orders} {t.navOrders.toLowerCase()}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(revenue)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button
          variant="outline"
          className="flex items-center gap-2 h-auto py-4 rounded-xl justify-start"
          onClick={() => toast.success(t.newOrder)}
        >
          <Plus className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-medium">{t.newOrder}</span>
        </Button>
        <Link
          href="/dashboard/kds"
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-4 text-sm font-medium hover:shadow-sm transition-all hover:-translate-y-0.5 text-violet-600 dark:text-violet-400"
        >
          <ChefHat className="h-4 w-4 flex-shrink-0" />
          {t.viewKitchen}
        </Link>
        <Link
          href="/dashboard/reservations"
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-4 text-sm font-medium hover:shadow-sm transition-all hover:-translate-y-0.5 text-amber-600 dark:text-amber-400"
        >
          <Calendar className="h-4 w-4 flex-shrink-0" />
          {t.todaysReservations}
        </Link>
        <Link
          href="/dashboard/menu"
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-4 text-sm font-medium hover:shadow-sm transition-all hover:-translate-y-0.5 text-green-600 dark:text-green-400"
        >
          <UtensilsCrossed className="h-4 w-4 flex-shrink-0" />
          {t.addMenuItem}
        </Link>
      </div>

      {/* Recent alerts */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">{t.recentAlertsTitle}</h2>
            <span className="text-xs text-muted-foreground">{alerts.length} {t.activeCount}</span>
          </div>
          <div className="divide-y divide-border">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${alert.dot}`} />
                <p className="flex-1 min-w-0 text-sm text-foreground truncate">
                  {alert.message}
                </p>
                <span className="text-xs text-muted-foreground flex-shrink-0 me-2">
                  {alert.ago}
                </span>
                <button
                  type="button"
                  onClick={() => dismissAlert(alert.id)}
                  className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Dismiss alert"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
