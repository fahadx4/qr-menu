"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, CheckCircle2, UtensilsCrossed, ShoppingBag,
  Truck, Car, Banknote, CreditCard, Wifi, Building2, Smartphone,
} from "lucide-react";

import { useCartStore } from "@/store/cart";
import { mockSettings, mockTenant } from "@/mock/tenant";
import { useT } from "@/lib/i18n";
import { formatPrice, generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { OrderType, PaymentMethod } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

const customerSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  table_number: z.string().optional(),
  car_description: z.string().optional(),
  delivery_address: z.string().optional(),
  guest_count: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;
type Step = 1 | 2 | 3 | 4;

const mockReturningCustomer = {
  name: "Ahmed",
  savedAddresses: [
    { label: "Home", address: "123 Maple Street, Apt 4B" },
    { label: "Work", address: "456 Business Ave, Floor 3" },
  ],
};

export default function CheckoutPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const t = useT();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const total = useCartStore((s) => s.total());
  const clearCart = useCartStore((s) => s.clearCart);
  const tax = total - subtotal;

  const allOrderTypeOptions = [
    { value: "dine_in" as const,  label: t.dineIn,   description: t.dineInDesc,   icon: <UtensilsCrossed className="size-5" />, enabled: mockSettings.ordering_dine_in },
    { value: "takeaway" as const, label: t.takeaway,  description: t.takeawayDesc, icon: <ShoppingBag className="size-5" />,    enabled: mockSettings.ordering_takeaway },
    { value: "delivery" as const, label: t.delivery,  description: t.deliveryDesc, icon: <Truck className="size-5" />,          enabled: mockSettings.ordering_delivery },
    { value: "drive_thru" as const, label: t.drivethru, description: t.drivethruDesc, icon: <Car className="size-5" />,         enabled: mockSettings.ordering_drive_thru },
  ];
  const orderTypeOptions = allOrderTypeOptions.filter((o) => o.enabled);

  const allPaymentOptions = [
    { value: "cash" as const,          label: "Cash",          description: t.cashDesc,        icon: <Banknote className="size-5" />,   enabled: mockSettings.payment_cash },
    { value: "card_venue" as const,    label: "Card at Venue", description: t.cardVenueDesc,   icon: <CreditCard className="size-5" />, enabled: mockSettings.payment_card_venue },
    { value: "card_online" as const,   label: "Card Online",   description: t.cardOnlineDesc,  icon: <Wifi className="size-5" />,       enabled: mockSettings.payment_card_online },
    { value: "bank_transfer" as const, label: "Bank Transfer", description: t.bankTransferDesc, icon: <Building2 className="size-5" />, enabled: mockSettings.payment_bank_transfer },
    { value: "jazzcash" as const,      label: "JazzCash",      description: t.jazzcashDesc,    icon: <Smartphone className="size-5" />, enabled: mockSettings.payment_jazzcash },
    { value: "easypaisa" as const,     label: "Easypaisa",     description: t.easypaisaDesc,   icon: <Smartphone className="size-5" />, enabled: mockSettings.payment_easypaisa },
  ];
  const paymentOptions = allPaymentOptions.filter((o) => o.enabled);

  const enabledOrderTypes = orderTypeOptions.filter((o) => o.enabled);
  const skipOrderTypeStep = enabledOrderTypes.length <= 1;
  const initialOrderType: OrderType = enabledOrderTypes.length === 1 ? enabledOrderTypes[0].value : "dine_in";

  const [step, setStep] = useState<Step>(skipOrderTypeStep ? 2 : 1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [orderType, setOrderType] = useState<OrderType>(initialOrderType);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(paymentOptions[0]?.value ?? "cash");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReturningBanner, setShowReturningBanner] = useState(false);

  const totalSteps = skipOrderTypeStep ? 3 : 4;
  void totalSteps;
  const stepNum = skipOrderTypeStep ? step - 1 : step;
  void stepNum;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  });

  const watchedPhone = watch("phone") ?? "";
  const [customerData, setCustomerData] = useState<CustomerFormValues>({});

  useEffect(() => {
    if (watchedPhone.replace(/\D/g, "").length >= 10) setShowReturningBanner(true);
    else setShowReturningBanner(false);
  }, [watchedPhone]);

  const goNext = () => { setDirection(1); setStep((s) => (s < 4 ? ((s + 1) as Step) : s)); };
  const goBack = () => {
    setDirection(-1);
    setStep((s) => {
      const prevStep = (s - 1) as Step;
      if (prevStep === 1 && skipOrderTypeStep) return s;
      return prevStep > 0 ? prevStep : s;
    });
  };

  const onCustomerInfoSubmit = (data: CustomerFormValues) => { setCustomerData(data); goNext(); };

  const handlePlaceOrder = async () => {
    if (!termsAccepted) { toast.error(t.acceptTerms); return; }
    setIsSubmitting(true);
    await new Promise((res) => setTimeout(res, 1200));
    clearCart();
    const orderId = `ORD-${generateId().toUpperCase().slice(0, 6)}`;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`order_type_${orderId}`, orderType);
      sessionStorage.setItem(`order_items_${orderId}`, JSON.stringify(items.map((i) => ({ name: i.name, quantity: i.quantity, line_total: i.line_total }))));
      sessionStorage.setItem(`order_total_${orderId}`, String(total));
    }
    router.push(`/r/${params.slug}/order/${orderId}`);
  };

  const stepVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{t.howOrderQuestion}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t.chooseOrderType}</p>
      </div>
      <RadioGroup value={orderType} onValueChange={(v) => setOrderType(v as OrderType)} className="gap-3">
        {orderTypeOptions.map((opt) => (
          <label key={opt.value} className={cn("flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-colors",
            orderType === opt.value ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40")}>
            <RadioGroupItem value={opt.value} id={`order-type-${opt.value}`} />
            <span className={cn("flex size-10 items-center justify-center rounded-lg",
              orderType === opt.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              {opt.icon}
            </span>
            <div className="flex-1">
              <p className="font-medium">{opt.label}</p>
              <p className="text-sm text-muted-foreground">{opt.description}</p>
            </div>
          </label>
        ))}
      </RadioGroup>
    </div>
  );

  const renderStep2 = () => (
    <form id="customer-info-form" onSubmit={handleSubmit(onCustomerInfoSubmit)}>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{t.yourDetails}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t.helpOrderRight}</p>
        </div>

        <AnimatePresence>
          {showReturningBanner && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <p className="font-semibold text-primary">{t.welcomeBack}, {mockReturningCustomer.name}! 🎉</p>
              <p className="text-sm text-muted-foreground">{t.foundPreviousOrders}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => toast.info(t.orderYourUsual)}>
                {t.orderYourUsual}
              </Button>
              <div className="flex flex-wrap gap-2">
                {mockReturningCustomer.savedAddresses.map((addr) => (
                  <button key={addr.label} type="button" onClick={() => setValue("delivery_address", addr.address)}
                    className="rounded-full bg-background border border-border px-3 py-1 text-xs font-medium hover:border-primary hover:text-primary transition-colors">
                    {addr.label}: {addr.address.slice(0, 20)}…
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {mockSettings.customer_require_name && (
            <div className="space-y-1.5">
              <Label htmlFor="name">{t.fullName} <span className="text-destructive">*</span></Label>
              <Input id="name" placeholder="e.g. Ahmed Ali" {...register("name", { required: t.nameRequired })} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
          )}
          {mockSettings.customer_require_phone && (
            <div className="space-y-1.5">
              <Label htmlFor="phone">{t.phoneNumber} <span className="text-destructive">*</span></Label>
              <Input id="phone" type="tel" placeholder="e.g. +966 50 123 4567"
                {...register("phone", { required: t.phoneRequired, minLength: { value: 7, message: t.phoneInvalid } })} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          )}
          {mockSettings.customer_require_email && (
            <div className="space-y-1.5">
              <Label htmlFor="email">{t.email} <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" placeholder="you@example.com"
                {...register("email", { required: t.emailRequired, pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t.emailInvalid } })} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          )}
          {mockSettings.customer_require_table && orderType === "dine_in" && (
            <div className="space-y-1.5">
              <Label htmlFor="table_number">{t.tableNumber} <span className="text-destructive">*</span></Label>
              <Input id="table_number" placeholder="e.g. 12" {...register("table_number", { required: t.tableRequired })} />
              {errors.table_number && <p className="text-xs text-destructive">{errors.table_number.message}</p>}
            </div>
          )}
          {mockSettings.customer_require_car && orderType === "drive_thru" && (
            <div className="space-y-1.5">
              <Label htmlFor="car_description">{t.vehicleDesc} <span className="text-destructive">*</span></Label>
              <Input id="car_description" placeholder="e.g. Red Toyota Corolla" {...register("car_description", { required: t.vehicleRequired })} />
              {errors.car_description && <p className="text-xs text-destructive">{errors.car_description.message}</p>}
            </div>
          )}
          {orderType === "delivery" && (
            <div className="space-y-1.5">
              <Label htmlFor="delivery_address">{t.deliveryAddress} <span className="text-destructive">*</span></Label>
              <Textarea id="delivery_address" placeholder={t.deliveryAddress} className="resize-none" rows={3}
                {...register("delivery_address", { required: t.addressRequired })} />
              {errors.delivery_address && <p className="text-xs text-destructive">{errors.delivery_address.message}</p>}
            </div>
          )}
          {mockSettings.customer_require_guest_count && (
            <div className="space-y-1.5">
              <Label htmlFor="guest_count">{t.numberOfGuests}</Label>
              <Input id="guest_count" type="number" min="1" placeholder="e.g. 2" {...register("guest_count")} />
            </div>
          )}
          {mockSettings.customer_allow_notes && (
            <div className="space-y-1.5">
              <Label htmlFor="notes">{t.specialInstructions}</Label>
              <Textarea id="notes" placeholder={t.allergiesPlaceholder} className="resize-none" rows={3} {...register("notes")} />
            </div>
          )}
        </div>
      </div>
    </form>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{t.paymentMethod}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t.choosePayment}</p>
      </div>
      <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="gap-3">
        {paymentOptions.map((opt) => (
          <div key={opt.value} className="space-y-2">
            <label className={cn("flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-colors",
              paymentMethod === opt.value ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40")}>
              <RadioGroupItem value={opt.value} id={`payment-${opt.value}`} />
              <span className={cn("flex size-10 items-center justify-center rounded-lg",
                paymentMethod === opt.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {opt.icon}
              </span>
              <div className="flex-1">
                <p className="font-medium">{opt.label}</p>
                <p className="text-sm text-muted-foreground">{opt.description}</p>
              </div>
            </label>
            {paymentMethod === opt.value && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mx-4 overflow-hidden">
                {opt.value === "card_online" && (
                  <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 space-y-2">
                    <div className="h-8 rounded bg-muted animate-pulse" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-8 rounded bg-muted animate-pulse" />
                      <div className="h-8 rounded bg-muted animate-pulse" />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{t.onlinePaymentSoon}</p>
                  </div>
                )}
                {opt.value === "bank_transfer" && (
                  <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1">
                    <p className="font-medium">{t.bankDetails}</p>
                    <p className="text-muted-foreground">Bank: First National Bank</p>
                    <p className="text-muted-foreground">Account: 0123-456789-01</p>
                    <p className="text-muted-foreground">Reference: {mockTenant.name}</p>
                  </div>
                )}
                {opt.value === "jazzcash" && (
                  <Button type="button" variant="outline" className="w-full" onClick={() => toast.info("JazzCash redirect — coming soon!")}>
                    {t.jazzcashDesc}
                  </Button>
                )}
                {opt.value === "easypaisa" && (
                  <Button type="button" variant="outline" className="w-full" onClick={() => toast.info("Easypaisa redirect — coming soon!")}>
                    {t.easypaisaDesc}
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        ))}
      </RadioGroup>
    </div>
  );

  const renderStep4 = () => {
    const paymentLabel = paymentOptions.find((p) => p.value === paymentMethod)?.label ?? paymentMethod;
    const orderTypeLabel = orderTypeOptions.find((o) => o.value === orderType)?.label ?? orderType;
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">{t.reviewOrder}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t.confirmEverything}</p>
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-muted/40 px-4 py-2.5 border-b border-border">
            <p className="text-sm font-semibold">{t.orderItems}</p>
          </div>
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  {item.selected_modifiers.length > 0 && (
                    <p className="text-xs text-muted-foreground">{item.selected_modifiers.map((m) => m.option_name).join(", ")}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 ms-3">
                  <span className="text-sm text-muted-foreground">×{item.quantity}</span>
                  <span className="text-sm font-medium tabular-nums">{formatPrice(item.line_total)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-muted/20 space-y-1.5 border-t border-border">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t.subtotal}</span><span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t.tax} ({mockSettings.payment_tax_rate}%)</span><span>{formatPrice(tax)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-semibold">
              <span>{t.total}</span><span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-muted/40 px-4 py-2.5 border-b border-border">
            <p className="text-sm font-semibold">{t.yourDetails}</p>
          </div>
          <div className="px-4 py-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t.orderType}</span><span className="font-medium">{orderTypeLabel}</span></div>
            {customerData.name && <div className="flex justify-between"><span className="text-muted-foreground">{t.name}</span><span className="font-medium">{customerData.name}</span></div>}
            {customerData.phone && <div className="flex justify-between"><span className="text-muted-foreground">{t.phone}</span><span className="font-medium">{customerData.phone}</span></div>}
            {customerData.email && <div className="flex justify-between"><span className="text-muted-foreground">{t.email}</span><span className="font-medium">{customerData.email}</span></div>}
            {customerData.table_number && <div className="flex justify-between"><span className="text-muted-foreground">{t.table}</span><span className="font-medium">#{customerData.table_number}</span></div>}
            {customerData.delivery_address && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">{t.address}</span>
                <span className="font-medium text-end">{customerData.delivery_address}</span>
              </div>
            )}
            {customerData.notes && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">{t.notes}</span>
                <span className="font-medium text-end">{customerData.notes}</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-muted/40 px-4 py-2.5 border-b border-border">
            <p className="text-sm font-semibold">{t.payment}</p>
          </div>
          <div className="px-4 py-3">
            <span className="text-sm font-medium">{paymentLabel}</span>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={termsAccepted} onCheckedChange={(c) => setTermsAccepted(c === true)} className="mt-0.5" />
          <span className="text-sm text-muted-foreground leading-snug">
            {t.termsText}{" "}
            <span className="text-primary underline underline-offset-2 cursor-pointer">{t.termsLink}</span>
          </span>
        </label>
      </div>
    );
  };

  const renderStepIndicator = () => {
    const labels = skipOrderTypeStep
      ? [t.detailsStepLabel, t.paymentStepLabel, t.reviewStepLabel]
      : [t.orderTypeStepLabel, t.detailsStepLabel, t.paymentStepLabel, t.reviewStepLabel];
    return (
      <div className="flex items-center gap-1 mb-6">
        {labels.map((label, i) => {
          const s = skipOrderTypeStep ? i + 2 : i + 1;
          const isCurrent = step === s;
          const isPast = step > s;
          return (
            <div key={label} className="flex items-center gap-1 flex-1">
              <div className="flex flex-col items-center gap-1">
                <div className={cn("flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isPast ? "bg-primary text-primary-foreground" : isCurrent ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-muted text-muted-foreground")}>
                  {isPast ? <CheckCircle2 className="size-4" /> : i + 1}
                </div>
                <span className={cn("text-[10px] font-medium leading-tight text-center", isCurrent ? "text-primary" : "text-muted-foreground")}>{label}</span>
              </div>
              {i < labels.length - 1 && <div className={cn("flex-1 h-px -mt-4 transition-colors", step > s ? "bg-primary" : "bg-border")} />}
            </div>
          );
        })}
      </div>
    );
  };

  const renderNav = () => {
    const isFirstStep = step === 1 || (skipOrderTypeStep && step === 2);
    const isLastStep = step === 4;
    return (
      <div className="flex gap-3 pt-2">
        {!isFirstStep && (
          <Button type="button" variant="outline" className="flex-1" onClick={goBack} disabled={isSubmitting}>
            <ChevronLeft className="size-4 me-1 rtl:rotate-180" />{t.back}
          </Button>
        )}
        {step === 2 ? (
          <Button type="submit" form="customer-info-form" className="flex-1">
            {t.next}<ChevronRight className="size-4 ms-1 rtl:rotate-180" />
          </Button>
        ) : isLastStep ? (
          <Button type="button" className="flex-1 h-12 text-base font-semibold" onClick={handlePlaceOrder} disabled={isSubmitting || !termsAccepted}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                {t.placingOrder}
              </span>
            ) : t.placeOrder}
          </Button>
        ) : (
          <Button type="button" className="flex-1" onClick={goNext}>
            {t.next}<ChevronRight className="size-4 ms-1 rtl:rotate-180" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button type="button" onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="size-4 rtl:rotate-180" />{t.back}
          </button>
          <h1 className="font-semibold text-base flex-1 text-center pe-8">{t.checkout}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {renderStepIndicator()}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={step} custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: "easeInOut" }}>
              {step === 1 && !skipOrderTypeStep && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-6">{renderNav()}</div>
      </div>
    </div>
  );
}
