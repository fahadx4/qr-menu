"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeatureFlag {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
  rollout: number;
  plan_required: string | null;
  tenants_overridden: number;
}

// ─── Mock flags ───────────────────────────────────────────────────────────────

const initialFlags: FeatureFlag[] = [
  { id: "f1", key: "ar_viewer",        label: "AR / 3D Viewer",         enabled: true,  rollout: 100, plan_required: "pro",      tenants_overridden: 3 },
  { id: "f2", key: "ai_translator",    label: "AI Menu Translator",      enabled: true,  rollout: 100, plan_required: "pro",      tenants_overridden: 0 },
  { id: "f3", key: "loyalty_v2",       label: "Loyalty Program v2",      enabled: true,  rollout: 50,  plan_required: "starter",  tenants_overridden: 5 },
  { id: "f4", key: "new_kds_ui",       label: "New KDS Interface",       enabled: true,  rollout: 25,  plan_required: null,       tenants_overridden: 0 },
  { id: "f5", key: "franchise_module", label: "Franchise Module",        enabled: true,  rollout: 100, plan_required: "business", tenants_overridden: 0 },
  { id: "f6", key: "delivery_mgmt",    label: "Delivery Management",     enabled: false, rollout: 0,   plan_required: "starter",  tenants_overridden: 0 },
  { id: "f7", key: "smart_upsells",    label: "AI Upsell Suggestions",   enabled: false, rollout: 0,   plan_required: "pro",      tenants_overridden: 2 },
  { id: "f8", key: "multi_brand",      label: "Multi-Brand Support",     enabled: true,  rollout: 100, plan_required: "business", tenants_overridden: 0 },
];

// Non-critical = can be killed by kill switch (all that are currently enabled)
const NON_CRITICAL_KEYS = initialFlags.filter((f) => f.enabled).map((f) => f.key);

// ─── Mock tenants for override section ───────────────────────────────────────

interface TenantOverride {
  tenantId: string;
  tenantName: string;
  flagKey: string;
  enabled: boolean;
}

const mockTenantOverrides: TenantOverride[] = [
  { tenantId: "t1", tenantName: "Spice Chain",   flagKey: "ar_viewer",      enabled: true  },
  { tenantId: "t1", tenantName: "Spice Chain",   flagKey: "loyalty_v2",     enabled: true  },
  { tenantId: "t3", tenantName: "Ahmed's Kitchen", flagKey: "ar_viewer",    enabled: false },
  { tenantId: "t3", tenantName: "Ahmed's Kitchen", flagKey: "smart_upsells", enabled: true },
  { tenantId: "t7", tenantName: "Taco Bell Dubai", flagKey: "loyalty_v2",   enabled: false },
  { tenantId: "t7", tenantName: "Taco Bell Dubai", flagKey: "smart_upsells", enabled: true },
  { tenantId: "t8", tenantName: "Sakura Sushi",    flagKey: "loyalty_v2",   enabled: true  },
  { tenantId: "t8", tenantName: "Sakura Sushi",    flagKey: "loyalty_v2",   enabled: false },
];

// Unique tenant list
const mockTenants = Array.from(
  new Map(mockTenantOverrides.map((o) => [o.tenantId, { id: o.tenantId, name: o.tenantName }])).values()
);

// ─── Plan badge ───────────────────────────────────────────────────────────────

