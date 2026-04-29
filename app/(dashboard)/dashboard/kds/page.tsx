"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  UtensilsCrossed, Clock, LogOut, Volume2, Moon, AlertTriangle,
  ShoppingBag, Bike, Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover";
import { cn, minutesSince } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { Order, OrderStatus, OrderType } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KDSOrder extends Order {
  ready_at?: string;
  notes?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const initialOrders: KDSOrder[] = [
  {
    id: "k1", tenant_id: "t1", branch_id: "b1", order_number: "#041",
    status: "pending", order_type: "dine_in", channel: "web", table_number: "T-3", customer_name: "Liam Torres",
    items: [
      { item_id: "i1", name: "Classic Smash Burger", quantity: 2, unit_price: 1299, modifiers: [{ name: "Large", price_delta: 200 }], line_total: 2998 },
      { item_id: "i4", name: "Crispy Fries", quantity: 1, unit_price: 499, modifiers: [], line_total: 499 },
    ],
    notes: "No onions please",
    subtotal: 3497, tax: 298, service_charge: 0, tip: 0, total: 3795,
    payment_method: "card_online", payment_status: "paid",
    created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: "k2", tenant_id: "t1", branch_id: "b1", order_number: "#042",
    status: "pending", order_type: "takeaway", channel: "whatsapp", customer_name: "Priya Nair", customer_phone: "+1 555 0303",
    items: [
      { item_id: "i2", name: "Crispy Chicken Burger", quantity: 1, unit_price: 1199, modifiers: [{ name: "Extra Spicy", price_delta: 0 }], line_total: 1199 },
      { item_id: "i6", name: "Classic Milkshake", quantity: 2, unit_price: 699, modifiers: [{ name: "Chocolate", price_delta: 0 }], line_total: 1398 },
    ],
    subtotal: 2597, tax: 221, service_charge: 0, tip: 0, total: 2818,
    payment_method: "cash", payment_status: "pending",
    created_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
  },
  {
    id: "k3", tenant_id: "t1", branch_id: "b1", order_number: "#043",
    status: "pending", order_type: "delivery", channel: "web", customer_name: "Omar Farooq", customer_phone: "+1 555 0505",
    delivery_address: "123 Baker St, New York, NY 10001",
    items: [
      { item_id: "i3", name: "Vegan Beyond Burger", quantity: 2, unit_price: 1399, modifiers: [], line_total: 2798 },
      { item_id: "i7", name: "Fresh Lemonade", quantity: 2, unit_price: 399, modifiers: [], line_total: 798 },
    ],
    subtotal: 3596, tax: 306, service_charge: 0, tip: 0, total: 3902,
    payment_method: "card_online", payment_status: "paid",
    created_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  },
  {
    id: "k4", tenant_id: "t1", branch_id: "b1", order_number: "#038",
    status: "preparing", order_type: "dine_in", channel: "web", table_number: "T-7", customer_name: "Ahmed Khan",
    items: [
      { item_id: "i1", name: "Classic Smash Burger", quantity: 2, unit_price: 1299, modifiers: [{ name: "Large", price_delta: 200 }], line_total: 2998 },
      { item_id: "i4", name: "Crispy Fries", quantity: 2, unit_price: 499, modifiers: [], line_total: 998 },
    ],
    subtotal: 3996, tax: 340, service_charge: 0, tip: 0, total: 4336,
    payment_method: "card_online", payment_status: "paid",
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    accepted_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    preparing_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  },
  {
    id: "k5", tenant_id: "t1", branch_id: "b1", order_number: "#039",
    status: "preparing", order_type: "takeaway", channel: "staff", customer_name: "Sara Lee", customer_phone: "+1 555 0202",
    items: [
      { item_id: "i2", name: "Crispy Chicken Burger", quantity: 1, unit_price: 1199, modifiers: [], line_total: 1199 },
      { item_id: "i8", name: "Loaded Brownie", quantity: 2, unit_price: 799, modifiers: [{ name: "Ice Cream", price_delta: 150 }], line_total: 1898 },
    ],
    notes: "Allergic to peanuts",
    subtotal: 3097, tax: 263, service_charge: 0, tip: 0, total: 3360,
    payment_method: "cash", payment_status: "pending",
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    accepted_at: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    preparing_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "k6", tenant_id: "t1", branch_id: "b1", order_number: "#040",
    status: "preparing", order_type: "dine_in", channel: "web", table_number: "T-2", customer_name: "Carlos Diaz",
    items: [
      { item_id: "i5", name: "BBQ Bacon Stack", quantity: 1, unit_price: 1499, modifiers: [{ name: "No Pickles", price_delta: 0 }], line_total: 1499 },
      { item_id: "i4", name: "Crispy Fries", quantity: 1, unit_price: 499, modifiers: [{ name: "Loaded (Cheese + Jalapeño)", price_delta: 300 }], line_total: 799 },
      { item_id: "i7", name: "Fresh Lemonade", quantity: 1, unit_price: 399, modifiers: [], line_total: 399 },
    ],
    subtotal: 2697, tax: 229, service_charge: 0, tip: 200, total: 3126,
    payment_method: "card_venue", payment_status: "pending",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    accepted_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    preparing_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: "k7", tenant_id: "t1", branch_id: "b1", order_number: "#036",
    status: "preparing", order_type: "delivery", channel: "web", customer_name: "John Smith", customer_phone: "+1 555 0404",
    delivery_address: "789 Park Ave, New York, NY 10021",
    items: [
      { item_id: "i1", name: "Classic Smash Burger", quantity: 3, unit_price: 1299, modifiers: [], line_total: 3897 },
      { item_id: "i4", name: "Crispy Fries", quantity: 3, unit_price: 499, modifiers: [], line_total: 1497 },
    ],
    notes: "Ring the bell, do not knock",
    subtotal: 5394, tax: 459, service_charge: 0, tip: 500, total: 6353,
    payment_method: "card_online", payment_status: "paid",
    created_at: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
    accepted_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    preparing_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
  },
  {
    id: "k8", tenant_id: "t1", branch_id: "b1", order_number: "#033",
    status: "ready", order_type: "dine_in", channel: "web", table_number: "T-8", customer_name: "Maria Garcia",
    items: [
      { item_id: "i3", name: "Vegan Beyond Burger", quantity: 1, unit_price: 1399, modifiers: [], line_total: 1399 },
      { item_id: "i7", name: "Fresh Lemonade", quantity: 2, unit_price: 399, modifiers: [], line_total: 798 },
    ],
    subtotal: 2197, tax: 187, service_charge: 0, tip: 300, total: 2684,
    payment_method: "card_venue", payment_status: "pending",
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    accepted_at: new Date(Date.now() - 17 * 60 * 1000).toISOString(),
    preparing_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    ready_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: "k9", tenant_id: "t1", branch_id: "b1", order_number: "#034",
    status: "ready", order_type: "takeaway", channel: "whatsapp", customer_name: "Nina Patel",
    items: [{ item_id: "i2", name: "Crispy Chicken Burger", quantity: 2, unit_price: 1199, modifiers: [{ name: "Medium Spicy", price_delta: 0 }], line_total: 2398 }],
    subtotal: 2398, tax: 204, service_charge: 0, tip: 0, total: 2602,
    payment_method: "cash", payment_status: "pending",
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    accepted_at: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
    preparing_at: new Date(Date.now() - 17 * 60 * 1000).toISOString(),
    ready_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: "k10", tenant_id: "t1", branch_id: "b1", order_number: "#035",
    status: "ready", order_type: "dine_in", channel: "web", table_number: "T-11", customer_name: "Ravi Gupta",
    items: [
      { item_id: "i5", name: "BBQ Bacon Stack", quantity: 2, unit_price: 1499, modifiers: [], line_total: 2998 },
      { item_id: "i8", name: "Loaded Brownie", quantity: 1, unit_price: 799, modifiers: [], line_total: 799 },
      { item_id: "i6", name: "Classic Milkshake", quantity: 2, unit_price: 699, modifiers: [{ name: "Vanilla", price_delta: 0 }], line_total: 1398 },
    ],
    subtotal: 5195, tax: 442, service_charge: 0, tip: 400, total: 6037,
    payment_method: "card_online", payment_status: "paid",
    created_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    accepted_at: new Date(Date.now() - 21 * 60 * 1000).toISOString(),
    preparing_at: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
    ready_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimerRef(order: KDSOrder): string {
  if (order.status === "ready" && order.ready_at) return order.ready_at;
  if (order.status === "preparing" && order.preparing_at) return order.preparing_at;
  return order.created_at;
}

function getElapsedMins(order: KDSOrder): number {
  return minutesSince(getTimerRef(order));
}

function getTimerColor(mins: number): string {
  if (mins < 5)  return "text-emerald-400";
  if (mins < 10) return "text-yellow-400";
  if (mins < 15) return "text-orange-400";
  return "text-red-400";
}

function isOverdue(mins: number): boolean { return mins >= 15; }

function orderTypeIcon(type: OrderType) {
  switch (type) {
    case "dine_in":  return <UtensilsCrossed className="size-3.5" />;
    case "takeaway": return <Package className="size-3.5" />;
    case "delivery": return <Bike className="size-3.5" />;
    default:         return <ShoppingBag className="size-3.5" />;
  }
}

function orderTypeBadgeClass(type: OrderType): string {
  switch (type) {
    case "dine_in":  return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "takeaway": return "bg-violet-500/20 text-violet-300 border-violet-500/30";
    case "delivery": return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    default:         return "bg-zinc-700 text-zinc-300";
  }
}

// ─── 86 Popover ───────────────────────────────────────────────────────────────

function EightySixPopover({ itemName }: { itemName: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    toast.success(`${itemName} — ${t.kds_markUnavailable}`);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="ms-1 inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold leading-none bg-zinc-700 text-zinc-400 hover:bg-red-900/60 hover:text-red-300 transition-colors cursor-pointer border border-transparent hover:border-red-700/40"
        aria-label={`86 ${itemName}`}
      >
        86
      </PopoverTrigger>
      <PopoverContent className="w-56 bg-zinc-900 border-zinc-700 text-white p-3">
        <p className="text-xs font-medium text-zinc-200 mb-1">{t.kds_markUnavailable}</p>
        <p className="text-xs text-zinc-400 mb-3">&ldquo;{itemName}&rdquo; {t.kds_eightySixSession}</p>
        <div className="flex gap-2">
          <button onClick={handleConfirm}
            className="flex-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-medium py-1.5 transition-colors">
            {t.dashClose}
          </button>
          <button onClick={() => setOpen(false)}
            className="flex-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-medium py-1.5 transition-colors">
            {t.dashCancel}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: KDSOrder;
  elapsedMins: number;
  onAction: (orderId: string) => void;
}

function OrderCard({ order, elapsedMins, onAction }: OrderCardProps) {
  const t = useT();
  const overdue = isOverdue(elapsedMins);
  const timerColor = getTimerColor(elapsedMins);
  const readyElapsed = order.status === "ready" && order.ready_at ? minutesSince(order.ready_at) : 0;
  const faded = order.status === "ready" && readyElapsed > 3;

  const ORDER_TYPE_LABELS: Record<OrderType, string> = {
    dine_in:    t.ord_dineIn,
    takeaway:   t.ord_takeaway,
    delivery:   t.delivery,
    drive_thru: t.ord_driveThru,
  };

  const actionLabel =
    order.status === "pending"   ? t.kds_actionAccept :
    order.status === "preparing" ? t.kds_actionMarkReady :
    t.kds_actionBump;

  const actionClass =
    order.status === "pending"   ? "bg-blue-600 hover:bg-blue-500 text-white" :
    order.status === "preparing" ? "bg-amber-500 hover:bg-amber-400 text-zinc-950" :
    "bg-emerald-600 hover:bg-emerald-500 text-white";

  return (
    <motion.div layout
      initial={{ opacity: 0, x: 60 }} animate={{ opacity: faded ? 0.5 : 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "rounded-xl border bg-zinc-900 p-4 flex flex-col gap-3 select-none",
        overdue ? "border-red-500/60 shadow-[0_0_12px_2px_rgba(239,68,68,0.25)]" : "border-zinc-800"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-bold text-white tracking-tight">{order.order_number}</span>
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", orderTypeBadgeClass(order.order_type))}>
            {orderTypeIcon(order.order_type)}
            {ORDER_TYPE_LABELS[order.order_type]}
          </span>
          {order.table_number && (
            <span className="rounded-full bg-zinc-700/60 px-2 py-0.5 text-xs font-semibold text-zinc-200">{order.table_number}</span>
          )}
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      <div className="flex flex-col gap-2">
        {order.items.map((item, idx) => (
          <div key={`${item.item_id}-${idx}`} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-zinc-100 leading-snug flex-1">
                {item.name} <span className="text-zinc-400 font-normal">&times;{item.quantity}</span>
              </span>
              <EightySixPopover itemName={item.name} />
            </div>
            {item.modifiers.length > 0 && (
              <div className="flex flex-col gap-0.5 ps-3">
                {item.modifiers.map((mod, mi) => (
                  <span key={mi} className="text-xs text-zinc-400 before:content-['+_'] before:text-zinc-600">{mod.name}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {order.notes && (
        <>
          <Separator className="bg-zinc-800" />
          <div className="flex items-start gap-2 rounded-lg bg-amber-950/40 border border-amber-700/30 px-3 py-2">
            <AlertTriangle className="size-3.5 mt-0.5 shrink-0 text-amber-400" />
            <p className="text-xs text-amber-300 leading-relaxed">{order.notes}</p>
          </div>
        </>
      )}

      <Separator className="bg-zinc-800" />

      <div className="flex items-center justify-between gap-2">
        <button onClick={() => onAction(order.id)}
          className={cn("min-h-[44px] flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors", actionClass)}>
          {actionLabel}
        </button>
        <div className={cn("flex items-center gap-1 text-sm font-semibold tabular-nums", timerColor)}>
          <Clock className="size-3.5 shrink-0" />
          <span>{elapsedMins}m</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

interface ColumnProps {
  title: string;
  status: OrderStatus;
  orders: KDSOrder[];
  elapsedMap: Record<string, number>;
  onAction: (orderId: string) => void;
  headerClass: string;
  emptyLabel: string;
}

function KanbanColumn({ title, status, orders, elapsedMap, onAction, headerClass, emptyLabel }: ColumnProps) {
  const col = orders.filter((o) => o.status === status);

  return (
    <div className="flex flex-col min-h-0">
      <div className={cn("flex items-center justify-between px-4 py-3 rounded-t-xl border-b border-zinc-800", headerClass)}>
        <h2 className="text-sm font-bold uppercase tracking-widest text-white/80">{title}</h2>
        <span className="inline-flex items-center justify-center min-w-[24px] h-6 rounded-full bg-white/10 px-2 text-xs font-bold text-white">{col.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-thin">
        <AnimatePresence initial={false} mode="popLayout">
          {col.map((order) => (
            <OrderCard key={order.id} order={order} elapsedMins={elapsedMap[order.id] ?? 0} onAction={onAction} />
          ))}
          {col.length === 0 && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-2 py-16 text-zinc-600">
              <UtensilsCrossed className="size-8" />
              <span className="text-sm">{emptyLabel}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KDSPage() {
  const t = useT();
  const router = useRouter();
  const [orders, setOrders] = useState<KDSOrder[]>(initialOrders);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tick, setTick] = useState(0);
  const [branch, setBranch] = useState("b1");
  const [extraDark, setExtraDark] = useState(false);
  const [audioAlerts, setAudioAlerts] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((tick_) => tick_ + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const elapsedMap = useCallback(() => {
    const map: Record<string, number> = {};
    for (const o of orders) { map[o.id] = getElapsedMins(o); }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, tick])();

  function handleAction(orderId: string) {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const now = new Date().toISOString();
        if (o.status === "pending")   return { ...o, status: "preparing" as OrderStatus, accepted_at: now, preparing_at: now };
        if (o.status === "preparing") return { ...o, status: "ready"     as OrderStatus, ready_at: now };
        if (o.status === "ready")     { toast.success(`${o.order_number} ${t.completed}`); return { ...o, status: "completed" as OrderStatus }; }
        return o;
      })
    );
  }

  function handleAudioToggle(checked: boolean) {
    setAudioAlerts(checked);
    if (checked) toast.info(t.kds_audioPermission);
  }

  const timeStr = currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  const visibleOrders = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled");

  return (
    <div className={cn("flex flex-col h-screen overflow-hidden transition-colors duration-300", extraDark ? "bg-black" : "bg-zinc-950")}>
      <header className="flex-none flex items-center justify-between gap-4 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-7 rounded-lg bg-primary">
            <UtensilsCrossed className="size-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">QR Menu</span>
            <span className="text-sm font-bold text-white">{t.kds_kitchenDisplay}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-lg font-mono font-semibold text-zinc-200 tabular-nums">
          <Clock className="size-4 text-zinc-500" />
          {timeStr}
        </div>

        <div className="flex items-center gap-3">
          <Select value={branch} onValueChange={(v) => { if (v !== null) setBranch(v); }}>
            <SelectTrigger className="h-8 min-w-[130px] border-zinc-700 bg-zinc-800/60 text-zinc-200 text-xs" size="default">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="b1">{t.kds_mainBranch}</SelectItem>
              <SelectItem value="b2">{t.kds_downtown}</SelectItem>
              <SelectItem value="b3">{t.kds_airport}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <Moon className="size-3.5 text-zinc-500" />
            <Switch checked={extraDark} onCheckedChange={setExtraDark} size="sm" aria-label="Extra dark mode" />
          </div>

          <div className="flex items-center gap-1.5">
            <Volume2 className="size-3.5 text-zinc-500" />
            <Switch checked={audioAlerts} onCheckedChange={handleAudioToggle} size="sm" aria-label="Audio alerts" />
          </div>

          <Separator orientation="vertical" className="h-5 bg-zinc-700" />

          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}
            className="h-8 border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700 hover:text-white gap-1.5">
            <LogOut className="size-3.5" />
            <span className="text-xs">{t.kds_exitKds}</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden grid grid-cols-3 gap-0 divide-x divide-zinc-800">
        <KanbanColumn title={t.kds_colNew}      status="pending"   orders={visibleOrders} elapsedMap={elapsedMap} onAction={handleAction} headerClass="bg-blue-950/30"    emptyLabel={t.kds_noOrders} />
        <KanbanColumn title={t.preparing}        status="preparing" orders={visibleOrders} elapsedMap={elapsedMap} onAction={handleAction} headerClass="bg-amber-950/30"   emptyLabel={t.kds_noOrders} />
        <KanbanColumn title={t.ready}            status="ready"     orders={visibleOrders} elapsedMap={elapsedMap} onAction={handleAction} headerClass="bg-emerald-950/30" emptyLabel={t.kds_noOrders} />
      </main>
    </div>
  );
}
