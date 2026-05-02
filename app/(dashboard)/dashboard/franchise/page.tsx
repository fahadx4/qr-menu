"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Building2, Users, DollarSign, ShieldCheck, Plus, ExternalLink, Edit2,
  Trash2, Send, Copy, Archive, Eye, Download, AlertTriangle, CheckCircle2, Clock, XCircle, Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn, generateId } from "@/lib/utils";
import { useT } from "@/lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Brand { id: string; name: string; slug: string; branches: number; status: "active" | "draft"; cuisine: string; }
interface Franchisee { id: string; name: string; email: string; location: string; branches: number; monthly_revenue: number; royalty_rate: number; compliance: number; joined: string; }
interface MenuTemplate { id: string; name: string; items: number; last_updated: string; deployed_to: number; status: "live" | "draft"; }
type DateRange = "this_month" | "last_month" | "q1" | "q2" | "custom";

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_BRANDS: Brand[] = [
  { id: "b1", name: "Burger House",      slug: "burger-house", branches: 2, status: "active", cuisine: "American"      },
  { id: "b2", name: "Burger House Café", slug: "bh-cafe",      branches: 1, status: "active", cuisine: "Café"          },
  { id: "b3", name: "BH Express",        slug: "bh-express",   branches: 0, status: "draft",  cuisine: "Quick Service" },
];

const INITIAL_FRANCHISEES: Franchisee[] = [
  { id: "f1", name: "Ahmed Al-Rashid", email: "ahmed@franchise.com", location: "Dubai, UAE",    branches: 3, monthly_revenue: 285000, royalty_rate: 6, compliance: 92, joined: "2025-01-15" },
  { id: "f2", name: "Sara Kim",        email: "sara@franchise.com",  location: "Seoul, Korea",  branches: 1, monthly_revenue: 98000,  royalty_rate: 6, compliance: 88, joined: "2025-06-01" },
  { id: "f3", name: "Carlos Mendez",   email: "carlos@franchise.com",location: "Mexico City",   branches: 2, monthly_revenue: 156000, royalty_rate: 5, compliance: 95, joined: "2024-11-01" },
];

const INITIAL_TEMPLATES: MenuTemplate[] = [
  { id: "t1", name: "Core Menu v3.2", items: 47, last_updated: "2026-04-20", deployed_to: 3, status: "live"  },
  { id: "t2", name: "Summer Special", items: 12, last_updated: "2026-04-22", deployed_to: 1, status: "live"  },
  { id: "t3", name: "Q2 Menu Update", items: 52, last_updated: "2026-04-24", deployed_to: 0, status: "draft" },
];

const ROYALTY_DATA: Record<string, { franchisee_id: string; gross: number; rate: number; status: "paid" | "pending" | "overdue" }[]> = {
  this_month: [{ franchisee_id: "f1", gross: 285000, rate: 6, status: "paid" }, { franchisee_id: "f2", gross: 98000, rate: 6, status: "pending" }, { franchisee_id: "f3", gross: 156000, rate: 5, status: "overdue" }],
  last_month:  [{ franchisee_id: "f1", gross: 271000, rate: 6, status: "paid" }, { franchisee_id: "f2", gross: 102000, rate: 6, status: "paid" },    { franchisee_id: "f3", gross: 148000, rate: 5, status: "paid"    }],
  q1:          [{ franchisee_id: "f1", gross: 810000, rate: 6, status: "paid" }, { franchisee_id: "f2", gross: 290000, rate: 6, status: "paid" },    { franchisee_id: "f3", gross: 445000, rate: 5, status: "paid"    }],
  q2:          [{ franchisee_id: "f1", gross: 285000, rate: 6, status: "paid" }, { franchisee_id: "f2", gross: 98000,  rate: 6, status: "pending" }, { franchisee_id: "f3", gross: 156000, rate: 5, status: "overdue" }],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function slugify(str: string) { return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function ComplianceBadge({ score }: { score: number }) {
  const cls = score > 90 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    : score >= 75 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  return <Badge className={cn(cls, "border-transparent")}>{score}%</Badge>;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3 pt-3 pb-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-base font-semibold leading-tight">{value}</p></div>
      </CardContent>
    </Card>
  );
}

// ─── Upgrade banner ────────────────────────────────────────────────────────────

function UpgradeBanner({ t }: { t: ReturnType<typeof useT> }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-700/40 dark:bg-amber-900/10">
      <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="flex-1 text-sm text-amber-800 dark:text-amber-300">{t.frn_upgradeNote}</p>
      <Button size="sm" className="shrink-0"><Zap className="size-3.5" />{t.frn_upgradeToBusiness}</Button>
    </div>
  );
}