const planBadgeClass: Record<string, string> = {
  free:     "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  starter:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pro:      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  business: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-xs font-medium capitalize", planBadgeClass[plan] ?? "bg-zinc-100 text-zinc-600")}>
      {plan}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);
  const [rolloutValues, setRolloutValues] = useState<Record<string, string>>(
    Object.fromEntries(initialFlags.map((f) => [f.id, String(f.rollout)]))
  );

  const [killDialogOpen, setKillDialogOpen] = useState(false);

  // Tenant override section
  const [tenantSearch, setTenantSearch] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<TenantOverride[]>(mockTenantOverrides);

  // ── Toggle global flag ──
  const toggleFlag = (id: string, enabled: boolean) => {
    setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, enabled } : f)));
    const flag = flags.find((f) => f.id === id);
    toast.success(`${flag?.label ?? "Flag"} ${enabled ? "enabled" : "disabled"}`);
  };

  // ── Update rollout ──
  const updateRollout = (id: string, raw: string) => {
    setRolloutValues((prev) => ({ ...prev, [id]: raw }));
    const val = parseInt(raw, 10);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, rollout: val } : f)));
    }
  };

  // ── Kill switch ──
  const handleKillSwitch = () => {
    setFlags((prev) =>
      prev.map((f) =>
        NON_CRITICAL_KEYS.includes(f.key) ? { ...f, enabled: false, rollout: 0 } : f
      )
    );
    setKillDialogOpen(false);
    toast.error("Emergency kill switch activated — all non-critical features disabled");
  };

  // ── Tenant override toggle ──
  const toggleTenantOverride = (tenantId: string, flagKey: string, enabled: boolean) => {
    setOverrides((prev) =>
      prev.map((o) =>
        o.tenantId === tenantId && o.flagKey === flagKey ? { ...o, enabled } : o
      )
    );
    toast.success(`Override updated for tenant`);
  };

  // ── Filtered tenant list ──
  const filteredTenants = mockTenants.filter((t) =>
    t.name.toLowerCase().includes(tenantSearch.toLowerCase())
  );

  const selectedTenant = mockTenants.find((t) => t.id === selectedTenantId);
  const tenantOverrides = overrides.filter((o) => o.tenantId === selectedTenantId);

  // Affected flags for kill dialog
  const affectedFlags = flags.filter((f) => f.enabled && NON_CRITICAL_KEYS.includes(f.key));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Feature Flags</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Control feature rollouts and per-tenant overrides.</p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setKillDialogOpen(true)}
          className="gap-1.5"
        >
          <AlertTriangle className="h-4 w-4" />
          Kill switch
        </Button>
      </div>

      {/* Flags table */}
      <div className="rounded-xl ring-1 ring-foreground/10 overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Flag</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Plan required</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Enabled</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Rollout %</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Overrides</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {flags.map((flag) => (
                <tr key={flag.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{flag.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{flag.key}</p>
                  </td>
                  <td className="px-4 py-3">
                    {flag.plan_required ? (
                      <PlanBadge plan={flag.plan_required} />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <Switch
                        checked={flag.enabled}
                        onCheckedChange={(v) => toggleFlag(flag.id, v)}
                        size="sm"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={rolloutValues[flag.id] ?? String(flag.rollout)}
                        onChange={(e) => updateRollout(flag.id, e.target.value)}
                        className="w-16 text-center"
                        disabled={!flag.enabled}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn("text-sm font-medium", flag.tenants_overridden > 0 ? "text-amber-600" : "text-muted-foreground")}>
                      {flag.tenants_overridden}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant override section */}
      <div className="rounded-xl ring-1 ring-foreground/10 bg-card p-4 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Tenant Overrides</h2>
          <p className="text-sm text-muted-foreground">Search a tenant to view and toggle their individual flag overrides.</p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tenant…"
            value={tenantSearch}
            onChange={(e) => {
              setTenantSearch(e.target.value);
              setSelectedTenantId(null);
            }}
            className="pl-8"
          />
        </div>

        {/* Tenant results */}
        {tenantSearch && (
          <div className="flex flex-wrap gap-2">
            {filteredTenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tenants found.</p>
            ) : (
              filteredTenants.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTenantId(t.id)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    selectedTenantId === t.id
                      ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {t.name}
                </button>
              ))
            )}
          </div>
        )}

        {/* Selected tenant overrides */}
        {selectedTenant && (
          <div className="space-y-3">
            <p className="text-sm font-medium">{selectedTenant.name} — overrides</p>
            {tenantOverrides.length === 0 ? (
              <p className="text-sm text-muted-foreground">No overrides configured for this tenant.</p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Flag</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tenantOverrides.map((o, i) => {
                      const flagMeta = flags.find((f) => f.key === o.flagKey);
                      return (
                        <tr key={i} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5">
                            <p className="font-medium">{flagMeta?.label ?? o.flagKey}</p>
                            <p className="text-xs text-muted-foreground font-mono">{o.flagKey}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex justify-center">
                              <Switch
                                checked={o.enabled}
                                onCheckedChange={(v) =>
                                  toggleTenantOverride(o.tenantId, o.flagKey, v)
                                }
                                size="sm"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kill switch dialog */}
      <Dialog open={killDialogOpen} onOpenChange={setKillDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Emergency Kill Switch
            </DialogTitle>
            <DialogDescription>
              This will immediately disable ALL non-critical features across the entire platform. This action affects all tenants.
            </DialogDescription>
          </DialogHeader>

          {/* Affected flags list */}
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wide">Features that will be disabled</p>
            {affectedFlags.length === 0 ? (
              <p className="text-xs text-muted-foreground">All non-critical features are already disabled.</p>
            ) : (
              <ul className="space-y-1">
                {affectedFlags.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive flex-shrink-0" />
                    {f.label}
                    <span className="ml-auto font-mono text-xs text-muted-foreground">{f.key}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter showCloseButton>
            <Button
              variant="destructive"
              onClick={handleKillSwitch}
              disabled={affectedFlags.length === 0}
              className="w-full sm:w-auto"
            >
              Emergency disable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
