"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, UtensilsCrossed, Coffee, Car, Package, Truck, Building2,
  QrCode, ShoppingBag, Users, Bike, Check, ArrowRight, ArrowLeft,
  PartyPopper, MessageCircle, Phone, Mail, Minus,
  Banknote, CreditCard, Smartphone, Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type RestaurantType = "quick_service" | "dine_in" | "cafe" | "drive_thru" | "cloud_kitchen" | "food_truck" | "chain";
type OrderingMethod = "qr_dine_in" | "qr_takeaway" | "walk_in" | "delivery" | "drive_thru_order";
type FulfillmentMethod = "dine_in" | "takeaway" | "delivery" | "drive_thru";
type PaymentOption = "cash" | "card_venue" | "card_online" | "bank_transfer" | "jazzcash" | "easypaisa" | "bizum";
type CommunicationMethod = "whatsapp" | "sms" | "email" | "none";

interface WizardData {
  restaurant_type: RestaurantType | null;
  ordering_methods: OrderingMethod[];
  fulfillment_methods: FulfillmentMethod[];
  payment_methods: PaymentOption[];
  communication: CommunicationMethod | null;
}

const INITIAL: WizardData = {
  restaurant_type: null,
  ordering_methods: [],
  fulfillment_methods: [],
  payment_methods: ["cash"],
  communication: null,
};

// ─── Smart Defaults ───────────────────────────────────────────────────────────

const ORDERING_DEFAULTS: Record<RestaurantType, OrderingMethod[]> = {
  quick_service:  ["qr_takeaway", "walk_in"],
  dine_in:        ["qr_dine_in", "walk_in", "qr_takeaway"],
  cafe:           ["qr_dine_in", "walk_in", "qr_takeaway"],
  drive_thru:     ["drive_thru_order", "walk_in"],
  cloud_kitchen:  ["delivery"],
  food_truck:     ["walk_in", "qr_takeaway"],
  chain:          ["qr_dine_in", "qr_takeaway", "walk_in", "delivery", "drive_thru_order"],
};

const FULFILLMENT_DEFAULTS: Record<RestaurantType, FulfillmentMethod[]> = {
  quick_service:  ["takeaway"],
  dine_in:        ["dine_in", "takeaway"],
  cafe:           ["dine_in", "takeaway"],
  drive_thru:     ["drive_thru", "takeaway"],
  cloud_kitchen:  ["delivery"],
  food_truck:     ["takeaway"],
  chain:          ["dine_in", "takeaway", "delivery", "drive_thru"],
};

// ─── Step Data ────────────────────────────────────────────────────────────────

const RESTAURANT_TYPES = [
  { id: "quick_service" as RestaurantType, label: "Quick Service", desc: "Fast food, counter service",  icon: Zap },
  { id: "dine_in"       as RestaurantType, label: "Dine-in",       desc: "Full table service",          icon: UtensilsCrossed },
  { id: "cafe"          as RestaurantType, label: "Café",           desc: "Coffee shop, brunch spot",    icon: Coffee },
  { id: "drive_thru"    as RestaurantType, label: "Drive-thru",     desc: "Car window service",          icon: Car },
  { id: "cloud_kitchen" as RestaurantType, label: "Cloud Kitchen",  desc: "Delivery-only kitchen",       icon: Package },
  { id: "food_truck"    as RestaurantType, label: "Food Truck",     desc: "Mobile street food",          icon: Truck },
  { id: "chain"         as RestaurantType, label: "Chain / Group",  desc: "Multiple locations",          icon: Building2 },
];

const ORDERING_METHODS = [
  { id: "qr_dine_in"      as OrderingMethod, label: "QR scan & order at table",    desc: "Customers scan QR and order themselves",  icon: QrCode },
  { id: "qr_takeaway"     as OrderingMethod, label: "QR for takeaway / collect",   desc: "Pre-order via QR before arriving",         icon: ShoppingBag },
  { id: "walk_in"         as OrderingMethod, label: "Walk-in / counter",           desc: "Staff takes order at the counter",         icon: Users },
  { id: "delivery"        as OrderingMethod, label: "Online delivery",             desc: "Customers order for home delivery",        icon: Bike },
  { id: "drive_thru_order" as OrderingMethod, label: "Drive-thru",                desc: "Order at window or pre-order via QR",      icon: Car },
];

