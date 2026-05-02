"use client";

import React, { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  User,
  CreditCard,
  BookOpen,
  Star,
  Bell,
  Palette,
  Clock,
  Receipt,
  Lock,
  Loader2,
  AlertCircle,
  Upload,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { mockTenant, mockSettings } from "@/mock/tenant";
import type { Plan, TenantSettings } from "@/types";
import { SettingsUpgradeModal } from "@/components/dashboard/settings-upgrade-modal";
import { useT } from "@/lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

type BooleanSettingKey = {
  [K in keyof TenantSettings]: TenantSettings[K] extends boolean ? K : never;
}[keyof TenantSettings];

type SettingKey = BooleanSettingKey;

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface OperatingDay {
  day: string;
  open: boolean;
  openTime: string;
  closeTime: string;
}

interface TaxCurrencyState {
  taxRate: string;
  taxInclusive: boolean;
  serviceCharge: string;
  minimumOrder: string;
  currency: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

function getTabs(t: ReturnType<typeof useT>): TabConfig[] {
  return [
    { id: "ordering",   label: t.set_tabOrdering,   icon: <ShoppingCart className="size-4" /> },
    { id: "customer",   label: t.set_tabCustomer,   icon: <User className="size-4" /> },
    { id: "payment",    label: t.set_tabPayment,    icon: <CreditCard className="size-4" /> },
    { id: "menu",       label: t.set_tabMenu,       icon: <BookOpen className="size-4" /> },
    { id: "experience", label: t.set_tabExperience, icon: <Star className="size-4" /> },
    { id: "notif",      label: t.set_tabNotif,      icon: <Bell className="size-4" /> },
    { id: "branding",   label: t.set_tabBranding,   icon: <Palette className="size-4" /> },
    { id: "hours",      label: t.set_tabHours,      icon: <Clock className="size-4" /> },
    { id: "tax",        label: t.set_tabTax,        icon: <Receipt className="size-4" /> },
  ];
}

const DEFAULT_DAYS: OperatingDay[] = [
  { day: "Monday",    open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Tuesday",   open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Wednesday", open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Thursday",  open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Friday",    open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Saturday",  open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Sunday",    open: true, openTime: "09:00", closeTime: "22:00" },
];

const PLAN_ORDER: Record<Plan, number> = {
  free: 0, starter: 1, pro: 2, business: 3,
};

const PLAN_LABEL: Record<Plan, string> = {
  free: "Free+", starter: "Starter+", pro: "Pro+", business: "Business",
};

const FONTS = ["Geist", "Inter", "Roboto", "Poppins", "Montserrat"];

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "PKR", label: "PKR — Pakistani Rupee" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SAR", label: "SAR — Saudi Riyal" },
];

// ─── FeatureToggle component ──────────────────────────────────────────────────

interface FeatureToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  locked?: boolean;
  requiredPlan?: Plan;
  isLoading?: boolean;
  onLockedClick?: () => void;
}

