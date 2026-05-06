"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Bike,
  Car,
  Star,
  Phone,
  MapPin,
  Clock,
  TrendingUp,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  Zap,
  Navigation,
  Package,
  Users,
  AlertCircle,
} from "lucide-react";

import type { Rider, VehicleType, RiderStatus } from "@/types";
import { mockOrders } from "@/mock/orders";
import { cn, formatPrice, generateId } from "@/lib/utils";
import { useT } from "@/lib/i18n";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_RIDERS: Rider[] = [
  {
    id: "r1",
    tenant_id: "t1",
    name: "Ahmed Al-Rashidi",
    name_ar: "أحمد الراشدي",
    phone: "+966 50 123 4567",
    vehicle: "motorcycle",
    status: "on_delivery",
    is_available: true,
    current_order_id: "o4",
    total_deliveries: 247,
    avg_delivery_time: 18,
    rating: 4.8,
    earnings_today: 8500,
    earnings_week: 52000,
    cash_collected: 12000,
    created_at: "2025-01-10T00:00:00Z",
  },
  {
    id: "r2",
    tenant_id: "t1",
    name: "Mohammed Hassan",
    name_ar: "محمد حسن",
    phone: "+966 55 987 6543",
    vehicle: "motorcycle",
    status: "online",
    is_available: true,
    total_deliveries: 183,
    avg_delivery_time: 22,
    rating: 4.6,
    earnings_today: 6200,
    earnings_week: 38000,
    cash_collected: 8500,
    created_at: "2025-02-14T00:00:00Z",
  },
  {
    id: "r3",
    tenant_id: "t1",
    name: "Khalid Ibrahim",
    name_ar: "خالد إبراهيم",
    phone: "+966 54 456 7890",
    vehicle: "bicycle",
    status: "online",
    is_available: true,
    total_deliveries: 96,
    avg_delivery_time: 25,
    rating: 4.5,
    earnings_today: 4100,
    earnings_week: 24000,
    cash_collected: 5200,
    created_at: "2025-03-20T00:00:00Z",
  },
  {
    id: "r4",
    tenant_id: "t1",
    name: "Yusuf Al-Qahtani",
    name_ar: "يوسف القحطاني",
    phone: "+966 56 321 0987",
    vehicle: "car",
    status: "offline",
    is_available: false,
    total_deliveries: 312,
    avg_delivery_time: 28,
    rating: 4.7,
    earnings_today: 0,
    earnings_week: 61000,
    cash_collected: 0,
    created_at: "2024-11-05T00:00:00Z",
  },
  {
    id: "r5",
    tenant_id: "t1",
    name: "Omar Bin Nasser",
    name_ar: "عمر بن ناصر",
    phone: "+966 59 654 3210",
    vehicle: "motorcycle",
    status: "on_delivery",
    is_available: true,
    total_deliveries: 158,
    avg_delivery_time: 20,
    rating: 4.9,
    earnings_today: 7300,
    earnings_week: 45000,
    cash_collected: 9800,
    created_at: "2025-04-01T00:00:00Z",
  },
];

// Mock active deliveries tied to riders
interface ActiveDeliveryItem {
  id: string;
  order_number: string;
  customer_name: string;
  address: string;
  rider_id: string;
  eta_minutes: number;
  status: "assigned" | "picked_up" | "near_destination";
}

const INITIAL_ACTIVE_DELIVERIES: ActiveDeliveryItem[] = [
  {
    id: "ad1",
    order_number: "#004",
    customer_name: "John Smith",
    address: "789 Park Ave, New York",
    rider_id: "r1",
    eta_minutes: 12,
    status: "picked_up",
  },
  {
    id: "ad2",
    order_number: "#007",
    customer_name: "Fatima Al-Zahrani",
    address: "123 King Fahad Rd, Riyadh",
    rider_id: "r5",
    eta_minutes: 6,
    status: "near_destination",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const VEHICLE_EMOJI: Record<VehicleType, string> = {
  motorcycle: "🏍️",
  bicycle: "🚲",
  car: "🚗",
};

function VehicleIcon({ type, className }: { type: VehicleType; className?: string }) {
  if (type === "car") return <Car className={className} />;
  return <Bike className={className} />;
}

const STATUS_COLORS: Record<RiderStatus, string> = {
  online:      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  offline:     "bg-zinc-100  text-zinc-600  dark:bg-zinc-800     dark:text-zinc-400",
  on_delivery: "bg-blue-100  text-blue-800  dark:bg-blue-900/30  dark:text-blue-400",
};

const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-green-500",
  "bg-amber-500", "bg-rose-500", "bg-cyan-500",
];

function avatarColor(id: string): string {
  const idx = id.charCodeAt(id.length - 1) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function StarRating({ rating }: { rating: number }) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} className="size-3 fill-current" />
      ))}
      {half && <Star key="h" className="size-3 fill-current opacity-50" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} className="size-3 text-muted-foreground/30" />
      ))}
      <span className="ms-1 text-xs font-semibold text-foreground">{rating.toFixed(1)}</span>
    </span>
  );
}

