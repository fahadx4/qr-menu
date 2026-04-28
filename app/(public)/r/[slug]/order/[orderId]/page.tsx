"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  ChefHat,
  Bell,
  Receipt,
  RefreshCw,
  Star,
  Check,
} from "lucide-react";

import { mockSettings, mockTenant } from "@/mock/tenant";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { OrderStatus } from "@/types";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StoredOrderItem {
  name: string;
  quantity: number;
  line_total: number;
}

// ─── Status step sequence ──────────────────────────────────────────────────────

const STATUS_STEPS: OrderStatus[] = ["pending", "accepted", "preparing", "ready"];

// ─── Auto-advance timing (ms) ──────────────────────────────────────────────────

const STATUS_SEQUENCE: { status: OrderStatus; delay: number }[] = [
  { status: "pending",   delay: 0     },
  { status: "accepted",  delay: 4000  },
  { status: "preparing", delay: 8000  },
  { status: "ready",     delay: 16000 },
];

// ─── Mock order items (fallback) ────────────────────────────────────────────────

const MOCK_ITEMS: StoredOrderItem[] = [
  { name: "Classic Smash Burger", quantity: 2, line_total: 2598 },
  { name: "Crispy Fries",         quantity: 1, line_total: 499  },
];

// ─── Page component ────────────────────────────────────────────────────────────

