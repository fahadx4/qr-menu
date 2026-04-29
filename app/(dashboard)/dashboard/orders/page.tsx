"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Globe,
  MessageCircle,
  Clock,
  Search,
  Package,
  Loader2,
  CheckCircle2,
  Circle,
  Truck,
} from "lucide-react";

import { mockOrders } from "@/mock/orders";
import type { Order, OrderStatus, OrderType, Channel } from "@/types";
import {
  cn,
  formatPrice,
  minutesSince,
  timeAgo,
  statusColors,
} from "@/lib/utils";
import { useDashboardStore } from "@/store/dashboard";
import { useT } from "@/lib/i18n";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// ─── Extended mock data ────────────────────────────────────────────────────────

const EXTENDED_ORDERS: Order[] = [
  ...mockOrders,
  {
    id: "o5", tenant_id: "t1", branch_id: "b1", order_number: "#005",
    status: "completed", order_type: "dine_in", channel: "web", table_number: "T-2",
    customer_name: "Emily Chen", customer_phone: "+1 555 0505",
    items: [
      { item_id: "i2", name: "Crispy Chicken Burger", quantity: 1, unit_price: 1199, modifiers: [], line_total: 1199 },
      { item_id: "i7", name: "Fresh Lemonade", quantity: 1, unit_price: 399, modifiers: [], line_total: 399 },
    ],
    subtotal: 1598, tax: 136, service_charge: 0, tip: 200, total: 1934,
    payment_method: "card_venue", payment_status: "paid",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    accepted_at: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
    preparing_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    ready_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "o6", tenant_id: "t1", branch_id: "b1", order_number: "#006",
    status: "completed", order_type: "takeaway", channel: "whatsapp",
    customer_name: "Ali Hassan", customer_phone: "+1 555 0606",
    items: [
      { item_id: "i1", name: "Classic Smash Burger", quantity: 2, unit_price: 1299, modifiers: [{ name: "Extra Sauce", price_delta: 50 }], line_total: 2698 },
    ],
    subtotal: 2698, tax: 229, service_charge: 0, tip: 0, total: 2927,
    payment_method: "cash", payment_status: "paid",
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    accepted_at: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
    preparing_at: new Date(Date.now() - 57 * 60 * 1000).toISOString(),
    ready_at: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
  },
  {
    id: "o7", tenant_id: "t1", branch_id: "b1", order_number: "#007",
    status: "completed", order_type: "delivery", channel: "web",
    customer_name: "Fatima Malik", customer_phone: "+1 555 0707",
    delivery_address: "123 Oak Street, Brooklyn, NY 11201",
    items: [
      { item_id: "i3", name: "Vegan Beyond Burger", quantity: 1, unit_price: 1399, modifiers: [], line_total: 1399 },
      { item_id: "i4", name: "Crispy Fries", quantity: 1, unit_price: 499, modifiers: [], line_total: 499 },
      { item_id: "i6", name: "Classic Milkshake", quantity: 1, unit_price: 699, modifiers: [{ name: "Vanilla", price_delta: 0 }], line_total: 699 },
    ],
    subtotal: 2597, tax: 221, service_charge: 200, tip: 300, total: 3318,
    payment_method: "card_online", payment_status: "paid",
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    accepted_at: new Date(Date.now() - 89 * 60 * 1000).toISOString(),
    preparing_at: new Date(Date.now() - 86 * 60 * 1000).toISOString(),
    ready_at: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
  },
  {
    id: "o8", tenant_id: "t1", branch_id: "b1", order_number: "#008",
    status: "cancelled", order_type: "dine_in", channel: "web", table_number: "T-12",
    customer_name: "David Park",
    items: [{ item_id: "i8", name: "Loaded Brownie", quantity: 2, unit_price: 799, modifiers: [], line_total: 1598 }],
    subtotal: 1598, tax: 136, service_charge: 0, tip: 0, total: 1734,
    payment_method: "card_venue", payment_status: "refunded",
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    cancelled_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    cancel_reason: "Customer requested",
  },
  {
    id: "o9", tenant_id: "t1", branch_id: "b1", order_number: "#009",
    status: "out_for_delivery", order_type: "delivery", channel: "whatsapp",
    customer_name: "Zara Ahmed", customer_phone: "+1 555 0909",
    delivery_address: "456 Elm Avenue, Manhattan, NY 10001",
    items: [
      { item_id: "i1", name: "Classic Smash Burger", quantity: 1, unit_price: 1299, modifiers: [], line_total: 1299 },
      { item_id: "i4", name: "Crispy Fries", quantity: 1, unit_price: 499, modifiers: [], line_total: 499 },
    ],
    subtotal: 1798, tax: 153, service_charge: 200, tip: 200, total: 2351,
    payment_method: "card_online", payment_status: "paid",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    accepted_at: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
    preparing_at: new Date(Date.now() - 27 * 60 * 1000).toISOString(),
    ready_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: "o10", tenant_id: "t1", branch_id: "b1", order_number: "#010",
    status: "pending", order_type: "takeaway", channel: "web",
    customer_name: "Omar Farooq", customer_phone: "+1 555 1010",
    items: [
      { item_id: "i5", name: "Double Smash Burger", quantity: 1, unit_price: 1599, modifiers: [{ name: "Jalapeños", price_delta: 100 }], line_total: 1699 },
      { item_id: "i7", name: "Fresh Lemonade", quantity: 2, unit_price: 399, modifiers: [], line_total: 798 },
    ],
    subtotal: 2497, tax: 212, service_charge: 0, tip: 0, total: 2709,
    payment_method: "cash", payment_status: "pending",
    created_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
  },
];

