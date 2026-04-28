"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Plan   = "free" | "starter" | "pro" | "business";
type Status = "active" | "trial" | "suspended" | "churned";

interface Tenant {
  id: string;
  name: string;
  email: string;
  slug: string;
  plan: Plan;
  country: string;
  branches: number;
  orders_mo: number;
  mrr: number;          // USD cents
  status: Status;
  joined: string;       // ISO date
}

// ─── Mock tenants ─────────────────────────────────────────────────────────────

const mockTenants: Tenant[] = [
  {
    id: "t1",  name: "Spice Chain",          email: "ops@spicechain.ng",     slug: "spice-chain",
    plan: "business", country: "Nigeria",       branches: 12, orders_mo: 42000, mrr: 29900, status: "active",    joined: "2023-03-14",
  },
  {
    id: "t2",  name: "Ramen House",           email: "hello@ramenhouse.jp",   slug: "ramen-house",
    plan: "pro",      country: "Japan",         branches:  3, orders_mo: 11800, mrr:  9900, status: "active",    joined: "2023-07-22",
  },
  {
    id: "t3",  name: "Ahmed's Kitchen",       email: "ahmed@kitchen.ae",      slug: "ahmeds-kitchen",
    plan: "pro",      country: "UAE",           branches:  5, orders_mo: 18400, mrr:  9900, status: "trial",     joined: "2024-11-01",
  },
  {
    id: "t4",  name: "Maria's Tapas",         email: "maria@tapas.es",        slug: "marias-tapas",
    plan: "starter",  country: "Spain",         branches:  1, orders_mo:  3200, mrr:  2900, status: "active",    joined: "2023-12-05",
  },
  {
    id: "t5",  name: "Pizza Planet",          email: "ops@pizzaplanet.co.uk", slug: "pizza-planet",
    plan: "starter",  country: "UK",            branches:  2, orders_mo:  4100, mrr:  2900, status: "churned",   joined: "2023-05-18",
  },
  {
    id: "t6",  name: "Cloud Kitchen Co",      email: "info@cloudkitchen.pk",  slug: "cloud-kitchen-co",
    plan: "free",     country: "Pakistan",      branches:  1, orders_mo:   540, mrr:     0, status: "active",    joined: "2024-10-30",
  },
  {
    id: "t7",  name: "Taco Bell Dubai",       email: "ops@tacobell.ae",       slug: "taco-bell-dubai",
    plan: "business", country: "UAE",           branches:  8, orders_mo: 28000, mrr: 29900, status: "suspended", joined: "2023-09-11",
  },
  {
    id: "t8",  name: "Sakura Sushi",          email: "hello@sakurasushi.jp",  slug: "sakura-sushi",
    plan: "pro",      country: "Japan",         branches:  2, orders_mo:  7200, mrr:  9900, status: "trial",     joined: "2024-12-15",
  },
  {
    id: "t9",  name: "Karachi Grill House",   email: "kgh@grillhouse.pk",     slug: "karachi-grill",
    plan: "starter",  country: "Pakistan",      branches:  1, orders_mo:  2800, mrr:  2900, status: "active",    joined: "2024-02-20",
  },
  {
    id: "t10", name: "Le Petit Bistro",       email: "contact@bistro.fr",     slug: "le-petit-bistro",
    plan: "pro",      country: "France",        branches:  4, orders_mo: 14000, mrr:  9900, status: "active",    joined: "2023-11-07",
  },
  {
    id: "t11", name: "Naan Republic",         email: "ops@naanrepublic.ca",   slug: "naan-republic",
    plan: "free",     country: "Canada",        branches:  1, orders_mo:   380, mrr:     0, status: "active",    joined: "2025-01-18",
  },
  {
    id: "t12", name: "Burger Brothers",       email: "hi@burgerbrothers.de",  slug: "burger-brothers",
    plan: "business", country: "Germany",       branches:  6, orders_mo: 22000, mrr: 29900, status: "active",    joined: "2023-06-30",
  },
];