export default function OrderTrackingPage({
  params,
}: {
  params: { slug: string; orderId: string };
}) {
  const router = useRouter();
  const { slug, orderId } = params;
  const t = useT();

  const [status, setStatus] = useState<OrderStatus>("pending");
  const [secondsLeft, setSecondsLeft] = useState(18 * 60);
  const [minutesLeft, setMinutesLeft] = useState(18);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [waiterCooldownLeft, setWaiterCooldownLeft] = useState(0);
  const [billRequested, setBillRequested] = useState(false);
  const [billCooldownLeft, setBillCooldownLeft] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isDineIn, setIsDineIn] = useState(false);
  const [orderItems, setOrderItems] = useState<StoredOrderItem[]>(MOCK_ITEMS);
  const [orderTotal, setOrderTotal] = useState(3097);

  const startTimeRef = useRef(Date.now());
  void startTimeRef;

  const statusMessages: Record<OrderStatus, string> = {
    pending:          t.orderStatusPending,
    accepted:         t.orderStatusAccepted,
    preparing:        t.orderStatusPreparing,
    ready:            t.orderStatusReady,
    out_for_delivery: t.orderStatusOutForDelivery,
    completed:        t.orderStatusCompleted,
    cancelled:        t.orderStatusCancelled,
  };

  const statusIcons: Record<OrderStatus, React.ReactNode> = {
    pending:          <Clock className="size-5" />,
    accepted:         <Check className="size-5" />,
    preparing:        <ChefHat className="size-5" />,
    ready:            <CheckCircle2 className="size-5" />,
    out_for_delivery: <CheckCircle2 className="size-5" />,
    completed:        <CheckCircle2 className="size-5" />,
    cancelled:        <CheckCircle2 className="size-5" />,
  };

  const statusLabels: Record<OrderStatus, string> = {
    pending:          t.received,
    accepted:         t.accepted,
    preparing:        t.preparing,
    ready:            t.ready,
    out_for_delivery: t.outForDelivery,
    completed:        t.completed,
    cancelled:        t.cancelled,
  };

  // Load order data from sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedType = sessionStorage.getItem(`order_type_${orderId}`);
    if (storedType === "dine_in") setIsDineIn(true);

    const storedItems = sessionStorage.getItem(`order_items_${orderId}`);
    if (storedItems) {
      try { setOrderItems(JSON.parse(storedItems) as StoredOrderItem[]); } catch { /* use mock */ }
    }

    const storedTotal = sessionStorage.getItem(`order_total_${orderId}`);
    if (storedTotal) setOrderTotal(Number(storedTotal));
  }, [orderId]);

  // Auto-advance status
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    STATUS_SEQUENCE.forEach(({ status: s, delay }) => {
      if (delay === 0) return;
      timers.push(setTimeout(() => setStatus(s), delay));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 0) { clearInterval(interval); return 0; }
        const next = prev - 1;
        setMinutesLeft(Math.ceil(next / 60));
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Waiter cooldown
  useEffect(() => {
    if (waiterCooldownLeft <= 0) return;
    const interval = setInterval(() => {
      setWaiterCooldownLeft((prev) => {
        if (prev <= 1) { clearInterval(interval); setWaiterCalled(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [waiterCooldownLeft]);

  // Bill cooldown
  useEffect(() => {
    if (billCooldownLeft <= 0) return;
    const interval = setInterval(() => {
      setBillCooldownLeft((prev) => {
        if (prev <= 1) { clearInterval(interval); setBillRequested(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [billCooldownLeft]);

  const handleCallWaiter = () => {
    if (waiterCalled) return;
    setWaiterCalled(true);
    setWaiterCooldownLeft(60);
    toast.success(t.waiterCalledSuccess);
  };

  const handleRequestBill = () => {
    if (billRequested) return;
    setBillRequested(true);
    setBillCooldownLeft(60);
    toast.success(t.billRequestedSuccess);
  };

  const handleReorder = () => {
    toast.info(t.reorder);
  };

  const handleStarClick = (star: number) => {
    setRating(star);
    if (star >= 4) {
      toast.success("Redirecting to Google Reviews…");
      setFeedbackSubmitted(true);
    }
  };

  const handleFeedbackSubmit = () => {
    if (!feedbackText.trim()) { toast.error(t.improveFeedback); return; }
    toast.success(t.thanksForFeedback);
    setFeedbackSubmitted(true);
  };

  const currentStatusIndex = STATUS_STEPS.indexOf(status);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            type="button"
            onClick={() => router.push(`/r/${slug}`)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
            {t.back}
          </button>
          <h1 className="font-semibold text-base flex-1 text-center pe-8">
            {t.orderStatus} #{orderId}
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Status stepper */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-semibold text-lg">{statusMessages[status]}</p>
            </motion.div>
          </AnimatePresence>

          {/* Horizontal stepper */}
          <div className="flex items-center">
            {STATUS_STEPS.map((s, i) => {
              const isPast = currentStatusIndex > i;
              const isCurrent = currentStatusIndex === i;
              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.div
                      animate={isCurrent ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                      transition={isCurrent ? { repeat: Infinity, duration: 1.6, ease: "easeInOut" } : {}}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full transition-colors",
                        isPast
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/25"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isPast ? <CheckCircle2 className="size-5" /> : statusIcons[s]}
                    </motion.div>
                    <span className={cn(
                      "text-[10px] font-medium text-center whitespace-nowrap",
                      isCurrent ? "text-primary" : isPast ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {statusLabels[s]}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-1 -mt-5">
                      <div className={cn("h-full transition-colors", currentStatusIndex > i ? "bg-primary" : "bg-border")} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Estimated time */}
        {secondsLeft > 0 && status !== "ready" && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <Clock className="size-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">{t.estimatedReady}</p>
              <p className="font-semibold">
                ~{minutesLeft} {minutesLeft === 1 ? t.minute : t.minutes}
              </p>
            </div>
          </div>
        )}

        {/* Order items summary */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="bg-muted/40 px-4 py-2.5 border-b border-border">
            <p className="text-sm font-semibold">{t.yourOrder}</p>
          </div>
          <div className="divide-y divide-border">
            {orderItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {item.quantity}
                  </span>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-sm font-medium tabular-nums">{formatPrice(item.line_total)}</span>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-border">
            <div className="flex justify-between font-semibold">
              <span>{t.total}</span>
              <span>{formatPrice(orderTotal)}</span>
            </div>
          </div>
        </div>

        {/* Call waiter / Request bill — dine-in only */}
        {isDineIn && (mockSettings.customer_call_waiter || mockSettings.customer_request_bill) && (
          <div className="grid grid-cols-2 gap-3">
            {mockSettings.customer_call_waiter && (
              <Button
                variant="outline"
                className="h-12 flex flex-col items-center gap-1 text-sm"
                onClick={handleCallWaiter}
                disabled={waiterCalled}
              >
                <Bell className="size-4" />
                {waiterCalled ? `${waiterCooldownLeft}s` : t.callWaiter}
              </Button>
            )}
            {mockSettings.customer_request_bill && (
              <Button
                variant="outline"
                className="h-12 flex flex-col items-center gap-1 text-sm"
                onClick={handleRequestBill}
                disabled={billRequested}
              >
                <Receipt className="size-4" />
                {billRequested ? `${t.orderStatus} (${billCooldownLeft}s)` : t.requestBill}
              </Button>
            )}
          </div>
        )}

        {/* Reorder */}
        {mockSettings.customer_reorder && (
          <Button variant="outline" className="w-full" onClick={handleReorder}>
            <RefreshCw className="size-4 me-2" />
            {t.reorder}
          </Button>
        )}

        {/* Review prompt — shows when ready */}
        <AnimatePresence>
          {status === "ready" && mockSettings.customer_review_prompt && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="rounded-2xl border border-border bg-card p-5 space-y-4"
            >
              <div className="text-center space-y-1">
                <p className="font-semibold text-base">{t.howWasExperience}</p>
                <p className="text-sm text-muted-foreground">{t.rateVisitAt} {mockTenant.name}</p>
              </div>

              {!feedbackSubmitted ? (
                <>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => handleStarClick(star)}
                        className="transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star className={cn(
                          "size-8 transition-colors",
                          (hoveredRating || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        )} />
                      </button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {rating > 0 && rating <= 3 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        <Textarea
                          placeholder={t.improveFeedback}
                          className="resize-none"
                          rows={3}
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                        />
                        <Button type="button" className="w-full" onClick={handleFeedbackSubmit}>
                          {t.submitFeedback}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-2 py-2"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="size-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="font-medium text-sm">{t.thanksForFeedback}</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
