"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  SquareIcon,
  Zap,
  Monitor,
  Bike,
  Truck,
  ShoppingBag,
  Package,
  CreditCard,
  DollarSign,
  Smartphone,
  FileText,
  Calculator,
  BarChart2,
  Share2,
  Stamp,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Webhook,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  LucideProps,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn, generateId } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type IntegrationStatus = "connected" | "disconnected" | "error" | "coming_soon";

interface ConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "select";
}

interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  status: IntegrationStatus;
  icon: string;
  connected_since?: string;
  config_fields?: ConfigField[];
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  last_delivery: string;
  status: "active" | "failing";
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_INTEGRATIONS: Integration[] = [
  { id: "int1",  name: "Square POS",       category: "POS",        description: "Sync menus, orders, and inventory with Square point of sale.",           status: "connected",    icon: "SquareIcon",   connected_since: "2026-01-15" },
  { id: "int2",  name: "Lightspeed",        category: "POS",        description: "Enterprise POS integration for large restaurant chains.",               status: "disconnected", icon: "Zap" },
  { id: "int3",  name: "EPOS Now",          category: "POS",        description: "Cloud POS with real-time menu sync and order routing.",                 status: "disconnected", icon: "Monitor" },
  { id: "int4",  name: "Uber Eats",         category: "Delivery",   description: "Accept Uber Eats orders directly in your dashboard. Menu auto-syncs.",  status: "connected",    icon: "Bike",         connected_since: "2026-02-01" },
  { id: "int5",  name: "DoorDash",          category: "Delivery",   description: "DoorDash Merchant integration with live order tracking.",               status: "disconnected", icon: "Truck" },
  { id: "int6",  name: "Deliveroo",         category: "Delivery",   description: "Deliveroo tablet-free integration via API.",                            status: "coming_soon",  icon: "ShoppingBag" },
  { id: "int7",  name: "Glovo",             category: "Delivery",   description: "Glovo courier integration for same-day delivery.",                      status: "coming_soon",  icon: "Package" },
  { id: "int8",  name: "Stripe",            category: "Payments",   description: "Online card payments, subscriptions, and Connect for marketplaces.",    status: "disconnected", icon: "CreditCard",   config_fields: [{ key: "pk", label: "Publishable key", type: "text" }, { key: "sk", label: "Secret key", type: "password" }] },
  { id: "int9",  name: "PayPal",            category: "Payments",   description: "PayPal checkout for online orders.",                                    status: "disconnected", icon: "DollarSign" },
  { id: "int10", name: "JazzCash",          category: "Payments",   description: "Pakistan mobile wallet payment gateway.",                               status: "disconnected", icon: "Smartphone" },
  { id: "int11", name: "Xero",              category: "Accounting", description: "Daily revenue export, invoices, and bank reconciliation.",              status: "connected",    icon: "FileText",     connected_since: "2026-03-01" },
  { id: "int12", name: "QuickBooks",        category: "Accounting", description: "Automatic sales data sync and expense tracking.",                       status: "disconnected", icon: "Calculator" },
  { id: "int13", name: "Google Analytics",  category: "Analytics",  description: "Track customer behaviour on your public menu pages.",                   status: "connected",    icon: "BarChart2",    connected_since: "2026-01-10" },
  { id: "int14", name: "Meta Pixel",        category: "Analytics",  description: "Facebook & Instagram conversion tracking for ad campaigns.",            status: "disconnected", icon: "Share2" },
  { id: "int15", name: "Stamp Me",          category: "Loyalty",    description: "Digital stamp card loyalty program integration.",                       status: "disconnected", icon: "Stamp" },
];

const INITIAL_WEBHOOKS: Webhook[] = [
  { id: "wh1", url: "https://api.myapp.com/qrmenu/events",  events: ["order.created", "order.completed"], last_delivery: "2m ago",  status: "active"  },
  { id: "wh2", url: "https://erp.company.com/pos/webhook", events: ["order.created"],                     last_delivery: "5h ago", status: "failing" },
];

const WEBHOOK_EVENT_OPTIONS = [
  "order.created",
  "order.updated",
  "order.completed",
  "order.cancelled",
  "item.86d",
  "reservation.created",
];