function FeatureToggle({
  label,
  description,
  checked,
  onCheckedChange,
  locked = false,
  requiredPlan,
  isLoading = false,
  onLockedClick,
}: FeatureToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {locked && requiredPlan && (
            <Badge variant="outline" className="h-4 text-[10px] px-1.5 gap-0.5">
              <Lock className="size-2.5" />
              {PLAN_LABEL[requiredPlan]}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isLoading && (
          <Loader2 className="size-3.5 text-muted-foreground animate-spin" />
        )}
        {locked ? (
          <button
            type="button"
            onClick={onLockedClick}
            className="flex items-center justify-center cursor-pointer"
            aria-label={`Upgrade to ${requiredPlan} to unlock ${label}`}
          >
            <Switch
              checked={checked}
              disabled
              size="sm"
              className="pointer-events-none"
            />
          </button>
        ) : (
          <Switch
            checked={checked}
            onCheckedChange={onCheckedChange}
            size="sm"
            disabled={isLoading}
          />
        )}
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const t = useT();
  const TABS = getTabs(t);
  const currentPlan: Plan = mockTenant.plan;

  // ── Settings state ──
  const [settings, setSettings] = useState<TenantSettings>({ ...mockSettings });
  const initialSettings = useRef<TenantSettings>({ ...mockSettings });

  // ── Active tab ──
  const [activeTab, setActiveTab] = useState("ordering");

  // ── In-progress toggles ──
  const [savingKeys, setSavingKeys] = useState<Set<SettingKey>>(new Set());

  // ── Upgrade modal ──
  const [upgradeModal, setUpgradeModal] = useState<{
    open: boolean;
    requiredPlan: Plan;
    featureName: string;
  }>({ open: false, requiredPlan: "starter", featureName: "" });

  // ── Branding state ──
  const [brandColor, setBrandColor] = useState(
    mockSettings.brand_primary_color ?? "#7C3AED"
  );
  const [brandFont, setBrandFont] = useState(mockSettings.brand_font ?? "Geist");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Operating hours state ──
  const [days, setDays] = useState<OperatingDay[]>(DEFAULT_DAYS);

  // ── Tax & currency state ──
  const [taxState, setTaxState] = useState<TaxCurrencyState>({
    taxRate: String(mockSettings.payment_tax_rate),
    taxInclusive: mockSettings.payment_tax_inclusive,
    serviceCharge: String(mockSettings.payment_service_charge),
    minimumOrder: String(mockSettings.payment_minimum_order),
    currency: mockTenant.currency,
  });
  const [taxSaving, setTaxSaving] = useState(false);

  // ── Unsaved state ──
  const hasUnsaved =
    JSON.stringify(settings) !== JSON.stringify(initialSettings.current) ||
    brandColor !== (mockSettings.brand_primary_color ?? "#7C3AED") ||
    brandFont !== (mockSettings.brand_font ?? "Geist");

  // ── Toggle handler with optimistic UI ──
  const handleToggle = useCallback(
    (key: SettingKey, value: boolean) => {
      // Optimistically update
      setSettings((prev) => ({ ...prev, [key as string]: value } as TenantSettings));
      setSavingKeys((prev) => new Set(prev).add(key));

      setTimeout(() => {
        const fail = Math.random() < 0.15;
        if (fail) {
          setSettings((prev) => ({ ...prev, [key as string]: !value } as TenantSettings));
          toast.error(t.set_toastFailed);
        } else {
          // Sync initial ref so it's considered saved
          initialSettings.current = { ...initialSettings.current, [key as string]: value } as TenantSettings;
        }
        setSavingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 600);
    },
    []
  );

  const openUpgrade = (plan: Plan, name: string) => {
    setUpgradeModal({ open: true, requiredPlan: plan, featureName: name });
  };

  const isPlanSufficient = (required: Plan) =>
    PLAN_ORDER[currentPlan] >= PLAN_ORDER[required];

  // ── Save all ──
  const handleSaveAll = () => {
    initialSettings.current = { ...settings };
    toast.success(t.set_toastAllSaved);
  };

  const handleDiscard = () => {
    setSettings({ ...initialSettings.current });
    setBrandColor(mockSettings.brand_primary_color ?? "#7C3AED");
    setBrandFont(mockSettings.brand_font ?? "Geist");
    toast.info(t.set_toastDiscarded);
  };

  // ── Tax save ──
  const handleTaxSave = () => {
    setTaxSaving(true);
    setTimeout(() => {
      setTaxSaving(false);
      toast.success(t.set_toastTaxSaved);
    }, 800);
  };

  // ── Logo upload ──
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t.set_toastFileTooLarge);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") {
        setLogoPreview(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Render section ──
  const renderSection = () => {
    switch (activeTab) {
      // ── 1. Ordering ──
      case "ordering":
        return (
          <div>
            <SectionHeader title={t.set_orderingTitle} description={t.set_orderingDesc} />
            <div className="divide-y divide-border rounded-xl border border-border bg-card px-4">
              <FeatureToggle
                label={t.set_dineInLabel}
                description={t.set_dineInDesc}
                checked={settings.ordering_dine_in}
                onCheckedChange={(v) => handleToggle("ordering_dine_in", v)}
                isLoading={savingKeys.has("ordering_dine_in")}
              />
              <FeatureToggle
                label={t.set_takeawayLabel}
                description={t.set_takeawayDesc}
                checked={settings.ordering_takeaway}
                onCheckedChange={(v) => handleToggle("ordering_takeaway", v)}
                isLoading={savingKeys.has("ordering_takeaway")}
              />
              <FeatureToggle
                label={t.set_deliveryLabel}
                description={t.set_deliveryDesc}
                checked={settings.ordering_delivery}
                onCheckedChange={(v) => handleToggle("ordering_delivery", v)}
                isLoading={savingKeys.has("ordering_delivery")}
              />
              <FeatureToggle
                label={t.set_driveThruLabel}
                description={t.set_driveThruDesc}
                checked={settings.ordering_drive_thru}
                onCheckedChange={(v) => handleToggle("ordering_drive_thru", v)}
                isLoading={savingKeys.has("ordering_drive_thru")}
              />
            </div>
          </div>
        );

      // ── 2. Customer Info ──
      case "customer":
        return (
          <div>
            <SectionHeader title={t.set_customerTitle} description={t.set_customerDesc} />
            <div className="divide-y divide-border rounded-xl border border-border bg-card px-4">
              <FeatureToggle
                label={t.set_requireName}
                description={t.set_requireNameDesc}
                checked={settings.customer_require_name}
                onCheckedChange={(v) => handleToggle("customer_require_name", v)}
                isLoading={savingKeys.has("customer_require_name")}
              />
              <FeatureToggle
                label={t.set_requirePhone}
                description={t.set_requirePhoneDesc}
                checked={settings.customer_require_phone}
                onCheckedChange={(v) => handleToggle("customer_require_phone", v)}
                isLoading={savingKeys.has("customer_require_phone")}
              />
              <FeatureToggle
                label={t.set_requireEmail}
                description={t.set_requireEmailDesc}
                checked={settings.customer_require_email}
                onCheckedChange={(v) => handleToggle("customer_require_email", v)}
                isLoading={savingKeys.has("customer_require_email")}
              />
              <FeatureToggle
                label={t.set_requireTable}
                description={t.set_requireTableDesc}
                checked={settings.customer_require_table}
                onCheckedChange={(v) => handleToggle("customer_require_table", v)}
                isLoading={savingKeys.has("customer_require_table")}
              />
              <FeatureToggle
                label={t.set_requireCar}
                description={t.set_requireCarDesc}
                checked={settings.customer_require_car}
                onCheckedChange={(v) => handleToggle("customer_require_car", v)}
                isLoading={savingKeys.has("customer_require_car")}
              />
              <FeatureToggle
                label={t.set_requireAddress}
                description={t.set_requireAddressDesc}
                checked={settings.customer_require_address}
                onCheckedChange={(v) => handleToggle("customer_require_address", v)}
                isLoading={savingKeys.has("customer_require_address")}
              />
              <FeatureToggle
                label={t.set_requireGuests}
                description={t.set_requireGuestsDesc}
                checked={settings.customer_require_guest_count}
                onCheckedChange={(v) =>
                  handleToggle("customer_require_guest_count", v)
                }
                isLoading={savingKeys.has("customer_require_guest_count")}
              />
              <FeatureToggle
                label={t.set_allowNotes}
                description={t.set_allowNotesDesc}
                checked={settings.customer_allow_notes}
                onCheckedChange={(v) => handleToggle("customer_allow_notes", v)}
                isLoading={savingKeys.has("customer_allow_notes")}
              />
            </div>
          </div>
        );

      // ── 3. Payment ──
      case "payment":
        return (
          <div>
            <SectionHeader title={t.set_paymentTitle} description={t.set_paymentDesc} />
            <div className="divide-y divide-border rounded-xl border border-border bg-card px-4">
              <FeatureToggle
                label={t.set_cashLabel}
                description={t.set_cashDesc}
                checked={settings.payment_cash}
                onCheckedChange={(v) => handleToggle("payment_cash", v)}
                isLoading={savingKeys.has("payment_cash")}
              />
              <FeatureToggle
                label={t.set_cardVenueLabel}
                description={t.set_cardVenueDesc}
                checked={settings.payment_card_venue}
                onCheckedChange={(v) => handleToggle("payment_card_venue", v)}
                isLoading={savingKeys.has("payment_card_venue")}
              />
              <FeatureToggle
                label={t.set_cardOnlineLabel}
                description={t.set_cardOnlineDesc}
                checked={settings.payment_card_online}
                onCheckedChange={(v) => handleToggle("payment_card_online", v)}
                isLoading={savingKeys.has("payment_card_online")}
              />
              <FeatureToggle
                label={t.set_bankTransferLabel}
                description={t.set_bankTransferDesc}
                checked={settings.payment_bank_transfer}
                onCheckedChange={(v) => handleToggle("payment_bank_transfer", v)}
                isLoading={savingKeys.has("payment_bank_transfer")}
              />
              <FeatureToggle
                label="JazzCash"
                description={t.set_jazzcashDesc}
                checked={settings.payment_jazzcash}
                onCheckedChange={
                  isPlanSufficient("starter")
                    ? (v) => handleToggle("payment_jazzcash", v)
                    : () => openUpgrade("starter", "JazzCash")
                }
                locked={!isPlanSufficient("starter")}
                requiredPlan="starter"
                isLoading={savingKeys.has("payment_jazzcash")}
                onLockedClick={() => openUpgrade("starter", "JazzCash")}
              />
              <FeatureToggle
                label="Easypaisa"
                description={t.set_easypaisaDesc}
                checked={settings.payment_easypaisa}
                onCheckedChange={
                  isPlanSufficient("starter")
                    ? (v) => handleToggle("payment_easypaisa", v)
                    : () => openUpgrade("starter", "Easypaisa")
                }
                locked={!isPlanSufficient("starter")}
                requiredPlan="starter"
                isLoading={savingKeys.has("payment_easypaisa")}
                onLockedClick={() => openUpgrade("starter", "Easypaisa")}
              />
              <FeatureToggle
                label="Bizum"
                description={t.set_bizumDesc}
                checked={settings.payment_bizum}
                onCheckedChange={
                  isPlanSufficient("starter")
                    ? (v) => handleToggle("payment_bizum", v)
                    : () => openUpgrade("starter", "Bizum")
                }
                locked={!isPlanSufficient("starter")}
                requiredPlan="starter"
                isLoading={savingKeys.has("payment_bizum")}
                onLockedClick={() => openUpgrade("starter", "Bizum")}
              />
              <FeatureToggle
                label={t.set_tipsLabel}
                description={t.set_tipsDesc}
                checked={settings.payment_tips}
                onCheckedChange={(v) => handleToggle("payment_tips", v)}
                isLoading={savingKeys.has("payment_tips")}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground flex items-start gap-1.5">
              <AlertCircle className="size-3.5 flex-shrink-0 mt-0.5" />
              {t.set_paymentNote}
            </p>
          </div>
        );

      // ── 4. Menu Display ──
      case "menu":
        return (
          <div>
            <SectionHeader title={t.set_menuDispTitle} description={t.set_menuDispDesc} />
            <div className="divide-y divide-border rounded-xl border border-border bg-card px-4">
              <FeatureToggle
                label={t.set_showPrices}
                description={t.set_showPricesDesc}
                checked={settings.menu_show_prices}
                onCheckedChange={(v) => handleToggle("menu_show_prices", v)}
                isLoading={savingKeys.has("menu_show_prices")}
              />
              <FeatureToggle
                label={t.set_showCalories}
                description={t.set_showCaloriesDesc}
                checked={settings.menu_show_calories}
                onCheckedChange={(v) => handleToggle("menu_show_calories", v)}
                isLoading={savingKeys.has("menu_show_calories")}
              />
              <FeatureToggle
                label={t.set_showPrepTime}
                description={t.set_showPrepTimeDesc}
                checked={settings.menu_show_prep_time}
                onCheckedChange={(v) => handleToggle("menu_show_prep_time", v)}
                isLoading={savingKeys.has("menu_show_prep_time")}
              />
              <FeatureToggle
                label={t.set_showAllergens}
                description={t.set_showAllergensDesc}
                checked={settings.menu_show_allergens}
                onCheckedChange={(v) => handleToggle("menu_show_allergens", v)}
                isLoading={savingKeys.has("menu_show_allergens")}
              />
              <FeatureToggle
                label={t.set_arViewer}
                description={t.set_arViewerDesc}
                checked={settings.menu_ar_viewer}
                onCheckedChange={
                  isPlanSufficient("pro")
                    ? (v) => handleToggle("menu_ar_viewer", v)
                    : () => openUpgrade("pro", "AR Viewer")
                }
                locked={!isPlanSufficient("pro")}
                requiredPlan="pro"
                isLoading={savingKeys.has("menu_ar_viewer")}
                onLockedClick={() => openUpgrade("pro", "AR Viewer")}
              />
              <FeatureToggle
                label={t.set_threeDViewer}
                description={t.set_threeDViewerDesc}
                checked={settings.menu_3d_viewer}
                onCheckedChange={
                  isPlanSufficient("pro")
                    ? (v) => handleToggle("menu_3d_viewer", v)
                    : () => openUpgrade("pro", "3D Viewer")
                }
                locked={!isPlanSufficient("pro")}
                requiredPlan="pro"
                isLoading={savingKeys.has("menu_3d_viewer")}
                onLockedClick={() => openUpgrade("pro", "3D Viewer")}
              />
              <FeatureToggle
                label={t.set_popularBadges}
                description={t.set_popularBadgesDesc}
                checked={settings.menu_popular_badges}
                onCheckedChange={(v) => handleToggle("menu_popular_badges", v)}
                isLoading={savingKeys.has("menu_popular_badges")}
              />
              <FeatureToggle
                label={t.set_newBadges}
                description={t.set_newBadgesDesc}
                checked={settings.menu_new_badges}
                onCheckedChange={(v) => handleToggle("menu_new_badges", v)}
                isLoading={savingKeys.has("menu_new_badges")}
              />
            </div>
          </div>
        );

      // ── 5. Customer Experience ──
      case "experience":
        return (
          <div>
            <SectionHeader title={t.set_expTitle} description={t.set_expDesc} />
            <div className="divide-y divide-border rounded-xl border border-border bg-card px-4">
              <FeatureToggle
                label={t.set_callWaiterLabel}
                description={t.set_callWaiterDesc}
                checked={settings.customer_call_waiter}
                onCheckedChange={(v) => handleToggle("customer_call_waiter", v)}
                isLoading={savingKeys.has("customer_call_waiter")}
              />
              <FeatureToggle
                label={t.set_requestBillLabel}
                description={t.set_requestBillDesc}
                checked={settings.customer_request_bill}
                onCheckedChange={(v) =>
                  handleToggle("customer_request_bill", v)
                }
                isLoading={savingKeys.has("customer_request_bill")}
              />
              <FeatureToggle
                label={t.set_reorderBtnLabel}
                description={t.set_reorderBtnDesc}
                checked={settings.customer_reorder}
                onCheckedChange={(v) => handleToggle("customer_reorder", v)}
                isLoading={savingKeys.has("customer_reorder")}
              />
              <FeatureToggle
                label={t.set_reviewPromptLabel}
                description={t.set_reviewPromptDesc}
                checked={settings.customer_review_prompt}
                onCheckedChange={(v) =>
                  handleToggle("customer_review_prompt", v)
                }
                isLoading={savingKeys.has("customer_review_prompt")}
              />
            </div>
          </div>
        );

      // ── 6. Notifications ──
      case "notif":
        return (
          <div>
            <SectionHeader title={t.set_notifTitle} description={t.set_notifDesc} />
            <div className="divide-y divide-border rounded-xl border border-border bg-card px-4">
              <FeatureToggle
                label={t.set_waCustomerLabel}
                description={t.set_waCustomerDesc}
                checked={settings.notif_whatsapp_customer}
                onCheckedChange={(v) =>
                  handleToggle("notif_whatsapp_customer", v)
                }
                isLoading={savingKeys.has("notif_whatsapp_customer")}
              />
              <FeatureToggle
                label={t.set_waOwnerLabel}
                description={t.set_waOwnerDesc}
                checked={settings.notif_whatsapp_owner}
                onCheckedChange={(v) =>
                  handleToggle("notif_whatsapp_owner", v)
                }
                isLoading={savingKeys.has("notif_whatsapp_owner")}
              />
              <FeatureToggle
                label={t.set_soundLabel}
                description={t.set_soundDesc}
                checked={settings.notif_sound}
                onCheckedChange={(v) => handleToggle("notif_sound", v)}
                isLoading={savingKeys.has("notif_sound")}
              />
            </div>
          </div>
        );

      // ── 7. Branding ──
      case "branding":
        return (
          <div>
            <SectionHeader title={t.set_brandingTitle} description={t.set_brandingDesc} />
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>{t.set_logo}</Label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 py-10 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:border-ring cursor-pointer"
                  )}
                >
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-16 w-16 object-contain rounded-lg"
                    />
                  ) : (
                    <Upload className="size-8 text-muted-foreground/60" />
                  )}
                  <span>{logoPreview ? t.set_logoReplace : t.set_logoUpload}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{t.set_primaryColor}</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-9 w-14 cursor-pointer rounded-lg border border-input bg-transparent p-1 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                  <Input
                    value={brandColor}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setBrandColor(v);
                    }}
                    className="w-32 font-mono"
                    maxLength={7}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{t.set_font}</Label>
                <Select
                  value={brandFont}
                  onValueChange={(v) => setBrandFont(v as string)}
                >
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{t.set_livePreview}</Label>
                <div
                  className="flex items-center gap-4 rounded-xl px-5 py-4 text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-bold"
                    style={{ fontFamily: brandFont }}
                  >
                    {mockTenant.name.charAt(0)}
                  </div>
                  <div>
                    <p
                      className="text-base font-semibold"
                      style={{ fontFamily: brandFont }}
                    >
                      {mockTenant.name}
                    </p>
                    <p className="text-xs opacity-80" style={{ fontFamily: brandFont }}>
                      {mockTenant.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // ── 8. Operating Hours ──
      case "hours":
        return (
          <div>
            <SectionHeader title={t.set_hoursTitle} description={t.set_hoursDesc} />
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_auto_1fr_1fr] gap-4 px-4 py-2 border-b border-border text-xs font-medium text-muted-foreground">
                <span>{t.set_colDay}</span>
                <span>{t.set_colOpen}</span>
                <span>{t.set_colOpensAt}</span>
                <span>{t.set_colClosesAt}</span>
              </div>
              {days.map((d, idx) => (
                <div
                  key={d.day}
                  className={cn(
                    "grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_1fr_1fr] gap-x-4 gap-y-2 px-4 py-3 items-center",
                    idx !== 0 && "border-t border-border"
                  )}
                >
                  <span className="text-sm font-medium">{d.day}</span>
                  <Switch
                    checked={d.open}
                    onCheckedChange={(v) => {
                      setDays((prev) =>
                        prev.map((day, i) =>
                          i === idx ? { ...day, open: v } : day
                        )
                      );
                    }}
                    size="sm"
                  />
                  {/* Mobile: full-width row for times */}
                  <div className="col-span-2 sm:col-span-1">
                    <Input
                      type="time"
                      value={d.openTime}
                      disabled={!d.open}
                      onChange={(e) =>
                        setDays((prev) =>
                          prev.map((day, i) =>
                            i === idx
                              ? { ...day, openTime: e.target.value }
                              : day
                          )
                        )
                      }
                      className={cn(
                        "w-full sm:w-auto",
                        !d.open && "opacity-40 cursor-not-allowed"
                      )}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Input
                      type="time"
                      value={d.closeTime}
                      disabled={!d.open}
                      onChange={(e) =>
                        setDays((prev) =>
                          prev.map((day, i) =>
                            i === idx
                              ? { ...day, closeTime: e.target.value }
                              : day
                          )
                        )
                      }
                      className={cn(
                        "w-full sm:w-auto",
                        !d.open && "opacity-40 cursor-not-allowed"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => toast.success(t.set_toastAllSaved)}>{t.set_saveHours}</Button>
            </div>
          </div>
        );

      // ── 9. Tax & Currency ──
      case "tax":
        return (
          <div>
            <SectionHeader title={t.set_taxTitle} description={t.set_taxDesc} />
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="tax-rate">{t.set_taxRate}</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={taxState.taxRate}
                  onChange={(e) =>
                    setTaxState((prev) => ({ ...prev, taxRate: e.target.value }))
                  }
                  className="w-40"
                />
              </div>

              <div className="space-y-2">
                <Label>{t.set_taxType}</Label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: false, label: t.set_taxExclusive, description: t.set_taxExclusiveDesc },
                    { value: true,  label: t.set_taxInclusiveLabel, description: t.set_taxInclusiveDesc },
                  ].map((opt) => (
                    <label
                      key={String(opt.value)}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors",
                        taxState.taxInclusive === opt.value
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <input
                        type="radio"
                        name="tax-type"
                        checked={taxState.taxInclusive === opt.value}
                        onChange={() =>
                          setTaxState((prev) => ({
                            ...prev,
                            taxInclusive: opt.value,
                          }))
                        }
                        className="mt-0.5 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {opt.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="service-charge">{t.set_serviceCharge}</Label>
                <Input
                  id="service-charge"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={taxState.serviceCharge}
                  onChange={(e) =>
                    setTaxState((prev) => ({
                      ...prev,
                      serviceCharge: e.target.value,
                    }))
                  }
                  className="w-40"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="min-order">{t.set_minimumOrder}</Label>
                <Input
                  id="min-order"
                  type="number"
                  min={0}
                  step={0.5}
                  value={taxState.minimumOrder}
                  onChange={(e) =>
                    setTaxState((prev) => ({
                      ...prev,
                      minimumOrder: e.target.value,
                    }))
                  }
                  className="w-40"
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t.set_currency}</Label>
                <Select
                  value={taxState.currency}
                  onValueChange={(v) =>
                    setTaxState((prev) => ({ ...prev, currency: v as string }))
                  }
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Save button */}
              <div className="pt-2">
                <Button onClick={handleTaxSave} disabled={taxSaving}>
                  {taxSaving ? (<><Loader2 className="size-4 animate-spin" />{t.stf_saving}</>) : t.dashSave}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{t.set_pageTitle}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t.set_pageSubtitle}</p>
      </div>

      <AnimatePresence>
        {hasUnsaved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30"
          >
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertCircle className="size-4 flex-shrink-0" />
              <span className="font-medium">{t.set_unsavedChanges}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleDiscard}>{t.set_discard}</Button>
              <Button size="sm" onClick={handleSaveAll}>{t.set_saveAll}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layout: nav + content */}
      <div className="flex gap-6">
        {/* Desktop vertical nav */}
        <nav className="hidden lg:flex flex-col w-52 flex-shrink-0 gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Mobile horizontal tab bar */}
        <div className="lg:hidden w-full">
          <div className="flex gap-1 overflow-x-auto pb-1 mb-4 scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          {/* Section content (mobile) */}
          <div className="flex-1">{renderSection()}</div>
        </div>

        {/* Desktop section content */}
        <div className="hidden lg:block flex-1 min-w-0">{renderSection()}</div>
      </div>

      {/* Upgrade modal */}
      <SettingsUpgradeModal
        open={upgradeModal.open}
        onOpenChange={(open) =>
          setUpgradeModal((prev) => ({ ...prev, open }))
        }
        requiredPlan={upgradeModal.requiredPlan}
        currentPlan={currentPlan}
        featureName={upgradeModal.featureName}
      />
    </div>
  );
}
