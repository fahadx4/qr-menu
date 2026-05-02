"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Flame, Zap, Snowflake, Wine, Plus, Pencil, Wifi, X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

type StationType = "KDS Screen" | "Thermal Printer" | "Both";

interface Station {
  id: string;
  name: string;
  icon: React.ElementType;
  type: StationType;
  color: string;
  items: string[];
  ip: string;
  enabled: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const ALL_MENU_ITEMS = [
  "Beef Burger",
  "Chicken Sandwich",
  "BBQ Ribs",
  "French Fries",
  "Onion Rings",
  "Chicken Wings",
  "Caesar Salad",
  "Coleslaw",
  "Mojito",
  "Lemonade",
  "Iced Tea",
  "Garlic Bread",
  "Mushroom Soup",
  "Chocolate Lava Cake",
];

const INITIAL_STATIONS: Station[] = [
  {
    id: "s1",
    name: "Grill Station",
    icon: Flame,
    type: "KDS Screen",
    color: "#ef4444",
    items: ["Beef Burger", "Chicken Sandwich", "BBQ Ribs"],
    ip: "192.168.1.101",
    enabled: true,
  },
  {
    id: "s2",
    name: "Fryer Station",
    icon: Zap,
    type: "Thermal Printer",
    color: "#f59e0b",
    items: ["French Fries", "Onion Rings", "Chicken Wings"],
    ip: "192.168.1.102",
    enabled: true,
  },
  {
    id: "s3",
    name: "Cold Station",
    icon: Snowflake,
    type: "KDS Screen",
    color: "#3b82f6",
    items: ["Caesar Salad", "Coleslaw"],
    ip: "192.168.1.103",
    enabled: true,
  },
  {
    id: "s4",
    name: "Bar Station",
    icon: Wine,
    type: "Thermal Printer",
    color: "#8b5cf6",
    items: ["Mojito", "Lemonade", "Iced Tea"],
    ip: "192.168.1.104",
    enabled: false,
  },
];

type CategoryRouting = {
  category: string;
  stationId: string;
};

const INITIAL_ROUTING: CategoryRouting[] = [
  { category: "Mains",      stationId: "s1" },
  { category: "Sides",      stationId: "s2" },
  { category: "Starters",   stationId: "s3" },
  { category: "Beverages",  stationId: "s4" },
  { category: "Desserts",   stationId: ""   },
];

interface DiscoveredPrinter {
  name: string;
  ip: string;
  type: string;
  online: boolean;
}

const DISCOVERED_PRINTERS: DiscoveredPrinter[] = [
  { name: "Kitchen Printer A", ip: "192.168.1.101", type: "Thermal",  online: true  },
  { name: "Bar Printer",       ip: "192.168.1.104", type: "Thermal",  online: true  },
  { name: "Office Printer",    ip: "192.168.1.200", type: "Laser",    online: false },
];

// ─── Station sheet form ───────────────────────────────────────────────────────

interface StationFormState {
  name: string;
  type: StationType;
  color: string;
  items: string[];
  ip: string;
}

function StationSheet({
  open, onOpenChange, initial, onSave, mode,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  initial: StationFormState | null; onSave: (data: StationFormState) => void; mode: "create" | "edit";
}) {
  const t = useT();
  const blank: StationFormState = {
    name: "",
    type: "KDS Screen",
    color: "#6366f1",
    items: [],
    ip: "",
  };

  const [form, setForm] = useState<StationFormState>(initial ?? blank);

  // Sync form when panel opens with new data
  React.useEffect(() => {
    if (open) setForm(initial ?? blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggleItem(item: string) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.includes(item)
        ? prev.items.filter((i) => i !== item)
        : [...prev.items, item],
    }));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>{mode === "create" ? t.prt_addStationTitle : t.prt_editStationTitle}</SheetTitle>
          <SheetDescription>{mode === "create" ? t.prt_addStationDesc : t.prt_editStationDesc}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="station-name">{t.prt_stationName}</Label>
            <Input
              id="station-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Grill Station"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t.prt_displayType}</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((p) => ({ ...p, type: v as StationType }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KDS Screen">KDS Screen</SelectItem>
                <SelectItem value="Thermal Printer">Thermal Printer</SelectItem>
                <SelectItem value="Both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="station-color">{t.prt_displayColor}</Label>
            <div className="flex items-center gap-3">
              <input
                id="station-color"
                type="color"
                value={form.color}
                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                className="h-9 w-14 cursor-pointer rounded-lg border border-input bg-transparent p-1 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
              <span className="text-sm font-mono text-muted-foreground">{form.color}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="station-ip">{t.prt_ipAddress}</Label>
            <Input
              id="station-ip"
              value={form.ip}
              onChange={(e) => setForm((p) => ({ ...p, ip: e.target.value }))}
              placeholder="e.g. 192.168.1.101"
            />
          </div>

          <div>
            <Button variant="outline" size="sm" onClick={() => toast.info(t.prt_toastTestPrint)}>
              {t.prt_testPrint}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>{t.prt_assignedItems}</Label>
            <div className="rounded-lg border border-border bg-muted/30 divide-y divide-border max-h-60 overflow-y-auto">
              {ALL_MENU_ITEMS.map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={form.items.includes(item)}
                    onChange={() => toggleItem(item)}
                    className="accent-primary h-4 w-4 rounded"
                  />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="border-t border-border pt-4 flex-row gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.dashCancel}</Button>
          <Button onClick={() => {
            if (!form.name.trim()) { toast.error(t.prt_stationNameRequired); return; }
            onSave(form); onOpenChange(false);
          }}>
            {mode === "create" ? t.prt_addStation : t.dashSave}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PrintersPage() {
  const t = useT();
  const [stations, setStations] = useState<Station[]>(INITIAL_STATIONS);
  const [routing, setRouting] = useState<CategoryRouting[]>(INITIAL_ROUTING);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetInitial, setSheetInitial] = useState<{
    name: string;
    type: StationType;
    color: string;
    items: string[];
    ip: string;
  } | null>(null);

  function openCreate() {
    setSheetMode("create");
    setEditingId(null);
    setSheetInitial(null);
    setSheetOpen(true);
  }

  function openEdit(s: Station) {
    setSheetMode("edit");
    setEditingId(s.id);
    setSheetInitial({
      name: s.name,
      type: s.type,
      color: s.color,
      items: s.items,
      ip: s.ip,
    });
    setSheetOpen(true);
  }

  function handleSave(data: {
    name: string;
    type: StationType;
    color: string;
    items: string[];
    ip: string;
  }) {
    if (sheetMode === "create") {
      const newStation: Station = {
        id: `s${Date.now()}`,
        name: data.name,
        icon: Zap,
        type: data.type,
        color: data.color,
        items: data.items,
        ip: data.ip,
        enabled: true,
      };
      setStations((prev) => [...prev, newStation]);
      toast.success(`${t.prt_addStation}: "${data.name}"`);
    } else if (editingId) {
      setStations((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? { ...s, ...data }
            : s
        )
      );
      toast.success(t.set_toastAllSaved);
    }
  }

  function toggleStation(id: string) {
    setStations((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }

  function updateRouting(category: string, stationId: string) {
    setRouting((prev) =>
      prev.map((r) => (r.category === category ? { ...r, stationId } : r))
    );
  }

  function saveRouting() {
    toast.success(t.prt_toastRoutingSaved);
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t.prt_pageTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t.prt_pageSubtitle}</p>
        </div>
        <Button onClick={openCreate} className="gap-2 flex-shrink-0">
          <Plus className="h-4 w-4" />{t.prt_addStation}
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t.prt_stationsSection}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stations.map((station) => {
            const Icon = station.icon;
            return (
              <div
                key={station.id}
                className={cn(
                  "rounded-xl border border-border bg-card p-4 space-y-3 transition-opacity",
                  !station.enabled && "opacity-60"
                )}
              >
                {/* Top row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${station.color}20` }}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: station.color }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{station.name}</p>
                      <Badge
                        variant="outline"
                        className="mt-0.5 text-[10px] h-4 px-1.5"
                      >
                        {station.type}
                      </Badge>
                    </div>
                  </div>
                  <Switch
                    checked={station.enabled}
                    onCheckedChange={() => toggleStation(station.id)}
                    size="sm"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {station.items.length} {station.items.length !== 1 ? t.prt_itemsAssigned : t.prt_itemAssigned}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => openEdit(station)} className="h-7 text-xs gap-1.5">
                    <Pencil className="h-3 w-3" />{t.dashEdit}
                  </Button>
                </div>

                {/* Items preview */}
                {station.items.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {station.items.slice(0, 4).map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {item}
                      </span>
                    ))}
                    {station.items.length > 4 && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        +{station.items.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t.prt_routingSection}</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="hidden sm:grid grid-cols-2 gap-4 px-4 py-2.5 border-b border-border text-xs font-medium text-muted-foreground">
            <span>{t.prt_colMenuCategory}</span>
            <span>{t.prt_colDefaultStation}</span>
          </div>
          {routing.map((row, idx) => (
            <div
              key={row.category}
              className={cn(
                "grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 py-3 items-center",
                idx !== 0 && "border-t border-border"
              )}
            >
              <span className="text-sm font-medium">{row.category}</span>
              <Select
                value={row.stationId}
                onValueChange={(v) => updateRouting(row.category, v as string)}
              >
                <SelectTrigger className="w-full sm:w-52 h-8">
                  <SelectValue placeholder="{t.prt_noPreference}" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t.prt_noPreference}</SelectItem>
                  {stations.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="flex justify-end px-4 py-3 border-t border-border">
            <Button onClick={saveRouting} size="sm">{t.prt_saveRouting}</Button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t.prt_networkSection}</h2>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info(t.prt_toastScanning)}>
            <Wifi className="h-4 w-4" />{t.prt_discoverPrinters}
          </Button>
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-border text-xs font-medium text-muted-foreground">
            <span>{t.prt_colName}</span>
            <span>{t.prt_colIp}</span>
            <span>{t.prt_colType}</span>
            <span>{t.prt_colStatus}</span>
            <span></span>
          </div>
          {DISCOVERED_PRINTERS.map((printer, idx) => (
            <div
              key={printer.ip}
              className={cn(
                "grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-x-4 gap-y-1 px-4 py-3 items-center",
                idx !== 0 && "border-t border-border"
              )}
            >
              <span className="text-sm font-medium">{printer.name}</span>
              <span className="text-sm font-mono text-muted-foreground">{printer.ip}</span>
              <span className="text-xs text-muted-foreground">{printer.type}</span>
              <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", printer.online ? "text-green-600 dark:text-green-400" : "text-red-500")}>
                <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", printer.online ? "bg-green-500" : "bg-red-500")} />
                {printer.online ? t.prt_online : t.prt_offline}
              </span>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.info(`${t.prt_testPrint}: ${printer.name}`)}>
                {t.prt_test}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Sheet */}
      <StationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        initial={sheetInitial}
        onSave={handleSave}
        mode={sheetMode}
      />
    </div>
  );
}