const CATEGORIES = ["All", "POS", "Delivery", "Payments", "Accounting", "Analytics", "Loyalty", "Webhooks"];

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  SquareIcon,
  Zap,
  Monitor,
  Bike,
  Truck,
  ShoppingBag,
  Package,
  CreditCard,
  DollarSign,
  Smartphone,
  FileText,
  Calculator,
  BarChart2,
  Share2,
  Stamp,
};

function IntegrationIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return <Webhook className={cn("size-6", className)} />;
  return <Icon className={cn("size-6", className)} />;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: IntegrationStatus }) {
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
        <span className="size-1.5 rounded-full bg-green-500" />
        Connected
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
        <XCircle className="size-3" />
        Error — reconnect
      </span>
    );
  }
  if (status === "coming_soon") {
    return (
      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
        Coming soon
      </Badge>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground/40" />
      Not connected
    </span>
  );
}

// ─── Configure Dialog ─────────────────────────────────────────────────────────

function ConfigureDialog({
  integration,
  open,
  onOpenChange,
  onDisconnect,
}: {
  integration: Integration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDisconnect: (id: string) => void;
}) {
  const [autoSync, setAutoSync] = useState(true);
  const [bidirectional, setBidirectional] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IntegrationIcon name={integration.icon} className="size-5" />
            {integration.name}
          </DialogTitle>
          <DialogDescription>{integration.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={integration.status} />
            </div>
            {integration.connected_since && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connected since</span>
                <span>{integration.connected_since}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last sync</span>
              <span>3 minutes ago</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Sync settings</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Auto-sync</p>
                <p className="text-xs text-muted-foreground">Sync data automatically every 15 minutes</p>
              </div>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Bidirectional sync</p>
                <p className="text-xs text-muted-foreground">Push changes back to {integration.name}</p>
              </div>
              <Switch checked={bidirectional} onCheckedChange={setBidirectional} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onDisconnect(integration.id);
              onOpenChange(false);
            }}
          >
            Disconnect
          </Button>
          <DialogClose render={<Button variant="outline" size="sm" />}>
            Close
          </DialogClose>
          <Button
            size="sm"
            onClick={() => {
              toast.success("Settings saved");
              onOpenChange(false);
            }}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Connect Dialog ───────────────────────────────────────────────────────────

function ConnectDialog({
  integration,
  open,
  onOpenChange,
  onConnect,
}: {
  integration: Integration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (id: string) => void;
}) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function handleConnect() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onConnect(integration.id);
      toast.success(`Connected to ${integration.name}`);
      onOpenChange(false);
    }, 800);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IntegrationIcon name={integration.icon} className="size-5" />
            Connect {integration.name}
          </DialogTitle>
          <DialogDescription>{integration.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {integration.config_fields && integration.config_fields.length > 0 ? (
            integration.config_fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label htmlFor={`field-${field.key}`}>{field.label}</Label>
                <Input
                  id={`field-${field.key}`}
                  type={field.type === "password" ? "password" : "text"}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  value={fields[field.key] ?? ""}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Click Connect to authorise {integration.name} via OAuth.
            </p>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" size="sm" />}>
            Cancel
          </DialogClose>
          <Button size="sm" disabled={loading} onClick={handleConnect}>
            {loading ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                Connecting…
              </>
            ) : (
              "Connect"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Integration Card ─────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  onStatusChange,
}: {
  integration: Integration;
  onStatusChange: (id: string, status: IntegrationStatus) => void;
}) {
  const [configOpen, setConfigOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <IntegrationIcon name={integration.icon} className="size-5 text-foreground/70" />
            </div>
            <div>
              <p className="font-medium text-sm leading-tight">{integration.name}</p>
              <Badge variant="secondary" className="mt-0.5 text-xs h-4 px-1.5">
                {integration.category}
              </Badge>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed flex-1">
          {integration.description}
        </p>

        {/* Status */}
        <div className="flex items-center justify-between">
          <StatusBadge status={integration.status} />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {integration.status === "connected" && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setConfigOpen(true)}
            >
              Configure
            </Button>
          )}
          {integration.status === "disconnected" && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setConnectOpen(true)}
            >
              Connect
            </Button>
          )}
          {integration.status === "error" && (
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => setConnectOpen(true)}
            >
              Reconnect
            </Button>
          )}
          {integration.status === "coming_soon" && (
            <Button size="sm" className="flex-1" disabled>
              Coming soon
            </Button>
          )}
        </div>
      </div>

      {integration.status === "connected" && (
        <ConfigureDialog
          integration={integration}
          open={configOpen}
          onOpenChange={setConfigOpen}
          onDisconnect={(id) => onStatusChange(id, "disconnected")}
        />
      )}

      {(integration.status === "disconnected" || integration.status === "error") && (
        <ConnectDialog
          integration={integration}
          open={connectOpen}
          onOpenChange={setConnectOpen}
          onConnect={(id) => onStatusChange(id, "connected")}
        />
      )}
    </>
  );
}

