"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  Monitor,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  SplitSquareHorizontal,
  Printer,
  PauseCircle,
  RotateCcw,
  Inbox,
  LogOut,
  Search,
  Zap,
  Tag,
  Percent,
  X,
  ShoppingBag,
  Keyboard,
  AlertTriangle,
  Lock,
} from "lucide-react";

import { mockItems, mockCategories, mockModifierGroups } from "@/mock/menu";
import type { Item, ModifierGroup, ModifierOption } from "@/types";
import { cn, formatPrice, generateId } from "@/lib/utils";
import { useT } from "@/lib/i18n";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

// ─── Types ─────────────────────────────────────────────────────────────────────

type OrderType = "dine_in" | "takeaway" | "delivery";
type PaymentMode = "cash" | "card" | "split";
type TipPreset = 0 | 10 | 15 | 20 | -1; // -1 = custom

interface SelectedModifier {
  group_id: string;
  group_name: string;
  option_id: string;
  option_name: string;
  price_delta: number;
}

interface POSLineItem {
  id: string;
  item_id: string;
  name: string;
  name_ar?: string;
  unit_price: number;
  quantity: number;
  selected_modifiers: SelectedModifier[];
  line_total: number;
}

interface HeldOrder {
  id: string;
  order_number: string;
  order_type: OrderType;
  customer_name: string;
  table_number: string;
  items: POSLineItem[];
  notes: string;
  held_at: string;
}

