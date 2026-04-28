"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  MapPin,
  Plus,
  MoreHorizontal,
  Truck,
  Clock,
  Users,
  RefreshCw,
  Phone,
  Package,
  CheckCircle2,
  Circle,
} from "lucide-react";

import { cn, formatPrice, generateId } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ─── Types ────────────────────────────────────────────────────────────────────

type ZoneFeeType = "flat" | "per_km" | "tiered";

interface DeliveryZone {
  id: string;
  name: string;
  radius_km: number;
  min_order: number;
  delivery_fee: number;
  fee_type: ZoneFeeType;
  estimated_time: number;
  active: boolean;
}

type DriverStatus = "available" | "on_delivery" | "offline" | "break";

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: DriverStatus;
  deliveries_today: number;
  active_order?: string;
  rating: number;
  joined: string;
}

interface ActiveDelivery {
  id: string;
  order_number: string;
  customer_name: string;
  customer_address: string;
  driver_id: string;
  driver_name: string;
  status: "assigned" | "picked_up" | "near_destination" | "delivered";
  assigned_at: string;
  picked_up_at?: string;
  eta_minutes: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockZones: DeliveryZone[] = [
  { id: "z1", name: "Downtown (0-2km)",  radius_km: 2,  min_order: 1000, delivery_fee: 199, fee_type: "flat", estimated_time: 20, active: true },
  { id: "z2", name: "Midtown (2-5km)",   radius_km: 5,  min_order: 1500, delivery_fee: 299, fee_type: "flat", estimated_time: 30, active: true },
  { id: "z3", name: "Uptown (5-10km)",   radius_km: 10, min_order: 2500, delivery_fee: 499, fee_type: "flat", estimated_time: 45, active: true },
  { id: "z4", name: "Suburbs (10-20km)", radius_km: 20, min_order: 5000, delivery_fee: 799, fee_type: "flat", estimated_time: 60, active: false },
];

const mockDrivers: Driver[] = [
  { id: "d1", name: "Marco Rossi",  phone: "+1 555 0201", vehicle: "Motorcycle", status: "on_delivery", deliveries_today: 8, active_order: "#1042", rating: 4.9, joined: "2025-03-01" },
  { id: "d2", name: "Ali Hassan",   phone: "+1 555 0202", vehicle: "Bicycle",    status: "available",   deliveries_today: 5, rating: 4.7, joined: "2025-06-15" },
  { id: "d3", name: "Jenny Park",   phone: "+1 555 0203", vehicle: "Motorcycle", status: "break",       deliveries_today: 6, rating: 4.8, joined: "2025-01-20" },
  { id: "d4", name: "Bob Williams", phone: "+1 555 0204", vehicle: "Car",        status: "offline",     deliveries_today: 0, rating: 4.5, joined: "2025-09-01" },
];

const mockActiveDeliveries: ActiveDelivery[] = [
  {
    id: "ad1",
    order_number: "#1042",
    customer_name: "John Smith",
    customer_address: "789 Park Ave",
    driver_id: "d1",
    driver_name: "Marco Rossi",
    status: "picked_up",
    assigned_at: new Date(Date.now() - 15 * 60000).toISOString(),
    picked_up_at: new Date(Date.now() - 8 * 60000).toISOString(),
    eta_minutes: 12,
  },
  {
    id: "ad2",
    order_number: "#1039",
    customer_name: "Lisa Chen",
    customer_address: "321 Oak St",
    driver_id: "d2",
    driver_name: "Ali Hassan",
    status: "near_destination",
    assigned_at: new Date(Date.now() - 25 * 60000).toISOString(),
    picked_up_at: new Date(Date.now() - 18 * 60000).toISOString(),
    eta_minutes: 3,
  },
];

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const zoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  radius_km: z.string().optional(),
  min_order: z.string().optional(),
  delivery_fee: z.string().optional(),
  fee_type: z.enum(["flat", "per_km", "tiered"]),
  estimated_time: z.string().optional(),
});

type ZoneFormValues = z.infer<typeof zoneSchema>;

const driverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(5, "Phone is required"),
  vehicle: z.enum(["Motorcycle", "Bicycle", "Car"]),
});

type DriverFormValues = z.infer<typeof driverSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DRIVER_STATUS_COLORS: Record<DriverStatus, string> = {
  available:   "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  on_delivery: "bg-blue-100  text-blue-800  dark:bg-blue-900/30  dark:text-blue-400",
  break:       "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  offline:     "bg-zinc-100  text-zinc-600   dark:bg-zinc-800     dark:text-zinc-400",
};