const FULFILLMENT_METHODS = [
  { id: "dine_in"    as FulfillmentMethod, label: "Dine in",            desc: "Eat at the restaurant" },
  { id: "takeaway"   as FulfillmentMethod, label: "Takeaway / Collect", desc: "Pick up and eat elsewhere" },
  { id: "delivery"   as FulfillmentMethod, label: "Delivery",           desc: "Delivered to customer's door" },
  { id: "drive_thru" as FulfillmentMethod, label: "Drive-thru",         desc: "Pick up from the car window" },
];

const PAYMENT_GROUPS: Record<string, { group: string; items: { id: PaymentOption; label: string; icon: React.ElementType }[] }[]> = {
  PK: [
    { group: "Mobile Wallets", items: [
      { id: "jazzcash",   label: "JazzCash",   icon: Smartphone },
      { id: "easypaisa",  label: "Easypaisa",  icon: Smartphone },
    ]},
    { group: "Traditional", items: [
      { id: "cash",         label: "Cash",             icon: Banknote },
      { id: "card_venue",   label: "Card at venue",    icon: CreditCard },
      { id: "bank_transfer",label: "Bank transfer",    icon: Building },
    ]},
  ],
  ES: [
    { group: "Digital", items: [
      { id: "bizum",       label: "Bizum",          icon: Smartphone },
      { id: "card_online", label: "Card online",    icon: CreditCard },
    ]},
    { group: "Traditional", items: [
      { id: "card_venue",   label: "Card at venue", icon: CreditCard },
      { id: "cash",         label: "Cash",          icon: Banknote },
      { id: "bank_transfer",label: "Bank transfer", icon: Building },
    ]},
  ],
  default: [
    { group: "Payments", items: [
      { id: "cash",         label: "Cash",          icon: Banknote },
      { id: "card_venue",   label: "Card at venue", icon: CreditCard },
      { id: "card_online",  label: "Card online",   icon: CreditCard },
      { id: "bank_transfer",label: "Bank transfer", icon: Building },
    ]},
  ],
};

const COMMUNICATION_OPTIONS = [
  { id: "whatsapp" as CommunicationMethod, label: "WhatsApp",       desc: "Recommended — 98% open rate",             icon: MessageCircle, badge: "Popular" },
  { id: "sms"      as CommunicationMethod, label: "SMS",            desc: "Traditional text messages",               icon: Phone },
  { id: "email"    as CommunicationMethod, label: "Email",          desc: "Order confirmations and receipts",         icon: Mail },
  { id: "none"     as CommunicationMethod, label: "Not sure yet",   desc: "I'll configure this later",               icon: Minus },
];

// ─── Animation ────────────────────────────────────────────────────────────────

const SPRING: [number, number, number, number] = [0.16, 1, 0.3, 1];

const stepVariants = {
  enter:  (d: number) => ({ x: d * 56, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { ease: SPRING, duration: 0.45 } },
  exit:   (d: number) => ({ x: d * -56, opacity: 0, transition: { duration: 0.22 } }),
};

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "qrmenu_onboarding_draft";

function loadDraft(): WizardData {
  if (typeof window === "undefined") return INITIAL;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...INITIAL, ...JSON.parse(raw) } : INITIAL;
  } catch { return INITIAL; }
}