// ─── Types & constants ─────────────────────────────────────────────────────────

type StatusFilter = "all" | "pending" | "accepted" | "preparing" | "ready" | "completed" | "cancelled";
type OrderTypeFilter = "all" | OrderType;
type ChannelFilter = "all" | Channel;
type TimeRange = "today" | "last_hour" | "last_3h";

const STATUS_PIPELINE: OrderStatus[] = ["pending", "accepted", "preparing", "ready", "out_for_delivery", "completed"];

const ORDER_TYPE_COLORS: Record<OrderType, string> = {
  dine_in:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  takeaway:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  delivery:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  drive_thru:"bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid:     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  refunded: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  failed:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getNextStatus(order: Order): OrderStatus | null {
  const { status, order_type } = order;
  if (status === "pending") return "accepted";
  if (status === "accepted") return "preparing";
  if (status === "preparing") return order_type === "delivery" ? "out_for_delivery" : "ready";
  if (status === "ready") return "completed";
  if (status === "out_for_delivery") return "completed";
  return null;
}

function getActionVariant(status: OrderStatus): "default" | "outline" | "ghost" | "destructive" | "secondary" | "link" {
  void status;
  return "default";
}

function getElapsedColor(minutes: number): string {
  if (minutes < 5)  return "text-muted-foreground";
  if (minutes < 10) return "text-yellow-600 dark:text-yellow-400";
  if (minutes < 15) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function isActiveOrder(status: OrderStatus): boolean {
  return ["pending", "accepted", "preparing", "ready", "out_for_delivery"].includes(status);
}

function filterByTimeRange(order: Order, range: TimeRange): boolean {
  const created = new Date(order.created_at).getTime();
  const now = Date.now();
  if (range === "last_hour") return now - created <= 60 * 60 * 1000;
  if (range === "last_3h")   return now - created <= 3 * 60 * 60 * 1000;
  const today = new Date();
  const orderDate = new Date(order.created_at);
  return (
    orderDate.getFullYear() === today.getFullYear() &&
    orderDate.getMonth() === today.getMonth() &&
    orderDate.getDate() === today.getDate()
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ChannelIcon({ channel }: { channel: Channel }) {
  if (channel === "whatsapp") return <MessageCircle className="size-3.5 text-green-500" />;
  return <Globe className="size-3.5 text-blue-500" />;
}

function ElapsedTimer({ createdAt, className }: { createdAt: string; className?: string }) {
  const [minutes, setMinutes] = useState(() => minutesSince(createdAt));
  useEffect(() => {
    const interval = setInterval(() => setMinutes(minutesSince(createdAt)), 30_000);
    return () => clearInterval(interval);
  }, [createdAt]);
  const color = getElapsedColor(minutes);
  const isPulsing = minutes >= 15;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", color, className)}>
      {isPulsing && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-red-500" />
        </span>
      )}
      <Clock className="size-3" />
      {minutes}m
    </span>
  );
}

// ─── Order Card ────────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: Order;
  loadingId: string | null;
  onAction: (order: Order) => void;
  onCancel: (order: Order) => void;
  onOpenDetail: (order: Order) => void;
}

