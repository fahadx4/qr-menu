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
import { useT } from "@/lib/i18n";
import { useLanguageStore } from "@/store/language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

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

const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_ABBR_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES_AR  = ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
const MONTH_ABBR_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function formatTime(hour: number, half: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
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
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all",
            step === s ? "bg-primary text-primary-foreground"
              : step > s ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground"
          )}>
            {step > s ? <Check className="h-3.5 w-3.5" /> : s}
          </div>
          {s < 3 && (
            <div className={cn("h-px w-8 transition-all", step > s ? "bg-primary" : "bg-border")} />
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
  lang,
  todayLabel,
  eightPlusLabel,
  guestLabel,
  guestsLabel,
}: {
  date: Date;
  time: string;
  partySize: number | "8+";
  lang: string;
  todayLabel: string;
  eightPlusLabel: string;
  guestLabel: string;
  guestsLabel: string;
}) {
  const isToday = new Date().toDateString() === date.toDateString();
  const dayNames  = lang === "ar" ? DAY_NAMES_AR  : DAY_NAMES_EN;
  const monthAbbr = lang === "ar" ? MONTH_ABBR_AR : MONTH_ABBR_EN;
  const dateLabel = isToday
    ? todayLabel
    : `${dayNames[date.getDay()]} ${date.getDate()} ${monthAbbr[date.getMonth()]}`;
  const gLabel = partySize === "8+"
    ? eightPlusLabel
    : `${partySize} ${partySize === 1 ? guestLabel : guestsLabel}`;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
      <span>📅</span>
      <span>{dateLabel}</span>
      <span>·</span>
      <span>{time}</span>
      <span>·</span>
      <span>{gLabel}</span>
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
  const t = useT();
  const lang = useLanguageStore((s) => s.lang);

  const detailsSchema = z.object({
    firstName:       z.string().min(1, t.firstNameRequired),
    lastName:        z.string().min(1, t.lastNameRequired),
    phone:           z.string().min(7, t.phoneInvalid),
    email:           z.string().email(t.emailInvalid).optional().or(z.literal("")),
    specialRequests: z.string().optional(),
  });
  type DetailsForm = z.infer<typeof detailsSchema>;

  const [step, setStep] = useState<Step>(1);
  const days = useMemo(() => buildDays(14), []);
  const today = days[0];
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [partySize, setPartySize] = useState<number | "8+">(2);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { firstName: "", lastName: "", phone: "", email: "", specialRequests: "" },
  });

  const [confirming, setConfirming] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);

  const timeSlots: { hour: number; half: number; label: string }[] = [];
  for (let hour = 12; hour <= 21; hour++) {
    timeSlots.push({ hour, half: 0, label: formatTime(hour, 0) });
    timeSlots.push({ hour, half: 1, label: formatTime(hour, 1) });
  }
  timeSlots.push({ hour: 22, half: 0, label: formatTime(22, 0) });

  const handleConfirm = async () => {
    setConfirming(true);
    await new Promise((r) => setTimeout(r, 1200));
    setBookingRef(`BKG-${generateId().toUpperCase().slice(0, 6)}`);
    setConfirming(false);
  };

  const formValues = getValues();

  const dayNames  = lang === "ar" ? DAY_NAMES_AR  : DAY_NAMES_EN;
  const monthAbbr = lang === "ar" ? MONTH_ABBR_AR : MONTH_ABBR_EN;

  function formatFullDate(d: Date): string {
    const fullDays = lang === "ar"
      ? ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
      : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const fullMonths = lang === "ar"
      ? ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]
      : ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return `${fullDays[d.getDay()]}, ${d.getDate()} ${fullMonths[d.getMonth()]} ${d.getFullYear()}`;
  }

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
          <h1 className="text-2xl font-bold">{t.reservationConfirmed}</h1>

          <div className="rounded-2xl border border-border bg-card p-5 text-start ring-1 ring-foreground/5 space-y-3">
            <p className="text-center font-mono text-lg font-bold tracking-widest text-primary">{bookingRef}</p>
            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <p className="font-semibold text-base">{mockTenant.name}</p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4 shrink-0" />{formatFullDate(selectedDate)}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />{selectedTime}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                {partySize === "8+" ? t.eightPlusGuests : `${partySize} ${partySize === 1 ? t.guest : t.guests}`}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                {formValues.firstName} {formValues.lastName} · {formValues.phone}
              </p>
              {formValues.specialRequests && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{t.specialRequests}:</span>{" "}
                  {formValues.specialRequests}
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{t.confirmationSentPhone}</p>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => toast.info(t.addToCalendar)}
            >
              <CalendarPlus className="h-4 w-4" />
              {t.addToCalendar}
            </Button>
            <Link
              href={`/r/${slug}/menu`}
              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:translate-y-px"
            >
              {t.viewMenuArrow}
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
            <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold">{t.bookTable}</h1>
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
                {t.selectDate}
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {days.map((day, i) => {
                  const isToday_ = i === 0;
                  const isSelected = selectedDate.toDateString() === day.toDateString();
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => { setSelectedDate(day); setSelectedTime(null); }}
                      className={cn(
                        "flex min-w-[56px] flex-col items-center rounded-xl px-2 py-2.5 text-center transition-all border",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-muted"
                      )}
                    >
                      <span className={cn("text-[10px] font-medium uppercase", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {isToday_ ? t.today : dayNames[day.getDay()]}
                      </span>
                      <span className="text-lg font-bold leading-tight">{day.getDate()}</span>
                      <span className={cn("text-[10px]", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {monthAbbr[day.getMonth()]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slot grid */}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t.selectTime}
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
                          {t.fullyBooked}
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
                {t.partySize}
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
                <p className="mt-2 text-xs text-muted-foreground">{t.largeGroupNote}</p>
              )}
            </div>

            <Button className="w-full" disabled={!selectedTime} onClick={() => setStep(2)}>
              {t.next}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
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
            {selectedTime && (
              <SummaryChip
                date={selectedDate}
                time={selectedTime}
                partySize={partySize}
                lang={lang}
                todayLabel={t.today}
                eightPlusLabel={t.eightPlusGuests}
                guestLabel={t.guest}
                guestsLabel={t.guests}
              />
            )}

            <form onSubmit={handleSubmit(() => setStep(3))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">{t.firstName} <span className="text-destructive">*</span></Label>
                  <Input id="firstName" placeholder="Ahmed" aria-invalid={!!errors.firstName} {...register("firstName")} />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">{t.lastName} <span className="text-destructive">*</span></Label>
                  <Input id="lastName" placeholder="Khan" aria-invalid={!!errors.lastName} {...register("lastName")} />
                  {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">{t.phoneNumber} <span className="text-destructive">*</span></Label>
                <Input id="phone" type="tel" placeholder="+1 555 0101" aria-invalid={!!errors.phone} {...register("phone")} />
                <p className="text-xs text-muted-foreground">{t.phoneIntlFormatNote}</p>
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">
                  {t.email} <span className="text-muted-foreground font-normal">{t.specialInstructionsOptional}</span>
                </Label>
                <Input id="email" type="email" placeholder="ahmed@example.com" aria-invalid={!!errors.email} {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="specialRequests">{t.specialRequests}</Label>
                <Textarea id="specialRequests" placeholder={t.specialRequestsPlaceholder} {...register("specialRequests")} />
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-1">
                  <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                  {t.back}
                </Button>
                <Button type="submit" className="flex-1">
                  {t.next}
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
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
              <h2 className="text-lg font-bold">{t.confirmReservation}</h2>
              <p className="text-sm text-muted-foreground">{t.reviewDetailsBelow}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-3 ring-1 ring-foreground/5">
              <p className="font-semibold text-base">{mockTenant.name}</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-foreground/50 shrink-0" />
                  {formatFullDate(selectedDate)}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-foreground/50 shrink-0" />
                  {selectedTime}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-foreground/50 shrink-0" />
                  {partySize === "8+" ? t.eightPlusGuests : `${partySize} ${partySize === 1 ? t.guest : t.guests}`}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-foreground/50 shrink-0" />
                  {formValues.firstName} {formValues.lastName} · {formValues.phone}
                </p>
              </div>
              {formValues.specialRequests && (
                <div className="border-t border-border pt-3 text-sm">
                  <span className="font-medium">{t.specialRequests}: </span>
                  <span className="text-muted-foreground">{formValues.specialRequests}</span>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
              <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{t.freeCancellation}</span>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-1">
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                {t.back}
              </Button>
              <Button className="flex-1 gap-2" disabled={confirming} onClick={handleConfirm}>
                {confirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.confirming}
                  </>
                ) : t.confirmReservationBtn}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