function saveDraft(d: WizardData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function StepHeading({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <div className="space-y-1 mb-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Step {step} of 5
      </p>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground text-sm leading-relaxed">{subtitle}</p>
    </div>
  );
}

function CheckCircle({ selected }: { selected: boolean }) {
  return (
    <div className={cn(
      "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
      selected ? "border-primary bg-primary" : "border-muted-foreground/30"
    )}>
      {selected && <Check className="h-3 w-3 text-primary-foreground" />}
    </div>
  );
}

// Step 1 — Restaurant Type
function Step1({ data, onChange }: { data: WizardData; onChange: (d: WizardData) => void }) {
  return (
    <div>
      <StepHeading
        step={1}
        title="What type of restaurant are you?"
        subtitle="This sets smart defaults for your ordering flow and menu layout."
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {RESTAURANT_TYPES.map(({ id, label, desc, icon: Icon }) => {
          const selected = data.restaurant_type === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange({
                ...data,
                restaurant_type: id,
                ordering_methods: ORDERING_DEFAULTS[id],
                fulfillment_methods: FULFILLMENT_DEFAULTS[id],
              })}
              className={cn(
                "relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 text-center transition-all duration-200 hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected ? "border-primary bg-primary/[0.06] shadow-sm" : "border-border bg-card"
              )}
            >
              {selected && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow-sm">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </span>
              )}
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className={cn("text-sm font-semibold leading-tight", selected && "text-primary")}>{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Step 2 — Ordering Methods
function Step2({ data, onChange }: { data: WizardData; onChange: (d: WizardData) => void }) {
  const toggle = (id: OrderingMethod) => {
    const cur = data.ordering_methods;
    onChange({ ...data, ordering_methods: cur.includes(id) ? cur.filter((m) => m !== id) : [...cur, id] });
  };

  return (
    <div>
      <StepHeading
        step={2}
        title="How will customers place orders?"
        subtitle="Select all that apply. You can change these anytime in Settings."
      />
      {data.restaurant_type && (
        <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg mb-4">
          Pre-selected based on your restaurant type — adjust as needed.
        </p>
      )}
      <div className="space-y-2">
        {ORDERING_METHODS.map(({ id, label, desc, icon: Icon }) => {
          const selected = data.ordering_methods.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected ? "border-primary bg-primary/[0.06]" : "border-border bg-card"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
                selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold", selected && "text-primary")}>{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <CheckCircle selected={selected} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Step 3 — Fulfillment Methods
function Step3({ data, onChange }: { data: WizardData; onChange: (d: WizardData) => void }) {
  const toggle = (id: FulfillmentMethod) => {
    const cur = data.fulfillment_methods;
    onChange({ ...data, fulfillment_methods: cur.includes(id) ? cur.filter((m) => m !== id) : [...cur, id] });
  };

  return (
    <div>
      <StepHeading
        step={3}
        title="How will orders be fulfilled?"
        subtitle="This configures your checkout flow and kitchen routing."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FULFILLMENT_METHODS.map(({ id, label, desc }) => {
          const selected = data.fulfillment_methods.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={cn(
                "flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected ? "border-primary bg-primary/[0.06]" : "border-border bg-card"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-base transition-colors",
                selected ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {selected
                  ? <Check className="h-4 w-4" />
                  : <span>{id === "dine_in" ? "🍽" : id === "takeaway" ? "🛍" : id === "delivery" ? "🛵" : "🚗"}</span>
                }
              </div>
              <div className="flex-1">
                <p className={cn("text-sm font-semibold", selected && "text-primary")}>{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Step 4 — Payment Methods
function Step4({ data, onChange, country }: { data: WizardData; onChange: (d: WizardData) => void; country: string }) {
  const groups = PAYMENT_GROUPS[country] ?? PAYMENT_GROUPS.default;

  const toggle = (id: PaymentOption) => {
    const cur = data.payment_methods;
    onChange({ ...data, payment_methods: cur.includes(id) ? cur.filter((m) => m !== id) : [...cur, id] });
  };

  return (
    <div>
      <StepHeading
        step={4}
        title="Which payment methods will you accept?"
        subtitle="These appear at checkout. Gateway integration is configured separately."
      />
      <div className="space-y-5">
        {groups.map(({ group, items }) => (
          <div key={group}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{group}</p>
            <div className="space-y-2">
              {items.map(({ id, label, icon: Icon }) => {
                const selected = data.payment_methods.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-xl border-2 p-3.5 text-left transition-all duration-150 hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selected ? "border-primary bg-primary/[0.06]" : "border-border bg-card"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
                      selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={cn("flex-1 text-sm font-medium", selected && "text-primary")}>{label}</span>
                    <CheckCircle selected={selected} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 5 — Communication
function Step5({ data, onChange }: { data: WizardData; onChange: (d: WizardData) => void }) {
  return (
    <div>
      <StepHeading
        step={5}
        title="How will you notify customers?"
        subtitle="Used for order confirmations, status updates, and receipts."
      />
      <div className="space-y-3">
        {COMMUNICATION_OPTIONS.map(({ id, label, desc, icon: Icon, badge }) => {
          const selected = data.communication === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange({ ...data, communication: id })}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected ? "border-primary bg-primary/[0.06]" : "border-border bg-card"
              )}
            >
              <div className={cn(
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
                selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn("text-sm font-semibold", selected && "text-primary")}>{label}</p>
                  {badge && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <div className={cn(
                "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                selected ? "border-primary bg-primary" : "border-muted-foreground/30"
              )}>
                {selected && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Success screen
function SuccessScreen() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center space-y-6 py-12"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.55 }}
    >
      <motion.div
        className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.2 }}
      >
        <PartyPopper className="h-9 w-9 text-green-600 dark:text-green-400" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-3xl font-bold">You&apos;re all set!</h2>
        <p className="text-muted-foreground max-w-sm">
          Your restaurant is configured. Let&apos;s go add your first menu item.
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        Redirecting to your dashboard…
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [country, setCountry] = useState("default");
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    setData(loadDraft());
    try {
      const raw = localStorage.getItem("qrmenu_signup_country");
      if (raw) setCountry(raw);
    } catch {}
  }, []);

  useEffect(() => { saveDraft(data); }, [data]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => {
      localStorage.removeItem(STORAGE_KEY);
      router.push("/dashboard");
    }, 2200);
    return () => clearTimeout(t);
  }, [success, router]);

  const validate = useCallback(() => {
    const msgs: Record<number, string> = {
      1: "Please select your restaurant type.",
      2: "Please select at least one ordering method.",
      3: "Please select at least one fulfillment method.",
      4: "Please select at least one payment method.",
      5: "Please select a communication preference.",
    };
    const checks: Record<number, boolean> = {
      1: !!data.restaurant_type,
      2: data.ordering_methods.length > 0,
      3: data.fulfillment_methods.length > 0,
      4: data.payment_methods.length > 0,
      5: !!data.communication,
    };
    if (!checks[step]) { setError(msgs[step]); return false; }
    setError(null);
    return true;
  }, [step, data]);

  const go = useCallback((dir: 1 | -1) => {
    if (dir === 1 && !validate()) return;
    if (dir === 1 && step === 5) { setSuccess(true); return; }
    setDirection(dir);
    setStep((s) => s + dir);
    setError(null);
  }, [step, validate]);

  const skip = useCallback(() => {
    if (step === 5) { setSuccess(true); return; }
    setDirection(1);
    setStep((s) => s + 1);
    setError(null);
  }, [step]);

  const update = useCallback((d: WizardData) => { setData(d); setError(null); }, []);

  const progressWidth = `${(step / 5) * 100}%`;

  if (success) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <SuccessScreen />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Progress bar */}
      <div className="h-1 w-full bg-border/40">
        <motion.div
          className="h-full bg-primary rounded-r-full"
          animate={{ width: progressWidth }}
          transition={{ ease: SPRING, duration: 0.5 }}
        />
      </div>

      <div className="flex flex-1 items-start justify-center px-6 py-10">
        <div className="w-full max-w-2xl">
          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i + 1 === step ? "h-2 w-8 bg-primary" :
                  i + 1 < step   ? "h-2 w-2 bg-primary/50" :
                                   "h-2 w-2 bg-border"
                )}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div key={step} custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                {step === 1 && <Step1 data={data} onChange={update} />}
                {step === 2 && <Step2 data={data} onChange={update} />}
                {step === 3 && <Step3 data={data} onChange={update} />}
                {step === 4 && <Step4 data={data} onChange={update} country={country} />}
                {step === 5 && <Step5 data={data} onChange={update} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                className="mt-4 text-sm text-destructive text-center"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 mt-8">
            <Button variant="ghost" size="sm" onClick={() => go(-1)} disabled={step === 1} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex items-center gap-3">
              {step < 5 && (
                <Button variant="ghost" size="sm" onClick={skip} className="text-muted-foreground text-xs">
                  Skip for now
                </Button>
              )}
              <Button onClick={() => go(1)} className="gap-2 min-w-[130px]">
                {step === 5 ? (
                  <><span>Finish setup</span><Check className="h-4 w-4" /></>
                ) : (
                  <><span>Continue</span><ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