// ─── Rider Form Sheet ─────────────────────────────────────────────────────────

interface RiderFormValues {
  name: string;
  name_ar: string;
  phone: string;
  vehicle: VehicleType;
  auto_assign: boolean;
}

const EMPTY_FORM: RiderFormValues = {
  name: "",
  name_ar: "",
  phone: "",
  vehicle: "motorcycle",
  auto_assign: false,
};

function RiderSheet({
  open,
  onOpenChange,
  editing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Rider | null;
  onSave: (values: RiderFormValues) => void;
}) {
  const t = useT();
  const [form, setForm] = useState<RiderFormValues>(() =>
    editing
      ? {
          name: editing.name,
          name_ar: editing.name_ar ?? "",
          phone: editing.phone,
          vehicle: editing.vehicle,
          auto_assign: false,
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RiderFormValues, string>>>({});

  // Sync form when editing target changes
  const prevEditingId = editing?.id;
  if (open && editing && editing.id !== prevEditingId) {
    setForm({
      name: editing.name,
      name_ar: editing.name_ar ?? "",
      phone: editing.phone,
      vehicle: editing.vehicle,
      auto_assign: false,
    });
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.phone.trim()) next.phone = "Phone is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    onSave(form);
    onOpenChange(false);
    setForm(EMPTY_FORM);
    setErrors({});
  }

  function handleOpenChange(v: boolean) {
    if (!v) {
      setForm(editing
        ? { name: editing.name, name_ar: editing.name_ar ?? "", phone: editing.phone, vehicle: editing.vehicle, auto_assign: false }
        : EMPTY_FORM
      );
      setErrors({});
    }
    onOpenChange(v);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>{editing ? t.rdr_editRider : t.rdr_addRider}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 p-4">
          {/* Name EN */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rdr-name">{t.rdr_riderName} *</Label>
            <Input
              id="rdr-name"
              placeholder={t.rdr_namePlaceholder}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Name AR */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rdr-name-ar">{t.rdr_riderNameAr}</Label>
            <Input
              id="rdr-name-ar"
              dir="rtl"
              placeholder={t.rdr_nameArPlaceholder}
              value={form.name_ar}
              onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rdr-phone">{t.rdr_phone} *</Label>
            <Input
              id="rdr-phone"
              type="tel"
              placeholder={t.rdr_phonePlaceholder}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          {/* Vehicle */}
          <div className="flex flex-col gap-1.5">
            <Label>{t.rdr_vehicle}</Label>
            <Select
              value={form.vehicle}
              onValueChange={(v) => setForm((f) => ({ ...f, vehicle: v as VehicleType }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="motorcycle">
                  <span className="flex items-center gap-2">
                    <span>🏍️</span>{t.rdr_motorcycle}
                  </span>
                </SelectItem>
                <SelectItem value="bicycle">
                  <span className="flex items-center gap-2">
                    <span>🚲</span>{t.rdr_bicycle}
                  </span>
                </SelectItem>
                <SelectItem value="car">
                  <span className="flex items-center gap-2">
                    <span>🚗</span>{t.rdr_car}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auto-assign toggle */}
          <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{t.rdr_autoAssign}</span>
              <span className="text-xs text-muted-foreground">{t.rdr_autoAssignDesc}</span>
            </div>
            <Switch
              checked={form.auto_assign}
              onCheckedChange={(v) => setForm((f) => ({ ...f, auto_assign: v }))}
            />
          </div>
        </div>

        <SheetFooter className="border-t border-border pt-4 flex-row gap-2 justify-end">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            {t.rdr_cancel}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : t.rdr_save}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────

function DeleteRiderDialog({
  open,
  onOpenChange,
  rider,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rider: Rider | null;
  onConfirm: () => void;
}) {
  const t = useT();
  if (!rider) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.rdr_deleteRider}</DialogTitle>
          <DialogDescription>
            <strong>{rider.name}</strong> — {t.rdr_deleteConfirm}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            {t.rdr_cancel}
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={() => { onConfirm(); onOpenChange(false); }}
          >
            {t.rdr_deleteRider}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ riders, unassignedCount }: { riders: Rider[]; unassignedCount: number }) {
  const t = useT();
  const activeCount      = riders.filter((r) => r.status !== "offline").length;
  const onDeliveryCount  = riders.filter((r) => r.status === "on_delivery").length;
  const todayDeliveries  = riders.reduce((acc, r) => acc + (r.status !== "offline" ? Math.floor(r.total_deliveries / 30) : 0), 0);

  const stats = [
    {
      label: t.rdr_online,
      value: activeCount,
      icon: <CheckCircle2 className="size-4 text-green-500" />,
      valueClass: "text-green-600 dark:text-green-400",
    },
    {
      label: t.rdr_onDelivery,
      value: onDeliveryCount,
      icon: <Navigation className="size-4 text-blue-500" />,
      valueClass: "text-blue-600 dark:text-blue-400",
    },
    {
      label: t.rdr_deliveries + " " + t.rdr_today,
      value: todayDeliveries,
      icon: <Package className="size-4 text-primary" />,
      valueClass: "text-foreground",
    },
    {
      label: t.rdr_pendingAssignment,
      value: unassignedCount,
      icon: <AlertCircle className={cn("size-4", unassignedCount > 0 ? "text-amber-500" : "text-muted-foreground")} />,
      valueClass: unassignedCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label} size="sm">
          <CardContent className="flex items-center gap-3 py-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
              {s.icon}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className={cn("text-xl font-bold leading-none", s.valueClass)}>
                {s.value}
              </span>
              <span className="text-xs text-muted-foreground truncate">{s.label}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Rider Card ───────────────────────────────────────────────────────────────

function RiderCard({
  rider,
  onEdit,
  onDelete,
  onAssign,
  onToggleAvailability,
  t,
}: {
  rider: Rider;
  onEdit: (r: Rider) => void;
  onDelete: (r: Rider) => void;
  onAssign: (r: Rider) => void;
  onToggleAvailability: (id: string) => void;
  t: ReturnType<typeof useT>;
}) {
  const statusLabel: Record<RiderStatus, string> = {
    online:      t.rdr_online,
    offline:     t.rdr_offline,
    on_delivery: t.rdr_onDelivery,
  };

  const todayDeliveries = Math.floor(rider.total_deliveries / 30);

  return (
    <Card className="flex flex-col gap-0 overflow-hidden">
      {/* Header strip */}
      <div className={cn(
        "h-1 w-full",
        rider.status === "online"      ? "bg-green-400"        :
        rider.status === "on_delivery" ? "bg-blue-400"         :
                                         "bg-zinc-300 dark:bg-zinc-600"
      )} />

      <CardContent className="flex flex-col gap-3 p-4">
        {/* Top row: avatar + info + status */}
        <div className="flex items-start gap-3">
          <Avatar className="size-11 flex-shrink-0">
            <AvatarFallback className={cn("text-white text-sm font-semibold", avatarColor(rider.id))}>
              {getInitials(rider.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight truncate">{rider.name}</p>
                {rider.name_ar && (
                  <p dir="rtl" className="text-xs text-muted-foreground mt-0.5">
                    ({rider.name_ar})
                  </p>
                )}
              </div>
              {/* Status badge */}
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium flex-shrink-0",
                STATUS_COLORS[rider.status]
              )}>
                {rider.status === "on_delivery" && (
                  <span className="relative flex size-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-blue-500" />
                  </span>
                )}
                {statusLabel[rider.status]}
              </span>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-1 mt-1">
              <Phone className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{rider.phone}</span>
            </div>

            {/* Vehicle */}
            <div className="flex items-center gap-1 mt-0.5">
              <VehicleIcon type={rider.vehicle} className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground capitalize">
                {VEHICLE_EMOJI[rider.vehicle]} {t[`rdr_${rider.vehicle}` as "rdr_motorcycle" | "rdr_bicycle" | "rdr_car"]}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">{todayDeliveries}</span>
            <span className="text-[10px] text-muted-foreground">{t.rdr_today}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">{formatPrice(rider.earnings_today)}</span>
            <span className="text-[10px] text-muted-foreground">{t.rdr_earnings}</span>
          </div>
          <div className="flex flex-col gap-0.5 items-center">
            <StarRating rating={rider.rating ?? 5} />
            <span className="text-[10px] text-muted-foreground">{t.rdr_rating}</span>
          </div>
        </div>

        <Separator />

        {/* Bottom row: availability + actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={rider.is_available}
              onCheckedChange={() => onToggleAvailability(rider.id)}
              size="sm"
            />
            <span className="text-xs text-muted-foreground">
              {rider.is_available ? t.rdr_available : t.rdr_busy}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              title={t.rdr_assign}
              onClick={() => onAssign(rider)}
              disabled={rider.status === "offline" || !rider.is_available}
            >
              <Zap className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              title={t.rdr_editRider}
              onClick={() => onEdit(rider)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              title={t.rdr_deleteRider}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(rider)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Active Deliveries Panel ──────────────────────────────────────────────────

function ActiveDeliveriesPanel({
  deliveries,
  riders,
  unassignedOrders,
  onAssignOrder,
  t,
}: {
  deliveries: ActiveDeliveryItem[];
  riders: Rider[];
  unassignedOrders: typeof mockOrders;
  onAssignOrder: (orderId: string, riderId: string) => void;
  t: ReturnType<typeof useT>;
}) {
  const deliveryStatusLabel: Record<ActiveDeliveryItem["status"], string> = {
    assigned:         "Assigned",
    picked_up:        "Picked Up",
    near_destination: "Near Destination",
  };

  const deliveryStatusColor: Record<ActiveDeliveryItem["status"], string> = {
    assigned:         "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    picked_up:        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    near_destination: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };

  const availableRiders = riders.filter((r) => r.status === "online" && r.is_available);

  return (
    <div className="flex flex-col gap-4">
      {/* Active deliveries */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">{t.rdr_assignedOrders}</h2>
          <Badge variant="outline" className="text-[11px]">{deliveries.length}</Badge>
        </div>

        {deliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
            <Navigation className="size-7 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t.rdr_noActiveDeliveries}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {deliveries.map((del) => {
              const riderName = riders.find((r) => r.id === del.rider_id)?.name ?? "—";
              return (
                <div
                  key={del.id}
                  className="rounded-xl border border-border bg-card p-3 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">{del.order_number}</span>
                        <span className={cn(
                          "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                          deliveryStatusColor[del.status]
                        )}>
                          {deliveryStatusLabel[del.status]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{del.customer_name}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 text-primary text-xs font-semibold">
                      <Clock className="size-3" />
                      {del.eta_minutes} {t.rdr_minutes}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3 flex-shrink-0" />
                    <span className="truncate">{del.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Navigation className="size-3 text-primary flex-shrink-0" />
                    <span className="font-medium">{riderName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Unassigned orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">{t.rdr_pendingAssignment}</h2>
          {unassignedOrders.length > 0 && (
            <Badge className="text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0">
              {unassignedOrders.length}
            </Badge>
          )}
        </div>

        {unassignedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
            <CheckCircle2 className="size-7 text-green-400" />
            <p className="text-sm text-muted-foreground">{t.rdr_noOrdersToAssign}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {unassignedOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-3 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {order.customer_name ?? "Customer"}
                    </p>
                    {order.delivery_address && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                        <MapPin className="size-3 flex-shrink-0" />
                        <span className="truncate">{order.delivery_address}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground flex-shrink-0">
                    {formatPrice(order.total)}
                  </span>
                </div>

                {/* Rider assign dropdown */}
                <Select
                  onValueChange={(riderId) => onAssignOrder(order.id, riderId as string)}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder={t.rdr_assign} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRiders.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">{t.rdr_noRiders}</div>
                    ) : (
                      availableRiders.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {VEHICLE_EMOJI[r.vehicle]} {r.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Performance Tab ──────────────────────────────────────────────────────────

function PerformanceTab({ riders, t }: { riders: Rider[]; t: ReturnType<typeof useT> }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">{t.rdr_performance}</h2>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground">Rider</th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground text-right">{t.rdr_totalOrders}</th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground text-right">{t.rdr_avgDeliveryTime}</th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground text-right">{t.rdr_cashCollected}</th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground text-right">{t.rdr_earnings} ({t.rdr_thisWeek})</th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground text-right">{t.rdr_rating}</th>
            </tr>
          </thead>
          <tbody>
            {riders.map((rider) => (
              <tr key={rider.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8">
                      <AvatarFallback className={cn("text-white text-xs font-semibold", avatarColor(rider.id))}>
                        {getInitials(rider.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-tight">{rider.name}</p>
                      {rider.name_ar && (
                        <p dir="rtl" className="text-xs text-muted-foreground">({rider.name_ar})</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm font-medium text-right">{rider.total_deliveries}</td>
                <td className="py-3 px-4 text-right">
                  <span className="flex items-center justify-end gap-1 text-sm">
                    <Clock className="size-3 text-muted-foreground" />
                    {rider.avg_delivery_time ?? "—"} {t.rdr_minutes}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-right">
                  <span className="flex items-center justify-end gap-1">
                    <DollarSign className="size-3 text-muted-foreground" />
                    {formatPrice(rider.cash_collected)}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm font-medium text-right text-green-600 dark:text-green-400">
                  {formatPrice(rider.earnings_week)}
                </td>
                <td className="py-3 px-4 text-right">
                  <StarRating rating={rider.rating ?? 5} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden flex flex-col gap-3">
        {riders.map((rider) => (
          <Card key={rider.id} size="sm">
            <CardContent className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <Avatar className="size-9">
                  <AvatarFallback className={cn("text-white text-sm font-semibold", avatarColor(rider.id))}>
                    {getInitials(rider.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{rider.name}</p>
                  {rider.name_ar && (
                    <p dir="rtl" className="text-xs text-muted-foreground">({rider.name_ar})</p>
                  )}
                </div>
                <StarRating rating={rider.rating ?? 5} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col gap-0.5 bg-muted/40 rounded-lg p-2">
                  <span className="text-muted-foreground">{t.rdr_totalOrders}</span>
                  <span className="font-semibold text-sm">{rider.total_deliveries}</span>
                </div>
                <div className="flex flex-col gap-0.5 bg-muted/40 rounded-lg p-2">
                  <span className="text-muted-foreground">{t.rdr_avgDeliveryTime}</span>
                  <span className="font-semibold text-sm">{rider.avg_delivery_time ?? "—"} {t.rdr_minutes}</span>
                </div>
                <div className="flex flex-col gap-0.5 bg-muted/40 rounded-lg p-2">
                  <span className="text-muted-foreground">{t.rdr_cashCollected}</span>
                  <span className="font-semibold text-sm">{formatPrice(rider.cash_collected)}</span>
                </div>
                <div className="flex flex-col gap-0.5 bg-muted/40 rounded-lg p-2">
                  <span className="text-muted-foreground">{t.rdr_earnings} ({t.rdr_thisWeek})</span>
                  <span className="font-semibold text-sm text-green-600 dark:text-green-400">{formatPrice(rider.earnings_week)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RidersPage() {
  const t = useT();

  const [riders, setRiders] = useState<Rider[]>(INITIAL_RIDERS);
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDeliveryItem[]>(INITIAL_ACTIVE_DELIVERIES);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingRider, setDeletingRider] = useState<Rider | null>(null);

  // Unassigned delivery orders from mock (those not already assigned to a rider)
  const assignedOrderIds = new Set(activeDeliveries.map((d) => d.order_number));
  const unassignedOrders = mockOrders.filter(
    (o) => o.order_type === "delivery" && !assignedOrderIds.has(o.order_number)
  );

  function handleOpenAdd() {
    setEditingRider(null);
    setSheetOpen(true);
  }

  function handleEdit(rider: Rider) {
    setEditingRider(rider);
    setSheetOpen(true);
  }

  function handleDelete(rider: Rider) {
    setDeletingRider(rider);
    setDeleteOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deletingRider) return;
    setRiders((prev) => prev.filter((r) => r.id !== deletingRider.id));
    toast.success(`${deletingRider.name} removed`);
    setDeletingRider(null);
  }

  function handleSaveRider(values: { name: string; name_ar: string; phone: string; vehicle: VehicleType }) {
    if (editingRider) {
      setRiders((prev) =>
        prev.map((r) =>
          r.id === editingRider.id
            ? { ...r, name: values.name, name_ar: values.name_ar || undefined, phone: values.phone, vehicle: values.vehicle }
            : r
        )
      );
      toast.success(`${values.name} updated`);
    } else {
      const newRider: Rider = {
        id: generateId(),
        tenant_id: "t1",
        name: values.name,
        name_ar: values.name_ar || undefined,
        phone: values.phone,
        vehicle: values.vehicle,
        status: "offline",
        is_available: false,
        total_deliveries: 0,
        avg_delivery_time: 0,
        rating: 5.0,
        earnings_today: 0,
        earnings_week: 0,
        cash_collected: 0,
        created_at: new Date().toISOString(),
      };
      setRiders((prev) => [...prev, newRider]);
      toast.success(`${values.name} added`);
    }
  }

  function handleToggleAvailability(id: string) {
    setRiders((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, is_available: !r.is_available, status: r.is_available ? "offline" : "online" }
          : r
      )
    );
  }

  function handleAssignRider(rider: Rider) {
    if (unassignedOrders.length === 0) {
      toast.info(t.rdr_noOrdersToAssign);
      return;
    }
    const order = unassignedOrders[0];
    const newDelivery: ActiveDeliveryItem = {
      id: generateId(),
      order_number: order.order_number,
      customer_name: order.customer_name ?? "Customer",
      address: order.delivery_address ?? "—",
      rider_id: rider.id,
      eta_minutes: rider.avg_delivery_time ?? 25,
      status: "assigned",
    };
    setActiveDeliveries((prev) => [...prev, newDelivery]);
    setRiders((prev) =>
      prev.map((r) => r.id === rider.id ? { ...r, status: "on_delivery", current_order_id: order.id } : r)
    );
    toast.success(`${order.order_number} assigned to ${rider.name}`);
  }

  function handleAssignOrder(orderId: string, riderId: string) {
    const order = mockOrders.find((o) => o.id === orderId);
    const rider = riders.find((r) => r.id === riderId);
    if (!order || !rider) return;

    const newDelivery: ActiveDeliveryItem = {
      id: generateId(),
      order_number: order.order_number,
      customer_name: order.customer_name ?? "Customer",
      address: order.delivery_address ?? "—",
      rider_id: riderId,
      eta_minutes: rider.avg_delivery_time ?? 25,
      status: "assigned",
    };
    setActiveDeliveries((prev) => [...prev, newDelivery]);
    setRiders((prev) =>
      prev.map((r) => r.id === riderId ? { ...r, status: "on_delivery", current_order_id: orderId } : r)
    );
    toast.success(`${order.order_number} assigned to ${rider.name}`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Navigation className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold">{t.rdr_pageTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {riders.filter((r) => r.status !== "offline").length} {t.rdr_online.toLowerCase()} · {riders.length} total
            </p>
          </div>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="size-4" />
          {t.rdr_addRider}
        </Button>
      </div>

      {/* Stats bar */}
      <StatsBar riders={riders} unassignedCount={unassignedOrders.length} />

      {/* Main tabs */}
      <Tabs defaultValue="riders">
        <TabsList>
          <TabsTrigger value="riders">
            <Users className="size-4" />
            {t.rdr_pageTitle}
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="size-4" />
            {t.rdr_performance}
          </TabsTrigger>
        </TabsList>

        {/* Riders tab — split layout */}
        <TabsContent value="riders">
          <div className="flex flex-col xl:flex-row gap-6 mt-2">
            {/* Left: Rider grid (60%) */}
            <div className="flex-1 xl:w-[60%]">
              {riders.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <Users className="size-7 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="font-medium">{t.rdr_noRiders}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t.rdr_addFirstRider}</p>
                  </div>
                  <Button size="sm" onClick={handleOpenAdd}>
                    <Plus className="size-4" />{t.rdr_addRider}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {riders.map((rider) => (
                    <RiderCard
                      key={rider.id}
                      rider={rider}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onAssign={handleAssignRider}
                      onToggleAvailability={handleToggleAvailability}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right: Active deliveries panel (40%) */}
            <div className="xl:w-[40%] xl:max-w-sm w-full">
              <div className="rounded-2xl border border-border bg-card p-4 xl:sticky xl:top-6">
                <ActiveDeliveriesPanel
                  deliveries={activeDeliveries}
                  riders={riders}
                  unassignedOrders={unassignedOrders}
                  onAssignOrder={handleAssignOrder}
                  t={t}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Performance tab */}
        <TabsContent value="performance">
          <div className="mt-2">
            <PerformanceTab riders={riders} t={t} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Add / Edit Sheet */}
      <RiderSheet
        open={sheetOpen}
        onOpenChange={(v) => {
          setSheetOpen(v);
          if (!v) setEditingRider(null);
        }}
        editing={editingRider}
        onSave={handleSaveRider}
      />

      {/* Delete Dialog */}
      <DeleteRiderDialog
        open={deleteOpen}
        onOpenChange={(v) => { setDeleteOpen(v); if (!v) setDeletingRider(null); }}
        rider={deletingRider}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
