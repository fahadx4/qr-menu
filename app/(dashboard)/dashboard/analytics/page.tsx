"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { mockOrderStats } from "@/mock/orders";
import { mockBranches } from "@/mock/tenant";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Static data ──────────────────────────────────────────────────────────────

const revenueData = [
  { day: "Mon", revenue: 142300, orders: 34 },
  { day: "Tue", revenue: 168900, orders: 41 },
  { day: "Wed", revenue: 155200, orders: 37 },
  { day: "Thu", revenue: 201400, orders: 48 },
  { day: "Fri", revenue: 234500, orders: 56 },
  { day: "Sat", revenue: 289000, orders: 69 },
  { day: "Sun", revenue: 198340, orders: 47 },
];

const orderStatusData = [
  { name: "Completed",    value: 38, color: "#22c55e" },
  { name: "Preparing",   value: 5,  color: "#f97316" },
  { name: "Ready",       value: 2,  color: "#3b82f6" },
  { name: "Accepted",    value: 1,  color: "#6366f1" },
  { name: "Pending",     value: 1,  color: "#eab308" },
];

const orderTypeData = [
  { name: "Dine-in",    orders: 21 },
  { name: "Takeaway",   orders: 14 },
  { name: "Delivery",   orders: 9  },
  { name: "Drive-thru", orders: 3  },
];

const topItems = [
  { name: "Classic Smash Burger",  orders: 89, revenue: 115711 },
  { name: "Crispy Fries",          orders: 78, revenue: 38922  },
  { name: "Crispy Chicken Burger", orders: 54, revenue: 64746  },
  { name: "Classic Milkshake",     orders: 41, revenue: 28659  },
  { name: "Vegan Beyond Burger",   orders: 38, revenue: 53162  },
];

const segments = [
  { name: "Returning", value: 67, color: "#7C3AED" },
  { name: "New",       value: 33, color: "#06b6d4" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8..22

// Deterministic-ish heatmap (avoid hydration mismatch with a seeded pattern)
function buildHeatmap() {
  return DAYS.map((_, di) =>
    HOURS.map((hour) => {
      const isLunch   = hour >= 12 && hour <= 14;
      const isDinner  = hour >= 19 && hour <= 21;
      const base      = isLunch || isDinner ? 0.75 : 0.18;
      const weekend   = di === 5 || di === 6 ? 1.3 : 1;
      // Deterministic variation using day+hour as seed
      const noise = ((di * 17 + hour * 7) % 10) / 10;
      return Math.min(1, base * weekend * (0.65 + noise * 0.55));
    })
  );
}

const heatmap = buildHeatmap();

// ─── Custom Tooltips ──────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-sm">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-muted-foreground">
        Revenue:{" "}
        <span className="text-foreground font-medium">
          {formatPrice(payload[0]?.value ?? 0)}
        </span>
      </p>
      <p className="text-muted-foreground">
        Orders:{" "}
        <span className="text-foreground font-medium">
          {payload[1]?.value ?? 0}
        </span>
      </p>
    </div>
  );
}

function StatusTooltip({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-sm">
      <p className="font-medium">{d.name}</p>
      <p className="text-muted-foreground">{d.value} orders</p>
    </div>
  );
}

function SegmentTooltip({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-sm">
      <p className="font-medium">{d.name}</p>
      <p className="text-muted-foreground">{d.value}%</p>
    </div>
  );
}

function ItemTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-sm">
      <p className="font-semibold mb-1 max-w-[180px]">{label}</p>
      <p className="text-muted-foreground">
        Orders: <span className="text-foreground font-medium">{payload[0]?.value}</span>
      </p>
    </div>
  );
}

