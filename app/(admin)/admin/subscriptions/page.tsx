"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Plan   = "free" | "starter" | "pro" | "business";
type SubStatus = "active" | "trial" | "past_due" | "cancelled";

interface Subscription {
  id: string;
  tenant: string;
  plan: Plan;
  status: SubStatus;
  mrr: number;
  nextRenewal: string;
  paymentMethod: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SUBS: Subscription[] = [
  { id: "s1",  tenant: "Spice House Dubai",       plan: "business", status: "active",    mrr: 299, nextRenewal: "May 1, 2026",   paymentMethod: "Visa •••• 4242" },
  { id: "s2",  tenant: "Ramen HQ Tokyo",          plan: "pro",      status: "active",    mrr: 99,  nextRenewal: "May 3, 2026",   paymentMethod: "Mastercard •••• 1234" },
  { id: "s3",  tenant: "Casa Tapas Barcelona",    plan: "starter",  status: "trial",     mrr: 29,  nextRenewal: "May 7, 2026",   paymentMethod: "—" },
  { id: "s4",  tenant: "Cloud Kitchen Karachi",   plan: "free",     status: "active",    mrr: 0,   nextRenewal: "—",             paymentMethod: "—" },
  { id: "s5",  tenant: "Pizza Planet London",     plan: "starter",  status: "cancelled", mrr: 0,   nextRenewal: "—",             paymentMethod: "Visa •••• 8888" },
  { id: "s6",  tenant: "Dim Sum Palace HK",       plan: "pro",      status: "past_due",  mrr: 99,  nextRenewal: "Apr 20, 2026",  paymentMethod: "UnionPay •••• 5566" },
  { id: "s7",  tenant: "Taco Bell Dubai",         plan: "business", status: "past_due",  mrr: 299, nextRenewal: "Apr 18, 2026",  paymentMethod: "Visa •••• 3311" },
  { id: "s8",  tenant: "Curry Leaf Mumbai",       plan: "pro",      status: "active",    mrr: 99,  nextRenewal: "May 12, 2026",  paymentMethod: "RuPay •••• 7721" },
  { id: "s9",  tenant: "Burger Co Riyadh",        plan: "starter",  status: "active",    mrr: 29,  nextRenewal: "May 5, 2026",   paymentMethod: "Mastercard •••• 9900" },
  { id: "s10", tenant: "Le Bistro Paris",         plan: "pro",      status: "trial",     mrr: 99,  nextRenewal: "May 9, 2026",   paymentMethod: "—" },
  { id: "s11", tenant: "Spice Chain Lagos",       plan: "business", status: "active",    mrr: 299, nextRenewal: "May 15, 2026",  paymentMethod: "Paystack •••• 4400" },
  { id: "s12", tenant: "Kebab King Berlin",       plan: "starter",  status: "active",    mrr: 29,  nextRenewal: "May 20, 2026",  paymentMethod: "Visa •••• 2277" },
  { id: "s13", tenant: "Noodle Bar Singapore",    plan: "free",     status: "active",    mrr: 0,   nextRenewal: "—",             paymentMethod: "—" },
  { id: "s14", tenant: "Mediterranean Mezze NY",  plan: "pro",      status: "active",    mrr: 99,  nextRenewal: "May 22, 2026",  paymentMethod: "Amex •••• 0055" },
  { id: "s15", tenant: "Sushi Mori Vancouver",    plan: "business", status: "cancelled", mrr: 0,   nextRenewal: "—",             paymentMethod: "Visa •••• 6644" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_STYLES: Record<Plan, string> = {
  free:     "bg-zinc-100 text-zinc-600",
  starter:  "bg-blue-100 text-blue-700",
  pro:      "bg-violet-100 text-violet-700",
  business: "bg-amber-100 text-amber-700",
};

const STATUS_STYLES: Record<SubStatus, string> = {
  active:    "bg-emerald-100 text-emerald-700",
  trial:     "bg-sky-100 text-sky-700",
  past_due:  "bg-red-100 text-red-700",
  cancelled: "bg-zinc-100 text-zinc-500",
};

const STATUS_LABELS: Record<SubStatus, string> = {
  active:    "Active",
  trial:     "Trial",
  past_due:  "Past Due",
  cancelled: "Cancelled",
};

function fmt(n: number) {
  return n === 0 ? "—" : `$${n}`;
}

// ─── Override plan dialog ─────────────────────────────────────────────────────

function OverridePlanDialog({ sub, open, onClose }: { sub: Subscription; open: boolean; onClose: () => void }) {
  const [plan, setPlan] = useState<string>(sub.plan);
  const [note, setNote] = useState("");

  function handleSave() {
    toast.success(`Plan for ${sub.tenant} overridden to ${plan}.`);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override Plan — {sub.tenant}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <Select value={plan} onValueChange={(v) => setPlan(v as string)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="starter">Starter — $29/mo</SelectItem>
              <SelectItem value="pro">Pro — $99/mo</SelectItem>
              <SelectItem value="business">Business — $299/mo</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Internal note (reason for override)…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-20"
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleSave}>Save override</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Row actions ──────────────────────────────────────────────────────────────

function SubActions({ sub }: { sub: Subscription }) {
  const [overrideOpen, setOverrideOpen] = useState(false);

  return (
    <>
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
            <DropdownMenuLabel>Subscription</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => toast.info(`Viewing ${sub.tenant}`)}>
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setOverrideOpen(true)}>
              Override plan
            </DropdownMenuItem>
            {sub.status === "past_due" && (
              <DropdownMenuItem onSelect={() => toast.success(`Marked paid: ${sub.tenant}`)}>
                Mark paid
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Danger</DropdownMenuLabel>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => toast.error(`Subscription cancelled for ${sub.tenant}`)}
            >
              Cancel subscription
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {overrideOpen && (
        <OverridePlanDialog sub={sub} open={overrideOpen} onClose={() => setOverrideOpen(false)} />
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const [planFilter,   setPlanFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = MOCK_SUBS.filter((s) => {
    if (planFilter   !== "all" && s.plan   !== planFilter)   return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Billing and plan management for all tenants.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total MRR",    value: "$892K"  },
          { label: "New MRR",      value: "$47.2K" },
          { label: "Churned MRR",  value: "$12.1K" },
          { label: "Conversion",   value: "18.4%"  },
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as string)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as string)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl ring-1 ring-foreground/10 overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Tenant</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Plan</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">MRR</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Next Renewal</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Payment</th>
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No subscriptions match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{sub.tenant}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-xs font-medium capitalize", PLAN_STYLES[sub.plan])}>
                        {sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-xs font-medium", STATUS_STYLES[sub.status])}>
                        {STATUS_LABELS[sub.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{fmt(sub.mrr)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{sub.nextRenewal}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{sub.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <SubActions sub={sub} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          Showing {filtered.length} of {MOCK_SUBS.length} subscriptions
        </div>
      </div>
    </div>
  );
}
