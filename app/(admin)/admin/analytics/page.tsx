"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// ─── Mock data ────────────────────────────────────────────────────────────────

// 30 days DAU / MAU
const dauMauData = Array.from({ length: 30 }, (_, i) => ({
  day:  `Apr ${i + 1}`,
  dau:  Math.round(35000 + Math.random() * 8000 + i * 200),
  mau:  Math.round(140000 + Math.random() * 4000 + i * 100),
}));

// 12 months new signups
const signupsData = [
  { month: "May",  signups: 1820 },
  { month: "Jun",  signups: 2140 },
  { month: "Jul",  signups: 2390 },
  { month: "Aug",  signups: 2105 },
  { month: "Sep",  signups: 2560 },
  { month: "Oct",  signups: 2980 },
  { month: "Nov",  signups: 3210 },
  { month: "Dec",  signups: 2870 },
  { month: "Jan",  signups: 3450 },
  { month: "Feb",  signups: 3780 },
  { month: "Mar",  signups: 4120 },
  { month: "Apr",  signups: 4470 },
];

// 12 months MRR
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

// Plan distribution
const planData = [
  { name: "Free",     tenants: 28400 },
  { name: "Starter",  tenants: 13200 },
  { name: "Pro",      tenants:  7100 },
  { name: "Business", tenants:  1547 },
];

// Top 5 by revenue
const topRevenue = [
  { tenant: "Spice Chain Lagos",       mrr: "$299",  total: "$3,588"  },
  { tenant: "Spice House Dubai",       mrr: "$299",  total: "$3,290"  },
  { tenant: "Mediterranean Mezze NY",  mrr: "$99",   total: "$1,980"  },
  { tenant: "Ramen HQ Tokyo",          mrr: "$99",   total: "$1,782"  },
  { tenant: "Curry Leaf Mumbai",       mrr: "$99",   total: "$1,683"  },
];

// Top 5 by orders
const topOrders = [
  { tenant: "Cloud Kitchen Karachi",   orders30d: 12847, ordersTotal: "154k" },
  { tenant: "Spice House Dubai",       orders30d: 10234, ordersTotal: "112k" },
  { tenant: "Burger Co Riyadh",        orders30d:  9821, ordersTotal: "87k"  },
  { tenant: "Spice Chain Lagos",       orders30d:  9102, ordersTotal: "98k"  },
  { tenant: "Ramen HQ Tokyo",          orders30d:  8740, ordersTotal: "76k"  },
];

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtK(v: number | string) {
  const n = Number(v);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function fmtMrr(v: number | string) {
  const n = Number(v);
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("last_30");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Platform Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Aggregated metrics across all tenants.</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as string)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last_7">Last 7 days</SelectItem>
            <SelectItem value="last_30">Last 30 days</SelectItem>
            <SelectItem value="last_90">Last 90 days</SelectItem>
            <SelectItem value="ytd">Year to date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* 1 — DAU / MAU */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">DAU / MAU — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dauMauData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 10 }} width={40} />
                <Tooltip formatter={(v) => fmtK(v as number)} />
                <Line type="monotone" dataKey="dau" stroke="#7C3AED" strokeWidth={2} dot={false} name="DAU" />
                <Line type="monotone" dataKey="mau" stroke="#3b82f6" strokeWidth={2} dot={false} name="MAU" />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-full bg-violet-500 inline-block" /> DAU</span>
              <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-full bg-blue-500 inline-block" /> MAU</span>
            </div>
          </CardContent>
        </Card>

        {/* 2 — New signups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">New Signups — Last 12 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={signupsData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 10 }} width={40} />
                <Tooltip formatter={(v) => fmtK(v as number)} />
                <Bar dataKey="signups" fill="#7C3AED" radius={[3, 3, 0, 0]} name="Signups" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3 — MRR */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">MRR — Last 12 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={mrrData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={fmtMrr} tick={{ fontSize: 10 }} width={52} />
                <Tooltip formatter={(v) => fmtMrr(v as number)} />
                <Area type="monotone" dataKey="mrr" stroke="#7C3AED" strokeWidth={2} fill="url(#mrrGrad2)" name="MRR" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4 — Plan distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={planData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 10 }} width={40} />
                <Tooltip formatter={(v) => fmtK(v as number)} />
                <Bar dataKey="tenants" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Tenants" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Top 5 by revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top 5 Tenants by Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Tenant</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">MRR</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topRevenue.map((r, i) => (
                  <tr key={r.tenant} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{r.tenant}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.mrr}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Top 5 by orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top 5 Tenants by Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Tenant</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">30d</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topOrders.map((r, i) => (
                  <tr key={r.tenant} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{r.tenant}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.orders30d.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.ordersTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
