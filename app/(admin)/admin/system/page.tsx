"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Mock data ────────────────────────────────────────────────────────────────

// API latency — 24 hours, 3 percentile lines
const latencyData = Array.from({ length: 24 }, (_, i) => {
  // introduce a couple of spikes
  const spike = i === 7 || i === 18;
  return {
    hour: `${String(i).padStart(2, "0")}:00`,
    p50:  spike ? 95  + Math.round(Math.random() * 30)  : 42  + Math.round(Math.random() * 12),
    p95:  spike ? 420 + Math.round(Math.random() * 80)  : 170 + Math.round(Math.random() * 30),
    p99:  spike ? 780 + Math.round(Math.random() * 120) : 300 + Math.round(Math.random() * 50),
  };
});

// Error rate — 24 hours
const errorRateData = Array.from({ length: 24 }, (_, i) => {
  const spike = i === 7 || i === 18;
  return {
    hour:  `${String(i).padStart(2, "0")}:00`,
    rate:  spike
      ? parseFloat((0.10 + Math.random() * 0.05).toFixed(3))
      : parseFloat((0.02 + Math.random() * 0.04).toFixed(3)),
  };
});

// ─── Services ─────────────────────────────────────────────────────────────────

const SERVICES = [
  "API",
  "Database",
  "WhatsApp Gateway",
  "Storage",
  "Email",
] as const;

// ─── Queues ───────────────────────────────────────────────────────────────────

const QUEUES = [
  { label: "Email queue",        depth: 142  },
  { label: "WhatsApp queue",     depth: 891  },
  { label: "Order webhooks",     depth: 47   },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SystemHealthPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">System Health</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Live infrastructure metrics and incident history.</p>
      </div>

      {/* Service status cards — 5 col */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {SERVICES.map((svc) => (
          <Card key={svc}>
            <CardContent className="flex flex-col items-center gap-1.5 py-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <p className="text-xs font-medium text-center">{svc}</p>
              <span className="inline-flex h-4 items-center rounded-full bg-emerald-100 px-2 text-[10px] font-medium text-emerald-700">
                Operational
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* API latency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">API Latency — Last 24h (ms)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={latencyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} width={36} unit="ms" />
                <Tooltip formatter={(v) => `${Number(v)}ms`} />
                <Line type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={1.5} dot={false} name="p50" />
                <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="p95" />
                <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={1.5} dot={false} name="p99" />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-full bg-emerald-500 inline-block" /> p50 ~45ms</span>
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-full bg-amber-400 inline-block" /> p95 ~180ms</span>
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-full bg-red-500 inline-block" /> p99 ~320ms</span>
            </div>
          </CardContent>
        </Card>

        {/* Error rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Error Rate — Last 24h (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={errorRateData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} width={40} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <Tooltip formatter={(v) => `${(Number(v) * 100).toFixed(2)}%`} />
                <Area type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2} fill="url(#errGrad)" name="Error rate" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Queue depth cards */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Queue Depths</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {QUEUES.map((q) => (
            <Card key={q.label}>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">{q.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tracking-tight">{q.depth.toLocaleString()}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">pending jobs</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Incident history */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Incident History</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-10">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="text-sm font-medium">No incidents in the last 30 days</p>
            <p className="text-xs text-muted-foreground">All systems have been operating normally.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