// ─── Badge helpers ────────────────────────────────────────────────────────────

const planConfig: Record<Plan, { label: string; className: string }> = {
  free:     { label: "Free",     className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  starter:  { label: "Starter",  className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  pro:      { label: "Pro",      className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  business: { label: "Business", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

const statusConfig: Record<Status, { label: string; className: string }> = {
  active:    { label: "Active",    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  trial:     { label: "Trial",     className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  suspended: { label: "Suspended", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  churned:   { label: "Churned",   className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500" },
};

function PlanBadge({ plan }: { plan: Plan }) {
  const cfg = planConfig[plan];
  return (
    <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-xs font-medium", cfg.className)}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status];
  return (
    <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-xs font-medium", cfg.className)}>
      {cfg.label}
    </span>
  );
}

// ─── Unique countries ─────────────────────────────────────────────────────────

const ALL_COUNTRIES = Array.from(new Set(mockTenants.map((t) => t.country))).sort();

// ─── Row actions ──────────────────────────────────────────────────────────────

function TenantActions({ tenant, onToggleSuspend }: { tenant: Tenant; onToggleSuspend: (id: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<button type="button" className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors" />}
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => toast.info(`Viewing ${tenant.name}`)}>
            View details
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => toast.info("Impersonation requires backend")}
          >
            Impersonate
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => onToggleSuspend(tenant.id)}
          >
            {tenant.status === "suspended" ? "Unsuspend" : "Suspend"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => toast.info("Password reset email queued")}
          >
            Force password reset
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => toast.error(`Delete tenant: not yet implemented`)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RestaurantsPage() {
  const [search, setSearch]       = useState("");
  const [planFilter, setPlanFilter]     = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");

  const [tenants, setTenants] = useState<Tenant[]>(mockTenants);

  const handleToggleSuspend = (id: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = t.status === "suspended" ? "active" : "suspended";
        toast.success(`${t.name} is now ${next}`);
        return { ...t, status: next };
      })
    );
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tenants.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q) && !t.email.toLowerCase().includes(q) && !t.country.toLowerCase().includes(q) && !t.slug.includes(q)) return false;
      if (planFilter   !== "all" && t.plan    !== planFilter)   return false;
      if (statusFilter !== "all" && t.status  !== statusFilter) return false;
      if (countryFilter !== "all" && t.country !== countryFilter) return false;
      return true;
    });
  }, [tenants, search, planFilter, statusFilter, countryFilter]);

  // Stats
  const totalRestaurants  = 50247;
  const activeTrials      = 1847;
  const suspended         = tenants.filter((t) => t.status === "suspended").length;
  const avgMrr            = 17.74;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Restaurants</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage all tenant accounts on the platform.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Restaurants",         value: totalRestaurants.toLocaleString() },
          { label: "Active Trials",              value: activeTrials.toLocaleString() },
          { label: "Suspended",                  value: String(suspended) },
          { label: "Avg MRR / Restaurant",       value: `$${avgMrr.toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-card ring-1 ring-foreground/10 px-4 py-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-52">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, country, slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as string)}>
          <SelectTrigger className="w-32">
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
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="churned">Churned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={(v) => setCountryFilter(v as string)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {ALL_COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl ring-1 ring-foreground/10 overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Plan</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Country</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Branches</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Orders/mo</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">MRR</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No restaurants match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.email}</p>
                    </td>
                    <td className="px-4 py-3"><PlanBadge plan={t.plan} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{t.country}</td>
                    <td className="px-4 py-3 text-right">{t.branches}</td>
                    <td className="px-4 py-3 text-right">{t.orders_mo.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {t.mrr === 0 ? "—" : `$${(t.mrr / 100).toFixed(0)}`}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(t.joined).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <TenantActions tenant={t} onToggleSuspend={handleToggleSuspend} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          Showing {filtered.length} of {tenants.length} local results (platform total: {totalRestaurants.toLocaleString()})
        </div>
      </div>
    </div>
  );
}
