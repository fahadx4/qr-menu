"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  UtensilsCrossed,
  Users,
  Clock,
  Bell,
  BellOff,
  Plus,
  Trash2,
  Scissors,
  DollarSign,
  ChefHat,
  PhoneCall,
  CheckCircle,
  Bike,
  Package,
  Building2,
  AlertTriangle,
  SplitSquareHorizontal,
  Receipt,
} from "lucide-react";

import { mockBranches } from "@/mock/tenant";
import { mockItems } from "@/mock/menu";
import type { RestaurantTable, Item } from "@/types";
import { cn, formatPrice, generateId, minutesSince } from "@/lib/utils";
import { useT } from "@/lib/i18n";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ─────────────────────────────────────────────────────────────────────

type TableStatus = RestaurantTable["status"];
type TableSection = "all" | "indoor" | "outdoor" | "vip" | "bar";

interface WaiterOrderItem {
  id: string;
  item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface WaiterOrder {
  tableId: string;
  items: WaiterOrderItem[];
  notes: string;
  held: boolean;
}

interface WaiterCall {
  id: string;
  tableNumber: string;
  tableId: string;
  createdAt: string;
  acknowledged: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<TableStatus, string> = {
  free: "bg-muted border-border text-muted-foreground",
  occupied:
    "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300",
  ready:
    "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300",
  bill_requested:
    "bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300",
  aging:
    "bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300 animate-pulse",
  reserved: "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300",
  dirty: "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300",
  blocked: "bg-zinc-200 border-zinc-400 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-400",
};

const TAX_RATE = 0.10;

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_TABLES: RestaurantTable[] = [
  { id: "wt1",  tenant_id: "t1", branch_id: "b1", number: "T-1",  capacity: 2,  qr_code_id: "qr1",  status: "free",           section: "indoor" },
  { id: "wt2",  tenant_id: "t1", branch_id: "b1", number: "T-2",  capacity: 4,  qr_code_id: "qr2",  status: "occupied",       section: "indoor" },
  { id: "wt3",  tenant_id: "t1", branch_id: "b1", number: "T-3",  capacity: 4,  qr_code_id: "qr3",  status: "ready",          section: "indoor" },
  { id: "wt4",  tenant_id: "t1", branch_id: "b1", number: "T-4",  capacity: 6,  qr_code_id: "qr4",  status: "bill_requested", section: "indoor" },
  { id: "wt5",  tenant_id: "t1", branch_id: "b1", number: "T-5",  capacity: 2,  qr_code_id: "qr5",  status: "aging",          section: "outdoor" },
  { id: "wt6",  tenant_id: "t1", branch_id: "b1", number: "T-6",  capacity: 4,  qr_code_id: "qr6",  status: "free",           section: "outdoor" },
  { id: "wt7",  tenant_id: "t1", branch_id: "b1", number: "T-7",  capacity: 8,  qr_code_id: "qr7",  status: "occupied",       section: "outdoor" },
  { id: "wt8",  tenant_id: "t1", branch_id: "b1", number: "T-8",  capacity: 4,  qr_code_id: "qr8",  status: "ready",          section: "vip" },
  { id: "wt9",  tenant_id: "t1", branch_id: "b1", number: "T-9",  capacity: 2,  qr_code_id: "qr9",  status: "free",           section: "vip" },
  { id: "wt10", tenant_id: "t1", branch_id: "b1", number: "T-10", capacity: 6,  qr_code_id: "qr10", status: "bill_requested", section: "vip" },
  { id: "wt11", tenant_id: "t1", branch_id: "b1", number: "T-11", capacity: 4,  qr_code_id: "qr11", status: "occupied",       section: "bar" },
  { id: "wt12", tenant_id: "t1", branch_id: "b1", number: "T-12", capacity: 10, qr_code_id: "qr12", status: "free",           section: "bar" },
];

const INITIAL_ORDERS: Record<string, WaiterOrder> = {
  wt2: {
    tableId: "wt2",
    items: [
      { id: generateId(), item_id: "i1", name: "Classic Smash Burger", quantity: 2, unit_price: 1299, line_total: 2598 },
      { id: generateId(), item_id: "i4", name: "Crispy Fries",         quantity: 1, unit_price: 499,  line_total: 499  },
    ],
    notes: "No onions on the burger",
    held: false,
  },
  wt7: {
    tableId: "wt7",
    items: [
      { id: generateId(), item_id: "i2", name: "Crispy Chicken Burger", quantity: 3, unit_price: 1199, line_total: 3597 },
      { id: generateId(), item_id: "i6", name: "Classic Milkshake",     quantity: 3, unit_price: 699,  line_total: 2097 },
      { id: generateId(), item_id: "i4", name: "Crispy Fries",          quantity: 2, unit_price: 499,  line_total: 998  },
    ],
    notes: "",
    held: false,
  },
  wt11: {
    tableId: "wt11",
    items: [
      { id: generateId(), item_id: "i5", name: "Onion Rings",    quantity: 2, unit_price: 549, line_total: 1098 },
      { id: generateId(), item_id: "i7", name: "Fresh Lemonade", quantity: 4, unit_price: 399, line_total: 1596 },
      { id: generateId(), item_id: "i8", name: "Loaded Brownie", quantity: 1, unit_price: 799, line_total: 799  },
    ],
    notes: "Allergic to peanuts",
    held: false,
  },
};

const INITIAL_CALLS: WaiterCall[] = [
  {
    id: "call1",
    tableNumber: "T-2",
    tableId: "wt2",
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: "call2",
    tableNumber: "T-7",
    tableId: "wt7",
    createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
];

const SESSION_STATS = {
  ordersServed: 12,
  tipTotal: 4850, // cents
  avgTime: 14,    // minutes
};

// ─── Occupied since map ────────────────────────────────────────────────────────

const OCCUPIED_SINCE: Record<string, string> = {
  wt2:  new Date(Date.now() - 23 * 60 * 1000).toISOString(),
  wt4:  new Date(Date.now() - 41 * 60 * 1000).toISOString(),
  wt5:  new Date(Date.now() - 67 * 60 * 1000).toISOString(),
  wt7:  new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  wt8:  new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  wt10: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
  wt11: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function calcSubtotal(items: WaiterOrderItem[]): number {
  return items.reduce((s, i) => s + i.line_total, 0);
}

// ─── Table Card ────────────────────────────────────────────────────────────────

function TableCard({
  table,
  hasOrder,
  occupiedSince,
  onClick,
}: {
  table: RestaurantTable;
  hasOrder: boolean;
  occupiedSince: string | undefined;
  onClick: (table: RestaurantTable) => void;
}) {
  const t = useT();
  const [, tick] = useState(0);

  useEffect(() => {
    if (!occupiedSince) return;
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, [occupiedSince]);

  const STATUS_LABELS: Record<TableStatus, string> = {
    free:           t.tbl_statusFree,
    occupied:       t.tbl_statusOccupied,
    ready:          t.tbl_statusReady,
    bill_requested: t.tbl_statusBillRequested,
    aging:          t.tbl_statusAging,
    reserved:       "Reserved",
    dirty:          "Dirty",
    blocked:        "Blocked",
  };

  const elapsedMins = occupiedSince ? minutesSince(occupiedSince) : null;

  return (
    <button
      type="button"
      onClick={() => onClick(table)}
      className={cn(
        "group relative flex flex-col items-center justify-center rounded-xl border-2 p-4 min-h-[110px] transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        STATUS_COLORS[table.status]
      )}
    >
      {hasOrder && (
        <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
      )}
      <span className="text-2xl font-bold tabular-nums leading-none">
        {table.number}
      </span>
      <span className="mt-1 text-xs opacity-70 flex items-center gap-0.5">
        <Users className="size-3" />
        {table.capacity}
      </span>
      <span
        className={cn(
          "mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          STATUS_COLORS[table.status]
        )}
      >
        {STATUS_LABELS[table.status]}
      </span>
      {elapsedMins !== null && (
        <span className="mt-1 flex items-center gap-0.5 text-[10px] font-medium opacity-80">
          <Clock className="size-2.5" />
          {elapsedMins}{t.wtr_min}
        </span>
      )}
    </button>
  );
}

// ─── Pending Calls Panel ───────────────────────────────────────────────────────

function PendingCallsPanel({
  calls,
  onAcknowledge,
}: {
  calls: WaiterCall[];
  onAcknowledge: (id: string) => void;
}) {
  const t = useT();
  const pending = calls.filter((c) => !c.acknowledged);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        {pending.length > 0 ? (
          <PhoneCall className="size-4 text-yellow-500" />
        ) : (
          <BellOff className="size-4 text-muted-foreground" />
        )}
        <span className="text-sm font-semibold text-foreground">
          {t.wtr_pendingCalls}
        </span>
        {pending.length > 0 && (
          <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-400/30 text-xs">
            {pending.length}
          </Badge>
        )}
      </div>

      {pending.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">{t.wtr_noCalls}</p>
      ) : (
        <div className="space-y-2">
          {pending.map((call) => (
            <motion.div
              key={call.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="flex items-center justify-between gap-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Bell className="size-3.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {t.wtr_table} {call.tableNumber}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {minutesSince(call.createdAt)}{t.wtr_min} ago
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] border-yellow-400/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
                onClick={() => onAcknowledge(call.id)}
              >
                <CheckCircle className="size-3" />
                {t.wtr_acknowledge}
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Item Picker Dialog ────────────────────────────────────────────────────────

function ItemPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (item: Item) => void;
}) {
  const t = useT();
  const [search, setSearch] = useState("");

  const filtered = mockItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.wtr_addItem}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder={t.wtr_addItem + "…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item);
                  onOpenChange(false);
                  setSearch("");
                }}
                className="w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-background hover:bg-muted/50 px-3 py-2.5 text-sm transition-colors text-left"
              >
                <span className="font-medium text-foreground">{item.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {formatPrice(item.price)}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No items found
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {t.dashCancel}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bill Split Dialog ─────────────────────────────────────────────────────────

function BillSplitDialog({
  open,
  onOpenChange,
  total,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  total: number;
  onConfirm: () => void;
}) {
  const t = useT();
  const [splitTab, setSplitTab] = useState<string>("evenly");
  const [people, setPeople] = useState(2);
  const [customAmounts, setCustomAmounts] = useState<string[]>(["", ""]);

  const perPerson = total / people;

  function handlePeopleChange(n: number) {
    const clamped = Math.min(Math.max(n, 2), 8);
    setPeople(clamped);
    setCustomAmounts(Array.from({ length: clamped }, (_, i) => customAmounts[i] ?? ""));
  }

  function handleCustomChange(idx: number, val: string) {
    const next = [...customAmounts];
    next[idx] = val;
    setCustomAmounts(next);
  }

  function handleConfirm() {
    onConfirm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SplitSquareHorizontal className="size-4 text-purple-500" />
            {t.wtr_splitBill}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-sm text-muted-foreground">{t.total}</span>
            <span className="text-base font-bold text-foreground">{formatPrice(total)}</span>
          </div>

          <Tabs value={splitTab} onValueChange={setSplitTab}>
            <TabsList className="w-full">
              <TabsTrigger value="evenly" className="flex-1 text-xs">
                {t.wtr_splitEvenly}
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex-1 text-xs">
                {t.wtr_splitCustom}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="evenly" className="mt-4 space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t.wtr_splitBy}</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-8 p-0"
                    onClick={() => handlePeopleChange(people - 1)}
                    disabled={people <= 2}
                  >
                    −
                  </Button>
                  <span className="min-w-[2rem] text-center text-sm font-semibold">
                    {people}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-8 p-0"
                    onClick={() => handlePeopleChange(people + 1)}
                    disabled={people >= 8}
                  >
                    +
                  </Button>
                  <span className="text-xs text-muted-foreground">{t.wtr_people}</span>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-green-50 dark:bg-green-900/20 px-3 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{t.wtr_eachPays}</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {formatPrice(perPerson)}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">{t.wtr_perPerson}</p>
              {Array.from({ length: people }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">
                    Person {idx + 1}
                  </span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={customAmounts[idx] ?? ""}
                    onChange={(e) => handleCustomChange(idx, e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {t.dashCancel}
          </DialogClose>
          <Button onClick={handleConfirm} className="bg-purple-600 hover:bg-purple-500 text-white">
            <Receipt className="size-4" />
            {t.wtr_billSplit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Order Side Panel ──────────────────────────────────────────────────────────

function OrderPanel({
  table,
  open,
  onOpenChange,
  order,
  onOrderChange,
  onStatusChange,
}: {
  table: RestaurantTable | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  order: WaiterOrder | null;
  onOrderChange: (tableId: string, order: WaiterOrder) => void;
  onStatusChange: (tableId: string, status: TableStatus) => void;
}) {
  const t = useT();
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [localOrder, setLocalOrder] = useState<WaiterOrder>(() =>
    order ?? { tableId: table?.id ?? "", items: [], notes: "", held: false }
  );

  // Sync when order/table changes
  useEffect(() => {
    setLocalOrder(
      order ?? { tableId: table?.id ?? "", items: [], notes: "", held: false }
    );
  }, [order, table]);

  const subtotal = calcSubtotal(localOrder.items);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;

  function handleVoidItem(itemId: string) {
    const next = { ...localOrder, items: localOrder.items.filter((i) => i.id !== itemId) };
    setLocalOrder(next);
    if (table) onOrderChange(table.id, next);
    toast.success(t.wtr_itemVoided);
  }

  function handleAddItem(item: Item) {
    const existing = localOrder.items.find((i) => i.item_id === item.id);
    let nextItems: WaiterOrderItem[];
    if (existing) {
      nextItems = localOrder.items.map((i) =>
        i.item_id === item.id
          ? { ...i, quantity: i.quantity + 1, line_total: (i.quantity + 1) * i.unit_price }
          : i
      );
    } else {
      nextItems = [
        ...localOrder.items,
        {
          id: generateId(),
          item_id: item.id,
          name: item.name,
          quantity: 1,
          unit_price: item.price,
          line_total: item.price,
        },
      ];
    }
    const next = { ...localOrder, items: nextItems };
    setLocalOrder(next);
    if (table) onOrderChange(table.id, next);
  }

  function handleNotesChange(notes: string) {
    const next = { ...localOrder, notes };
    setLocalOrder(next);
    if (table) onOrderChange(table.id, next);
  }

  function handleSendToKitchen() {
    if (table) onStatusChange(table.id, "occupied");
    toast.success(t.wtr_orderSent);
    onOpenChange(false);
  }

  function handleHoldOrder() {
    const next = { ...localOrder, held: true };
    setLocalOrder(next);
    if (table) onOrderChange(table.id, next);
    toast.success(t.wtr_orderHeld);
  }

  function handleMarkFree() {
    if (table) onStatusChange(table.id, "free");
    onOpenChange(false);
    toast.success(`${t.tbl_tableUpdated ?? "Table updated"}: ${t.tbl_statusFree}`);
  }

  function handleSplitConfirm() {
    toast.success(t.wtr_billSplit);
  }

  const STATUS_LABELS: Record<TableStatus, string> = {
    free:           t.tbl_statusFree,
    occupied:       t.tbl_statusOccupied,
    ready:          t.tbl_statusReady,
    bill_requested: t.tbl_statusBillRequested,
    aging:          t.tbl_statusAging,
    reserved:       "Reserved",
    dirty:          "Dirty",
    blocked:        "Blocked",
  };

  if (!table) return null;

  const canMarkFree = ["ready", "bill_requested", "aging"].includes(table.status);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto flex flex-col">
          <SheetHeader className="pb-0">
            <SheetTitle className="flex items-center gap-2">
              <UtensilsCrossed className="size-4 text-primary" />
              {t.wtr_table} {table.number}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 px-4 pb-4 space-y-5">
            {/* ── Table info ── */}
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                  STATUS_COLORS[table.status]
                )}
              >
                {STATUS_LABELS[table.status]}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3.5" />
                {table.capacity} {t.wtr_guests}
              </span>
              {table.section && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground capitalize">
                  <Building2 className="size-3" />
                  {table.section}
                </span>
              )}
            </div>

            <Separator />

            {/* ── Order items ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.wtr_orderItems}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => setItemPickerOpen(true)}
                >
                  <Plus className="size-3" />
                  {t.wtr_addItem}
                </Button>
              </div>

              {localOrder.items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <UtensilsCrossed className="size-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">{t.wtr_noActiveOrders}</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <AnimatePresence initial={false}>
                    {localOrder.items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t.wtr_qty} {item.quantity} × {formatPrice(item.unit_price)}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-foreground tabular-nums shrink-0">
                          {formatPrice(item.line_total)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleVoidItem(item.id)}
                          className="shrink-0 flex items-center justify-center rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label={t.wtr_voidItem}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* ── Notes ── */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.wtr_addNote}
              </p>
              <Textarea
                placeholder={t.wtr_notePlaceholder}
                value={localOrder.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                className="min-h-[64px] resize-none text-sm"
                dir="auto"
              />
            </div>

            {/* ── Alert for held ── */}
            {localOrder.held && (
              <div className="flex items-center gap-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/40 px-3 py-2">
                <AlertTriangle className="size-4 text-orange-500 shrink-0" />
                <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">
                  {t.wtr_orderHeld}
                </p>
              </div>
            )}

            <Separator />

            {/* ── Totals ── */}
            <div className="space-y-1.5 rounded-lg bg-muted/40 border border-border px-4 py-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.subtotal}</span>
                <span className="tabular-nums font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.tax} (10%)</span>
                <span className="tabular-nums font-medium">{formatPrice(tax)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between text-base font-bold">
                <span>{t.total}</span>
                <span className="tabular-nums">{formatPrice(total)}</span>
              </div>
            </div>

            {/* ── Action buttons ── */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5"
                onClick={handleSendToKitchen}
                disabled={localOrder.items.length === 0}
              >
                <ChefHat className="size-4" />
                {t.wtr_sendToKitchen}
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5"
                onClick={() => setSplitOpen(true)}
                disabled={localOrder.items.length === 0}
              >
                <Scissors className="size-4" />
                {t.wtr_splitBill}
              </Button>
              <Button
                variant="outline"
                className="border-orange-400/50 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20 gap-1.5"
                onClick={handleHoldOrder}
                disabled={localOrder.items.length === 0}
              >
                <Package className="size-4" />
                {t.wtr_holdOrder}
              </Button>
              {canMarkFree && (
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={handleMarkFree}
                >
                  <CheckCircle className="size-4" />
                  {t.tbl_markFree ?? "Mark Free"}
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ItemPickerDialog
        open={itemPickerOpen}
        onOpenChange={setItemPickerOpen}
        onSelect={handleAddItem}
      />

      <BillSplitDialog
        open={splitOpen}
        onOpenChange={setSplitOpen}
        total={total}
        onConfirm={handleSplitConfirm}
      />
    </>
  );
}

// ─── Session Stats Bar ─────────────────────────────────────────────────────────

function SessionStatsBar() {
  const t = useT();
  const stats = [
    {
      icon: <CheckCircle className="size-4 text-green-500" />,
      label: t.wtr_ordersServed,
      value: SESSION_STATS.ordersServed.toString(),
    },
    {
      icon: <DollarSign className="size-4 text-emerald-500" />,
      label: t.wtr_tipTotal,
      value: formatPrice(SESSION_STATS.tipTotal),
    },
    {
      icon: <Clock className="size-4 text-blue-500" />,
      label: t.wtr_avgTime,
      value: `${SESSION_STATS.avgTime} ${t.wtr_min}`,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
        >
          {s.icon}
          <div>
            <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{s.label}</p>
            <p className="text-sm font-bold text-foreground tabular-nums">{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WaiterPage() {
  const t = useT();

  const [tables, setTables] = useState<RestaurantTable[]>(MOCK_TABLES);
  const [orders, setOrders] = useState<Record<string, WaiterOrder>>(INITIAL_ORDERS);
  const [calls, setCalls] = useState<WaiterCall[]>(INITIAL_CALLS);

  const [selectedBranchId, setSelectedBranchId] = useState("b1");
  const [sectionFilter, setSectionFilter] = useState<TableSection>("all");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

  const SECTION_FILTERS: { value: TableSection; label: string }[] = [
    { value: "all",     label: t.all ?? "All" },
    { value: "indoor",  label: t.wtr_indoor },
    { value: "outdoor", label: t.wtr_outdoor },
    { value: "vip",     label: t.wtr_vip },
    { value: "bar",     label: t.wtr_bar },
  ];

  const filteredTables = tables.filter((tbl) => {
    if (tbl.branch_id !== selectedBranchId) return false;
    if (sectionFilter !== "all" && tbl.section !== sectionFilter) return false;
    return true;
  });

  const handleTableClick = useCallback((table: RestaurantTable) => {
    setSelectedTable(table);
    setSheetOpen(true);
  }, []);

  function handleOrderChange(tableId: string, order: WaiterOrder) {
    setOrders((prev) => ({ ...prev, [tableId]: order }));
  }

  function handleStatusChange(tableId: string, status: TableStatus) {
    setTables((prev) =>
      prev.map((tbl) => (tbl.id === tableId ? { ...tbl, status } : tbl))
    );
    setSelectedTable((prev) =>
      prev?.id === tableId ? { ...prev, status } : prev
    );
  }

  function handleAcknowledge(callId: string) {
    setCalls((prev) =>
      prev.map((c) => (c.id === callId ? { ...c, acknowledged: true } : c))
    );
    const call = calls.find((c) => c.id === callId);
    if (call) toast.success(`${t.wtr_callReceived} ${call.tableNumber}`);
  }

  const pendingCallCount = calls.filter((c) => !c.acknowledged).length;

  return (
    <div className="space-y-5 max-w-7xl">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UtensilsCrossed className="size-5 text-primary" />
            {t.wtr_pageTitle}
          </h1>
          <SessionStatsBar />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Branch selector */}
          <Select
            value={selectedBranchId}
            onValueChange={(v) => {
              if (v !== null) setSelectedBranchId(v);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t.tbl_selectBranch} />
            </SelectTrigger>
            <SelectContent>
              {mockBranches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Pending calls indicator */}
          {pendingCallCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-yellow-400/50 bg-yellow-50 dark:bg-yellow-900/20 px-2.5 py-1.5 text-xs font-semibold text-yellow-700 dark:text-yellow-400 animate-pulse">
              <Bell className="size-3.5" />
              {pendingCallCount}
            </div>
          )}
        </div>
      </div>

      {/* ── Section filter tabs ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {SECTION_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setSectionFilter(f.value)}
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              sectionFilter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {f.label}
            <span
              className={cn(
                "ms-1.5 tabular-nums",
                sectionFilter === f.value ? "opacity-80" : "opacity-50"
              )}
            >
              {f.value === "all"
                ? tables.filter((tbl) => tbl.branch_id === selectedBranchId).length
                : tables.filter(
                    (tbl) => tbl.branch_id === selectedBranchId && tbl.section === f.value
                  ).length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Main layout: table grid + calls panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
        {/* ── Table grid ── */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredTables.map((table) => (
                <motion.div
                  key={table.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <TableCard
                    table={table}
                    hasOrder={!!orders[table.id]}
                    occupiedSince={OCCUPIED_SINCE[table.id]}
                    onClick={handleTableClick}
                  />
                </motion.div>
              ))}
              {filteredTables.length === 0 && (
                <div className="col-span-full flex flex-col items-center gap-3 py-16 text-center">
                  <Bike className="size-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    {t.tbl_noTablesYet ?? "No tables in this section"}
                  </p>
                </div>
              )}
            </div>
          </AnimatePresence>
        </div>

        {/* ── Pending calls panel ── */}
        <div className="space-y-3">
          <AnimatePresence>
            <PendingCallsPanel calls={calls} onAcknowledge={handleAcknowledge} />
          </AnimatePresence>

          {/* ── Status legend ── */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.tbl_statusSection ?? "Status"}
            </p>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  ["free",           t.tbl_statusFree],
                  ["occupied",       t.tbl_statusOccupied],
                  ["ready",          t.tbl_statusReady],
                  ["bill_requested", t.tbl_statusBillRequested],
                  ["aging",          t.tbl_statusAging],
                ] as [TableStatus, string][]
              ).map(([status, label]) => (
                <span
                  key={status}
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium",
                    STATUS_COLORS[status].replace("animate-pulse", "")
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Order side panel ── */}
      <OrderPanel
        table={selectedTable}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        order={selectedTable ? orders[selectedTable.id] ?? null : null}
        onOrderChange={handleOrderChange}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