const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  available:   "Available",
  on_delivery: "On delivery",
  break:       "On break",
  offline:     "Offline",
};

const VEHICLE_ICONS: Record<string, string> = {
  Motorcycle: "🏍",
  Bicycle:    "🚲",
  Car:        "🚗",
};

function ratingColor(r: number): string {
  if (r >= 4.8) return "text-green-600 dark:text-green-400";
  if (r >= 4.5) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

const DELIVERY_STEPS: { key: ActiveDelivery["status"]; label: string }[] = [
  { key: "assigned",         label: "Assigned" },
  { key: "picked_up",        label: "Picked up" },
  { key: "near_destination", label: "Near destination" },
  { key: "delivered",        label: "Delivered" },
];

function stepIndex(status: ActiveDelivery["status"]): number {
  return DELIVERY_STEPS.findIndex((s) => s.key === status);
}

// ─── Zone Dialog ──────────────────────────────────────────────────────────────

function ZoneDialog({
  open,
  onOpenChange,
  zone,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  zone?: DeliveryZone;
  onSave: (values: ZoneFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneSchema),
    defaultValues: zone
      ? {
          name: zone.name,
          radius_km: String(zone.radius_km),
          min_order: String(zone.min_order / 100),
          delivery_fee: String(zone.delivery_fee / 100),
          fee_type: zone.fee_type,
          estimated_time: String(zone.estimated_time),
        }
      : { fee_type: "flat" as const },
  });

  function onSubmit(values: ZoneFormValues) {
    onSave(values);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{zone ? "Edit zone" : "Add delivery zone"}</DialogTitle>
          <DialogDescription>
            Configure a delivery radius and its fee structure.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="zone-name">Zone name</Label>
            <Input id="zone-name" placeholder="e.g. Downtown (0-2km)" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Radius */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="zone-radius">Radius (km)</Label>
            <Input id="zone-radius" type="number" step="0.1" placeholder="5" {...register("radius_km")} />
            {errors.radius_km && <p className="text-xs text-destructive">{errors.radius_km.message}</p>}
          </div>

          {/* Min order + fee */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="zone-min">Min order ($)</Label>
              <Input id="zone-min" type="number" step="0.01" placeholder="10.00" {...register("min_order")} />
              {errors.min_order && <p className="text-xs text-destructive">{errors.min_order.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="zone-fee">Delivery fee ($)</Label>
              <Input id="zone-fee" type="number" step="0.01" placeholder="2.99" {...register("delivery_fee")} />
              {errors.delivery_fee && <p className="text-xs text-destructive">{errors.delivery_fee.message}</p>}
            </div>
          </div>

          {/* Fee type */}
          <div className="flex flex-col gap-1.5">
            <Label>Fee type</Label>
            <Controller
              name="fee_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v as ZoneFeeType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat rate</SelectItem>
                    <SelectItem value="per_km">Per km</SelectItem>
                    <SelectItem value="tiered">Tiered</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.fee_type && <p className="text-xs text-destructive">{errors.fee_type.message}</p>}
          </div>

          {/* Estimated time */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="zone-time">Estimated delivery time (min)</Label>
            <Input id="zone-time" type="number" placeholder="30" {...register("estimated_time")} />
            {errors.estimated_time && <p className="text-xs text-destructive">{errors.estimated_time.message}</p>}
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit">{zone ? "Save changes" : "Add zone"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Driver Dialog ────────────────────────────────────────────────────────

function AddDriverDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (values: DriverFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: { vehicle: "Motorcycle" },
  });

  function onSubmit(values: DriverFormValues) {
    onAdd(values);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add driver</DialogTitle>
          <DialogDescription>Register a new delivery driver.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="driver-name">Full name</Label>
            <Input id="driver-name" placeholder="Marco Rossi" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="driver-phone">Phone</Label>
            <Input id="driver-phone" placeholder="+1 555 0000" {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Vehicle type</Label>
            <Controller
              name="vehicle"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v as string)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Motorcycle">🏍 Motorcycle</SelectItem>
                    <SelectItem value="Bicycle">🚲 Bicycle</SelectItem>
                    <SelectItem value="Car">🚗 Car</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit">Add driver</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delivery Zones Tab ───────────────────────────────────────────────────────

function DeliveryZonesTab() {
  const [zones, setZones] = useState<DeliveryZone[]>(mockZones);
  const [addOpen, setAddOpen] = useState(false);
  const [editZone, setEditZone] = useState<DeliveryZone | undefined>(undefined);

  function handleToggle(id: string) {
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, active: !z.active } : z))
    );
  }

  function handleDelete(id: string) {
    setZones((prev) => prev.filter((z) => z.id !== id));
    toast.success("Zone removed");
  }

  function handleSave(values: ZoneFormValues) {
    const radius_km = parseFloat(values.radius_km ?? "0") || 0;
    const min_order = parseFloat(values.min_order ?? "0") || 0;
    const delivery_fee = parseFloat(values.delivery_fee ?? "0") || 0;
    const estimated_time = parseInt(values.estimated_time ?? "30") || 30;
    if (editZone) {
      setZones((prev) =>
        prev.map((z) =>
          z.id === editZone.id
            ? {
                ...z,
                name: values.name,
                radius_km,
                min_order: Math.round(min_order * 100),
                delivery_fee: Math.round(delivery_fee * 100),
                fee_type: values.fee_type,
                estimated_time,
              }
            : z
        )
      );
      toast.success("Zone updated");
    } else {
      const newZone: DeliveryZone = {
        id: generateId(),
        name: values.name,
        radius_km,
        min_order: Math.round(min_order * 100),
        delivery_fee: Math.round(delivery_fee * 100),
        fee_type: values.fee_type,
        estimated_time,
        active: true,
      };
      setZones((prev) => [...prev, newZone]);
      toast.success("Zone added");
    }
    setEditZone(undefined);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold">Delivery Zones</h2>
          <p className="text-sm text-muted-foreground">{zones.length} zones configured</p>
        </div>
        <Button size="sm" onClick={() => { setEditZone(undefined); setAddOpen(true); }}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add zone
        </Button>
      </div>

      {/* Map placeholder */}
      <div className="relative w-full h-64 rounded-xl overflow-hidden bg-muted/50 border border-border">
        <svg viewBox="0 0 400 260" className="w-full h-full">
          {/* Zone circles — largest first */}
          <circle cx="200" cy="130" r="110" fill="none" stroke="#7C3AED" strokeWidth="1" strokeDasharray="4" opacity="0.3" />
          <circle cx="200" cy="130" r="75"  fill="rgba(124,58,237,0.05)" stroke="#7C3AED" strokeWidth="1.5" opacity="0.5" />
          <circle cx="200" cy="130" r="45"  fill="rgba(124,58,237,0.08)" stroke="#7C3AED" strokeWidth="2" opacity="0.7" />
          <circle cx="200" cy="130" r="20"  fill="rgba(124,58,237,0.12)" stroke="#7C3AED" strokeWidth="2" />
          {/* Restaurant pin */}
          <circle cx="200" cy="130" r="8" fill="#7C3AED" />
          <circle cx="200" cy="130" r="4" fill="white" />
          {/* Zone labels */}
          <text x="225" y="115" fontSize="9" fill="#7C3AED" opacity="0.8">0-2km</text>
          <text x="238" y="90"  fontSize="9" fill="#7C3AED" opacity="0.6">2-5km</text>
          <text x="255" y="65"  fontSize="9" fill="#7C3AED" opacity="0.4">5-10km</text>
        </svg>
        <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-background/80 px-2 py-1 rounded">
          Map view · Interactive map coming soon
        </div>
      </div>

      {/* Zone cards */}
      <div className="flex flex-col gap-3">
        {zones.map((zone) => (
          <Card key={zone.id} size="sm" className={cn(!zone.active && "opacity-60")}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-sm">{zone.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Up to {zone.radius_km} km · {zone.fee_type === "flat" ? "Flat fee" : zone.fee_type === "per_km" ? "Per km" : "Tiered"}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch
                    checked={zone.active}
                    onCheckedChange={() => handleToggle(zone.id)}
                    size="sm"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" />
                      }
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditZone(zone);
                            setAddOpen(true);
                          }}
                        >
                          Edit zone
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(zone.id)}
                        >
                          Delete zone
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Min order</span>
                  <span className="font-medium">{formatPrice(zone.min_order)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Delivery fee</span>
                  <span className="font-medium">{formatPrice(zone.delivery_fee)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Est. time</span>
                  <span className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {zone.estimated_time} min
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Zone dialog */}
      <ZoneDialog
        open={addOpen}
        onOpenChange={(v) => {
          setAddOpen(v);
          if (!v) setEditZone(undefined);
        }}
        zone={editZone}
        onSave={handleSave}
      />
    </div>
  );
}

// ─── Drivers Tab ──────────────────────────────────────────────────────────────

function DriversTab() {
  const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);
  const [addOpen, setAddOpen] = useState(false);

  const stats = {
    available:   drivers.filter((d) => d.status === "available").length,
    on_delivery: drivers.filter((d) => d.status === "on_delivery").length,
    on_break:    drivers.filter((d) => d.status === "break").length,
    offline:     drivers.filter((d) => d.status === "offline").length,
    deliveries:  drivers.reduce((acc, d) => acc + d.deliveries_today, 0),
  };

  function handleAddDriver(values: DriverFormValues) {
    const newDriver: Driver = {
      id: generateId(),
      name: values.name,
      phone: values.phone,
      vehicle: values.vehicle,
      status: "offline",
      deliveries_today: 0,
      rating: 5.0,
      joined: new Date().toISOString().split("T")[0],
    };
    setDrivers((prev) => [...prev, newDriver]);
    toast.success(`${values.name} added as a driver`);
  }

  function handleStatusChange(id: string, status: DriverStatus) {
    setDrivers((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status } : d))
    );
  }

  function handleRemove(id: string) {
    const driver = drivers.find((d) => d.id === id);
    setDrivers((prev) => prev.filter((d) => d.id !== id));
    if (driver) toast.success(`${driver.name} removed`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold">Drivers</h2>
          <p className="text-sm text-muted-foreground">{drivers.length} registered drivers</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add driver
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 py-3">
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.available}</span>
            <span className="text-xs text-muted-foreground">Available</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 py-3">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.on_delivery}</span>
            <span className="text-xs text-muted-foreground">On delivery</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 py-3">
            <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.on_break}</span>
            <span className="text-xs text-muted-foreground">On break</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 py-3">
            <span className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">{stats.offline}</span>
            <span className="text-xs text-muted-foreground">Offline</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 py-3">
            <span className="text-2xl font-bold text-foreground">{stats.deliveries}</span>
            <span className="text-xs text-muted-foreground">Deliveries today</span>
          </CardContent>
        </Card>
      </div>

      {/* Driver table — responsive cards on mobile */}
      <div className="flex flex-col gap-2">
        {/* Table header — hidden on small screens */}
        <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 px-4 text-xs font-medium text-muted-foreground">
          <span>Driver</span>
          <span>Status</span>
          <span>Phone</span>
          <span>Del. today</span>
          <span>Rating</span>
          <span />
        </div>

        {drivers.map((driver) => (
          <Card key={driver.id} size="sm">
            <CardContent>
              {/* Mobile layout */}
              <div className="flex items-start justify-between gap-3 sm:hidden">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-sm">
                    {VEHICLE_ICONS[driver.vehicle] ?? "🚗"} {driver.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{driver.phone}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-xs font-medium", DRIVER_STATUS_COLORS[driver.status])}>
                      {DRIVER_STATUS_LABELS[driver.status]}
                    </span>
                    {driver.active_order && (
                      <span className="inline-flex h-5 items-center rounded-full bg-blue-100 px-2 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {driver.active_order}
                      </span>
                    )}
                  </div>
                </div>
                <DriverActions driver={driver} onStatusChange={handleStatusChange} onRemove={handleRemove} />
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-3">
                {/* Name + vehicle */}
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-sm">
                    {VEHICLE_ICONS[driver.vehicle] ?? "🚗"} {driver.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{driver.vehicle}</span>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1">
                  <span className={cn("inline-flex h-5 w-fit items-center rounded-full px-2 text-xs font-medium", DRIVER_STATUS_COLORS[driver.status])}>
                    {DRIVER_STATUS_LABELS[driver.status]}
                  </span>
                  {driver.active_order && (
                    <span className="inline-flex h-5 w-fit items-center rounded-full bg-blue-100 px-2 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {driver.active_order}
                    </span>
                  )}
                </div>

                {/* Phone */}
                <span className="text-sm text-muted-foreground">{driver.phone}</span>

                {/* Deliveries */}
                <span className="text-sm font-medium">{driver.deliveries_today}</span>

                {/* Rating */}
                <span className={cn("text-sm font-semibold", ratingColor(driver.rating))}>
                  {driver.rating.toFixed(1)} ★
                </span>

                {/* Actions */}
                <DriverActions driver={driver} onStatusChange={handleStatusChange} onRemove={handleRemove} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddDriverDialog open={addOpen} onOpenChange={setAddOpen} onAdd={handleAddDriver} />
    </div>
  );
}

function DriverActions({
  driver,
  onStatusChange,
  onRemove,
}: {
  driver: Driver;
  onStatusChange: (id: string, status: DriverStatus) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" />
        }
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{driver.name}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => toast.info(`Viewing ${driver.name}'s history`)}>
            View history
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast.info(`Assigning order to ${driver.name}...`)}>
            Assign order
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onStatusChange(driver.id, "break")}>
            Mark on break
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange(driver.id, "offline")}>
            Mark offline
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => onRemove(driver.id)}>
            Remove driver
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Live Tracking Tab ────────────────────────────────────────────────────────

