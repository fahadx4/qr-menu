"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ─── Revenue chart ────────────────────────────────────────────────────────────

const revenueData = [
  { day: "Mon", revenue: 142.3, orders: 34 },
  { day: "Tue", revenue: 168.9, orders: 41 },
  { day: "Wed", revenue: 155.2, orders: 37 },
  { day: "Thu", revenue: 201.4, orders: 48 },
  { day: "Fri", revenue: 234.5, orders: 56 },
  { day: "Sat", revenue: 289.0, orders: 69 },
  { day: "Today", revenue: 198.3, orders: 47 },
];

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-sm">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-muted-foreground">
        Revenue: <span className="text-foreground font-medium">${payload[0]?.value?.toFixed(0)}</span>
      </p>
      <p className="text-muted-foreground">
        Orders: <span className="text-foreground font-medium">{payload[1]?.value}</span>
      </p>
    </div>
  );
}

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.6)" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
        <RechartsTooltip content={<RevenueTooltip />} cursor={{ stroke: "#7C3AED", strokeWidth: 1, strokeDasharray: "4 4" }} />
        <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: "#7C3AED", strokeWidth: 0 }} />
        <Area type="monotone" dataKey="orders" stroke="#06b6d4" strokeWidth={1.5} fill="none" dot={false} activeDot={{ r: 3, fill: "#06b6d4", strokeWidth: 0 }} strokeDasharray="4 4" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Order status donut ───────────────────────────────────────────────────────

const statusData = [
  { name: "Completed", value: 38, color: "#22c55e" },
  { name: "Preparing", value: 5,  color: "#f97316" },
  { name: "Ready",     value: 2,  color: "#3b82f6" },
  { name: "Accepted",  value: 1,  color: "#6366f1" },
  { name: "Pending",   value: 1,  color: "#eab308" },
];

function StatusTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-sm">
      <p className="font-medium">{d.name}</p>
      <p className="text-muted-foreground">{d.value} orders</p>
    </div>
  );
}

export function OrderStatusChart() {
  const total = statusData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="relative flex flex-col items-center">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={statusData}
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {statusData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip content={<StatusTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ marginTop: -10 }}>
        <p className="text-2xl font-bold leading-none">{total}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">orders</p>
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 w-full px-2">
        {statusData.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-xs text-muted-foreground truncate">{d.name}</span>
            <span className="ml-auto text-xs font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