function OrderCard({ order, loadingId, onAction, onCancel, onOpenDetail }: OrderCardProps) {
  const t = useT();
  const isLoading = loadingId === order.id;
  const hasAction = getNextStatus(order) !== null;
  const visibleItems = order.items.slice(0, 2);
  const extraCount = order.items.length - 2;

  const ORDER_TYPE_LABELS: Record<OrderType, string> = {
    dine_in:   t.ord_dineIn,
    takeaway:  t.ord_takeaway,
    delivery:  t.delivery,
    drive_thru: t.ord_driveThru,
  };

  const STATUS_LABELS: Record<string, string> = {
    pending:          t.ord_statusPending,
    accepted:         t.accepted,
    preparing:        t.preparing,
    ready:            t.ready,
    out_for_delivery: t.outForDelivery,
    completed:        t.completed,
    cancelled:        t.cancelled,
  };

  function getActionLabel(o: Order): string {
    if (o.status === "pending")   return t.ord_actionAccept;
    if (o.status === "accepted")  return t.ord_actionStartPreparing;
    if (o.status === "preparing") return o.order_type === "delivery" ? t.outForDelivery : t.ord_actionMarkReady;
    if (o.status === "ready")     return t.ord_actionComplete;
    if (o.status === "out_for_delivery") return t.ord_actionMarkDelivered;
    return "";
  }

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
      className="rounded-xl border border-border bg-card ring-1 ring-foreground/5 overflow-hidden flex flex-col"
    >
      <button type="button" className="flex-1 text-start p-4 hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-t-xl"
        onClick={() => onOpenDetail(order)}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-heading font-semibold text-sm">{order.order_number}</span>
            <ChannelIcon channel={order.channel} />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", ORDER_TYPE_COLORS[order.order_type])}>
              {ORDER_TYPE_LABELS[order.order_type]}
            </span>
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", statusColors[order.status])}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground truncate mb-1">
          {order.customer_name
            ? order.customer_name
            : order.table_number
            ? `${t.tableNumber} ${order.table_number}`
            : "—"}
          {order.table_number && order.customer_name ? ` · ${t.tableNumber} ${order.table_number}` : ""}
          {order.delivery_address ? ` · ${order.delivery_address}` : ""}
        </p>

        <div className="space-y-0.5 mb-3">
          {visibleItems.map((item, idx) => (
            <p key={idx} className="text-xs text-muted-foreground truncate">{item.quantity}× {item.name}</p>
          ))}
          {extraCount > 0 && <p className="text-xs text-muted-foreground">+{extraCount} {t.ord_moreItems}</p>}
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{formatPrice(order.total)}</span>
          {isActiveOrder(order.status) && <ElapsedTimer createdAt={order.created_at} />}
        </div>
      </button>

      {(hasAction || order.status === "pending") && (
        <div className="px-4 pb-4 pt-2 border-t border-border/50 flex gap-2">
          {hasAction && (
            <Button size="sm" className={cn("flex-1", order.status === "ready" && "bg-green-600 hover:bg-green-700 text-white")}
              disabled={isLoading} onClick={(e) => { e.stopPropagation(); onAction(order); }}>
              {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {getActionLabel(order)}
            </Button>
          )}
          {(order.status === "pending" || order.status === "accepted" || order.status === "preparing" || order.status === "ready" || order.status === "out_for_delivery") && (
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={isLoading} onClick={(e) => { e.stopPropagation(); onCancel(order); }}>
              {t.dashCancel}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Status Timeline ───────────────────────────────────────────────────────────

function StatusTimeline({ order }: { order: Order }) {
  const t = useT();

  const steps: { status: OrderStatus; label: string; timestamp?: string }[] = [
    { status: "pending",  label: t.ord_timelinePlaced, timestamp: order.created_at },
    { status: "accepted", label: t.accepted,           timestamp: order.accepted_at },
    { status: "preparing",label: t.preparing,          timestamp: order.preparing_at },
  ];

  if (order.order_type === "delivery") {
    steps.push({ status: "out_for_delivery", label: t.outForDelivery, timestamp: order.ready_at });
  } else {
    steps.push({ status: "ready", label: t.ready, timestamp: order.ready_at });
  }
  steps.push({ status: "completed", label: t.completed, timestamp: order.completed_at });

  const currentIdx = STATUS_PIPELINE.indexOf(order.status);

  return (
    <div className="space-y-3">
      {steps.map((step, idx) => {
        const stepIdx = STATUS_PIPELINE.indexOf(step.status);
        const isReached = order.status !== "cancelled" && stepIdx <= currentIdx;
        const isCurrent = step.status === order.status;
        return (
          <div key={step.status} className="flex gap-3 items-start">
            <div className="flex flex-col items-center">
              {isReached
                ? <CheckCircle2 className={cn("size-4 mt-0.5", isCurrent ? "text-primary" : "text-green-500 dark:text-green-400")} />
                : <Circle className="size-4 mt-0.5 text-muted-foreground/30" />
              }
              {idx < steps.length - 1 && (
                <div className={cn("w-px h-4 mt-1", isReached ? "bg-green-500/50" : "bg-border")} />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <p className={cn("text-sm font-medium leading-none", isCurrent ? "text-primary" : isReached ? "text-foreground" : "text-muted-foreground/50")}>
                {step.label}
              </p>
              {step.timestamp && isReached && (
                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(step.timestamp)}</p>
              )}
            </div>
          </div>
        );
      })}

      {order.status === "cancelled" && (
        <div className="flex gap-3 items-start">
          <div className="size-4 mt-0.5 rounded-full bg-destructive/20 flex items-center justify-center">
            <span className="size-2 rounded-full bg-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium text-destructive">{t.cancelled}</p>
            {order.cancelled_at && <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(order.cancelled_at)}</p>}
            {order.cancel_reason && <p className="text-xs text-muted-foreground">{t.ord_cancelledReason} {order.cancel_reason}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Order Detail Sheet ────────────────────────────────────────────────────────

interface OrderDetailSheetProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loadingId: string | null;
  onAction: (order: Order) => void;
  onCancelRequest: (order: Order) => void;
}

function OrderDetailSheet({ order, open, onOpenChange, loadingId, onAction, onCancelRequest }: OrderDetailSheetProps) {
  const t = useT();
  if (!order) return null;

  const isLoading = loadingId === order.id;
  const hasAction = getNextStatus(order) !== null;
  const canCancel = isActiveOrder(order.status);

  const STATUS_LABELS: Record<string, string> = {
    pending:          t.ord_statusPending,
    accepted:         t.accepted,
    preparing:        t.preparing,
    ready:            t.ready,
    out_for_delivery: t.outForDelivery,
    completed:        t.completed,
    cancelled:        t.cancelled,
  };

  function getActionLabel(o: Order): string {
    if (o.status === "pending")   return t.ord_actionAccept;
    if (o.status === "accepted")  return t.ord_actionStartPreparing;
    if (o.status === "preparing") return o.order_type === "delivery" ? t.outForDelivery : t.ord_actionMarkReady;
    if (o.status === "ready")     return t.ord_actionComplete;
    if (o.status === "out_for_delivery") return t.ord_actionMarkDelivered;
    return "";
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md w-full flex flex-col overflow-y-auto p-0" showCloseButton>
        <SheetHeader className="p-4 pb-0">
          <div className="flex items-center gap-2 flex-wrap pe-8">
            <SheetTitle className="text-base font-semibold">{t.navOrders} {order.order_number}</SheetTitle>
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", statusColors[order.status])}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
          <SheetDescription className="flex items-center gap-1.5">
            <ChannelIcon channel={order.channel} />
            <span className="capitalize">{order.channel}</span>
            <span className="text-muted-foreground/50">·</span>
            <span>{timeAgo(order.created_at)}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5 mt-4">
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.ord_sectionCustomer}</h3>
            <div className="space-y-1 text-sm">
              {order.customer_name  && <p><span className="text-muted-foreground">{t.name}: </span>{order.customer_name}</p>}
              {order.customer_phone && <p><span className="text-muted-foreground">{t.phone}: </span>{order.customer_phone}</p>}
              {order.table_number   && <p><span className="text-muted-foreground">{t.tableNumber}: </span>{order.table_number}</p>}
              {order.delivery_address && <p><span className="text-muted-foreground">{t.address}: </span>{order.delivery_address}</p>}
              {order.notes          && <p><span className="text-muted-foreground">{t.notes}: </span>{order.notes}</p>}
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.ord_sectionItems}</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-start justify-between gap-2 text-sm">
                    <span className="font-medium">{item.quantity}× {item.name}</span>
                    <span className="shrink-0 text-muted-foreground">{formatPrice(item.line_total)}</span>
                  </div>
                  {item.modifiers.length > 0 && (
                    <div className="ms-4 mt-0.5 space-y-0.5">
                      {item.modifiers.map((mod, mIdx) => (
                        <p key={mIdx} className="text-xs text-muted-foreground">
                          + {mod.name}{mod.price_delta > 0 ? ` (+${formatPrice(mod.price_delta)})` : ""}
                        </p>
                      ))}
                    </div>
                  )}
                  {item.notes && <p className="ms-4 mt-0.5 text-xs text-muted-foreground italic">{item.notes}</p>}
                </div>
              ))}
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.ord_sectionTotals}</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t.subtotal}</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t.tax}</span><span>{formatPrice(order.tax)}</span></div>
              {order.service_charge > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">{t.ord_serviceCharge}</span><span>{formatPrice(order.service_charge)}</span></div>
              )}
              {order.tip > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">{t.ord_tip}</span><span>{formatPrice(order.tip)}</span></div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold"><span>{t.total}</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.ord_sectionPayment}</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="capitalize">{order.payment_method.replace(/_/g, " ")}</span>
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", PAYMENT_STATUS_COLORS[order.payment_status])}>
                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </span>
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t.ord_sectionTimeline}</h3>
            <StatusTimeline order={order} />
          </section>
        </div>

        {(hasAction || canCancel) && (
          <SheetFooter className="border-t border-border">
            <div className="flex flex-col gap-2 w-full">
              {hasAction && (
                <Button className={cn("w-full", order.status === "ready" && "bg-green-600 hover:bg-green-700 text-white")}
                  disabled={isLoading} onClick={() => onAction(order)}>
                  {isLoading && <Loader2 className="size-4 animate-spin" />}
                  {getActionLabel(order)}
                </Button>
              )}
              {canCancel && (
                <Button variant="destructive" className="w-full" disabled={isLoading} onClick={() => onCancelRequest(order)}>
                  {t.ord_cancelOrder}
                </Button>
              )}
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Cancel Order Dialog ───────────────────────────────────────────────────────

interface CancelOrderDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (order: Order, reason: string) => void;
}

function CancelOrderDialog({ order, open, onOpenChange, onConfirm }: CancelOrderDialogProps) {
  const t = useT();

  const CANCEL_REASONS = [
    t.ord_reasonCustomerReq,
    t.ord_reasonOutOfStock,
    t.ord_reasonRestaurantClose,
    t.ord_reasonPaymentIssue,
    t.ord_reasonOther,
  ] as const;

  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.ord_cancelOrder} {order.order_number}?</DialogTitle>
          <DialogDescription>{t.ord_cancelDialogDesc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>{t.ord_cancelReason}</Label>
          <Select value={reason} onValueChange={(v) => { if (v) setReason(v); }}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CANCEL_REASONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>{t.ord_keepOrder}</DialogClose>
          <Button type="button" variant="destructive" onClick={() => { onConfirm(order, reason); onOpenChange(false); }}>
            {t.ord_confirmCancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Filter Pill ───────────────────────────────────────────────────────────────

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const t = useT();
  const currentRole = useDashboardStore((s) => s.currentRole);

  const STATUS_LABELS: Record<string, string> = {
    pending:          t.ord_statusPending,
    accepted:         t.accepted,
    preparing:        t.preparing,
    ready:            t.ready,
    out_for_delivery: t.outForDelivery,
    completed:        t.completed,
    cancelled:        t.cancelled,
  };

  const ORDER_TYPE_LABELS: Record<OrderType, string> = {
    dine_in:    t.ord_dineIn,
    takeaway:   t.ord_takeaway,
    delivery:   t.delivery,
    drive_thru: t.ord_driveThru,
  };

  const [orders, setOrders] = useState<Order[]>(EXTENDED_ORDERS);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<OrderTypeFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [cancelOrder, setCancelOrder] = useState<Order | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const roleFilteredOrders = orders.filter((order) => {
    if (currentRole === "kitchen") return isActiveOrder(order.status);
    if (currentRole === "cashier") return filterByTimeRange(order, "today");
    return true;
  });

  const filteredOrders = roleFilteredOrders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (typeFilter !== "all" && order.order_type !== typeFilter) return false;
    if (channelFilter !== "all" && order.channel !== channelFilter) return false;
    if (!filterByTimeRange(order, timeRange)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!order.order_number.toLowerCase().includes(q) && !(order.customer_name?.toLowerCase().includes(q) ?? false)) return false;
    }
    return true;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const activeCount = roleFilteredOrders.filter((o) => isActiveOrder(o.status)).length;

  const handleAction = useCallback(async (order: Order) => {
    const next = getNextStatus(order);
    if (!next) return;
    setLoadingId(order.id);
    await new Promise((r) => setTimeout(r, 600));
    if (Math.random() < 0.05) {
      setLoadingId(null);
      toast.error(t.ord_failedUpdate);
      return;
    }
    const now = new Date().toISOString();
    const updater = (o: Order) => o.id === order.id ? { ...o, status: next,
      ...(next === "accepted"          && { accepted_at: now }),
      ...(next === "preparing"         && { preparing_at: now }),
      ...(next === "ready"             && { ready_at: now }),
      ...(next === "out_for_delivery"  && { ready_at: now }),
      ...(next === "completed"         && { completed_at: now }),
    } : o;
    setOrders((prev) => prev.map(updater));
    if (selectedOrder?.id === order.id) setSelectedOrder((prev) => prev ? updater(prev) : null);
    setLoadingId(null);
    toast.success(`${order.order_number} — ${STATUS_LABELS[next] ?? next}`);
  }, [selectedOrder, t, STATUS_LABELS]);

  const handleCancelRequest = useCallback((order: Order) => { setCancelOrder(order); setCancelOpen(true); }, []);

  const handleCancelConfirm = useCallback((order: Order, reason: string) => {
    const now = new Date().toISOString();
    const updater = (o: Order) => o.id === order.id ? { ...o, status: "cancelled" as OrderStatus, cancelled_at: now, cancel_reason: reason } : o;
    setOrders((prev) => prev.map(updater));
    if (selectedOrder?.id === order.id) setSelectedOrder((prev) => prev ? updater(prev) : null);
    toast.success(`${order.order_number} ${t.cancelled}`);
    setCancelOrder(null);
    setDetailOpen(false);
  }, [selectedOrder, t]);

  const handleOpenDetail = useCallback((order: Order) => { setSelectedOrder(order); setDetailOpen(true); }, []);

  function clearFilters() {
    setStatusFilter("all"); setTypeFilter("all"); setChannelFilter("all"); setSearch(""); setTimeRange("today");
  }

  const showFilterBar = currentRole !== "cashier";
  const STATUS_FILTERS: StatusFilter[] = ["all", "pending", "accepted", "preparing", "ready", "completed", "cancelled"];
  const TYPE_FILTERS: OrderTypeFilter[] = ["all", "dine_in", "takeaway", "delivery", "drive_thru"];
  const CHANNEL_FILTERS: ChannelFilter[] = ["all", "web", "whatsapp"];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{t.ord_pageTitle}</h1>
          {activeCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-2.5 py-0.5 text-xs font-semibold tabular-nums">
              {activeCount} {t.activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="sound-alerts" className="text-sm text-muted-foreground">{t.ord_soundAlerts}</Label>
          <Switch id="sound-alerts" checked={soundEnabled} onCheckedChange={setSoundEnabled} size="sm" />
        </div>
      </div>

      {showFilterBar && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {STATUS_FILTERS.map((s) => (
              <FilterPill key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                {s === "all" ? t.all : STATUS_LABELS[s as OrderStatus] ?? s}
              </FilterPill>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {TYPE_FILTERS.map((type) => (
                <FilterPill key={type} active={typeFilter === type} onClick={() => setTypeFilter(type)}>
                  {type === "all" ? t.ord_allTypes : ORDER_TYPE_LABELS[type as OrderType]}
                </FilterPill>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {CHANNEL_FILTERS.map((c) => (
                <FilterPill key={c} active={channelFilter === c} onClick={() => setChannelFilter(c)}>
                  {c === "all" ? t.ord_allChannels : c === "web" ? t.ord_channelWeb : "WhatsApp"}
                </FilterPill>
              ))}
            </div>

            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input placeholder={t.ord_searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-8 h-7 text-xs" />
            </div>

            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger size="sm" className="min-w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">{t.today}</SelectItem>
                <SelectItem value="last_hour">{t.ord_lastHour}</SelectItem>
                <SelectItem value="last_3h">{t.ord_last3h}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {sortedOrders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {sortedOrders.map((order) => (
              <OrderCard key={order.id} order={order} loadingId={loadingId} onAction={handleAction} onCancel={handleCancelRequest} onOpenDetail={handleOpenDetail} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <Package className="size-12 text-muted-foreground/30" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t.ord_noOrdersMatch}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{t.ord_noOrdersSubtitle}</p>
          </div>
          <Button variant="outline" size="sm" onClick={clearFilters}>{t.clearFilters}</Button>
        </div>
      )}

      <OrderDetailSheet order={selectedOrder} open={detailOpen} onOpenChange={setDetailOpen} loadingId={loadingId} onAction={handleAction} onCancelRequest={handleCancelRequest} />
      <CancelOrderDialog order={cancelOrder} open={cancelOpen} onOpenChange={setCancelOpen} onConfirm={handleCancelConfirm} />
    </div>
  );
}