// ─── Brands Tab ───────────────────────────────────────────────────────────────

function AddBrandDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (v: boolean) => void; onAdd: (brand: Brand) => void }) {
  const t = useT();
  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [plan, setPlan] = useState("pro");
  const slug = slugify(name);

  function handleAdd() {
    if (!name.trim() || !cuisine.trim()) { toast.error("Name and cuisine are required"); return; }
    onAdd({ id: generateId(), name: name.trim(), slug, branches: 0, status: "draft", cuisine: cuisine.trim() });
    toast.success(`Brand "${name}" created`);
    setName(""); setCuisine(""); setPlan("pro"); onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.frn_addBrandTitle}</DialogTitle>
          <DialogDescription>{t.frn_addBrandDesc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label htmlFor="brand-name">{t.frn_brandName}</Label><Input id="brand-name" placeholder="e.g. Burger House" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="brand-cuisine">{t.frn_cuisineType}</Label><Input id="brand-cuisine" placeholder="e.g. American, Italian…" value={cuisine} onChange={(e) => setCuisine(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="brand-slug">{t.frn_slugLabel}</Label><Input id="brand-slug" value={slug} readOnly className="bg-muted/50 text-muted-foreground font-mono text-xs" /></div>
          <div className="space-y-1">
            <Label htmlFor="brand-plan">{t.frn_planAllocation}</Label>
            <Select value={plan} onValueChange={(v) => setPlan(v ?? "pro")}>
              <SelectTrigger id="brand-plan" className="w-full"><SelectValue placeholder={t.frn_selectPlan} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" size="sm" />}>{t.dashCancel}</DialogClose>
          <Button size="sm" onClick={handleAdd}>{t.frn_createBrand}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BrandsTab() {
  const t = useT();
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{brands.length} {t.frn_brandsInGroup}</p>
        <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="size-4" />{t.frn_addBrand}</Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <Card key={brand.id} size="sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-sm">{brand.name}</CardTitle>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="secondary" className="text-xs">{brand.cuisine}</Badge>
                    <Badge variant={brand.status === "active" ? "default" : "outline"} className="text-xs">
                      {brand.status === "active" ? t.frn_statusActive : t.frn_statusDraft}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">{brand.branches} {brand.branches === 1 ? t.frn_branch : t.frn_branches}</p>
              <Separator />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs"><ExternalLink className="size-3" />{t.frn_openDashboard}</Button>
                <Button variant="ghost" size="icon-sm" onClick={() => toast.info(`Edit ${brand.name}`)}><Edit2 className="size-3.5" /></Button>
                <Button variant="ghost" size="icon-sm" className="text-destructive hover:bg-destructive/10" onClick={() => { setBrands((prev) => prev.filter((b) => b.id !== brand.id)); toast.info(t.frn_brandDeleted); }}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <AddBrandDialog open={addOpen} onOpenChange={setAddOpen} onAdd={(b) => setBrands((prev) => [...prev, b])} />
    </div>
  );
}

// ─── Franchisees Tab ──────────────────────────────────────────────────────────

function FranchiseesTab() {
  const t = useT();
  const franchisees = INITIAL_FRANCHISEES;
  const totalBranches = franchisees.reduce((s, f) => s + f.branches, 0);
  const platformMrr = franchisees.reduce((s, f) => s + f.monthly_revenue * (f.royalty_rate / 100), 0);
  const avgCompliance = franchisees.reduce((s, f) => s + f.compliance, 0) / franchisees.length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Users className="size-4" />}       label={t.frn_totalFranchisees} value={String(franchisees.length)} />
        <StatCard icon={<Building2 className="size-4" />}   label={t.frn_totalBranches}    value={String(totalBranches)} />
        <StatCard icon={<DollarSign className="size-4" />}  label={t.frn_platformMrr}      value={formatCurrency(platformMrr)} />
        <StatCard icon={<ShieldCheck className="size-4" />} label={t.frn_avgCompliance}    value={`${avgCompliance.toFixed(1)}%`} />
      </div>
      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="border-b text-start text-muted-foreground">
              <th className="py-2.5 px-4 font-medium">{t.frn_franchisee}</th>
              <th className="py-2.5 px-4 font-medium">{t.frn_location}</th>
              <th className="py-2.5 px-4 font-medium text-center">{t.frn_branches}</th>
              <th className="py-2.5 px-4 font-medium text-end">{t.frn_monthlyRev}</th>
              <th className="py-2.5 px-4 font-medium text-center">{t.frn_royaltyCol}</th>
              <th className="py-2.5 px-4 font-medium text-center">{t.frn_compliance}</th>
              <th className="py-2.5 px-4 font-medium">{t.frn_joined}</th>
              <th className="py-2.5 px-4 font-medium text-end">{t.dashActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {franchisees.map((f) => (
              <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4"><p className="font-medium">{f.name}</p><p className="text-xs text-muted-foreground">{f.email}</p></td>
                <td className="py-3 px-4 text-muted-foreground">{f.location}</td>
                <td className="py-3 px-4 text-center">{f.branches}</td>
                <td className="py-3 px-4 text-end font-medium">{formatCurrency(f.monthly_revenue)}</td>
                <td className="py-3 px-4 text-center">{f.royalty_rate}%</td>
                <td className="py-3 px-4 text-center"><ComplianceBadge score={f.compliance} /></td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{f.joined}</td>
                <td className="py-3 px-4 text-end">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => toast.info(`Viewing ${f.name}`)}><Eye className="size-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => toast.info(`Message sent to ${f.name}`)}><Send className="size-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive hover:bg-destructive/10" onClick={() => toast.info(`${f.name} suspended`)}><XCircle className="size-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Menu Templates Tab ───────────────────────────────────────────────────────

function PushDialog({ template, franchisees, open, onOpenChange }: {
  template: MenuTemplate; franchisees: Franchisee[]; open: boolean; onOpenChange: (v: boolean) => void;
}) {
  const t = useT();
  const [selected, setSelected] = useState<string[]>(franchisees.map((f) => f.id));
  function toggle(id: string) { setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]); }
  function handlePush() {
    toast.success(`Menu pushed to ${selected.length} ${selected.length !== 1 ? t.frn_franchiseesUnit : t.frn_franchiseeUnit}`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.frn_push} &ldquo;{template.name}&rdquo;</DialogTitle>
          <DialogDescription>{t.frn_pushDesc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {franchisees.map((f) => (
            <label key={f.id} className="flex items-center gap-2.5 cursor-pointer rounded-lg p-2 hover:bg-muted/50 transition-colors">
              <input type="checkbox" className="rounded" checked={selected.includes(f.id)} onChange={() => toggle(f.id)} />
              <div><p className="text-sm font-medium">{f.name}</p><p className="text-xs text-muted-foreground">{f.location} · {f.branches} {t.frn_branches}</p></div>
            </label>
          ))}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" size="sm" />}>{t.dashCancel}</DialogClose>
          <Button size="sm" disabled={selected.length === 0} onClick={handlePush}>
            {t.frn_pushNow} {selected.length} {selected.length !== 1 ? t.frn_franchiseesUnit : t.frn_franchiseeUnit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MenuTemplatesTab() {
  const t = useT();
  const [templates, setTemplates] = useState<MenuTemplate[]>(INITIAL_TEMPLATES);
  const [pushTarget, setPushTarget] = useState<MenuTemplate | null>(null);

  function handleDuplicate(tmpl: MenuTemplate) {
    setTemplates((prev) => [...prev, { ...tmpl, id: generateId(), name: `${tmpl.name} (copy)`, deployed_to: 0, status: "draft" }]);
    toast.success(`"${tmpl.name}" duplicated`);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t.frn_pushMenuDesc}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((tmpl) => (
          <Card key={tmpl.id} size="sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm">{tmpl.name}</CardTitle>
                <Badge variant={tmpl.status === "live" ? "default" : "outline"} className="shrink-0 text-xs">
                  {tmpl.status === "live" ? t.frn_live : t.frn_statusDraft}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{tmpl.items} {t.frn_items}</span>
                <span>{t.frn_updated} {tmpl.last_updated}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t.frn_deployedTo} <span className="font-medium text-foreground">{tmpl.deployed_to}</span> {tmpl.deployed_to !== 1 ? t.frn_franchiseesUnit : t.frn_franchiseeUnit}
              </p>
              <Separator />
              <div className="flex flex-wrap gap-1.5">
                <Button variant="ghost" size="xs" onClick={() => toast.info(`Edit "${tmpl.name}"`)}><Edit2 className="size-3" />{t.dashEdit}</Button>
                <Button variant="ghost" size="xs" onClick={() => setPushTarget(tmpl)}><Send className="size-3" />{t.frn_push}</Button>
                <Button variant="ghost" size="xs" onClick={() => handleDuplicate(tmpl)}><Copy className="size-3" />{t.frn_duplicate}</Button>
                <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => { setTemplates((prev) => prev.filter((t2) => t2.id !== tmpl.id)); toast.info(t.frn_templateArchived); }}>
                  <Archive className="size-3" />{t.frn_archive}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {pushTarget && <PushDialog template={pushTarget} franchisees={INITIAL_FRANCHISEES} open={!!pushTarget} onOpenChange={(open) => { if (!open) setPushTarget(null); }} />}
    </div>
  );
}

// ─── Royalties Tab ────────────────────────────────────────────────────────────

function RoyaltyStatusBadge({ status, t }: { status: "paid" | "pending" | "overdue"; t: ReturnType<typeof useT> }) {
  if (status === "paid")    return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400"><CheckCircle2 className="size-3.5" />{t.frn_paid}</span>;
  if (status === "pending") return <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600 dark:text-yellow-400"><Clock className="size-3.5" />{t.frn_pending}</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400"><XCircle className="size-3.5" />{t.frn_overdue}</span>;
}

function RoyaltiesTab() {
  const t = useT();
  const [dateRange, setDateRange] = useState<DateRange>("this_month");
  const franchiseeMap = Object.fromEntries(INITIAL_FRANCHISEES.map((f) => [f.id, f]));
  const rows = ROYALTY_DATA[dateRange] ?? ROYALTY_DATA["this_month"];
  const totalDue  = rows.reduce((s, r) => s + r.gross * (r.rate / 100), 0);
  const totalPaid = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.gross * (r.rate / 100), 0);
  const outstanding = totalDue - totalPaid;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-44"><SelectValue placeholder={t.frn_selectPeriod} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="this_month">{t.frn_thisMonth}</SelectItem>
            <SelectItem value="last_month">{t.frn_lastMonth}</SelectItem>
            <SelectItem value="q1">{t.frn_q1}</SelectItem>
            <SelectItem value="q2">{t.frn_q2}</SelectItem>
            <SelectItem value="custom">{t.frn_custom}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => toast.info("CSV export coming soon")}>
          <Download className="size-4" />{t.frn_exportCsv}
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 text-center"><p className="text-xs text-muted-foreground mb-1">{t.frn_totalDue}</p><p className="text-lg font-semibold">{formatCurrency(totalDue)}</p></div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 text-center"><p className="text-xs text-muted-foreground mb-1">{t.frn_totalPaid}</p><p className="text-lg font-semibold text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</p></div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 text-center"><p className="text-xs text-muted-foreground mb-1">{t.frn_outstanding}</p><p className={cn("text-lg font-semibold", outstanding > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>{formatCurrency(outstanding)}</p></div>
      </div>
      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="border-b text-start text-muted-foreground">
              <th className="py-2.5 px-4 font-medium">{t.frn_franchisee}</th>
              <th className="py-2.5 px-4 font-medium text-end">{t.frn_grossRevenue}</th>
              <th className="py-2.5 px-4 font-medium text-center">{t.frn_rate}</th>
              <th className="py-2.5 px-4 font-medium text-end">{t.frn_royaltyDue}</th>
              <th className="py-2.5 px-4 font-medium">{t.dashStatus}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, idx) => {
              const f = franchiseeMap[row.franchisee_id];
              const royaltyDue = row.gross * (row.rate / 100);
              return (
                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4"><p className="font-medium">{f?.name ?? row.franchisee_id}</p><p className="text-xs text-muted-foreground">{f?.location}</p></td>
                  <td className="py-3 px-4 text-end">{formatCurrency(row.gross)}</td>
                  <td className="py-3 px-4 text-center">{row.rate}%</td>
                  <td className="py-3 px-4 text-end font-medium">{formatCurrency(royaltyDue)}</td>
                  <td className="py-3 px-4"><RoyaltyStatusBadge status={row.status} t={t} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FranchisePage() {
  const t = useT();
  const [activeTab, setActiveTab] = useState("brands");

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold">{t.frn_pageTitle}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t.frn_pageSubtitle}</p>
      </div>
      <UpgradeBanner t={t} />
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <TabsList variant="line">
          <TabsTrigger value="brands">{t.frn_tabBrands}</TabsTrigger>
          <TabsTrigger value="franchisees">{t.frn_tabFranchisees}</TabsTrigger>
          <TabsTrigger value="templates">{t.frn_tabMenuTemplates}</TabsTrigger>
          <TabsTrigger value="royalties">{t.frn_tabRoyalties}</TabsTrigger>
        </TabsList>
        <TabsContent value="brands" className="mt-4"><BrandsTab /></TabsContent>
        <TabsContent value="franchisees" className="mt-4"><FranchiseesTab /></TabsContent>
        <TabsContent value="templates" className="mt-4"><MenuTemplatesTab /></TabsContent>
        <TabsContent value="royalties" className="mt-4"><RoyaltiesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
