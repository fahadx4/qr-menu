"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  LayoutGrid,
  Map,
  Plus,
  Printer,
  Pencil,
  Trash2,
  Clock,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";

import { mockBranches } from "@/mock/tenant";
import type { RestaurantTable } from "@/types";
import { cn, generateId } from "@/lib/utils";
import { useT } from "@/lib/i18n";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ─── Types ─────────────────────────────────────────────────────────────────────

type TableStatus = RestaurantTable["status"];
type ViewMode = "grid" | "floor";

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
  reserved:
    "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300",
  dirty:
    "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300",
  blocked:
    "bg-zinc-200 border-zinc-400 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-400",
};

// STATUS_LABELS is now built from translations inside components that call useT()

// ─── Mock data ─────────────────────────────────────────────────────────────────

const INITIAL_TABLES: RestaurantTable[] = [
  { id: "tbl1",  tenant_id: "t1", branch_id: "b1", number: "T-1",  capacity: 2,  qr_code_id: "qr1",  status: "free" },
  { id: "tbl2",  tenant_id: "t1", branch_id: "b1", number: "T-2",  capacity: 4,  qr_code_id: "qr2",  status: "occupied" },
  { id: "tbl3",  tenant_id: "t1", branch_id: "b1", number: "T-3",  capacity: 4,  qr_code_id: "qr3",  status: "ready" },
  { id: "tbl4",  tenant_id: "t1", branch_id: "b1", number: "T-4",  capacity: 6,  qr_code_id: "qr4",  status: "bill_requested" },
  { id: "tbl5",  tenant_id: "t1", branch_id: "b1", number: "T-5",  capacity: 2,  qr_code_id: "qr5",  status: "aging" },
  { id: "tbl6",  tenant_id: "t1", branch_id: "b1", number: "T-6",  capacity: 4,  qr_code_id: "qr6",  status: "free" },
  { id: "tbl7",  tenant_id: "t1", branch_id: "b1", number: "T-7",  capacity: 8,  qr_code_id: "qr7",  status: "occupied" },
  { id: "tbl8",  tenant_id: "t1", branch_id: "b1", number: "T-8",  capacity: 4,  qr_code_id: "qr8",  status: "ready" },
  { id: "tbl9",  tenant_id: "t1", branch_id: "b1", number: "T-9",  capacity: 2,  qr_code_id: "qr9",  status: "free" },
  { id: "tbl10", tenant_id: "t1", branch_id: "b1", number: "T-10", capacity: 6,  qr_code_id: "qr10", status: "bill_requested" },
  { id: "tbl11", tenant_id: "t1", branch_id: "b1", number: "T-11", capacity: 4,  qr_code_id: "qr11", status: "free" },
  { id: "tbl12", tenant_id: "t1", branch_id: "b1", number: "T-12", capacity: 10, qr_code_id: "qr12", status: "occupied" },
];

// ─── Zod schema ────────────────────────────────────────────────────────────────

const tableSchema = z.object({
  number: z.string().min(1, "Table number is required"),
  capacity: z
    .string()
    .min(1, "Capacity is required")
    .refine((v) => !isNaN(Number(v)), { message: "Enter a valid number" })
    .refine((v) => Number(v) >= 1, { message: "Min 1 seat" })
    .refine((v) => Number(v) <= 20, { message: "Max 20 seats" }),
  branch_id: z.string().min(1, "Branch is required"),
});

type TableFormValues = z.infer<typeof tableSchema>;

// ─── Mock past orders ──────────────────────────────────────────────────────────

const MOCK_PAST_ORDERS = [
  { id: "039", total: "$32.00", status: "Completed", when: "Yesterday" },
  { id: "031", total: "$58.50", status: "Completed", when: "2 days ago" },
  { id: "022", total: "$21.75", status: "Completed", when: "4 days ago" },
];

// ─── Status legend ─────────────────────────────────────────────────────────────

