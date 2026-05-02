"use client";

import React, { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import {
  Download,
  FileText,
  Copy,
  Plus,
  Printer,
  MoreHorizontal,
  Pencil,
  Trash2,
  QrCode,
  BarChart2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPrice } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { mockTenant } from "@/mock/tenant";

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = `https://qrmenu.app/r/${mockTenant.slug}`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface TableEntry {
  id: string;
  number: string;
  capacity: number;
}

interface Campaign {
  id: string;
  name: string;
  code: string;
  scans: number;
  orders: number;
  revenue: number;
  expires: string;
  active: boolean;
}

type EcLevel = "L" | "M" | "Q" | "H";

// ─── Seed data ────────────────────────────────────────────────────────────────

const INITIAL_TABLES: TableEntry[] = [
  { id: "t1", number: "T-1", capacity: 2 },
  { id: "t2", number: "T-2", capacity: 4 },
  { id: "t3", number: "T-3", capacity: 4 },
  { id: "t4", number: "T-4", capacity: 6 },
  { id: "t5", number: "T-5", capacity: 2 },
  { id: "t6", number: "T-6", capacity: 8 },
];

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: "c1",
    name: "Summer Promo",
    code: "SUMMER24",
    scans: 142,
    orders: 38,
    revenue: 167400,
    expires: "2024-08-31",
    active: true,
  },
  {
    id: "c2",
    name: "Happy Hour",
    code: "HAPPY",
    scans: 89,
    orders: 22,
    revenue: 84200,
    expires: "2024-12-31",
    active: true,
  },
  {
    id: "c3",
    name: "Launch Week",
    code: "LAUNCH",
    scans: 312,
    orders: 95,
    revenue: 421000,
    expires: "2024-03-01",
    active: false,
  },
];

// ─── MasterQR Tab ─────────────────────────────────────────────────────────────

