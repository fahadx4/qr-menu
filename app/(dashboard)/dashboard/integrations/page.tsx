"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  SquareIcon, Zap, Monitor, Bike, Truck, ShoppingBag, Package, CreditCard,
  DollarSign, Smartphone, FileText, Calculator, BarChart2, Share2, Stamp,
  Search, Plus, Trash2, RefreshCw, Webhook, CheckCircle2, XCircle, AlertCircle, LucideProps,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { cn, generateId } from "@/lib/utils";
import { useT } from "@/lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

type IntegrationStatus = "connected" | "disconnected" | "error" | "coming_soon";

interface ConfigField { key: string; label: string; type: "text" | "password" | "select"; }
interface Integration {
  id: string; name: string; category: string; description: string;
  status: IntegrationStatus; icon: string; connected_since?: string; config_fields?: ConfigField[];
}
interface WebhookItem { id: string; url: string; events: string[]; last_delivery: string; status: "active" | "failing"; }

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_INTEGRATIONS: Integration[] = [
  { id: "int1",  name: "Square POS",       category: "POS",        description: "Sync menus, orders, and inventory with Square point of sale.",          status: "connected",    icon: "SquareIcon", connected_since: "2026-01-15" },
  { id: "int2",  name: "Lightspeed",        category: "POS",        description: "Enterprise POS integration for large restaurant chains.",              status: "disconnected", icon: "Zap" },
  { id: "int3",  name: "EPOS Now",          category: "POS",        description: "Cloud POS with real-time menu sync and order routing.",                status: "disconnected", icon: "Monitor" },
  { id: "int4",  name: "Uber Eats",         category: "Delivery",   description: "Accept Uber Eats orders directly in your dashboard. Menu auto-syncs.", status: "connected",    icon: "Bike",       connected_since: "2026-02-01" },
  { id: "int5",  name: "DoorDash",          category: "Delivery",   description: "DoorDash Merchant integration with live order tracking.",              status: "disconnected", icon: "Truck" },
  { id: "int6",  name: "Deliveroo",         category: "Delivery",   description: "Deliveroo tablet-free integration via API.",                           status: "coming_soon",  icon: "ShoppingBag" },
  { id: "int7",  name: "Glovo",             category: "Delivery",   description: "Glovo courier integration for same-day delivery.",                     status: "coming_soon",  icon: "Package" },
  { id: "int8",  name: "Stripe",            category: "Payments",   description: "Online card payments, subscriptions, and Connect for marketplaces.",   status: "disconnected", icon: "CreditCard", config_fields: [{ key: "pk", label: "Publishable key", type: "text" }, { key: "sk", label: "Secret key", type: "password" }] },
  { id: "int9",  name: "PayPal",            category: "Payments",   description: "PayPal checkout for online orders.",                                   status: "disconnected", icon: "DollarSign" },
  { id: "int10", name: "JazzCash",          category: "Payments",   description: "Pakistan mobile wallet payment gateway.",                              status: "disconnected", icon: "Smartphone" },
  { id: "int11", name: "Xero",              category: "Accounting", description: "Daily revenue export, invoices, and bank reconciliation.",             status: "connected",    icon: "FileText",   connected_since: "2026-03-01" },
  { id: "int12", name: "QuickBooks",        category: "Accounting", description: "Automatic sales data sync and expense tracking.",                      status: "disconnected", icon: "Calculator" },
  { id: "int13", name: "Google Analytics",  category: "Analytics",  description: "Track customer behaviour on your public menu pages.",                  status: "connected",    icon: "BarChart2",  connected_since: "2026-01-10" },
  { id: "int14", name: "Meta Pixel",        category: "Analytics",  description: "Facebook & Instagram conversion tracking for ad campaigns.",           status: "disconnected", icon: "Share2" },
  { id: "int15", name: "Stamp Me",          category: "Loyalty",    description: "Digital stamp card loyalty program integration.",                      status: "disconnected", icon: "Stamp" },
];

const INITIAL_WEBHOOKS: WebhookItem[] = [
  { id: "wh1", url: "https://api.myapp.com/qrmenu/events",  events: ["order.created", "order.completed"], last_delivery: "2m ago",  status: "active"  },
  { id: "wh2", url: "https://erp.company.com/pos/webhook",  events: ["order.created"],                    last_delivery: "5h ago",  status: "failing" },
];

const WEBHOOK_EVENT_OPTIONS = ["order.created","order.updated","order.completed","order.cancelled","item.86d","reservation.created"];
const CATEGORIES = ["All","POS","Delivery","Payments","Accounting","Analytics","Loyalty","Webhooks"];

const ICON_MAP: Record<string, React.FC<LucideProps>> = { SquareIcon, Zap, Monitor, Bike, Truck, ShoppingBag, Package, CreditCard, DollarSign, Smartphone, FileText, Calculator, BarChart2, Share2, Stamp };

function IntegrationIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return <Webhook className={cn("size-6", className)} />;
  return <Icon className={cn("size-6", className)} />;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, t }: { status: IntegrationStatus; t: ReturnType<typeof useT> }) {
  if (status === "connected") return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
      <span className="size-1.5 rounded-full bg-green-500" />{t.int_connected}
    </span>
  );
  if (status === "error") return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
      <XCircle className="size-3" />{t.int_errorReconnect}
    </span>
  );
  if (status === "coming_soon") return (
    <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
      {t.int_comingSoon}
    </Badge>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground/40" />{t.int_notConnected}
    </span>
  );
}

// ─── Configure Dialog ─────────────────────────────────────────────────────────

function ConfigureDialog({ integration, open, onOpenChange, onDisconnect }: {
  integration: Integration; open: boolean; onOpenChange: (v: boolean) => void; onDisconnect: (id: string) => void;
}) {
  const t = useT();
  const [autoSync, setAutoSync] = useState(true);
  const [bidirectional, setBidirectional] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IntegrationIcon name={integration.icon} className="size-5" />{integration.name}
          </DialogTitle>
          <DialogDescription>{integration.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">{t.dashStatus}</span><StatusBadge status={integration.status} t={t} /></div>
            {integration.connected_since && (
              <div className="flex justify-between"><span className="text-muted-foreground">{t.int_connectedSince}</span><span>{integration.connected_since}</span></div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">{t.int_lastSync}</span><span>3 minutes ago</span></div>
          </div>
          <Separator />
          <div className="space-y-3">
            <p className="text-sm font-medium">{t.int_syncSettings}</p>
            <div className="flex items-center justify-between">
              <div><p className="text-sm">{t.int_autoSync}</p><p className="text-xs text-muted-foreground">{t.int_autoSyncDesc}</p></div>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm">{t.int_bidirectional}</p><p className="text-xs text-muted-foreground">{t.int_bidirectionalDesc} {integration.name}</p></div>
              <Switch checked={bidirectional} onCheckedChange={setBidirectional} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="destructive" size="sm" onClick={() => { onDisconnect(integration.id); onOpenChange(false); }}>{t.int_disconnect}</Button>
          <DialogClose render={<Button variant="outline" size="sm" />}>{t.dashClose}</DialogClose>
          <Button size="sm" onClick={() => { toast.success(t.int_settingsSaved); onOpenChange(false); }}>{t.dashSave}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Connect Dialog ───────────────────────────────────────────────────────────

function ConnectDialog({ integration, open, onOpenChange, onConnect }: {
  integration: Integration; open: boolean; onOpenChange: (v: boolean) => void; onConnect: (id: string) => void;
}) {
  const t = useT();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function handleConnect() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onConnect(integration.id);
      toast.success(`${t.int_connect} ${integration.name}`);
      onOpenChange(false);
    }, 800);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IntegrationIcon name={integration.icon} className="size-5" />{t.int_connect} {integration.name}
          </DialogTitle>
          <DialogDescription>{integration.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {integration.config_fields && integration.config_fields.length > 0 ? (
            integration.config_fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label htmlFor={`field-${field.key}`}>{field.label}</Label>
                <Input id={`field-${field.key}`} type={field.type === "password" ? "password" : "text"}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  value={fields[field.key] ?? ""} onChange={(e) => setFields((prev) => ({ ...prev, [field.key]: e.target.value }))} />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t.int_oauthNote}</p>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" size="sm" />}>{t.dashCancel}</DialogClose>
          <Button size="sm" disabled={loading} onClick={handleConnect}>
            {loading ? (<><RefreshCw className="size-4 animate-spin" />{t.int_connecting}</>) : t.int_connect}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Integration Card ─────────────────────────────────────────────────────────

function IntegrationCard({ integration, onStatusChange }: {
  integration: Integration; onStatusChange: (id: string, status: IntegrationStatus) => void;
}) {
  const t = useT();
  const [configOpen, setConfigOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <IntegrationIcon name={integration.icon} className="size-5 text-foreground/70" />
            </div>
            <div>
              <p className="font-medium text-sm leading-tight">{integration.name}</p>
              <Badge variant="secondary" className="mt-0.5 text-xs h-4 px-1.5">{integration.category}</Badge>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed flex-1">{integration.description}</p>
        <div className="flex items-center justify-between"><StatusBadge status={integration.status} t={t} /></div>
        <div className="flex gap-2">
          {integration.status === "connected" && (
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfigOpen(true)}>{t.int_configure}</Button>
          )}
          {integration.status === "disconnected" && (
            <Button size="sm" className="flex-1" onClick={() => setConnectOpen(true)}>{t.int_connect}</Button>
          )}
          {integration.status === "error" && (
            <Button variant="destructive" size="sm" className="flex-1" onClick={() => setConnectOpen(true)}>{t.int_reconnect}</Button>
          )}
          {integration.status === "coming_soon" && (
            <Button size="sm" className="flex-1" disabled>{t.int_comingSoon}</Button>
          )}
        </div>
      </div>
      {integration.status === "connected" && (
        <ConfigureDialog integration={integration} open={configOpen} onOpenChange={setConfigOpen} onDisconnect={(id) => onStatusChange(id, "disconnected")} />
      )}
      {(integration.status === "disconnected" || integration.status === "error") && (
        <ConnectDialog integration={integration} open={connectOpen} onOpenChange={setConnectOpen} onConnect={(id) => onStatusChange(id, "connected")} />
      )}
    </>
  );
}

// ─── Add Webhook Dialog ────────────────────────────────────────────────────────

function AddWebhookDialog({ open, onOpenChange, onAdd }: {
  open: boolean; onOpenChange: (v: boolean) => void; onAdd: (wh: WebhookItem) => void;
}) {
  const t = useT();
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  function toggleEvent(ev: string) {
    setSelectedEvents((prev) => prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]);
  }

  function handleAdd() {
    if (!url.trim() || selectedEvents.length === 0) { toast.error(t.int_webhookError); return; }
    onAdd({ id: generateId(), url: url.trim(), events: selectedEvents, last_delivery: "never", status: "active" });
    toast.success(t.int_webhookAdded);
    setUrl(""); setSelectedEvents([]); onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.int_addWebhook}</DialogTitle>
          <DialogDescription>Send real-time event notifications to your server URL.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="wh-url">{t.int_endpointUrl}</Label>
            <Input id="wh-url" type="url" placeholder="https://your-server.com/webhook" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t.int_eventsLabel}</Label>
            <div className="space-y-2">
              {WEBHOOK_EVENT_OPTIONS.map((ev) => (
                <label key={ev} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" checked={selectedEvents.includes(ev)} onChange={() => toggleEvent(ev)} />
                  <span className="text-sm font-mono text-muted-foreground">{ev}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" size="sm" />}>{t.dashCancel}</DialogClose>
          <Button size="sm" onClick={handleAdd}>{t.int_addEndpoint}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Webhooks Section ─────────────────────────────────────────────────────────

function WebhooksSection() {
  const t = useT();
  const [webhooks, setWebhooks] = useState<WebhookItem[]>(INITIAL_WEBHOOKS);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="mt-10 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold">{t.int_webhooks}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t.int_webhooksDesc}</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />{t.int_addWebhook}
        </Button>
      </div>
      <Separator />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-start text-muted-foreground">
              <th className="py-2.5 pe-4 font-medium">{t.int_urlLabel}</th>
              <th className="py-2.5 pe-4 font-medium">{t.int_eventsColumn}</th>
              <th className="py-2.5 pe-4 font-medium">{t.int_lastDelivery}</th>
              <th className="py-2.5 pe-4 font-medium">{t.dashStatus}</th>
              <th className="py-2.5 font-medium text-end">{t.dashActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {webhooks.map((wh) => (
              <tr key={wh.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 pe-4"><code className="text-xs font-mono text-foreground/80 max-w-[240px] block truncate">{wh.url}</code></td>
                <td className="py-3 pe-4"><div className="flex flex-wrap gap-1">{wh.events.map((ev) => <Badge key={ev} variant="secondary" className="text-xs font-mono">{ev}</Badge>)}</div></td>
                <td className="py-3 pe-4 text-muted-foreground">{wh.last_delivery}</td>
                <td className="py-3 pe-4">
                  {wh.status === "active" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                      <CheckCircle2 className="size-3.5" />{t.int_activeStatus}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                      <AlertCircle className="size-3.5" />{t.int_failingStatus}
                    </span>
                  )}
                </td>
                <td className="py-3 text-end">
                  <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive"
                    onClick={() => { setWebhooks((prev) => prev.filter((w) => w.id !== wh.id)); toast.info(t.int_webhookRemoved); }}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
            {webhooks.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">{t.int_noWebhooks}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <AddWebhookDialog open={addOpen} onOpenChange={setAddOpen} onAdd={(wh) => setWebhooks((prev) => [...prev, wh])} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const t = useT();
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  function handleStatusChange(id: string, status: IntegrationStatus) {
    setIntegrations((prev) => prev.map((i) =>
      i.id === id ? { ...i, status, connected_since: status === "connected" ? new Date().toISOString().slice(0, 10) : undefined } : i
    ));
  }

  const filtered = integrations.filter((i) => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || activeCategory === "Webhooks" || i.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t.int_pageTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {connectedCount} {t.int_connectedOf} {integrations.length} {t.int_integrationsConnected}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input placeholder={t.int_searchPlaceholder} className="ps-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as string)}>
        <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0" variant="line">
          {CATEGORIES.map((cat) => <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>)}
        </TabsList>
        {CATEGORIES.map((cat) => (
          <TabsContent key={cat} value={cat}>
            {cat === "Webhooks" ? (
              <WebhooksSection />
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">{t.int_noMatch}</div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((integration) => (
                  <IntegrationCard key={integration.id} integration={integration} onStatusChange={handleStatusChange} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
