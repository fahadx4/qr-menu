"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Mock data ────────────────────────────────────────────────────────────────

const mrrData = [
  { month: "May",  mrr: 610000 },
  { month: "Jun",  mrr: 648000 },
  { month: "Jul",  mrr: 692000 },
  { month: "Aug",  mrr: 721000 },
  { month: "Sep",  mrr: 755000 },
  { month: "Oct",  mrr: 788000 },
  { month: "Nov",  mrr: 812000 },
  { month: "Dec",  mrr: 831000 },
  { month: "Jan",  mrr: 849000 },
  { month: "Feb",  mrr: 862000 },
  { month: "Mar",  mrr: 876000 },
  { month: "Apr",  mrr: 892000 },
];

const planData = [
  { name: "Free",     value: 28400, color: "#94a3b8" },
  { name: "Starter",  value: 13200, color: "#3b82f6" },
  { name: "Pro",      value:  7100, color: "#7C3AED" },
  { name: "Business", value:  1547, color: "#f59e0b" },
];

const activity = [
  "New signup: Ahmed Al-Rashid (Dubai) — Pro trial",
  "Upgrade: Spice Chain (Lagos) Free → Business",
  "WhatsApp banned: 1 account (resolved)",
  "New signup: Maria García (Barcelona) — Starter trial",
  "Churn: Pizza Planet (London) cancelled Starter",
  "Upgrade: Ramen House (Tokyo) Starter → Pro",
  "Payment failed: Taco Bell Dubai — retrying",
  "New signup: Cloud Kitchen Co (Karachi) — Free",
  "Support ticket: KDS not loading — P2",
  "Milestone: 50,000 active restaurants reached 🎉",
];

// ─── KPI cards ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  change: string;
  up: boolean;
}

function KpiCard({ label, value, change, up }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <div className={cn("mt-1 flex items-center gap-1 text-xs font-medium", up ? "text-emerald-600" : "text-red-500")}>
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {change}
        </div>
      </CardContent>
    </Card>
  );
}

const KPI_DATA: KpiCardProps[] = [
  { label: "Active Restaurants",  value: "50,247",   change: "▲ 3.2% MoM",  up: true  },
  { label: "Monthly Revenue",     value: "$892K",     change: "▲ 8.1% MoM",  up: true  },
  { label: "Total Orders / Day",  value: "127,423",   change: "▲ 5.4%",      up: true  },
  { label: "New Signups Today",   value: "47",        change: "▲ 12%",       up: true  },
  { label: "WhatsApp Msgs / Day", value: "89,231",    change: "▲ 2.1%",      up: true  },
  { label: "Churn Rate",          value: "2.1%",      change: "▼ 0.3%",      up: false },
];

// ─── MRR formatter ───────────────────────────────────────────────────────────

function fmtMrr(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const [dateRange, setDateRange] = useState("last_30");

  const totalTenants = planData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Live snapshot of the QR Menu platform.</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as string)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="this_week">This week</SelectItem>
            <SelectItem value="this_month">This month</SelectItem>
            <SelectItem value="last_30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {KPI_DATA.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Charts + activity feed */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* MRR area chart (spans 2 cols) */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Platform MRR — Last 12 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={mrrData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtMrr} tick={{ fontSize: 11 }} width={52} />
                <Tooltip formatter={(v) => fmtMrr(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="#7C3AED"
                  strokeWidth={2}
                  fill="url(#mrrGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right column: plan donut + activity */}
        <div className="flex flex-col gap-6">
          {/* Plan distribution donut */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <PieChart width={120} height={120}>
                  <Pie
                    data={planData}
                    cx={55}
                    cy={55}
                    innerRadius={32}
                    outerRadius={52}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {planData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="flex flex-col gap-1.5 text-xs">
                  {planData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="ml-auto font-medium">
                        {((d.value / totalTenants) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity feed */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {activity.map((item, i) => (
                  <li key={i} className="flex gap-2 text-xs leading-snug">
                    <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-500" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
