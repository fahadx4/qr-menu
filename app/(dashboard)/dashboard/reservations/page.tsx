"use client";

import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import {
  Plus,
  MoreHorizontal,
  CalendarDays,
  Users,
  Loader2,
  List,
  Calendar,
  Search,
  Phone,
  ChevronDown,
  ChevronRight,
  Bell,
  X,
  UserPlus,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { cn } from "@/lib/utils";

// ─── Constants ─────────────────────────────────────────────────────────────────

const TODAY = "2026-04-24";

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const TOMORROW = addDays(TODAY, 1);
const DAY2 = addDays(TODAY, 2);
const DAY3 = addDays(TODAY, 3);

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime12(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

// Generate 30-min slots 11:00–22:00
const TIME_SLOTS: string[] = [];
for (let h = 11; h <= 22; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 22) TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

const TABLES = [
  "No preference",
  ...Array.from({ length: 10 }, (_, i) => `T${i + 1}`),
];

// ─── Types ─────────────────────────────────────────────────────────────────────

type ReservationStatus =
  | "upcoming"
  | "seated"
  | "completed"
  | "no_show"
  | "cancelled";

interface Reservation {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  party: number;
  table: string;
  status: ReservationStatus;
  specialRequests?: string;
  deposit: boolean;
  depositAmount?: number;
  internalNotes?: string;
}

interface WaitlistEntry {
  id: string;
  name: string;
  party: number;
  waitMinutes: number;
  phone: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: "r1",
    firstName: "Ahmed",
    lastName: "Al-Rashidi",
    phone: "+1 555 0101",
    email: "ahmed@example.com",
    date: TODAY,
    time: "19:00",
    party: 4,
    table: "T4",
    status: "upcoming",
    specialRequests: "Anniversary dinner — flowers on table please",
    deposit: true,
    depositAmount: 50,
    internalNotes: "Regular guest, prefers corner table",
  },
  {
    id: "r2",
    firstName: "Sara",
    lastName: "Watanabe",
    phone: "+1 555 0202",
    email: "sara.w@example.com",
    date: TODAY,
    time: "19:30",
    party: 2,
    table: "T2",
    status: "seated",
    deposit: false,
  },
  {
    id: "r3",
    firstName: "Carlos",
    lastName: "García",
    phone: "+1 555 0303",
    date: TODAY,
    time: "20:00",
    party: 6,
    table: "T7",
    status: "upcoming",
    specialRequests: "Birthday celebration — cake requested, nut allergy",
    deposit: true,
    depositAmount: 100,
  },
  {
    id: "r4",
    firstName: "Fatima",
    lastName: "Malik",
    phone: "+1 555 0404",
    email: "fatima@example.com",
    date: TODAY,
    time: "20:30",
    party: 3,
    table: "T3",
    status: "upcoming",
    deposit: false,
  },
  {
    id: "r5",
    firstName: "Thomas",
    lastName: "Müller",
    phone: "+1 555 0505",
    date: TODAY,
    time: "18:00",
    party: 8,
    table: "T9",
    status: "completed",
    deposit: false,
    internalNotes: "Large corporate group",
  },
  {
    id: "r6",
    firstName: "Elena",
    lastName: "Rossi",
    phone: "+1 555 0606",
    date: TODAY,
    time: "18:30",
    party: 2,
    table: "T1",
    status: "no_show",
    deposit: true,
    depositAmount: 30,
  },
  {
    id: "r7",
    firstName: "Omar",
    lastName: "Hassan",
    phone: "+1 555 0707",
    date: TOMORROW,
    time: "12:00",
    party: 1,
    table: "T1",
    status: "upcoming",
    deposit: false,
    specialRequests: "Vegetarian menu only",
  },
  {
    id: "r8",
    firstName: "Yuki",
    lastName: "Tanaka",
    phone: "+1 555 0808",
    email: "yuki@example.com",
    date: TOMORROW,
    time: "19:00",
    party: 5,
    table: "T6",
    status: "upcoming",
    deposit: true,
    depositAmount: 75,
  },
  {
    id: "r9",
    firstName: "Isabella",
    lastName: "Santos",
    phone: "+1 555 0909",
    date: TOMORROW,
    time: "20:30",
    party: 4,
    table: "T5",
    status: "cancelled",
    deposit: false,
    internalNotes: "Cancelled due to illness",
  },
  {
    id: "r10",
    firstName: "Khalid",
    lastName: "Al-Amin",
    phone: "+1 555 1010",
    email: "khalid@example.com",
    date: DAY2,
    time: "13:00",
    party: 7,
    table: "T8",
    status: "upcoming",
    specialRequests: "Halal menu, high chair needed",
    deposit: true,
    depositAmount: 80,
  },
  {
    id: "r11",
    firstName: "Sophie",
    lastName: "Lefebvre",
    phone: "+1 555 1111",
    date: DAY2,
    time: "19:30",
    party: 2,
    table: "T2",
    status: "upcoming",
    deposit: false,
  },
  {
    id: "r12",
    firstName: "Ravi",
    lastName: "Patel",
    phone: "+1 555 1212",
    email: "ravi.p@example.com",
    date: DAY3,
    time: "20:00",
    party: 3,
    table: "T3",
    status: "upcoming",
    specialRequests: "Gluten-free options required",
    deposit: false,
  },
];

const INITIAL_WAITLIST: WaitlistEntry[] = [
  { id: "w1", name: "Amina Nouri", party: 3, waitMinutes: 15, phone: "+1 555 2001" },
  { id: "w2", name: "Marco Conti", party: 2, waitMinutes: 30, phone: "+1 555 2002" },
  { id: "w3", name: "Priya Sharma", party: 4, waitMinutes: 45, phone: "+1 555 2003" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fullName(r: Reservation) {
  return `${r.firstName} ${r.lastName}`;
}

function getStatusConfig(status: ReservationStatus, t: ReturnType<typeof useT>): {
  label: string;
  className: string;
} {
  switch (status) {
    case "upcoming":
      return { label: t.rsv_statusUpcoming, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
    case "seated":
      return { label: t.rsv_statusSeated, className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
    case "completed":
      return { label: t.completed, className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" };
    case "no_show":
      return { label: t.rsv_statusNoShow, className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
    case "cancelled":
      return { label: t.cancelled, className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500 line-through" };
  }
}

// ─── Zod schema ────────────────────────────────────────────────────────────────

const reservationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  party: z.string().min(1, "Party size is required"),
  table: z.string().optional(),
  specialRequests: z.string().optional(),
  deposit: z.boolean().optional(),
  depositAmount: z.string().optional(),
  internalNotes: z.string().optional(),
  status: z.enum(["upcoming", "seated", "completed", "no_show", "cancelled"]),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

// ─── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReservationStatus }) {
  const t = useT();
  const cfg = getStatusConfig(status, t);
  return (
    <span className={cn("inline-flex h-5 items-center rounded-full px-2 py-0.5 text-xs font-medium", cfg.className)}>
      {cfg.label}
    </span>
  );
}

// ─── Cancel Dialog ──────────────────────────────────────────────────────────────

function CancelDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const t = useT();
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.rsv_cancelDialogTitle}</DialogTitle>
          <DialogDescription>{t.rsv_cancelDialogDesc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label htmlFor="cancel-reason">{t.rsv_cancelReasonLabel}</Label>
          <Textarea id="cancel-reason" placeholder={t.rsv_cancelReasonPlaceholder} rows={3}
            value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.back}</Button>
          <Button variant="destructive" onClick={() => { onConfirm(reason); setReason(""); onOpenChange(false); }}>
            {t.rsv_cancelBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Walk-in Dialog ─────────────────────────────────────────────────────────────

function WalkInDialog({
  open,
  onOpenChange,
  onSeat,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSeat: (name: string, party: number) => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [party, setParty] = useState(2);

  const handleSeat = () => {
    onSeat(name.trim() || t.rsv_walkInDefault, party);
    setName("");
    setParty(2);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.rsv_walkInTitle}</DialogTitle>
          <DialogDescription>{t.rsv_walkInDesc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="walkin-name">{t.rsv_guestNameLabel}</Label>
            <Input id="walkin-name" placeholder={t.rsv_walkInDefault}
              value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t.partySize}</Label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setParty(n)}
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                    party === n
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.dashCancel}</Button>
          <Button onClick={handleSeat}>
            <UserPlus className="size-4" />
            {t.rsv_seatNow}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reservation Sheet ──────────────────────────────────────────────────────────

function ReservationSheet({
  open,
  onOpenChange,
  editTarget,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editTarget: Reservation | null;
  onSave: (values: ReservationFormValues, id?: string) => void;
}) {
  const t = useT();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      date: TODAY,
      time: "",
      party: "2",
      table: "No preference",
      specialRequests: "",
      deposit: false,
      depositAmount: "",
      internalNotes: "",
      status: "upcoming",
    },
  });

  React.useEffect(() => {
    if (open) {
      if (editTarget) {
        reset({
          firstName: editTarget.firstName,
          lastName: editTarget.lastName,
          phone: editTarget.phone,
          email: editTarget.email ?? "",
          date: editTarget.date,
          time: editTarget.time,
          party: String(editTarget.party),
          table: editTarget.table || "No preference",
          specialRequests: editTarget.specialRequests ?? "",
          deposit: editTarget.deposit,
          depositAmount: editTarget.depositAmount ? String(editTarget.depositAmount) : "",
          internalNotes: editTarget.internalNotes ?? "",
          status: editTarget.status,
        });
      } else {
        reset({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          date: TODAY,
          time: "",
          party: "2",
          table: "No preference",
          specialRequests: "",
          deposit: false,
          depositAmount: "",
          internalNotes: "",
          status: "upcoming",
        });
      }
    }
  }, [open, editTarget, reset]);

  const onSubmit = (values: ReservationFormValues) => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSave(values, editTarget?.id);
      onOpenChange(false);
    }, 600);
  };

  const partyVal = watch("party");
  const tableVal = watch("table");
  const statusVal = watch("status");
  const timeVal = watch("time");
  const depositVal = watch("deposit");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editTarget ? t.rsv_editTitle : t.rsv_newTitle}</SheetTitle>
          <SheetDescription>
            {editTarget ? t.rsv_editDesc : t.rsv_newDesc}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 pb-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-fname">
                {t.firstName} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="r-fname"
                placeholder={t.rsv_firstPlaceholder}
                {...register("firstName")}
                aria-invalid={!!errors.firstName}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-lname">
                {t.lastName} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="r-lname"
                placeholder={t.rsv_lastPlaceholder}
                {...register("lastName")}
                aria-invalid={!!errors.lastName}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-phone">
                {t.phoneNumber} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="r-phone"
                placeholder="+1 555 0000"
                {...register("phone")}
                aria-invalid={!!errors.phone}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-email">{t.email}</Label>
              <Input
                id="r-email"
                type="email"
                placeholder="guest@example.com"
                {...register("email")}
              />
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-date">
                {t.rsv_dateLabel} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="r-date"
                type="date"
                {...register("date")}
                aria-invalid={!!errors.date}
              />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                {t.rsv_timeLabel} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={timeVal}
                onValueChange={(v) => setValue("time", v as string)}
              >
                <SelectTrigger className="w-full" aria-invalid={!!errors.time}>
                  <SelectValue placeholder={t.rsv_selectTime} />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatTime12(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.time && (
                <p className="text-xs text-destructive">{errors.time.message}</p>
              )}
            </div>
          </div>

          {/* Party size */}
          <div className="space-y-1.5">
            <Label>
              {t.partySize} <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  const cur = parseInt(partyVal || "2", 10);
                  if (cur > 1) setValue("party", String(cur - 1));
                }}
              >
                −
              </Button>
              <span className="w-10 text-center text-sm font-medium tabular-nums">
                {partyVal || "2"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  const cur = parseInt(partyVal || "2", 10);
                  if (cur < 20) setValue("party", String(cur + 1));
                }}
              >
                +
              </Button>
              <span className="text-xs text-muted-foreground">
                {parseInt(partyVal || "2", 10) === 1 ? t.rsv_person : t.rsv_people}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="space-y-1.5">
            <Label>{t.rsv_tableLabel}</Label>
            <Select
              value={tableVal ?? "No preference"}
              onValueChange={(v) => setValue("table", v as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t.rsv_selectTable} />
              </SelectTrigger>
              <SelectContent>
                {TABLES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Special requests */}
          <div className="space-y-1.5">
            <Label htmlFor="r-requests">{t.specialRequests}</Label>
            <Textarea
              id="r-requests"
              placeholder={t.rsv_requestsPlaceholder}
              rows={2}
              {...register("specialRequests")}
            />
          </div>

          {/* Deposit */}
          <div className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="r-deposit" className="cursor-pointer">
                {t.rsv_depositRequired}
              </Label>
              <Switch
                id="r-deposit"
                checked={!!depositVal}
                onCheckedChange={(checked) => setValue("deposit", checked)}
              />
            </div>
            {depositVal && (
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="r-deposit-amt">{t.rsv_depositAmount}</Label>
                <Input
                  id="r-deposit-amt"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  {...register("depositAmount")}
                  className="max-w-xs"
                />
              </div>
            )}
          </div>

          {/* Internal notes */}
          <div className="space-y-1.5">
            <Label htmlFor="r-notes">{t.rsv_internalNotes}</Label>
            <Textarea
              id="r-notes"
              placeholder={t.rsv_staffNotes}
              rows={2}
              {...register("internalNotes")}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>{t.dashStatus}</Label>
            <Select
              value={statusVal}
              onValueChange={(v) => setValue("status", v as ReservationStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t.rsv_selectStatus} />
              </SelectTrigger>
              <SelectContent>
                {(
                  ["upcoming", "seated", "completed", "no_show", "cancelled"] as ReservationStatus[]
                ).map((s) => (
                  <SelectItem key={s} value={s}>
                    {getStatusConfig(s, t).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SheetFooter className="px-0 pt-2">
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? (
                <><Loader2 className="size-4 animate-spin" />{t.rsv_saving}</>
              ) : editTarget ? t.rsv_updateBtn : t.rsv_createBtn}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Row Actions ────────────────────────────────────────────────────────────────

function RowActions({
  reservation,
  onStatusChange,
  onEdit,
  onCancelRequest,
}: {
  reservation: Reservation;
  onStatusChange: (id: string, status: ReservationStatus) => void;
  onEdit: (r: Reservation) => void;
  onCancelRequest: (id: string) => void;
}) {
  const t = useT();
  const { status } = reservation;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="h-7 w-7" aria-label={t.dashActions} />}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t.dashActions}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onEdit(reservation)}>{t.dashEdit}</DropdownMenuItem>
          {status === "upcoming" && (
            <DropdownMenuItem onClick={() => onStatusChange(reservation.id, "no_show")}>
              {t.rsv_markNoShow}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        {status === "upcoming" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t.rsv_danger}</DropdownMenuLabel>
              <DropdownMenuItem variant="destructive" onClick={() => onCancelRequest(reservation.id)}>
                {t.rsv_cancelWithReason}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Reservation Card (list view row) ──────────────────────────────────────────

function ReservationCard({
  r,
  onStatusChange,
  onEdit,
  onCancelRequest,
}: {
  r: Reservation;
  onStatusChange: (id: string, status: ReservationStatus) => void;
  onEdit: (r: Reservation) => void;
  onCancelRequest: (id: string) => void;
}) {
  const t = useT();
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-xl border border-border bg-card p-4 hover:bg-muted/20 transition-colors">
      {/* Time + date */}
      <div className="flex sm:flex-col items-center sm:items-start gap-2 min-w-28">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary tabular-nums">
          {formatTime12(r.time)}
        </span>
        <span className="text-xs text-muted-foreground">{formatDateLabel(r.date)}</span>
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-sm">{fullName(r)}</span>
          <StatusBadge status={r.status} />
          {r.deposit && (
            <span className="inline-flex h-5 items-center rounded-full bg-amber-100 px-2 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {t.rsv_depositBadge}
            </span>
          )}
        </div>
        <a
          href={`tel:${r.phone}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Phone className="size-3" />
          {r.phone}
        </a>
        <div className="flex flex-wrap items-center gap-3 pt-0.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-3" />
            {r.party} {r.party === 1 ? t.rsv_person : t.rsv_people}
          </span>
          <span className="text-xs text-muted-foreground">
            {t.rsv_tablePrefix} {r.table || t.rsv_unassigned}
          </span>
        </div>
        {r.specialRequests && (
          <p className="text-xs italic text-muted-foreground pt-0.5">
            "{r.specialRequests}"
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {r.status === "upcoming" && (
          <Button size="sm" variant="outline" onClick={() => onStatusChange(r.id, "seated")}>
            {t.rsv_seatBtn}
          </Button>
        )}
        {r.status === "seated" && (
          <Button size="sm" variant="outline" onClick={() => onStatusChange(r.id, "completed")}>
            {t.rsv_completeBtn}
          </Button>
        )}
        <RowActions
          reservation={r}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onCancelRequest={onCancelRequest}
        />
      </div>
    </div>
  );
}

// ─── List View ──────────────────────────────────────────────────────────────────

type FilterTab = "today" | "tomorrow" | "week" | "all";

function ListView({
  reservations,
  onStatusChange,
  onEdit,
  onCancelRequest,
}: {
  reservations: Reservation[];
  onStatusChange: (id: string, status: ReservationStatus) => void;
  onEdit: (r: Reservation) => void;
  onCancelRequest: (id: string) => void;
}) {
  const t = useT();
  const [filter, setFilter] = useState<FilterTab>("today");
  const [search, setSearch] = useState("");

  const weekDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = 0; i <= 6; i++) dates.push(addDays(TODAY, i));
    return dates;
  }, []);

  const filtered = useMemo(() => {
    let list = reservations;
    if (filter === "today") list = list.filter((r) => r.date === TODAY);
    else if (filter === "tomorrow") list = list.filter((r) => r.date === TOMORROW);
    else if (filter === "week") list = list.filter((r) => weekDates.includes(r.date));
    // "all" = all upcoming statuses
    else list = list.filter((r) => r.status !== "completed" && r.status !== "no_show" && r.status !== "cancelled");

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          fullName(r).toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q) ||
          (r.email ?? "").toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [reservations, filter, search, weekDates]);

  const filterTabs: { value: FilterTab; label: string }[] = [
    { value: "today",    label: t.rsv_filterToday },
    { value: "tomorrow", label: t.rsv_filterTomorrow },
    { value: "week",     label: t.rsv_filterThisWeek },
    { value: "all",      label: t.rsv_filterAllUpcoming },
  ];

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={cn(
                "inline-flex h-7 items-center rounded-full px-3 text-xs font-medium transition-colors",
                filter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder={t.rsv_searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 pl-8 w-52 text-xs"
          />
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
          <CalendarDays className="size-8 opacity-40" />
          <span className="text-sm">{t.rsv_noFound}</span>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <ReservationCard
              key={r.id}
              r={r}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onCancelRequest={onCancelRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Calendar View ───────────────────────────────────────────────────────────────

function CalendarView({
  reservations,
  onEdit,
}: {
  reservations: Reservation[];
  onEdit: (r: Reservation) => void;
}) {
  const weekDays = useMemo(() => {
    // Find the Monday of the current week
    const base = new Date(TODAY + "T00:00:00");
    const dow = base.getDay(); // 0=Sun
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const days: { date: string; label: string; dayLabel: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + mondayOffset + i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: dateStr,
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      });
    }
    return days;
  }, []);

  const byDate = useMemo(() => {
    const map: Record<string, Reservation[]> = {};
    for (const d of weekDays) map[d.date] = [];
    for (const r of reservations) {
      if (map[r.date]) map[r.date].push(r);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [reservations, weekDays]);

  const statusColor: Record<ReservationStatus, string> = {
    upcoming: "bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700",
    seated: "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700",
    completed: "bg-zinc-100 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-600",
    no_show: "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700",
    cancelled: "bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700 opacity-50",
  };

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[700px]" style={{ gridTemplateColumns: `repeat(7, 1fr)` }}>
        {weekDays.map((day) => {
          const isToday = day.date === TODAY;
          const dayRes = byDate[day.date] ?? [];
          return (
            <div
              key={day.date}
              className={cn(
                "border-r border-b border-border last:border-r-0 p-2 min-h-32",
                isToday && "bg-primary/5"
              )}
            >
              <div className="mb-2 text-center">
                <div
                  className={cn(
                    "text-xs font-medium uppercase tracking-wide",
                    isToday ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {day.label}
                </div>
                <div
                  className={cn(
                    "text-sm font-semibold",
                    isToday ? "text-primary" : "text-foreground"
                  )}
                >
                  {day.dayLabel.split(" ")[1]}
                </div>
              </div>
              <div className="space-y-1">
                {dayRes.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onEdit(r)}
                    className={cn(
                      "w-full rounded border p-1 text-left transition-opacity hover:opacity-80",
                      statusColor[r.status]
                    )}
                  >
                    <div className="text-xs font-medium tabular-nums leading-tight">
                      {formatTime12(r.time)}
                    </div>
                    <div className="text-xs truncate leading-tight">
                      {r.firstName} {r.lastName[0]}.
                    </div>
                    <div className="flex items-center gap-0.5 text-xs opacity-70">
                      <Users className="size-2.5" />
                      {r.party}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Waitlist Section ───────────────────────────────────────────────────────────

function WaitlistSection({
  entries,
  onNotify,
  onRemove,
}: {
  entries: WaitlistEntry[];
  onNotify: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}) {
  const t = useT();
  if (entries.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Clock className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{t.rsv_waitlist}</h3>
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
          {entries.length}
        </span>
      </div>
      <div className="divide-y divide-border">
        {entries.map((e) => (
          <div key={e.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{e.name}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3" />
                  {e.party}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <a
                  href={`tel:${e.phone}`}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Phone className="size-3" />
                  {e.phone}
                </a>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  ~{e.waitMinutes} {t.rsv_minWait}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button size="sm" variant="outline" onClick={() => onNotify(e.id, e.name)}>
                <Bell className="size-3" />
                {t.rsv_notify}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(e.id)}
                aria-label="Remove from waitlist"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reservation Rules ──────────────────────────────────────────────────────────

function ReservationRules() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [maxParty, setMaxParty] = useState("10");
  const [buffer, setBuffer] = useState("15");
  const [window_, setWindow] = useState("30d");
  const [maxPerSlot, setMaxPerSlot] = useState("4");

  const handleSave = () => {
    toast.success(t.rsv_toastRulesSaved);
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold">{t.rsv_rules}</span>
        <span className="text-muted-foreground transition-transform" style={{ transform: open ? "rotate(180deg)" : undefined }}>
          <ChevronDown className="size-4" />
        </span>
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-4 pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rr-max-party">{t.rsv_maxPartySlot}</Label>
              <Input
                id="rr-max-party"
                type="number"
                min="1"
                value={maxParty}
                onChange={(e) => setMaxParty(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rr-max-slot">{t.rsv_maxPerSlot}</Label>
              <Input
                id="rr-max-slot"
                type="number"
                min="1"
                value={maxPerSlot}
                onChange={(e) => setMaxPerSlot(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t.rsv_buffer}</Label>
              <Select value={buffer} onValueChange={(v) => setBuffer(v as string)}>
                <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t.rsv_bufferNone}</SelectItem>
                  <SelectItem value="15">{t.rsv_buffer15}</SelectItem>
                  <SelectItem value="30">{t.rsv_buffer30}</SelectItem>
                  <SelectItem value="60">{t.rsv_buffer60}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t.rsv_bookingWindow}</Label>
              <Select value={window_} onValueChange={(v) => setWindow(v as string)}>
                <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="same">{t.rsv_windowSameDay}</SelectItem>
                  <SelectItem value="7d">{t.rsv_window7d}</SelectItem>
                  <SelectItem value="30d">{t.rsv_window30d}</SelectItem>
                  <SelectItem value="90d">{t.rsv_window90d}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSave} size="sm">{t.rsv_saveRules}</Button>
        </div>
      )}
    </div>
  );
}

// ─── Stats Row ──────────────────────────────────────────────────────────────────

function StatsRow({ reservations }: { reservations: Reservation[] }) {
  const t = useT();
  const todayCount = reservations.filter((r) => r.date === TODAY).length;

  const sevenDaysDates: string[] = [];
  for (let i = 0; i <= 6; i++) sevenDaysDates.push(addDays(TODAY, i));
  const upcomingCount = reservations.filter(
    (r) => sevenDaysDates.includes(r.date) && r.status === "upcoming"
  ).length;

  const total = reservations.length;
  const noShows = reservations.filter((r) => r.status === "no_show").length;
  const noShowRate = total > 0 ? Math.round((noShows / total) * 100) : 0;

  const withParty = reservations.filter((r) => r.party > 0);
  const avgParty =
    withParty.length > 0
      ? (withParty.reduce((s, r) => s + r.party, 0) / withParty.length).toFixed(1)
      : "0";

  const stats = [
    { label: t.rsv_statToday,      value: todayCount },
    { label: t.rsv_statUpcoming7d, value: upcomingCount },
    { label: t.rsv_statNoShowRate, value: `${noShowRate}%` },
    { label: t.rsv_statAvgParty,   value: avgParty },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-border bg-card px-4 py-3 space-y-0.5"
        >
          <div className="text-xs text-muted-foreground">{s.label}</div>
          <div className="text-xl font-bold tabular-nums">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const t = useT();
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(INITIAL_WAITLIST);
  const [view, setView] = useState<"list" | "calendar">("list");

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Reservation | null>(null);

  // Walk-in dialog
  const [walkInOpen, setWalkInOpen] = useState(false);

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  const handleStatusChange = (id: string, status: ReservationStatus) => {
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(`${getStatusConfig(status, t).label}`);
  };

  const handleEdit = (r: Reservation) => {
    setEditTarget(r);
    setSheetOpen(true);
  };

  const handleNew = () => {
    setEditTarget(null);
    setSheetOpen(true);
  };

  const handleCancelRequest = (id: string) => {
    setCancelTargetId(id);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = (reason: string) => {
    if (!cancelTargetId) return;
    setReservations((prev) =>
      prev.map((r) => (r.id === cancelTargetId ? { ...r, status: "cancelled" } : r))
    );
    toast.success(reason ? `${t.rsv_toastCancelled}: ${reason}` : t.rsv_toastCancelled);
    setCancelTargetId(null);
  };

  const handleSave = (values: ReservationFormValues, id?: string) => {
    if (id) {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                firstName: values.firstName,
                lastName: values.lastName,
                phone: values.phone,
                email: values.email,
                date: values.date,
                time: values.time,
                party: parseInt(values.party, 10),
                table: values.table ?? "No preference",
                specialRequests: values.specialRequests,
                deposit: !!values.deposit,
                depositAmount: values.depositAmount ? parseFloat(values.depositAmount) : undefined,
                internalNotes: values.internalNotes,
                status: values.status,
              }
            : r
        )
      );
      toast.success(t.rsv_toastUpdated);
    } else {
      const newRes: Reservation = {
        id: `r${Date.now()}`,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        email: values.email,
        date: values.date,
        time: values.time,
        party: parseInt(values.party, 10),
        table: values.table ?? "No preference",
        specialRequests: values.specialRequests,
        deposit: !!values.deposit,
        depositAmount: values.depositAmount ? parseFloat(values.depositAmount) : undefined,
        internalNotes: values.internalNotes,
        status: values.status,
      };
      setReservations((prev) => [...prev, newRes]);
      toast.success(t.rsv_toastCreated);
    }
  };

  const handleWalkIn = (name: string, party: number) => {
    const [first, ...rest] = name.trim().split(" ");
    const newRes: Reservation = {
      id: `r${Date.now()}`,
      firstName: first || "Guest",
      lastName: rest.join(" ") || "",
      phone: "—",
      date: TODAY,
      time: new Date().toTimeString().slice(0, 5),
      party,
      table: "T1",
      status: "seated",
      deposit: false,
      internalNotes: "Walk-in",
    };
    setReservations((prev) => [...prev, newRes]);
    toast.success(`${name} seated at T1`);
  };

  const handleNotify = (_id: string, name: string) => {
    toast.success(`Notification sent to ${name}`);
  };

  const handleRemoveWaitlist = (id: string) => {
    setWaitlist((prev) => prev.filter((e) => e.id !== id));
    toast.success(t.rsv_toastRemovedWaitlist);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t.rsv_pageTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t.rsv_pageSubtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setWalkInOpen(true)}>
            <UserPlus className="size-4" />{t.rsv_walkIn}
          </Button>
          <Button onClick={handleNew}>
            <Plus className="size-4" />{t.rsv_newReservation}
          </Button>
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center transition-colors",
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              )}
              aria-label="List view"
            >
              <List className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("calendar")}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center transition-colors",
                view === "calendar"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              )}
              aria-label="Calendar view"
            >
              <Calendar className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsRow reservations={reservations} />

      {/* Main content */}
      {view === "list" ? (
        <ListView
          reservations={reservations}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onCancelRequest={handleCancelRequest}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3 flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{t.rsv_weekView}</span>
            <span className="text-xs text-muted-foreground ms-1">{t.rsv_clickToEdit}</span>
          </div>
          <CalendarView reservations={reservations} onEdit={handleEdit} />
        </div>
      )}

      {/* Waitlist */}
      <WaitlistSection
        entries={waitlist}
        onNotify={handleNotify}
        onRemove={handleRemoveWaitlist}
      />

      {/* Reservation rules */}
      <ReservationRules />

      {/* Dialogs & Sheets */}
      <WalkInDialog
        open={walkInOpen}
        onOpenChange={setWalkInOpen}
        onSeat={handleWalkIn}
      />

      <CancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelConfirm}
      />

      <ReservationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editTarget={editTarget}
        onSave={handleSave}
      />
    </div>
  );
}