interface ShiftData {
  started_at: string;
  orders: number;
  cash_sales: number;
  card_sales: number;
  voids: number;
  refunds: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const MOCK_PIN = "1234";
const TAX_RATE = 0.1;

const CATEGORY_GRADIENTS: Record<string, string> = {
  c1: "from-orange-500 to-amber-400",
  c2: "from-yellow-500 to-lime-400",
  c3: "from-sky-500 to-cyan-400",
  c4: "from-pink-500 to-rose-400",
};
const DEFAULT_GRADIENT = "from-violet-500 to-purple-400";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function calcLineTotal(unit_price: number, quantity: number, modifiers: SelectedModifier[]): number {
  const modSum = modifiers.reduce((s, m) => s + m.price_delta, 0);
  return (unit_price + modSum) * quantity;
}

let _orderCounter = 100;
function nextOrderNumber(): string {
  return `#${++_orderCounter}`;
}

// ─── Modifier Picker ───────────────────────────────────────────────────────────

interface ModifierPickerProps {
  item: Item;
  onConfirm: (modifiers: SelectedModifier[]) => void;
  onCancel: () => void;
}

function ModifierPicker({ item, onConfirm, onCancel }: ModifierPickerProps) {
  const groups: ModifierGroup[] = mockModifierGroups[item.id] ?? item.modifier_groups ?? [];
  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    groups.forEach((g) => {
      const defaults = g.options.filter((o) => o.is_default).map((o) => o.id);
      init[g.id] = defaults;
    });
    return init;
  });

  function toggle(group: ModifierGroup, optionId: string) {
    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      const max = group.max_selections ?? 1;
      if (current.includes(optionId)) {
        if (group.min_selections > 0 && current.length <= group.min_selections) return prev;
        return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
      }
      if (max === 1) return { ...prev, [group.id]: [optionId] };
      if (current.length >= max) return prev;
      return { ...prev, [group.id]: [...current, optionId] };
    });
  }

  function buildModifiers(): SelectedModifier[] {
    const result: SelectedModifier[] = [];
    groups.forEach((g) => {
      (selections[g.id] ?? []).forEach((optId) => {
        const opt = g.options.find((o) => o.id === optId);
        if (opt) {
          result.push({
            group_id: g.id,
            group_name: g.name,
            option_id: opt.id,
            option_name: opt.name,
            price_delta: opt.price_delta,
          });
        }
      });
    });
    return result;
  }

  function isValid() {
    return groups.every((g) => {
      if (!g.is_required) return true;
      return (selections[g.id]?.length ?? 0) >= g.min_selections;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <div key={group.id}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-semibold">{group.name}</span>
            {group.is_required && (
              <span className="text-[10px] bg-destructive/10 text-destructive rounded px-1">Required</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {group.options.filter((o) => o.is_available).map((opt) => {
              const selected = (selections[group.id] ?? []).includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggle(group, opt.id)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted text-foreground hover:border-primary/50"
                  )}
                >
                  {opt.name}
                  {opt.price_delta > 0 && (
                    <span className={cn("text-[10px]", selected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      +{formatPrice(opt.price_delta)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex gap-2 mt-1">
        <Button variant="outline" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="flex-1" disabled={!isValid()} onClick={() => onConfirm(buildModifiers())}>
          Add to Order
        </Button>
      </div>
    </div>
  );
}

// ─── Item Card ─────────────────────────────────────────────────────────────────

interface ItemCardProps {
  item: Item & { translations?: Record<string, { name: string; description?: string }> };
  onAdd: (item: Item, modifiers: SelectedModifier[]) => void;
}

function ItemCard({ item, onAdd }: ItemCardProps) {
  const hasModifiers = !!(mockModifierGroups[item.id]?.length || item.modifier_groups?.length);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const gradient = CATEGORY_GRADIENTS[item.category_id] ?? DEFAULT_GRADIENT;
  const arName = item.translations?.ar?.name;

  function handleClick() {
    if (!item.is_available) return;
    if (hasModifiers) {
      setPopoverOpen(true);
    } else {
      onAdd(item, []);
    }
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={!item.is_available}
            onClick={handleClick}
            className={cn(
              "group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden text-left transition-all",
              item.is_available
                ? "hover:border-primary/50 hover:shadow-md hover:shadow-primary/10 active:scale-[0.97]"
                : "opacity-50 cursor-not-allowed"
            )}
          />
        }
      >
        {/* Image placeholder */}
        <div className={cn("h-20 bg-gradient-to-br flex items-center justify-center relative shrink-0", gradient)}>
          <ShoppingBag className="size-8 text-white/60" />
          {/* Availability dot */}
          <span className={cn(
            "absolute top-1.5 right-1.5 size-2 rounded-full border border-white/50",
            item.is_available ? "bg-green-400" : "bg-red-400"
          )} />
        </div>

        {/* Info */}
        <div className="p-2 flex-1 flex flex-col gap-0.5">
          <p className="text-xs font-semibold leading-tight line-clamp-2">{item.name}</p>
          {arName && (
            <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1" dir="rtl">{arName}</p>
          )}
          <p className="mt-auto pt-1 text-xs font-bold text-primary">{formatPrice(item.price)}</p>
        </div>
      </PopoverTrigger>

      {hasModifiers && (
        <PopoverContent side="top" className="w-80">
          <p className="text-sm font-semibold mb-3">{item.name}</p>
          <ModifierPicker
            item={item}
            onConfirm={(mods) => { setPopoverOpen(false); onAdd(item, mods); }}
            onCancel={() => setPopoverOpen(false)}
          />
        </PopoverContent>
      )}
    </Popover>
  );
}

// ─── Void Confirm Dialog ───────────────────────────────────────────────────────

interface VoidDialogProps {
  open: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function VoidDialog({ open, itemName, onConfirm, onCancel }: VoidDialogProps) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            {t.pos_confirmVoid}
          </DialogTitle>
          <DialogDescription>
            {t.pos_confirmVoidDesc} <span className="font-semibold text-foreground">{itemName}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />} onClick={onCancel}>
            Cancel
          </DialogClose>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            {t.pos_voidItem}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── PIN Dialog ────────────────────────────────────────────────────────────────

interface PinDialogProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

function PinDialog({ open, onSuccess, onCancel }: PinDialogProps) {
  const t = useT();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit() {
    if (pin === MOCK_PIN) {
      setPin("");
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  }

  function handleClose() {
    setPin("");
    setError(false);
    onCancel();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-4" />
            {t.pos_enterPin}
          </DialogTitle>
          <DialogDescription>{t.pos_discountPin}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label>{t.pos_pinLabel}</Label>
          <Input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            placeholder="••••"
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{t.pos_pinError}</p>}
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />} onClick={handleClose}>
            Cancel
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={pin.length !== 4}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Clear Order Dialog ────────────────────────────────────────────────────────

interface ClearOrderDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ClearOrderDialog({ open, onConfirm, onCancel }: ClearOrderDialogProps) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            {t.pos_clearOrder}?
          </DialogTitle>
          <DialogDescription>This will remove all items from the current order.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />} onClick={onCancel}>
            Cancel
          </DialogClose>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            {t.pos_clearOrder}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Shift Report Dialog ───────────────────────────────────────────────────────

interface ShiftReportDialogProps {
  open: boolean;
  shift: ShiftData;
  onClose: () => void;
}

function ShiftReportDialog({ open, shift, onClose }: ShiftReportDialogProps) {
  const t = useT();
  const duration = Math.round((Date.now() - new Date(shift.started_at).getTime()) / 60000);
  const net = shift.cash_sales + shift.card_sales;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="size-4" />
            {t.pos_shiftReport}
          </DialogTitle>
          <DialogDescription>
            {t.pos_shiftStart}: {new Date(shift.started_at).toLocaleTimeString()} · {duration}m ago
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.pos_ordersCount}</span>
            <span className="font-semibold">{shift.orders}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.pos_cashSales}</span>
            <span className="font-semibold text-green-600">{formatPrice(shift.cash_sales)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.pos_cardSales}</span>
            <span className="font-semibold text-blue-600">{formatPrice(shift.card_sales)}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.pos_voids}</span>
            <span className="font-semibold text-destructive">{shift.voids}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.pos_refunds}</span>
            <span className="font-semibold text-amber-600">{formatPrice(shift.refunds)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base">
            <span className="font-bold">{t.pos_netSales}</span>
            <span className="font-bold">{formatPrice(net)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => toast.success("Report printed")} className="gap-1.5">
            <Printer className="size-3.5" />
            Print Report
          </Button>
          <Button variant="destructive" size="sm" onClick={onClose} className="gap-1.5">
            <LogOut className="size-3.5" />
            Close Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Held Orders Sheet ─────────────────────────────────────────────────────────

interface HeldOrdersSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  held: HeldOrder[];
  onRecall: (order: HeldOrder) => void;
}

function HeldOrdersSheet({ open, onOpenChange, held, onRecall }: HeldOrdersSheetProps) {
  const t = useT();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 sm:max-w-xs flex flex-col" showCloseButton>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Inbox className="size-4" />
            {t.pos_heldOrders}
            {held.length > 0 && (
              <Badge variant="secondary" className="ml-1">{held.length}</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {held.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
              <Inbox className="size-8 opacity-30" />
              <p className="text-sm">{t.pos_noHeldOrders}</p>
            </div>
          ) : (
            held.map((order) => (
              <div key={order.id} className="rounded-lg border border-border bg-card p-3 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{order.order_number}</p>
                    {order.customer_name && (
                      <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {order.order_type === "dine_in" ? t.pos_dineIn : order.order_type === "takeaway" ? t.pos_takeaway : t.pos_delivery}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {order.items.length} {t.pos_total_items} ·{" "}
                  {new Date(order.held_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                <Button size="sm" className="w-full gap-1.5" onClick={() => { onRecall(order); onOpenChange(false); }}>
                  <RotateCcw className="size-3.5" />
                  {t.pos_recallOrder}
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CashierPage() {
  const t = useT();

  // ── Order state ──────────────────────────────────────────────────────────────
  const [orderNumber, setOrderNumber] = useState(() => nextOrderNumber());
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<POSLineItem[]>([]);

  // ── Item browser state ───────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // ── Discount state ───────────────────────────────────────────────────────────
  const [discountPct, setDiscountPct] = useState<string>("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);

  // ── Tip state ────────────────────────────────────────────────────────────────
  const [tipPreset, setTipPreset] = useState<TipPreset>(0);
  const [customTip, setCustomTip] = useState("");

  // ── Payment state ────────────────────────────────────────────────────────────
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [tendered, setTendered] = useState("");
  const [splitCash, setSplitCash] = useState("");
  const [splitCard, setSplitCard] = useState("");

  // ── Void state ───────────────────────────────────────────────────────────────
  const [voidTarget, setVoidTarget] = useState<POSLineItem | null>(null);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);

  // ── Clear order dialog ───────────────────────────────────────────────────────
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // ── Held orders ──────────────────────────────────────────────────────────────
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [heldSheetOpen, setHeldSheetOpen] = useState(false);

  // ── Shift report ─────────────────────────────────────────────────────────────
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [shift] = useState<ShiftData>({
    started_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    orders: 14,
    cash_sales: 87400,
    card_sales: 134200,
    voids: 2,
    refunds: 1299,
  });

  // ── Filtered items ───────────────────────────────────────────────────────────
  const filteredItems = mockItems.filter((item) => {
    if (!item.is_available && activeCategory === "all" && !search) return true; // still show unavailable
    if (activeCategory !== "all" && item.category_id !== activeCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const arName = item.translations?.ar?.name?.toLowerCase() ?? "";
      return item.name.toLowerCase().includes(q) || arName.includes(q);
    }
    return true;
  });

  // ── Order calculations ───────────────────────────────────────────────────────
  const subtotal = lineItems.reduce((s, i) => s + i.line_total, 0);
  const discountAmount = discountApplied && discountPct ? Math.round(subtotal * (parseFloat(discountPct) / 100)) : 0;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = Math.round(afterDiscount * TAX_RATE);

  const tipPct = tipPreset === -1 ? parseFloat(customTip || "0") : tipPreset;
  const tipAmount = Math.round(afterDiscount * (tipPct / 100));

  const total = afterDiscount + taxAmount + tipAmount;
  const tenderedNum = parseFloat(tendered || "0") * 100;
  const change = tenderedNum - total;

  const splitCashNum = parseFloat(splitCash || "0") * 100;
  const splitCardNum = parseFloat(splitCard || "0") * 100;
  const splitValid = Math.abs(splitCashNum + splitCardNum - total) < 2;

  // ── Actions ──────────────────────────────────────────────────────────────────

  const addItem = useCallback((item: Item & { translations?: Record<string, { name: string }> }, modifiers: SelectedModifier[]) => {
    if (!item.is_available) return;
    setLineItems((prev) => {
      // If no modifiers and item already exists with no mods → increment
      const modKey = modifiers.map((m) => m.option_id).sort().join(",");
      const existing = prev.find(
        (li) => li.item_id === item.id && li.selected_modifiers.map((m) => m.option_id).sort().join(",") === modKey
      );
      if (existing) {
        return prev.map((li) =>
          li.id === existing.id
            ? { ...li, quantity: li.quantity + 1, line_total: calcLineTotal(li.unit_price, li.quantity + 1, li.selected_modifiers) }
            : li
        );
      }
      const newItem: POSLineItem = {
        id: generateId(),
        item_id: item.id,
        name: item.name,
        name_ar: item.translations?.ar?.name,
        unit_price: item.price,
        quantity: 1,
        selected_modifiers: modifiers,
        line_total: calcLineTotal(item.price, 1, modifiers),
      };
      return [...prev, newItem];
    });
  }, []);

  function adjustQty(id: string, delta: number) {
    setLineItems((prev) =>
      prev.flatMap((li) => {
        if (li.id !== id) return [li];
        const newQty = li.quantity + delta;
        if (newQty <= 0) return [];
        return [{ ...li, quantity: newQty, line_total: calcLineTotal(li.unit_price, newQty, li.selected_modifiers) }];
      })
    );
  }

  function requestVoid(li: POSLineItem) {
    setVoidTarget(li);
    setVoidDialogOpen(true);
  }

  function confirmVoid() {
    if (!voidTarget) return;
    setLineItems((prev) => prev.filter((li) => li.id !== voidTarget.id));
    setVoidDialogOpen(false);
    setVoidTarget(null);
    toast.success(`${voidTarget.name} voided`);
  }

  function newOrder() {
    setLineItems([]);
    setCustomerName("");
    setTableNumber("");
    setNotes("");
    setDiscountPct("");
    setDiscountApplied(false);
    setTipPreset(0);
    setCustomTip("");
    setTendered("");
    setSplitCash("");
    setSplitCard("");
    setOrderNumber(nextOrderNumber());
  }

  function holdOrder() {
    if (lineItems.length === 0) { toast.error(t.pos_emptyOrder); return; }
    const held: HeldOrder = {
      id: generateId(),
      order_number: orderNumber,
      order_type: orderType,
      customer_name: customerName,
      table_number: tableNumber,
      items: lineItems,
      notes,
      held_at: new Date().toISOString(),
    };
    setHeldOrders((prev) => [...prev, held]);
    toast.success(t.pos_held);
    newOrder();
  }

  function recallOrder(order: HeldOrder) {
    setHeldOrders((prev) => prev.filter((h) => h.id !== order.id));
    setOrderNumber(order.order_number);
    setOrderType(order.order_type);
    setCustomerName(order.customer_name);
    setTableNumber(order.table_number);
    setLineItems(order.items);
    setNotes(order.notes);
    toast.success(t.pos_recalled);
  }

  function processPayment() {
    if (lineItems.length === 0) { toast.error(t.pos_emptyOrder); return; }
    toast.success(`${t.pos_paymentProcessed} — ${orderNumber}`);
    newOrder();
  }

  function openDrawer() {
    toast.success(t.pos_drawerOpened);
  }

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Enter") processPayment();
      if (e.key === "F2") { e.preventDefault(); newOrder(); }
      if (e.key === "F9") { e.preventDefault(); openDrawer(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const ORDER_TYPE_OPTIONS: { value: OrderType; label: string }[] = [
    { value: "dine_in",   label: t.pos_dineIn },
    { value: "takeaway",  label: t.pos_takeaway },
    { value: "delivery",  label: t.pos_delivery },
  ];

  const TIP_OPTIONS: { value: TipPreset; label: string }[] = [
    { value: 0,   label: "0%" },
    { value: 10,  label: "10%" },
    { value: 15,  label: "15%" },
    { value: 20,  label: "20%" },
    { value: -1,  label: "Custom" },
  ];

  const orderTypeBadgeColor: Record<OrderType, string> = {
    dine_in:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    takeaway: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    delivery: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      {/* Full-viewport overlay that escapes the normal dashboard padding */}
      <div className="fixed inset-0 z-10 flex bg-background" style={{ top: "var(--header-height, 57px)" }}>

        {/* ══ LEFT — Item Browser (60%) ══════════════════════════════════════════ */}
        <div className="flex flex-col w-[60%] min-w-0 border-r border-border">

          {/* Top bar */}
          <div className="shrink-0 flex flex-col gap-2 p-3 border-b border-border bg-card">
            {/* Row 1: search + barcode + order type + table */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.pos_searchItems}
                  className="pl-8 h-9 text-sm"
                />
              </div>

              {/* Barcode scan */}
              <Tooltip>
                <TooltipTrigger render={<span className="contents" />}>
                  <Button variant="outline" size="sm" className="gap-1.5 shrink-0 h-9"
                    onClick={() => toast.info("Scanning…")}>
                    <Zap className="size-3.5" />
                    <span className="hidden sm:inline">{t.pos_scanBarcode}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t.pos_scanBarcode}</TooltipContent>
              </Tooltip>

              {/* Order type pills */}
              <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-0.5">
                {ORDER_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setOrderType(opt.value)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                      orderType === opt.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Table input (only for dine-in) */}
              {orderType === "dine_in" && (
                <Input
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder={`${t.pos_table}…`}
                  className="w-24 h-9 text-sm shrink-0"
                />
              )}
            </div>

            {/* Row 2: order type on mobile */}
            <div className="flex md:hidden items-center gap-1 bg-muted rounded-lg p-0.5 w-fit">
              {ORDER_TYPE_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setOrderType(opt.value)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    orderType === opt.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  )}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category tabs */}
          <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto px-3 py-2 border-b border-border scrollbar-none bg-card">
            {[{ id: "all", name: "All" }, ...mockCategories].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Item grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                <Search className="size-8 opacity-30" />
                <p className="text-sm">No items found</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {filteredItems.map((item) => (
                  <ItemCard key={item.id} item={item} onAdd={addItem} />
                ))}
              </div>
            )}
          </div>

          {/* Keyboard shortcut hint */}
          <div className="shrink-0 border-t border-border bg-muted/30 px-3 py-1.5 flex items-center gap-4 text-[10px] text-muted-foreground">
            <Keyboard className="size-3 shrink-0" />
            <span><kbd className="rounded border border-border bg-background px-1 font-mono">Enter</kbd> = Process payment</span>
            <span><kbd className="rounded border border-border bg-background px-1 font-mono">F2</kbd> = New order</span>
            <span><kbd className="rounded border border-border bg-background px-1 font-mono">F9</kbd> = Open drawer</span>
          </div>
        </div>

        {/* ══ RIGHT — Current Order (40%) ════════════════════════════════════════ */}
        <div className="flex flex-col w-[40%] min-w-0 bg-card">

          {/* Order header */}
          <div className="shrink-0 p-3 border-b border-border">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-semibold text-base">{t.pos_currentOrder}</h2>
                  <span className="text-sm font-mono text-muted-foreground">{orderNumber}</span>
                </div>
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium mt-0.5", orderTypeBadgeColor[orderType])}>
                  {ORDER_TYPE_OPTIONS.find((o) => o.value === orderType)?.label}
                  {orderType === "dine_in" && tableNumber ? ` · T-${tableNumber}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 px-2" onClick={() => { newOrder(); }}>
                  <Plus className="size-3" />
                  {t.pos_newOrder}
                </Button>
                <Tooltip>
                  <TooltipTrigger render={<span className="contents" />}>
                    <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive h-7 w-7"
                      onClick={() => setClearDialogOpen(true)}>
                      <X className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t.pos_clearOrder}</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Customer name */}
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={`${t.pos_customer} (${t.pos_walkIn})`}
              className="h-8 text-xs"
            />
          </div>

          {/* Order items list */}
          <div className="flex-1 overflow-y-auto">
            {lineItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                <ShoppingBag className="size-10 opacity-20" />
                <p className="text-sm">{t.pos_emptyOrder}</p>
                <p className="text-xs opacity-60">{t.pos_addItemsToStart}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {lineItems.map((li) => (
                  <div key={li.id} className="px-3 py-2.5 flex gap-2 items-start group">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold leading-tight">{li.name}</p>
                      {li.name_ar && (
                        <p className="text-[10px] text-muted-foreground leading-tight" dir="rtl">{li.name_ar}</p>
                      )}
                      {li.selected_modifiers.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {li.selected_modifiers.map((m) => m.option_name).join(", ")}
                        </p>
                      )}
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => adjustQty(li.id, -1)}
                        className="size-6 rounded-md border border-border bg-muted flex items-center justify-center hover:bg-muted/60 transition-colors">
                        <Minus className="size-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-semibold tabular-nums">{li.quantity}</span>
                      <button type="button" onClick={() => adjustQty(li.id, 1)}
                        className="size-6 rounded-md border border-border bg-muted flex items-center justify-center hover:bg-muted/60 transition-colors">
                        <Plus className="size-3" />
                      </button>
                    </div>

                    {/* Line total */}
                    <span className="text-xs font-semibold w-16 text-right shrink-0">{formatPrice(li.line_total)}</span>

                    {/* Void button */}
                    <button type="button" onClick={() => requestVoid(li)}
                      className="size-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom panel — fixed */}
          <div className="shrink-0 border-t border-border">
            {/* Notes */}
            <div className="px-3 pt-2 pb-1">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.pos_notesPlaceholder}
                className="text-xs resize-none h-10 min-h-0 py-1.5"
                rows={2}
              />
            </div>

            {/* Discount section */}
            <div className="px-3 pb-2 flex items-center gap-2">
              <Tag className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">{t.pos_discount}</span>
              <div className="flex items-center gap-1 ml-auto">
                <Input
                  value={discountPct}
                  onChange={(e) => { setDiscountPct(e.target.value); setDiscountApplied(false); }}
                  placeholder="0"
                  className="w-14 h-7 text-xs text-center"
                  type="number"
                  min="0"
                  max="100"
                />
                <Percent className="size-3 text-muted-foreground" />
                <Button
                  size="sm"
                  variant={discountApplied ? "secondary" : "outline"}
                  className="h-7 text-xs px-2"
                  disabled={!discountPct || parseFloat(discountPct) <= 0}
                  onClick={() => setPinDialogOpen(true)}
                >
                  {discountApplied ? "Applied" : "Apply"}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="px-3 py-2 space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>{t.pos_subtotal}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>{t.pos_discount} ({discountPct}%)</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>{t.pos_tax} (10%)</span>
                <span>{formatPrice(taxAmount)}</span>
              </div>

              {/* Tip */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">{t.pos_tip}</span>
                <div className="flex items-center gap-1">
                  {TIP_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setTipPreset(opt.value)}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors",
                        tipPreset === opt.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted text-muted-foreground hover:text-foreground"
                      )}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {tipPreset === -1 && (
                <div className="flex items-center gap-1 justify-end">
                  <Input
                    value={customTip}
                    onChange={(e) => setCustomTip(e.target.value)}
                    placeholder="0"
                    className="w-14 h-6 text-xs text-center"
                    type="number"
                    min="0"
                    max="100"
                  />
                  <Percent className="size-3 text-muted-foreground" />
                </div>
              )}
              {tipAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>{t.pos_tip} ({tipPct}%)</span>
                  <span>{formatPrice(tipAmount)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="px-3 pb-2">
              <div className="flex justify-between items-center rounded-lg bg-primary/10 px-3 py-2">
                <span className="text-sm font-bold">{t.pos_total}</span>
                <span className="text-lg font-black tabular-nums">{formatPrice(total)}</span>
              </div>
            </div>

            <Separator />

            {/* Payment method tabs */}
            <div className="px-3 pt-2 pb-1 flex gap-1.5">
              <button type="button" onClick={() => setPaymentMode("cash")}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-medium transition-colors",
                  paymentMode === "cash" ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "border-border bg-muted text-muted-foreground hover:text-foreground"
                )}>
                <Banknote className="size-4" />
                {t.pos_cash}
              </button>
              <button type="button" onClick={() => setPaymentMode("card")}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-medium transition-colors",
                  paymentMode === "card" ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : "border-border bg-muted text-muted-foreground hover:text-foreground"
                )}>
                <CreditCard className="size-4" />
                {t.pos_card}
              </button>
              <button type="button" onClick={() => setPaymentMode("split")}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-medium transition-colors",
                  paymentMode === "split" ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" : "border-border bg-muted text-muted-foreground hover:text-foreground"
                )}>
                <SplitSquareHorizontal className="size-4" />
                {t.pos_split}
              </button>
            </div>

            {/* Cash flow */}
            {paymentMode === "cash" && (
              <div className="px-3 pb-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground shrink-0">{t.pos_tendered}</Label>
                  <Input
                    value={tendered}
                    onChange={(e) => setTendered(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 h-8 text-sm"
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </div>
                {tenderedNum > 0 && (
                  <div className={cn("flex justify-between text-xs font-semibold", change >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                    <span>{t.pos_change}</span>
                    <span>{change >= 0 ? formatPrice(change) : "-" + formatPrice(-change)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Card flow — no extra input needed */}

            {/* Split flow */}
            {paymentMode === "split" && (
              <div className="px-3 pb-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground w-14 shrink-0">{t.pos_cashAmount}</Label>
                  <Input value={splitCash} onChange={(e) => setSplitCash(e.target.value)} placeholder="0.00" className="flex-1 h-8 text-sm" type="number" min="0" step="0.01" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground w-14 shrink-0">{t.pos_cardAmount}</Label>
                  <Input value={splitCard} onChange={(e) => setSplitCard(e.target.value)} placeholder="0.00" className="flex-1 h-8 text-sm" type="number" min="0" step="0.01" />
                </div>
                {(splitCash || splitCard) && (
                  <p className={cn("text-[10px] font-medium", splitValid ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                    {splitValid ? "✓ Amounts match total" : `Must equal ${formatPrice(total)}`}
                  </p>
                )}
              </div>
            )}

            {/* Process payment button */}
            <div className="px-3 pb-2">
              <Button
                className="w-full h-11 text-sm font-bold gap-2"
                disabled={lineItems.length === 0 || (paymentMode === "split" && !splitValid)}
                onClick={processPayment}
              >
                {paymentMode === "cash" && <Banknote className="size-4" />}
                {paymentMode === "card" && <CreditCard className="size-4" />}
                {paymentMode === "split" && <SplitSquareHorizontal className="size-4" />}
                {t.pos_processPayment}
              </Button>
            </div>

            <Separator />

            {/* Action buttons row */}
            <div className="px-3 py-2 flex items-center gap-1.5 flex-wrap">
              <Tooltip>
                <TooltipTrigger render={<span className="flex-1 contents" />}>
                  <Button variant="outline" size="sm" className="gap-1 text-xs h-8 flex-1" onClick={holdOrder}>
                    <PauseCircle className="size-3.5" />
                    {t.pos_holdOrder}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hold current order</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger render={<span className="flex-1 contents" />}>
                  <Button variant="outline" size="sm" className="gap-1 text-xs h-8 relative flex-1"
                    onClick={() => setHeldSheetOpen(true)}>
                    <Inbox className="size-3.5" />
                    {t.pos_recallOrder}
                    {heldOrders.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                        {heldOrders.length}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View held orders</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger render={<span className="flex-1 contents" />}>
                  <Button variant="outline" size="sm" className="gap-1 text-xs h-8 flex-1"
                    onClick={() => toast.success(t.pos_printReceipt)}>
                    <Printer className="size-3.5" />
                    <span className="hidden lg:inline">{t.pos_printReceipt}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t.pos_printReceipt}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger render={<span className="flex-1 contents" />}>
                  <Button variant="outline" size="sm" className="gap-1 text-xs h-8 flex-1" onClick={openDrawer}>
                    <Banknote className="size-3.5" />
                    <span className="hidden lg:inline">{t.pos_openDrawer}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t.pos_openDrawer}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger render={<span className="flex-1 contents" />}>
                  <Button variant="outline" size="sm" className="gap-1 text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-1"
                    onClick={() => setShiftDialogOpen(true)}>
                    <LogOut className="size-3.5" />
                    <span className="hidden lg:inline">{t.pos_endShift}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t.pos_endShift}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dialogs & Sheets ─────────────────────────────────────────────────── */}

      <VoidDialog
        open={voidDialogOpen}
        itemName={voidTarget?.name ?? ""}
        onConfirm={confirmVoid}
        onCancel={() => { setVoidDialogOpen(false); setVoidTarget(null); }}
      />

      <PinDialog
        open={pinDialogOpen}
        onSuccess={() => { setPinDialogOpen(false); setDiscountApplied(true); toast.success("Discount applied"); }}
        onCancel={() => setPinDialogOpen(false)}
      />

      <ClearOrderDialog
        open={clearDialogOpen}
        onConfirm={() => { setClearDialogOpen(false); newOrder(); }}
        onCancel={() => setClearDialogOpen(false)}
      />

      <ShiftReportDialog
        open={shiftDialogOpen}
        shift={shift}
        onClose={() => setShiftDialogOpen(false)}
      />

      <HeldOrdersSheet
        open={heldSheetOpen}
        onOpenChange={setHeldSheetOpen}
        held={heldOrders}
        onRecall={recallOrder}
      />
    </TooltipProvider>
  );
}
