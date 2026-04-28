"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type WAStatus   = "connected" | "paused" | "banned" | "pending";
type WABilling  = "direct" | "managed";

interface WAAccount {
  id: string;
  tenant: string;
  phone: string;
  status: WAStatus;
  msgs30d: number;
  cost30d: number;
  billing: WABilling;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_WA: WAAccount[] = [
  { id: "wa1",  tenant: "Spice House Dubai",       phone: "+971 50 123 4567",  status: "connected", msgs30d: 14230, cost30d: 18.40, billing: "managed" },
  { id: "wa2",  tenant: "Ramen HQ Tokyo",          phone: "+81 90 1234 5678",  status: "connected", msgs30d: 9812,  cost30d: 12.75, billing: "direct"  },
  { id: "wa3",  tenant: "Casa Tapas Barcelona",    phone: "+34 612 345 678",   status: "paused",    msgs30d: 2100,  cost30d: 2.73,  billing: "managed" },
  { id: "wa4",  tenant: "Cloud Kitchen Karachi",   phone: "+92 300 1234567",   status: "pending",   msgs30d: 0,     cost30d: 0,     billing: "direct"  },
  { id: "wa5",  tenant: "Pizza Planet London",     phone: "+44 7700 900123",   status: "banned",    msgs30d: 0,     cost30d: 0,     billing: "managed" },
  { id: "wa6",  tenant: "Dim Sum Palace HK",       phone: "+852 9123 4567",    status: "connected", msgs30d: 7654,  cost30d: 9.95,  billing: "direct"  },
  { id: "wa7",  tenant: "Taco Bell Dubai",         phone: "+971 55 987 6543",  status: "connected", msgs30d: 5302,  cost30d: 6.89,  billing: "managed" },
  { id: "wa8",  tenant: "Curry Leaf Mumbai",       phone: "+91 98765 43210",   status: "paused",    msgs30d: 3110,  cost30d: 4.04,  billing: "direct"  },
  { id: "wa9",  tenant: "Burger Co Riyadh",        phone: "+966 55 123 4567",  status: "connected", msgs30d: 6870,  cost30d: 8.93,  billing: "managed" },
  { id: "wa10", tenant: "Le Bistro Paris",         phone: "+33 6 12 34 56 78", status: "connected", msgs30d: 4210,  cost30d: 5.47,  billing: "direct"  },
  { id: "wa11", tenant: "Spice Chain Lagos",       phone: "+234 803 123 4567", status: "banned",    msgs30d: 0,     cost30d: 0,     billing: "managed" },
  { id: "wa12", tenant: "Sushi Mori Vancouver",    phone: "+1 604 123 4567",   status: "connected", msgs30d: 3980,  cost30d: 5.17,  billing: "direct"  },
];

const PROBLEMATIC = MOCK_WA.filter((w) => w.status === "banned" || w.status === "paused");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<WAStatus, string> = {
  connected: "bg-emerald-100 text-emerald-700",
  paused:    "bg-yellow-100 text-yellow-700",
  banned:    "bg-red-100 text-red-700",
  pending:   "bg-blue-100 text-blue-700",
};

const STATUS_LABELS: Record<WAStatus, string> = {
  connected: "Connected",
  paused:    "Paused",
  banned:    "Banned",
  pending:   "Pending",
};

// ─── Row actions ──────────────────────────────────────────────────────────────

function WAActions({
  account,
  onStatusChange,
}: {
  account: WAAccount;
  onStatusChange: (id: string, s: WAStatus) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors"
          />
        }
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => toast.info(`Viewing ${account.tenant}`)}>
            View details
          </DropdownMenuItem>
          {account.status === "connected" && (
            <DropdownMenuItem onSelect={() => onStatusChange(account.id, "paused")}>
              Pause
            </DropdownMenuItem>
          )}
          {account.status === "paused" && (
            <DropdownMenuItem onSelect={() => onStatusChange(account.id, "connected")}>
              Resume
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => toast.info(`Opening investigation for ${account.tenant}`)}>
            Investigate
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Danger</DropdownMenuLabel>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onStatusChange(account.id, "pending")}
          >
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WhatsAppPlatformPage() {
  const [accounts, setAccounts] = useState<WAAccount[]>(MOCK_WA);

  function handleStatusChange(id: string, status: WAStatus) {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    const account = accounts.find((a) => a.id === id);
    if (account) {
      toast.success(`${account.tenant} status changed to ${STATUS_LABELS[status]}.`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">WhatsApp Platform</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Monitor all connected WhatsApp accounts.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Connected Accounts", value: "1,247"    },
          { label: "Messages Today",     value: "89,231"   },
          { label: "Cost Today",         value: "$142.50"  },
          { label: "Issues",             value: String(PROBLEMATIC.length + 4) },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert banner */}
      {PROBLEMATIC.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {PROBLEMATIC.length} accounts require attention
              </p>
              <ul className="mt-1 space-y-0.5">
                {PROBLEMATIC.map((a) => (
                  <li key={a.id} className="text-xs text-amber-700 dark:text-amber-400">
                    <span className="font-medium">{a.tenant}</span> — {a.phone} —{" "}
                    <span className={cn("font-semibold", a.status === "banned" ? "text-red-600" : "text-yellow-700")}>
                      {STATUS_LABELS[a.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl ring-1 ring-foreground/10 overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Tenant</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Phone</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Msgs / 30d</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Cost / 30d</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Billing</th>
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{acc.tenant}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{acc.phone}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-xs font-medium", STATUS_STYLES[acc.status])}>
                      {STATUS_LABELS[acc.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{acc.msgs30d.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {acc.cost30d === 0 ? "—" : `$${acc.cost30d.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex h-5 items-center rounded-full px-2 text-xs font-medium",
                      acc.billing === "managed" ? "bg-violet-100 text-violet-700" : "bg-zinc-100 text-zinc-600"
                    )}>
                      {acc.billing.charAt(0).toUpperCase() + acc.billing.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <WAActions account={acc} onStatusChange={handleStatusChange} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          {accounts.length} accounts shown
        </div>
      </div>
    </div>
  );
}