function MasterQRTab() {
  const t = useT();
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [qrSize, setQrSize] = useState(220);
  const [logoEnabled, setLogoEnabled] = useState(false);
  const [ecLevel, setEcLevel] = useState<EcLevel>("M");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDownloadPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Could not render QR canvas");
      return;
    }
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-master.png";
    a.click();
    toast.success("qr-master.png downloaded");
  }, []);

  const handleDownloadPdf = () => {
    toast.info(t.qrc_pdfSoon);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(BASE_URL);
      toast.success(t.qrc_linkCopied);
    } catch {
      toast.error(t.qrc_copyFailed);
    }
  };

  const imageSettings = logoEnabled
    ? {
        src: "/logo-placeholder.png",
        height: 40,
        width: 40,
        excavate: true,
      }
    : undefined;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left — QR Preview + actions */}
      <div className="flex flex-col items-center gap-5 lg:w-72 flex-shrink-0">
        {/* Preview card */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center gap-4 w-full">
          <QRCodeSVG
            value={BASE_URL}
            size={qrSize}
            fgColor={fgColor}
            bgColor={bgColor}
            level={ecLevel}
            imageSettings={imageSettings}
          />
          <div className="text-center">
            <p className="text-sm font-semibold">{mockTenant.name}</p>
            <p className="text-xs text-muted-foreground break-all mt-0.5">{BASE_URL}</p>
          </div>
        </div>

        {/* Hidden canvas for PNG download */}
        <div className="hidden" aria-hidden="true">
          <QRCodeCanvas
            ref={canvasRef}
            value={BASE_URL}
            size={300}
            fgColor={fgColor}
            bgColor={bgColor}
            level={ecLevel}
            imageSettings={imageSettings}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap justify-center w-full">
          <Button onClick={handleDownloadPng} className="flex-1 min-w-[130px]">
            <Download className="size-4" />
            {t.qrc_downloadPng}
          </Button>
          <Button variant="outline" onClick={handleCopyLink} className="flex-1 min-w-[100px]">
            <Copy className="size-4" />
            {t.qrc_copyLink}
          </Button>
          <Button variant="outline" onClick={handleDownloadPdf} className="w-full">
            <FileText className="size-4" />
            {t.qrc_downloadPdf}
          </Button>
        </div>
      </div>

      {/* Right — Customise panel */}
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold">{t.qrc_customise}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t.qrc_customiseSubtitle}
            </p>
          </div>

          {/* Foreground colour */}
          <div className="space-y-2">
            <Label>{t.qrc_fgColour}</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded-lg border border-input bg-transparent p-1 outline-none"
              />
              <Input
                value={fgColor}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setFgColor(v);
                }}
                className="w-32 font-mono"
                maxLength={7}
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Background colour */}
          <div className="space-y-2">
            <Label>{t.qrc_bgColour}</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded-lg border border-input bg-transparent p-1 outline-none"
              />
              <Input
                value={bgColor}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setBgColor(v);
                }}
                className="w-32 font-mono"
                maxLength={7}
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Size selector */}
          <div className="space-y-2">
            <Label>{t.qrc_size}</Label>
            <div className="flex gap-2">
              {([150, 220, 300] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setQrSize(s)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    qrSize === s
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  {s === 150 ? t.qrc_small : s === 220 ? t.qrc_medium : t.qrc_large}
                  <span className="ml-1 text-xs opacity-60">({s}px)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error correction */}
          <div className="space-y-2">
            <Label>{t.qrc_errorCorrection}</Label>
            <Select
              value={ecLevel}
              onValueChange={(v) => setEcLevel(v as EcLevel)}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">L — Low (7%)</SelectItem>
                <SelectItem value="M">M — Medium (15%)</SelectItem>
                <SelectItem value="Q">Q — Quartile (25%)</SelectItem>
                <SelectItem value="H">H — High (30%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logo in centre */}
          <div className="flex items-center justify-between gap-4 py-2 border-t border-border">
            <div>
              <p className="text-sm font-medium">{t.qrc_logoCentre}</p>
              <p className="text-xs text-muted-foreground">
                {t.qrc_logoDesc}
              </p>
            </div>
            <Switch
              checked={logoEnabled}
              onCheckedChange={(checked) => setLogoEnabled(checked)}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TableQRCard ──────────────────────────────────────────────────────────────

interface TableQRCardProps {
  table: TableEntry;
  onEdit: (table: TableEntry) => void;
  onDelete: (id: string) => void;
}

function TableQRCard({ table, onEdit, onDelete }: TableQRCardProps) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tableUrl = `${BASE_URL}?table=${encodeURIComponent(table.number)}`;

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Could not render QR canvas");
      return;
    }
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${table.number}.png`;
    a.click();
    toast.success(`qr-${table.number}.png downloaded`);
  }, [table.number]);

  return (
    <Card className="flex flex-col gap-0">
      <CardContent className="pt-4 flex flex-col items-center gap-3">
        <p className="text-2xl font-bold tracking-tight">{table.number}</p>
        <p className="text-xs text-muted-foreground">{table.capacity} {table.capacity === 1 ? t.qrc_seat : t.qrc_seats}</p>

        {/* Visible small QR */}
        <QRCodeSVG value={tableUrl} size={80} level="M" />

        {/* Hidden canvas for download */}
        <div className="hidden" aria-hidden="true">
          <QRCodeCanvas ref={canvasRef} value={tableUrl} size={300} level="M" />
        </div>

        <div className="flex gap-2 w-full">
          <Button size="sm" variant="outline" className="flex-1" onClick={handleDownload}>
            <Download className="size-3.5" />
            {t.qrc_downloadPng}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button size="icon-sm" variant="ghost" />}
              aria-label="More options"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t.qrc_tableActions}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(table)}>
                  <Pencil className="size-4" />
                  {t.qrc_editName}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(table.id)}
                >
                  <Trash2 className="size-4" />
                  {t.qrc_deleteTable}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── AddTableDialog ───────────────────────────────────────────────────────────

interface AddTableDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (number: string, capacity: number) => void;
}

function AddTableDialog({ open, onOpenChange, onAdd }: AddTableDialogProps) {
  const t = useT();
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("4");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      toast.error("Table number is required");
      return;
    }
    onAdd(tableNumber.trim(), parseInt(capacity, 10) || 4);
    setTableNumber("");
    setCapacity("4");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.qrc_addTable}</DialogTitle>
          <DialogDescription>
            {t.qrc_addTableDesc}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="add-table-number">{t.qrc_tableNumber}</Label>
            <Input
              id="add-table-number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g. T-7"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-table-capacity">{t.qrc_capacitySeats}</Label>
            <Input
              id="add-table-capacity"
              type="number"
              min={1}
              max={100}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-32"
            />
          </div>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" type="button" />}
            >
              {t.dashCancel}
            </DialogClose>
            <Button type="submit">{t.qrc_addTable}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── EditTableDialog ──────────────────────────────────────────────────────────

interface EditTableDialogProps {
  table: TableEntry | null;
  onClose: () => void;
  onSave: (id: string, number: string, capacity: number) => void;
}

function EditTableDialog({ table, onClose, onSave }: EditTableDialogProps) {
  const t = useT();
  const [tableNumber, setTableNumber] = useState(table?.number ?? "");
  const [capacity, setCapacity] = useState(String(table?.capacity ?? 4));

  React.useEffect(() => {
    if (table) {
      setTableNumber(table.number);
      setCapacity(String(table.capacity));
    }
  }, [table]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!table) return;
    if (!tableNumber.trim()) {
      toast.error("Table number is required");
      return;
    }
    onSave(table.id, tableNumber.trim(), parseInt(capacity, 10) || 4);
    onClose();
  };

  return (
    <Dialog open={!!table} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.qrc_editTable}</DialogTitle>
          <DialogDescription>
            {t.tbl_editTableDesc}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-table-number">{t.qrc_tableNumber}</Label>
            <Input
              id="edit-table-number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-table-capacity">{t.qrc_capacitySeats}</Label>
            <Input
              id="edit-table-capacity"
              type="number"
              min={1}
              max={100}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-32"
            />
          </div>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" type="button" />}
            >
              {t.dashCancel}
            </DialogClose>
            <Button type="submit">{t.tbl_saveChanges}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── DeleteTableDialog ────────────────────────────────────────────────────────

interface DeleteTableDialogProps {
  tableId: string | null;
  tableName: string;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

function DeleteTableDialog({ tableId, tableName, onClose, onConfirm }: DeleteTableDialogProps) {
  const t = useT();
  return (
    <Dialog open={!!tableId} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.tbl_deleteTable} {tableName}?</DialogTitle>
          <DialogDescription>
            {t.tbl_deleteConfirmDesc}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {t.dashCancel}
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              if (tableId) {
                onConfirm(tableId);
                onClose();
              }
            }}
          >
            {t.dashDelete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── TableQRsTab ──────────────────────────────────────────────────────────────

function TableQRsTab() {
  const t = useT();
  const [tables, setTables] = useState<TableEntry[]>(INITIAL_TABLES);
  const [addOpen, setAddOpen] = useState(false);
  const [editTable, setEditTable] = useState<TableEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteTarget = tables.find((t) => t.id === deleteId);

  const handleAdd = (tableNumber: string, capacity: number) => {
    const id = `t${Date.now()}`;
    setTables((prev) => [...prev, { id, number: tableNumber, capacity }]);
    toast.success(`Table "${tableNumber}" added`);
  };

  const handleSaveEdit = (id: string, tableNumber: string, capacity: number) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, number: tableNumber, capacity } : t))
    );
    toast.success("Table updated");
  };

  const handleDelete = (id: string) => {
    const entry = tables.find((t) => t.id === id);
    setTables((prev) => prev.filter((t) => t.id !== id));
    toast.success(`Table "${entry?.number ?? id}" deleted`);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          {t.qrc_addTable}
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.info(t.qrc_bulkPdfSoon)}
        >
          <FileText className="size-4" />
          {t.qrc_downloadAll}
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          {tables.length} {t.qrc_seats}
        </div>
      </div>

      {/* Grid */}
      {tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border py-16 text-center">
          <QrCode className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t.qrc_noTablesYet}</p>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            {t.qrc_addFirstTable}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {tables.map((table) => (
            <TableQRCard
              key={table.id}
              table={table}
              onEdit={setEditTable}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddTableDialog open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />
      <EditTableDialog
        table={editTable}
        onClose={() => setEditTable(null)}
        onSave={handleSaveEdit}
      />
      <DeleteTableDialog
        tableId={deleteId}
        tableName={deleteTarget?.number ?? ""}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ─── CreateCampaignDialog ─────────────────────────────────────────────────────

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (name: string, expires: string) => void;
}

function CreateCampaignDialog({ open, onOpenChange, onCreate }: CreateCampaignDialogProps) {
  const t = useT();
  const [name, setName] = useState("");
  const [expires, setExpires] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Campaign name is required");
      return;
    }
    if (!expires) {
      toast.error("Expiry date is required");
      return;
    }
    onCreate(name.trim(), expires);
    setName("");
    setExpires("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.qrc_createCampaign}</DialogTitle>
          <DialogDescription>
            {t.qrc_createCampaignDesc}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="camp-name">{t.qrc_campaignName}</Label>
            <Input
              id="camp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Winter Promo"
              autoFocus
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="camp-expires">{t.qrc_expiryDate}</Label>
            <Input
              id="camp-expires"
              type="date"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" type="button" />}
            >
              {t.dashCancel}
            </DialogClose>
            <Button type="submit">{t.qrc_createCampaign}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── DeleteCampaignDialog ─────────────────────────────────────────────────────

interface DeleteCampaignDialogProps {
  campaignId: string | null;
  campaignName: string;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

function DeleteCampaignDialog({ campaignId, campaignName, onClose, onConfirm }: DeleteCampaignDialogProps) {
  const t = useT();
  return (
    <Dialog open={!!campaignId} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.qrc_deleteCampaign}</DialogTitle>
          <DialogDescription>
            &ldquo;{campaignName}&rdquo;? {t.mnu_cannotUndo}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {t.dashCancel}
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              if (campaignId) {
                onConfirm(campaignId);
                onClose();
              }
            }}
          >
            {t.dashDelete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── CampaignsTab ─────────────────────────────────────────────────────────────

function CampaignsTab() {
  const t = useT();
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null);
  // Canvas refs keyed by campaign id are created per-row via a component
  const deleteCampaign = campaigns.find((c) => c.id === deleteCampaignId);

  const handleCreate = (name: string, expires: string) => {
    const code = name.toUpperCase().replace(/\s+/g, "").slice(0, 10);
    const newCampaign: Campaign = {
      id: `c${Date.now()}`,
      name,
      code,
      scans: 0,
      orders: 0,
      revenue: 0,
      expires,
      active: true,
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
    toast.success(`Campaign "${name}" created`);
  };

  const handleToggleActive = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = !c.active;
        toast.success(next ? "Campaign activated" : "Campaign deactivated");
        return { ...c, active: next };
      })
    );
  };

  const handleDelete = (id: string) => {
    const entry = campaigns.find((c) => c.id === id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    toast.success(`Campaign "${entry?.name ?? id}" deleted`);
  };

  // Stats
  const totalScans = campaigns.reduce((s, c) => s + c.scans, 0);
  const totalOrders = campaigns.reduce((s, c) => s + c.orders, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const avgConversion =
    totalScans > 0 ? ((totalOrders / totalScans) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t.qrc_totalScans}</p>
          <p className="text-2xl font-bold tabular-nums mt-1">{totalScans.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t.qrc_totalOrders}</p>
          <p className="text-2xl font-bold tabular-nums mt-1">{totalOrders.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t.qrc_avgConversion}</p>
          <p className="text-2xl font-bold tabular-nums mt-1">{avgConversion}%</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t.qrc_totalRevenue}</p>
          <p className="text-2xl font-bold tabular-nums mt-1">{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {t.qrc_createCampaign}
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t.qrc_colName}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t.qrc_colQr}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t.qrc_colCode}</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t.qrc_colScans}</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t.qrc_colOrders}</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t.qrc_colRevenue}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t.qrc_colExpires}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t.qrc_colStatus}</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t.qrc_colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {campaigns.map((campaign) => (
              <CampaignRow
                key={campaign.id}
                campaign={campaign}
                onToggleActive={handleToggleActive}
                onDelete={(id) => setDeleteCampaignId(id)}
              />
            ))}
          </tbody>
        </table>

        {campaigns.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <QrCode className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t.qrc_noCampaigns}</p>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              {t.qrc_createFirstCampaign}
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateCampaignDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />
      <DeleteCampaignDialog
        campaignId={deleteCampaignId}
        campaignName={deleteCampaign?.name ?? ""}
        onClose={() => setDeleteCampaignId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ─── CampaignRow ──────────────────────────────────────────────────────────────

interface CampaignRowProps {
  campaign: Campaign;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
}

function CampaignRow({ campaign, onToggleActive, onDelete }: CampaignRowProps) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const campUrl = `${BASE_URL}?utm=${campaign.code}`;
  const isExpired = campaign.expires ? new Date(campaign.expires) < new Date() : false;

  const handleDownloadQR = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Could not render QR canvas");
      return;
    }
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${campaign.code}.png`;
    a.click();
    toast.success(`qr-${campaign.code}.png downloaded`);
  }, [campaign.code]);

  return (
    <tr className="bg-card hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium">{campaign.name}</p>
      </td>
      <td className="px-4 py-3">
        <div className="relative">
          <QRCodeSVG value={campUrl} size={48} level="M" />
          {/* Hidden canvas for download */}
          <div className="hidden" aria-hidden="true">
            <QRCodeCanvas ref={canvasRef} value={campUrl} size={300} level="M" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-muted-foreground">{campaign.code}</span>
      </td>
      <td className="px-4 py-3 text-right tabular-nums">{campaign.scans.toLocaleString()}</td>
      <td className="px-4 py-3 text-right tabular-nums">{campaign.orders.toLocaleString()}</td>
      <td className="px-4 py-3 text-right tabular-nums">{formatPrice(campaign.revenue)}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        <span className={cn(isExpired && "text-destructive")}>
          {campaign.expires || "—"}
        </span>
      </td>
      <td className="px-4 py-3">
        {campaign.active ? (
          <Badge
            variant="default"
            className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20"
          >
            {t.qrc_badgeActive}
          </Badge>
        ) : (
          <Badge variant="secondary">{t.qrc_badgeInactive}</Badge>
        )}
        {isExpired && (
          <Badge variant="destructive" className="ml-1">
            {t.qrc_badgeExpired}
          </Badge>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button size="icon-sm" variant="ghost" />}
            aria-label={`Actions for ${campaign.name}`}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t.qrc_campaignActions}</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleDownloadQR}>
                <Download className="size-4" />
                {t.qrc_downloadQr}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info(t.qrc_statsSoon)}>
                <BarChart2 className="size-4" />
                {t.qrc_viewStats}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggleActive(campaign.id)}>
                {campaign.active ? (
                  <>
                    <ToggleLeft className="size-4" />
                    {t.qrc_deactivate}
                  </>
                ) : (
                  <>
                    <ToggleRight className="size-4" />
                    {t.qrc_activate}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(campaign.id)}
              >
                <Trash2 className="size-4" />
                {t.dashDelete}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QRPage() {
  const t = useT();
  return (
    <div className="max-w-6xl space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">{t.qrc_pageTitle}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t.qrc_pageSubtitle}
        </p>
      </div>

      <Tabs defaultValue="master">
        <TabsList>
          <TabsTrigger value="master">{t.qrc_tabMaster}</TabsTrigger>
          <TabsTrigger value="tables">{t.qrc_tabTables}</TabsTrigger>
          <TabsTrigger value="campaigns">{t.qrc_tabCampaigns}</TabsTrigger>
        </TabsList>

        <TabsContent value="master" className="pt-6">
          <MasterQRTab />
        </TabsContent>

        <TabsContent value="tables" className="pt-6">
          <TableQRsTab />
        </TabsContent>

        <TabsContent value="campaigns" className="pt-6">
          <CampaignsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
