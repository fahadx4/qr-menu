"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  CalendarDays,
  Clock,
  Users,
  Phone,
  CalendarPlus,
} from "lucide-react";

import { mockTenant } from "@/mock/tenant";
import { generateId, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

const detailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(7, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  specialRequests: z.string().optional(),
});

type DetailsForm = z.infer<typeof detailsSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDays(count = 14): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatFullDate(d: Date): string {
  const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
  const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][d.getMonth()];
  return `${day}, ${d.getDate()} ${month} ${d.getFullYear()}`;
}

function formatTime(hour: number, half: number): string {
  const h24 = hour;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24;
  return `${h12}:${half === 0 ? "00" : "30"} ${ampm}`;
}

function isSlotUnavailable(date: Date, hour: number, half: number): boolean {
  return (date.getDate() * 7 + hour * 2 + half) % 3 === 0;
}

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {([1, 2, 3] as Step[]).map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all",
              step === s
                ? "bg-primary text-primary-foreground"
                : step > s
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {step > s ? <Check className="h-3.5 w-3.5" /> : s}
          </div>
          {s < 3 && (
            <div
              className={cn(
                "h-px w-8 transition-all",
                step > s ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Summary chip ─────────────────────────────────────────────────────────────

function SummaryChip({
  date,
  time,
  partySize,
}: {
  date: Date;
  time: string;
  partySize: number | "8+";
}) {
  const isToday = new Date().toDateString() === date.toDateString();
  const dateLabel = isToday ? "Today" : `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_ABBR[date.getMonth()]}`;
  const guestLabel = partySize === "8+" ? "8+ guests" : `${partySize} guest${partySize === 1 ? "" : "s"}`;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
      <span>📅</span>
      <span>{dateLabel}</span>
      <span>·</span>
      <span>{time}</span>
      <span>·</span>
      <span>{guestLabel}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReservePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [step, setStep] = useState<Step>(1);

  // Step 1 state
  const days = useMemo(() => buildDays(14), []);
  const today = days[0];
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [partySize, setPartySize] = useState<number | "8+">(2);

  // Step 2 — form
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { firstName: "", lastName: "", phone: "", email: "", specialRequests: "" },
  });

  // Step 3 — confirmation
  const [confirming, setConfirming] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);

  // ── time slots ──
  const timeSlots: { hour: number; half: number; label: string }[] = [];
  for (let hour = 12; hour <= 21; hour++) {
    timeSlots.push({ hour, half: 0, label: formatTime(hour, 0) });
    timeSlots.push({ hour, half: 1, label: formatTime(hour, 1) });
  }
  // 22:00
  timeSlots.push({ hour: 22, half: 0, label: formatTime(22, 0) });

  const handleConfirm = async () => {
    setConfirming(true);
    await new Promise((r) => setTimeout(r, 1200));
    const ref = `BKG-${generateId().toUpperCase().slice(0, 6)}`;
    setBookingRef(ref);
    setConfirming(false);
  };

  const formValues = getValues();

  // ── Success screen ──
  if (bookingRef) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        >
          <Check className="h-10 w-10" strokeWidth={2.5} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-sm space-y-6 text-center"
        >
          <div>
            <h1 className="text-2xl font-bold">Reservation confirmed!</h1>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 text-left ring-1 ring-foreground/5 space-y-3">
            <p className="text-center font-mono text-lg font-bold tracking-widest text-primary">
              {bookingRef}
            </p>
            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <p className="font-semibold text-base">{mockTenant.name}</p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                {formatFullDate(selectedDate)}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {selectedTime}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                {partySize === "8+" ? "8+ guests" : `${partySize} guest${partySize === 1 ? "" : "s"}`}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {formValues.firstName} {formValues.lastName} · {formValues.phone}
              </p>
              {formValues.specialRequests && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Special requests:</span>{" "}
                  {formValues.specialRequests}
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a confirmation to your phone.
          </p>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => toast.info("Add to calendar feature coming soon")}
            >
              <CalendarPlus className="h-4 w-4" />
              Add to calendar
            </Button>
            <Link
              href={`/r/${slug}/menu`}
              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:translate-y-px"
            >
              View menu →
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:backdrop-blur-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
          <Link
            href={`/r/${slug}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold">Book a table</h1>
            <p className="text-xs text-muted-foreground">{mockTenant.name}</p>
          </div>
        </div>
        <StepIndicator step={step} />
      </div>

      <AnimatePresence mode="wait">
        {/* ── STEP 1 ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl mx-auto px-4 py-5 space-y-6"
          >
            {/* Date strip */}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Select date
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {days.map((day, i) => {
                  const isToday_ = i === 0;
                  const isSelected = selectedDate.toDateString() === day.toDateString();
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => {
                        setSelectedDate(day);
                        setSelectedTime(null);
                      }}
                      className={cn(
                        "flex min-w-[56px] flex-col items-center rounded-xl px-2 py-2.5 text-center transition-all border",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-muted"
                      )}
                    >
                      <span className={cn("text-[10px] font-medium uppercase", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {isToday_ ? "Today" : DAY_NAMES[day.getDay()]}
                      </span>
                      <span className="text-lg font-bold leading-tight">{day.getDate()}</span>
                      <span className={cn("text-[10px]", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {MONTH_ABBR[day.getMonth()]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slot grid */}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Select time
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(({ hour, half, label }) => {
                  const unavailable = isSlotUnavailable(selectedDate, hour, half);
                  const isSelected = selectedTime === label;
                  return (
                    <button
                      key={label}
                      disabled={unavailable}
                      onClick={() => setSelectedTime(label)}
                      className={cn(
                        "flex flex-col items-center rounded-lg border py-2 text-xs font-medium transition-all",
                        unavailable
                          ? "cursor-not-allowed border-border opacity-40 line-through"
                          : isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-muted"
                      )}
                    >
                      {label}
                      {unavailable && (
                        <span className="mt-0.5 text-[9px] font-normal no-underline opacity-70">
                          Fully booked
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Party size */}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Party size
              </h2>
              <div className="flex flex-wrap gap-2">
                {([1, 2, 3, 4, 5, 6, 7, "8+"] as (number | "8+")[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setPartySize(size)}
                    className={cn(
                      "h-10 w-12 rounded-xl border text-sm font-semibold transition-all",
                      partySize === size
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-muted"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {partySize === "8+" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  For groups over 8, please call us directly.
                </p>
              )}
            </div>

            <Button
              className="w-full"
              disabled={!selectedTime}
              onClick={() => setStep(2)}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl mx-auto px-4 py-5 space-y-5"
          >
            {/* Summary chip */}
            {selectedTime && (
              <SummaryChip date={selectedDate} time={selectedTime} partySize={partySize} />
            )}

            <form
              onSubmit={handleSubmit(() => setStep(3))}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name *</Label>
                  <Input
                    id="firstName"
                    placeholder="Ahmed"
                    aria-invalid={!!errors.firstName}
                    {...register("firstName")}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Khan"
                    aria-invalid={!!errors.lastName}
                    {...register("lastName")}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 555 0101"
                  aria-invalid={!!errors.phone}
                  {...register("phone")}
                />
                <p className="text-xs text-muted-foreground">International format, e.g. +1 555 0101</p>
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ahmed@example.com"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="specialRequests">Special requests</Label>
                <Textarea
                  id="specialRequests"
                  placeholder="Dietary needs, high chair, anniversary, etc."
                  {...register("specialRequests")}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="flex-1">
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl mx-auto px-4 py-5 space-y-5"
          >
            <div>
              <h2 className="text-lg font-bold">Confirm your reservation</h2>
              <p className="text-sm text-muted-foreground">Please review the details below</p>
            </div>

            {/* Summary card */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3 ring-1 ring-foreground/5">
              <p className="font-semibold text-base">{mockTenant.name}</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-foreground/50" />
                  {formatFullDate(selectedDate)}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-foreground/50" />
                  {selectedTime}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-foreground/50" />
                  {partySize === "8+" ? "8+ guests" : `${partySize} guest${partySize === 1 ? "" : "s"}`}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-foreground/50" />
                  {formValues.firstName} {formValues.lastName} · {formValues.phone}
                </p>
              </div>
              {formValues.specialRequests && (
                <div className="border-t border-border pt-3 text-sm">
                  <span className="font-medium">Special requests: </span>
                  <span className="text-muted-foreground">{formValues.specialRequests}</span>
                </div>
              )}
            </div>

            {/* Cancellation policy */}
            <div className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
              <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>Free cancellation up to 2 hours before your booking</span>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                className="flex-1 gap-2"
                disabled={confirming}
                onClick={handleConfirm}
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Confirming…
                  </>
                ) : (
                  "Confirm reservation"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