// ─── Add Webhook Dialog ────────────────────────────────────────────────────────

function AddWebhookDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (wh: Webhook) => void;
}) {
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  function toggleEvent(ev: string) {
    setSelectedEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );
  }

  function handleAdd() {
    if (!url.trim() || selectedEvents.length === 0) {
      toast.error("Enter a URL and select at least one event");
      return;
    }
    const newWh: Webhook = {
      id: generateId(),
      url: url.trim(),
      events: selectedEvents,
      last_delivery: "never",
      status: "active",
    };
    onAdd(newWh);
    toast.success("Webhook endpoint added");
    setUrl("");
    setSelectedEvents([]);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add webhook endpoint</DialogTitle>
          <DialogDescription>
            Send real-time event notifications to your server URL.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="wh-url">Endpoint URL</Label>
            <Input
              id="wh-url"
              type="url"
              placeholder="https://your-server.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Events to listen for</Label>
            <div className="space-y-2">
              {WEBHOOK_EVENT_OPTIONS.map((ev) => (
                <label key={ev} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedEvents.includes(ev)}
                    onChange={() => toggleEvent(ev)}
                  />
                  <span className="text-sm font-mono text-muted-foreground">{ev}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" size="sm" />}>
            Cancel
          </DialogClose>
          <Button size="sm" onClick={handleAdd}>
            Add endpoint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Webhooks Section ─────────────────────────────────────────────────────────

function WebhooksSection() {
  const [webhooks, setWebhooks] = useState<Webhook[]>(INITIAL_WEBHOOKS);
  const [addOpen, setAddOpen] = useState(false);

  function handleAdd(wh: Webhook) {
    setWebhooks((prev) => [...prev, wh]);
  }

  function handleDelete(id: string) {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    toast.info("Webhook endpoint removed");
  }

  return (
    <div className="mt-10 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold">Webhooks</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Send real-time events to your own servers.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          Add webhook endpoint
        </Button>
      </div>

      <Separator />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2.5 pr-4 font-medium">URL</th>
              <th className="py-2.5 pr-4 font-medium">Events</th>
              <th className="py-2.5 pr-4 font-medium">Last delivery</th>
              <th className="py-2.5 pr-4 font-medium">Status</th>
              <th className="py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {webhooks.map((wh) => (
              <tr key={wh.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 pr-4">
                  <code className="text-xs font-mono text-foreground/80 max-w-[240px] block truncate">
                    {wh.url}
                  </code>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-1">
                    {wh.events.map((ev) => (
                      <Badge key={ev} variant="secondary" className="text-xs font-mono">
                        {ev}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{wh.last_delivery}</td>
                <td className="py-3 pr-4">
                  {wh.status === "active" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                      <CheckCircle2 className="size-3.5" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                      <AlertCircle className="size-3.5" /> Failing
                    </span>
                  )}
                </td>
                <td className="py-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(wh.id)}
                  >
                    <Trash2 className="size-3.5" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </td>
              </tr>
            ))}
            {webhooks.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  No webhook endpoints yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddWebhookDialog open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  function handleStatusChange(id: string, status: IntegrationStatus) {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              status,
              connected_since: status === "connected" ? new Date().toISOString().slice(0, 10) : undefined,
            }
          : i
      )
    );
  }

  const filtered = integrations.filter((i) => {
    const matchesSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" ||
      activeCategory === "Webhooks" ||
      i.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {connectedCount} of {integrations.length} integrations connected
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search integrations…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as string)}>
        <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0" variant="line">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((cat) => (
          <TabsContent key={cat} value={cat}>
            {cat === "Webhooks" ? (
              <WebhooksSection />
            ) : (
              <>
                {filtered.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground text-sm">
                    No integrations match your search.
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((integration) => (
                      <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