// ─── KPI Delta Badge ──────────────────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number }) {
  const up = delta >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        up
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      )}
    >
      {up ? (
        <TrendingUp className="size-3" />
      ) : (
        <TrendingDown className="size-3" />
      )}
      {up ? "+" : ""}{delta}%
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("today");
  const [branch, setBranch]       = useState("all");

  const { today, yesterday } = mockOrderStats;

  function pct(a: number, b: number) {
    if (b === 0) return 0;
    return Math.round(((a - b) / b) * 1000) / 10;
  }

  const kpis = useMemo(() => [
    {
      label: "Total Orders",
      value: today.orders.toString(),
      delta: pct(today.orders, yesterday.orders),
      sub:   "vs yesterday",
    },
    {
      label: "Revenue",
      value: formatPrice(today.revenue),
      delta: pct(today.revenue, yesterday.revenue),
      sub:   "vs yesterday",
    },
    {
      label: "Avg Order Value",
      value: formatPrice(today.aov),
      delta: pct(today.aov, yesterday.aov),
      sub:   "vs yesterday",
    },
    {
      label: "New Customers",
      value: "11",
      delta: 22,
      sub:   "vs yesterday",
    },
  ], [today, yesterday]);

  const statusTotal = orderStatusData.reduce((s, d) => s + d.value, 0);
  const segmentTotal = segments.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Performance overview for your restaurant
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range */}
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as string)}>
            <SelectTrigger className="min-w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last_7">Last 7 days</SelectItem>
              <SelectItem value="last_30">Last 30 days</SelectItem>
              <SelectItem value="this_month">This month</SelectItem>
              <SelectItem value="last_month">Last month</SelectItem>
              <SelectItem value="last_90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          {/* Branch */}
          <Select value={branch} onValueChange={(v) => setBranch(v as string)}>
            <SelectTrigger className="min-w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {mockBranches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Section 1: KPI cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, delta, sub }) => (
          <Card key={label}>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <DeltaBadge delta={delta} />
                <span className="text-xs text-muted-foreground">{sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Section 2: Revenue chart ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Revenue</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Last 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-violet-500 inline-block" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-px w-4 border-t-2 border-dashed border-cyan-500 inline-block" />
                Orders
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={revenueData}
              margin={{ top: 4, right: 4, bottom: 0, left: -8 }}
            >
              <defs>
                <linearGradient id="analyticsRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border) / 0.6)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="revenue"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 100).toFixed(0)}`}
              />
              <YAxis
                yAxisId="orders"
                orientation="right"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "#7C3AED", strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="#7C3AED"
                strokeWidth={2}
                fill="url(#analyticsRevGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#7C3AED", strokeWidth: 0 }}
              />
              <Area
                yAxisId="orders"
                type="monotone"
                dataKey="orders"
                stroke="#06b6d4"
                strokeWidth={1.5}
                fill="none"
                dot={false}
                activeDot={{ r: 3, fill: "#06b6d4", strokeWidth: 0 }}
                strokeDasharray="4 4"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Section 3: Orders breakdown + Peak hours ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2/3: Status donut + Type bar */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Order status donut */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
              <p className="text-xs text-muted-foreground">Today&apos;s distribution</p>
            </CardHeader>
            <CardContent>
              <div className="relative flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={78}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {orderStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<StatusTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
                  style={{ marginTop: -8 }}
                >
                  <p className="text-2xl font-bold leading-none">{statusTotal}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">orders</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 w-full">
                  {orderStatusData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ background: d.color }}
                      />
                      <span className="text-xs text-muted-foreground truncate">
                        {d.name}
                      </span>
                      <span className="ml-auto text-xs font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order type bar */}
          <Card>
            <CardHeader>
              <CardTitle>Order Type</CardTitle>
              <p className="text-xs text-muted-foreground">Today&apos;s breakdown</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={orderTypeData}
                  margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
                  barSize={28}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border) / 0.6)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                    formatter={(value) => [value, "Orders"]}
                  />
                  <Bar dataKey="orders" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right 1/3: Peak hours heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
            <p className="text-xs text-muted-foreground">Order volume by day &amp; hour</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {/* Hour labels */}
              <div className="flex mb-1 ml-8">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="flex-1 text-center text-[9px] text-muted-foreground"
                    style={{ minWidth: 14 }}
                  >
                    {h}
                  </div>
                ))}
              </div>
              {/* Grid rows */}
              {DAYS.map((day, di) => (
                <div key={day} className="flex items-center gap-0.5 mb-0.5">
                  <span className="text-[9px] text-muted-foreground w-7 shrink-0 text-right pr-1">
                    {day}
                  </span>
                  {HOURS.map((hour, hi) => {
                    const intensity = heatmap[di][hi];
                    return (
                      <div
                        key={hour}
                        title={`${day} ${hour}:00 — ${Math.round(intensity * 100)}%`}
                        className="rounded-sm flex-1"
                        style={{
                          minWidth: 14,
                          height: 14,
                          backgroundColor: `rgba(124,58,237,${intensity.toFixed(2)})`,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
              {/* Intensity legend */}
              <div className="flex items-center gap-1.5 mt-3">
                <span className="text-[9px] text-muted-foreground">Low</span>
                {[0.08, 0.2, 0.4, 0.6, 0.85].map((op) => (
                  <div
                    key={op}
                    className="rounded-sm"
                    style={{
                      width: 14,
                      height: 14,
                      backgroundColor: `rgba(124,58,237,${op})`,
                    }}
                  />
                ))}
                <span className="text-[9px] text-muted-foreground">High</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 4: Menu performance ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Top Menu Items</CardTitle>
          <p className="text-xs text-muted-foreground">By orders this week</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={topItems}
              layout="vertical"
              margin={{ top: 0, right: 20, bottom: 0, left: 8 }}
              barSize={18}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border) / 0.6)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={160}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ItemTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
              <Bar dataKey="orders" fill="#7C3AED" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Section 5: Customer segments ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* New vs Returning donut */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
            <p className="text-xs text-muted-foreground">New vs returning</p>
          </CardHeader>
          <CardContent>
            <div className="relative flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={segments}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {segments.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<SegmentTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
                style={{ marginTop: -8 }}
              >
                <p className="text-2xl font-bold leading-none">{segmentTotal}%</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">split</p>
              </div>
              <div className="flex items-center gap-6 mt-2">
                {segments.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span className="text-sm text-muted-foreground">{d.name}</span>
                    <span className="text-sm font-semibold">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Segment breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Segment Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">Customer lifecycle groups</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              {[
                {
                  label: "New",
                  desc: "1 order",
                  count: 11,
                  color: "bg-cyan-500",
                  pct: 21,
                },
                {
                  label: "Regular",
                  desc: "2–5 orders",
                  count: 28,
                  color: "bg-violet-500",
                  pct: 54,
                },
                {
                  label: "VIP",
                  desc: "6+ orders",
                  count: 8,
                  color: "bg-amber-500",
                  pct: 15,
                },
                {
                  label: "Lapsed",
                  desc: "90+ days inactive",
                  count: 5,
                  color: "bg-zinc-400",
                  pct: 10,
                },
              ].map(({ label, desc, count, color, pct: p }) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", color)} />
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground text-xs">({desc})</span>
                    </div>
                    <span className="font-semibold">{count} customers</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", color)}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Export ───────────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => toast.info("CSV export coming soon")}
        >
          <Download className="size-4" />
          Export report
        </Button>
      </div>
    </div>
  );
}