function StatusLegend() {
  const t = useT();
  const entries: { status: TableStatus; label: string }[] = [
    { status: "free",           label: t.tbl_statusFree },
    { status: "occupied",       label: t.tbl_statusOccupied },
    { status: "bill_requested", label: t.tbl_statusBillRequested },
    { status: "ready",          label: t.tbl_statusReadyServed },
    { status: "aging",          label: t.tbl_statusAging },
    { status: "reserved",       label: "Reserved" },
    { status: "dirty",          label: "Dirty" },
    { status: "blocked",        label: "Blocked" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(({ status, label }) => (
        <span
          key={status}
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
            STATUS_COLORS[status]
          )}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

// ─── Table Card ────────────────────────────────────────────────────────────────

function TableCard({
  table,
  onClick,
  large = false,
}: {
  table: RestaurantTable;
  onClick: (table: RestaurantTable) => void;
  large?: boolean;
}) {
  const t = useT();
  const STATUS_LABELS: Record<TableStatus, string> = {
    free: t.tbl_statusFree, occupied: t.tbl_statusOccupied, ready: t.tbl_statusReady,
    bill_requested: t.tbl_statusBillRequested, aging: t.tbl_statusAging,
    reserved: "Reserved", dirty: "Dirty", blocked: "Blocked",
  };
  return (
    <button
      type="button"
      onClick={() => onClick(table)}
      className={cn(
        "group relative flex flex-col items-center justify-center rounded-xl border-2 transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        large ? "p-5 min-h-[130px]" : "p-4 min-h-[110px]",
        STATUS_COLORS[table.status]
      )}
    >
      <span
        className={cn(
          "font-bold tabular-nums leading-none",
          large ? "text-3xl" : "text-2xl"
        )}
      >
        {table.number}
      </span>
      {table.capacity !== undefined && (
        <span className="mt-1.5 text-xs opacity-70">
          {table.capacity} {table.capacity === 1 ? t.tbl_seat : t.tbl_seats}
        </span>
      )}
      <span
        className={cn(
          "mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          STATUS_COLORS[table.status]
        )}
      >
        {STATUS_LABELS[table.status]}
      </span>
    </button>
  );
}

// ─── Add / Edit Table Dialog ───────────────────────────────────────────────────

function AddTableDialog({
  open,
  onOpenChange,
  editTable,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editTable: RestaurantTable | null;
  onSave: (values: TableFormValues, id?: string) => void;
}) {
  const t = useT();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: editTable
      ? {
          number: editTable.number,
          capacity: String(editTable.capacity ?? 4),
          branch_id: editTable.branch_id,
        }
      : {
          number: "",
          capacity: "4",
          branch_id: "b1",
        },
  });

  // Sync defaults when editTable changes
  const isEdit = !!editTable;

  async function onSubmit(values: TableFormValues) {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    onSave(values, editTable?.id);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? t.tbl_editTableTitle : t.tbl_addTableTitle}</DialogTitle>
          <DialogDescription>
            {isEdit ? t.tbl_editTableDesc : t.tbl_addTableDesc}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Table number */}
          <div className="space-y-1.5">
            <Label htmlFor="table-number">{t.tbl_tableNumber}</Label>
            <Input
              id="table-number"
              placeholder="e.g. T-13"
              {...register("number")}
              aria-invalid={!!errors.number}
            />
            {errors.number && (
              <p className="text-xs text-destructive">{errors.number.message}</p>
            )}
          </div>

          {/* Capacity */}
          <div className="space-y-1.5">
            <Label htmlFor="table-capacity">{t.tbl_capacity}</Label>
            <Input
              id="table-capacity"
              type="number"
              min={1}
              max={20}
              {...register("capacity")}
              aria-invalid={!!errors.capacity}
            />
            {errors.capacity && (
              <p className="text-xs text-destructive">
                {errors.capacity.message}
              </p>
            )}
          </div>

          {/* Branch */}
          <div className="space-y-1.5">
            <Label>{t.tbl_branch}</Label>
            <Controller
              control={control}
              name="branch_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
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
              )}
            />
            {errors.branch_id && (
              <p className="text-xs text-destructive">
                {errors.branch_id.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={saving} />}>
              {t.dashCancel}
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? t.tbl_saving : isEdit ? t.tbl_saveChanges : t.tbl_addTable}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirmation Dialog ────────────────────────────────────────────────

function DeleteTableDialog({
  open,
  onOpenChange,
  table,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  table: RestaurantTable | null;
  onConfirm: () => void;
}) {
  const t = useT();
  if (!table) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.tbl_deleteTable} {table.number}?</DialogTitle>
          <DialogDescription>
            {t.tbl_deleteConfirmDesc}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            {t.dashCancel}
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {t.tbl_deleteTable}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Table Detail Sheet ────────────────────────────────────────────────────────

function TableDetailSheet({
  table,
  open,
  onOpenChange,
  onStatusChange,
  onEdit,
  onDeleteRequest,
}: {
  table: RestaurantTable | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStatusChange: (id: string, status: TableStatus) => void;
  onEdit: (table: RestaurantTable) => void;
  onDeleteRequest: (table: RestaurantTable) => void;
}) {
  const t = useT();
  const STATUS_LABELS: Record<TableStatus, string> = {
    free: t.tbl_statusFree, occupied: t.tbl_statusOccupied, ready: t.tbl_statusReady,
    bill_requested: t.tbl_statusBillRequested, aging: t.tbl_statusAging,
    reserved: "Reserved", dirty: "Dirty", blocked: "Blocked",
  };
  if (!table) return null;

  const isActive =
    table.status === "occupied" ||
    table.status === "ready" ||
    table.status === "bill_requested" ||
    table.status === "aging";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-0">
          <SheetTitle>{t.tbl_tableDetail} {table.number}</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-5">
          {/* ── Status ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.tbl_statusSection}
            </p>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                STATUS_COLORS[table.status]
              )}
            >
              {STATUS_LABELS[table.status]}
            </span>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {table.status === "free" && (
                <Button size="sm" onClick={() => onStatusChange(table.id, "occupied")}>
                  {t.tbl_markOccupied}
                </Button>
              )}
              {table.status === "occupied" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => onStatusChange(table.id, "ready")}>
                    {t.tbl_markReady}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onStatusChange(table.id, "bill_requested")}>
                    {t.tbl_requestBill}
                  </Button>
                </>
              )}
              {(table.status === "ready" || table.status === "bill_requested" || table.status === "aging") && (
                <Button size="sm" variant="outline" onClick={() => onStatusChange(table.id, "free")}>
                  {t.tbl_markFree}
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* ── Current session ── */}
          {isActive && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.tbl_currentSession}
                </p>
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Order #042</span>
                    </div>
                    <Badge variant="secondary">$47.50</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      18 min ago
                    </span>
                    <span>3 items</span>
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                    onClick={() => toast.info("Opening order #042…")}
                  >
                    {t.tbl_viewOrder}
                    <ExternalLink className="size-3" />
                  </button>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* ── Past orders ── */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.tbl_pastOrders}
            </p>
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {MOCK_PAST_ORDERS.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-3 py-2.5 text-sm"
                >
                  <div>
                    <span className="font-medium">Order #{order.id}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {order.when}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {order.status}
                    </span>
                    <Badge variant="outline">{order.total}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* ── Actions ── */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.tbl_actionsSection}
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => toast.info(t.tbl_printQr)}
              >
                <Printer className="size-4" />
                {t.tbl_printQr}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(table);
                }}
              >
                <Pencil className="size-4" />
                {t.tbl_editTable}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="justify-start"
                onClick={() => {
                  onOpenChange(false);
                  onDeleteRequest(table);
                }}
              >
                <Trash2 className="size-4" />
                {t.tbl_deleteTable}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TablesPage() {
  const t = useT();
  const STATUS_LABELS: Record<TableStatus, string> = {
    free: t.tbl_statusFree, occupied: t.tbl_statusOccupied, ready: t.tbl_statusReady,
    bill_requested: t.tbl_statusBillRequested, aging: t.tbl_statusAging,
    reserved: "Reserved", dirty: "Dirty", blocked: "Blocked",
  };
  const [tables, setTables] = useState<RestaurantTable[]>(INITIAL_TABLES);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("b1");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(
    null
  );

  // Add/Edit dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [editTable, setEditTable] = useState<RestaurantTable | null>(null);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingTable, setDeletingTable] = useState<RestaurantTable | null>(
    null
  );

  // Filtered tables
  const filteredTables = tables.filter(
    (t) => t.branch_id === selectedBranchId
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleTableClick(table: RestaurantTable) {
    setSelectedTable(table);
    setSheetOpen(true);
  }

  function handleStatusChange(id: string, status: TableStatus) {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
    // Keep the sheet's selectedTable in sync
    setSelectedTable((prev) =>
      prev?.id === id ? { ...prev, status } : prev
    );
    toast.success(`${t.tbl_tableUpdated}: ${STATUS_LABELS[status]}`);
  }

  function handleSaveTable(values: TableFormValues, id?: string) {
    const capacityNum = parseInt(values.capacity, 10);
    if (id) {
      // Edit
      setTables((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                number: values.number,
                capacity: capacityNum,
                branch_id: values.branch_id,
              }
            : t
        )
      );
      toast.success(t.tbl_tableUpdated);
    } else {
      // Add
      const newTable: RestaurantTable = {
        id: generateId(),
        tenant_id: "t1",
        branch_id: values.branch_id,
        number: values.number,
        capacity: capacityNum,
        qr_code_id: generateId(),
        status: "free",
      };
      setTables((prev) => [...prev, newTable]);
      toast.success(t.tbl_tableAdded);
    }
    setEditTable(null);
  }

  function handleEditTable(table: RestaurantTable) {
    setEditTable(table);
    setAddOpen(true);
  }

  function handleDeleteRequest(table: RestaurantTable) {
    if (table.status !== "free") {
      toast.error(t.tbl_cannotDeleteActive);
      return;
    }
    setDeletingTable(table);
    setDeleteOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deletingTable) return;
    setTables((prev) => prev.filter((t) => t.id !== deletingTable.id));
    toast.success(`Table ${deletingTable.number} deleted`);
    setDeletingTable(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t.tbl_pageTitle}</h1>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Branch selector */}
          <Select
            value={selectedBranchId}
            onValueChange={(v) => { if (v !== null) setSelectedBranchId(v); }}
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

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center justify-center px-2.5 py-1.5 text-sm transition-colors",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Floor plan view"
              onClick={() => setViewMode("floor")}
              className={cn(
                "flex items-center justify-center px-2.5 py-1.5 text-sm border-l border-border transition-colors",
                viewMode === "floor"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <Map className="size-4" />
            </button>
          </div>

          {/* Add table */}
          <Button
            onClick={() => {
              setEditTable(null);
              setAddOpen(true);
            }}
          >
            <Plus className="size-4" />
            {t.tbl_addTable}
          </Button>
        </div>
      </div>

      {/* ── Status legend ── */}
      <StatusLegend />

      {/* ── Grid view ── */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredTables.map((table) => (
            <TableCard key={table.id} table={table} onClick={handleTableClick} />
          ))}
          {filteredTables.length === 0 && (
            <div className="col-span-full flex flex-col items-center gap-3 py-16 text-center">
              <LayoutGrid className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {t.tbl_noTablesYet}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditTable(null);
                  setAddOpen(true);
                }}
              >
                <Plus className="size-4" />
                {t.tbl_addFirstTable}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Floor plan view ── */}
      {viewMode === "floor" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground italic">
              Pro+ plan · Drag to rearrange (visual preview)
            </p>
          </div>
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
            <div className="grid grid-cols-4 gap-3" style={{ gridTemplateRows: "repeat(3, 1fr)" }}>
              {Array.from({ length: 12 }).map((_, idx) => {
                const table = filteredTables[idx];
                if (!table) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="rounded-xl border-2 border-dashed border-border min-h-[130px] flex items-center justify-center text-xs text-muted-foreground/40"
                    >
                      Empty
                    </div>
                  );
                }
                return (
                  <TableCard
                    key={table.id}
                    table={table}
                    onClick={handleTableClick}
                    large
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Table detail sheet ── */}
      <TableDetailSheet
        table={selectedTable}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStatusChange={handleStatusChange}
        onEdit={handleEditTable}
        onDeleteRequest={handleDeleteRequest}
      />

      {/* ── Add / Edit dialog ── */}
      <AddTableDialog
        open={addOpen}
        onOpenChange={(v) => {
          setAddOpen(v);
          if (!v) setEditTable(null);
        }}
        editTable={editTable}
        onSave={handleSaveTable}
      />

      {/* ── Delete confirmation dialog ── */}
      <DeleteTableDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        table={deletingTable}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