function LiveTrackingTab() {
  const [deliveries, setDeliveries] = useState<ActiveDelivery[]>(mockActiveDeliveries);

  function handleMarkDelivered(id: string) {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "delivered" } : d))
    );
    toast.success("Order marked as delivered");
  }

  function handleCallDriver(driverName: string) {
    toast.info(`Calling ${driverName}...`);
  }

  const activeDeliveries = deliveries.filter((d) => d.status !== "delivered");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold">Live Tracking</h2>
          <p className="text-sm text-muted-foreground">{activeDeliveries.length} active deliveries</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          Updates every 30 seconds
        </div>
      </div>

      {activeDeliveries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Truck className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-medium text-sm">No active deliveries right now</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              All orders have been delivered or there are no active deliveries at the moment.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {activeDeliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              onMarkDelivered={handleMarkDelivered}
              onCallDriver={handleCallDriver}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DeliveryCard({
  delivery,
  onMarkDelivered,
  onCallDriver,
}: {
  delivery: ActiveDelivery;
  onMarkDelivered: (id: string) => void;
  onCallDriver: (driverName: string) => void;
}) {
  const currentStep = stepIndex(delivery.status);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{delivery.order_number}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm">{delivery.customer_name}</span>
            </div>
            <span className="text-xs text-muted-foreground">{delivery.customer_address}</span>
          </div>
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
            <div className="flex items-center gap-1 text-sm font-medium">
              {VEHICLE_ICONS[mockDrivers.find((d) => d.id === delivery.driver_id)?.vehicle ?? ""] ?? "🚗"}
              <span>{delivery.driver_name}</span>
            </div>
            <span className="text-xs font-semibold text-primary">ETA: {delivery.eta_minutes} min</span>
          </div>
        </div>

        {/* Map placeholder */}
        <div className="h-24 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-xs text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1" /> Live map · Interactive tracking coming soon
        </div>

        <Separator />

        {/* Status stepper */}
        <div className="flex items-center gap-0">
          {DELIVERY_STEPS.map((step, idx) => {
            const isDone    = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div key={step.key} className="flex flex-1 items-center">
                {/* Step node */}
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <div className={cn(
                    "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-colors",
                    isDone    ? "bg-primary text-primary-foreground"      : "",
                    isCurrent ? "bg-primary text-primary-foreground ring-2 ring-primary/30" : "",
                    !isDone && !isCurrent ? "bg-muted text-muted-foreground" : ""
                  )}>
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isCurrent ? (
                      <Circle className="h-3 w-3 fill-current" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[9px] text-center leading-tight max-w-[52px] px-0.5",
                    isCurrent ? "text-primary font-semibold" : isDone ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
                {/* Connector line */}
                {idx < DELIVERY_STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-1 mb-4 rounded-full transition-colors",
                    idx < currentStep ? "bg-primary" : "bg-border"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => onCallDriver(delivery.driver_name)}
          >
            <Phone className="h-3.5 w-3.5" />
            Call driver
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => toast.info(`Viewing order ${delivery.order_number}`)}
          >
            <Package className="h-3.5 w-3.5" />
            View order
          </Button>
          {delivery.status !== "delivered" && (
            <Button
              size="sm"
              className="gap-1.5 ml-auto"
              onClick={() => onMarkDelivered(delivery.id)}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark delivered
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeliveryPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <Truck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-semibold">Delivery Management</h1>
          <p className="text-sm text-muted-foreground">Manage zones, drivers, and track active deliveries</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="zones">
        <TabsList>
          <TabsTrigger value="zones">
            <MapPin className="h-4 w-4" />
            Delivery Zones
          </TabsTrigger>
          <TabsTrigger value="drivers">
            <Users className="h-4 w-4" />
            Drivers
          </TabsTrigger>
          <TabsTrigger value="tracking">
            <Truck className="h-4 w-4" />
            Live Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="zones">
          <DeliveryZonesTab />
        </TabsContent>

        <TabsContent value="drivers">
          <DriversTab />
        </TabsContent>

        <TabsContent value="tracking">
          <LiveTrackingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
