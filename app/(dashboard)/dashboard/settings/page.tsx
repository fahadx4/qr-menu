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

const TABS: TabConfig[] = [
  { id: "ordering",    label: "Ordering",            icon: <ShoppingCart className="size-4" /> },
  { id: "customer",    label: "Customer Info",        icon: <User className="size-4" /> },
  { id: "payment",     label: "Payment",              icon: <CreditCard className="size-4" /> },
  { id: "menu",        label: "Menu Display",         icon: <BookOpen className="size-4" /> },
  { id: "experience",  label: "Customer Experience",  icon: <Star className="size-4" /> },
  { id: "notif",       label: "Notifications",        icon: <Bell className="size-4" /> },
  { id: "branding",    label: "Branding",             icon: <Palette className="size-4" /> },
  { id: "hours",       label: "Operating Hours",      icon: <Clock className="size-4" /> },
  { id: "tax",         label: "Tax & Currency",       icon: <Receipt className="size-4" /> },
];

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
          toast.error("Failed to save setting");
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
    toast.success("All settings saved");
  };

  const handleDiscard = () => {
    setSettings({ ...initialSettings.current });
    setBrandColor(mockSettings.brand_primary_color ?? "#7C3AED");
    setBrandFont(mockSettings.brand_font ?? "Geist");
    toast.info("Changes discarded");
  };

  // ── Tax save ──
  const handleTaxSave = () => {
    setTaxSaving(true);
    setTimeout(() => {
      setTaxSaving(false);
      toast.success("Tax & currency settings saved");
    }, 800);
  };

  // ── Logo upload ──
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large. Max 2MB.");
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
            <SectionHeader
              title="Ordering"
              description="Choose which order channels are active for your restaurant."
            />
            <div className="divide-y divide-border rounded-xl border border-border bg-card px-4">
              <FeatureToggle
                label="Dine-in"
                description="Allow customers to order at their table via QR code."
                checked={settings.ordering_dine_in}
                onCheckedChange={(v) => handleToggle("ordering_dine_in", v)}
                isLoading={savingKeys.has("ordering_dine_in")}
              />
              <FeatureToggle
                label="Takeaway"
                description="Allow walk-in customers to place pickup orders."
                checked={settings.ordering_takeaway}
                onCheckedChange={(v) => handleToggle("ordering_takeaway", v)}
                isLoading={savingKeys.has("ordering_takeaway")}
              />
              <FeatureToggle
                label="Delivery"
                description="Accept delivery orders with address collection."
                checked={settings.ordering_delivery}
                onCheckedChange={(v) => handleToggle("ordering_delivery", v)}
                isLoading={savingKeys.has("ordering_delivery")}
              />
              <FeatureToggle
                label="Drive-thru"
                description="Allow drive-thru orders with car number collection."
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
            <SectionHeader
              title="Customer Info"
              description="Decide which fields customers must fill before placing an order."
            />
            <div className="divide-y divide-border rounded-xl border border-border bg-card px-4">
              <FeatureToggle
                label="Require Name"
                description="Ask for customer's full name."
                checked={settings.customer_require_name}
                onCheckedChange={(v) => handleToggle("customer_require_name", v)}
                isLoading={savingKeys.has("customer_require_name")}
              />
              <FeatureToggle
                label="Require Phone"
                description="Ask for a contact phone number."
                checked={settings.customer_require_phone}
                onCheckedChange={(v) => handleToggle("customer_require_phone", v)}
                isLoading={savingKeys.has("customer_require_phone")}
              />
              <FeatureToggle
                label="Require Email"
                description="Ask for customer email address."
                checked={settings.customer_require_email}
                onCheckedChange={(v) => handleToggle("customer_require_email", v)}
                isLoading={savingKeys.has("customer_require_email")}
              />
              <FeatureToggle
                label="Require Table Number"
                description="Confirm table number for dine-in orders."
                checked={settings.customer_require_table}
                onCheckedChange={(v) => handleToggle("customer_require_table", v)}
                isLoading={savingKeys.has("customer_require_table")}
              />
              <FeatureToggle
                label="Require Car Number"
                description="Collect vehicle registration for drive-thru orders."
                checked={settings.customer_require_car}
                onCheckedChange={(v) => handleToggle("customer_require_car", v)}
                isLoading={savingKeys.has("customer_require_car")}
              />
              <FeatureToggle
                label="Require Delivery Address"
                description="Collect full address for delivery orders."
                checked={settings.customer_require_address}
                onCheckedChange={(v) => handleToggle("customer_require_address", v)}
                isLoading={savingKeys.has("customer_require_address")}
              />
              <FeatureToggle
                label="Require Guest Count"
                description="Ask how many guests are dining for dine-in orders."
                checked={settings.customer_require_guest_count}
                onCheckedChange={(v) =>
                  handleToggle("customer_require_guest_count", v)
                }
                isLoading={savingKeys.has("customer_require_guest_count")}
              />
              <FeatureToggle
                label="Allow Special Notes"
                description="Let customers add order-level notes or instructions."
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
            <SectionHeader
              title="Payment"
              description="Configure the payment methods available to customers."
            />
            <div className="divide-y divide-border rounded-xl border border-border bg-card px-4">
              <FeatureToggle
                label="Cash"
                description="Accept cash payments at delivery or pickup."
                checked={settings.payment_cash}
                onCheckedChange={(v) => handleToggle("payment_cash", v)}
                isLoading={savingKeys.has("payment_cash")}
              />
              <FeatureToggle
                label="Card at Venue"
                description="Accept card payments via a physical terminal."
                checked={settings.payment_card_venue}
                onCheckedChange={(v) => handleToggle("payment_card_venue", v)}
                isLoading={savingKeys.has("payment_card_venue")}
              />
              <FeatureToggle
                label="Card Online"
                description="Accept card payments via online gateway."
                checked={settings.payment_card_online}
                onCheckedChange={(v) => handleToggle("payment_card_online", v)}
                isLoading={savingKeys.has("payment_card_online")}
              />
              <FeatureToggle
                label="Bank Transfer"
                description="Allow customers to pay via bank transfer."
                checked={settings.payment_bank_transfer}
                onCheckedChange={(v) => handleToggle("payment_bank_transfer", v)}
                isLoading={savingKeys.has("payment_bank_transfer")}
              />
              <FeatureToggle
                label="JazzCash"
                description="Accept JazzCash mobile wallet payments."
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
                description="Accept Easypaisa mobile wallet payments."
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
                description="Accept Bizum payments (Spain)."
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
                label="Tips Enabled"
                description="Allow customers to add a tip when paying."
                checked={settings.payment_tips}
                onCheckedChange={(v) => handleToggle("payment_tips", v)}
                isLoading={savingKeys.has("payment_tips")}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground flex items-start gap-1.5">
              <AlertCircle className="size-3.5 flex-shrink-0 mt-0.5" />
              Payment gateway integration is configured in the Billing section.
            </p>
          </div>
        );

      // ── 4. Menu Display ──
      case "menu":
        return (
          <div>
            <SectionHeader
              title="Menu Display"
              description="Control what information and features appear on your customer-facing menu."
            />
            <div className="divide-y divide-border rounded-xl border border-border bg-card px-4">
              <FeatureToggle
                label="Show Prices"
                description="Display item prices on the menu."
                checked={settings.menu_show_prices}
                onCheckedChange={(v) => handleToggle("menu_show_prices", v)}
                isLoading={savingKeys.has("menu_show_prices")}
              />
              <FeatureToggle
                label="Show Calories"
                description="Display calorie count alongside each item."
                checked={settings.menu_show_calories}
                onCheckedChange={(v) => handleToggle("menu_show_calories", v)}
                isLoading={savingKeys.has("menu_show_calories")}
              />
              <FeatureToggle
                label="Show Prep Time"
                description="Display estimated preparation time per item."
                checked={settings.menu_show_prep_time}
                onCheckedChange={(v) => handleToggle("menu_show_prep_time", v)}
                isLoading={savingKeys.has("menu_show_prep_time")}
              />
              <FeatureToggle
                label="Show Allergens"
                description="Display allergen information for each item."
                checked={settings.menu_show_allergens}
                onCheckedChange={(v) => handleToggle("menu_show_allergens", v)}
                isLoading={savingKeys.has("menu_show_allergens")}
              />
              <FeatureToggle
                label="AR Viewer"
                description="Allow customers to view items in augmented reality."
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
                label="3D Viewer"
                description="Allow customers to view items in interactive 3D."
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
                label="Popular Badges"
                description="Highlight popular items with a badge."
                checked={settings.menu_popular_badges}
                onCheckedChange={(v) => handleToggle("menu_popular_badges", v)}
                isLoading={savingKeys.has("menu_popular_badges")}
              />
              <FeatureToggle
                label="New Badges"
                description="Highlight newly added items with a badge."
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
            <SectionHeader
              title="Customer Experience"
              description="Enable interactive features for dine-in customers."
            />
            <div className="divide-y divide-border rounded-xl border border-border bg-card px-4">
              <FeatureToggle
                label="Call Waiter Button"
                description="Let customers call a waiter to their table."
                checked={settings.customer_call_waiter}
                onCheckedChange={(v) => handleToggle("customer_call_waiter", v)}
                isLoading={savingKeys.has("customer_call_waiter")}
              />
              <FeatureToggle
                label="Request Bill Button"
                description="Allow customers to request the bill from their phone."
                checked={settings.customer_request_bill}
                onCheckedChange={(v) =>
                  handleToggle("customer_request_bill", v)
                }
                isLoading={savingKeys.has("customer_request_bill")}
              />
              <FeatureToggle
                label="Reorder Button"
                description="Let returning customers reorder with one tap."
                checked={settings.customer_reorder}
                onCheckedChange={(v) => handleToggle("customer_reorder", v)}
                isLoading={savingKeys.has("customer_reorder")}
              />
              <FeatureToggle
                label="Review Prompt After Order"
                description="Show a review request after each order is completed."
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
            <SectionHeader
              title="Notifications"
              description="Configure how you and your customers receive order updates."
            />
            <div className="divide-y divide-border rounded-xl border border-border bg-card px-4">
              <FeatureToggle
                label="WhatsApp Customer Updates"
                description="Send automated WhatsApp messages to customers on status changes."
                checked={settings.notif_whatsapp_customer}
                onCheckedChange={(v) =>
                  handleToggle("notif_whatsapp_customer", v)
                }
                isLoading={savingKeys.has("notif_whatsapp_customer")}
              />
              <FeatureToggle
                label="WhatsApp Owner Alerts"
                description="Notify the owner via WhatsApp when new orders arrive."
                checked={settings.notif_whatsapp_owner}
                onCheckedChange={(v) =>
                  handleToggle("notif_whatsapp_owner", v)
                }
                isLoading={savingKeys.has("notif_whatsapp_owner")}
              />
              <FeatureToggle
                label="In-app Sound Alerts"
                description="Play a sound in the dashboard when a new order is received."
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
            <SectionHeader
              title="Branding"
              description="Customise the look and feel of your customer-facing menu."
            />
            <div className="space-y-6">
              {/* Logo upload */}
              <div className="space-y-2">
                <Label>Logo</Label>
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
                  <span>
                    {logoPreview
                      ? "Click to replace logo"
                      : "Click to upload logo — PNG/SVG, max 2MB"}
                  </span>
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

              {/* Primary colour */}
              <div className="space-y-2">
                <Label>Primary Colour</Label>
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

              {/* Font selector */}
              <div className="space-y-2">
                <Label>Font</Label>
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

              {/* Live preview strip */}
              <div className="space-y-2">
                <Label>Live Preview</Label>
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
            <SectionHeader
              title="Operating Hours"
              description="Set your restaurant's opening and closing times for each day of the week."
            />
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_auto_1fr_1fr] gap-4 px-4 py-2 border-b border-border text-xs font-medium text-muted-foreground">
                <span>Day</span>
                <span>Open</span>
                <span>Opens at</span>
                <span>Closes at</span>
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
              <Button
                onClick={() => toast.success("Operating hours saved")}
              >
                Save hours
              </Button>
            </div>
          </div>
        );

      // ── 9. Tax & Currency ──
      case "tax":
        return (
          <div>
            <SectionHeader
              title="Tax & Currency"
              description="Configure tax rates, service charges, and the currency displayed to customers."
            />
            <div className="space-y-5">
              {/* Tax rate */}
              <div className="space-y-1.5">
                <Label htmlFor="tax-rate">Tax Rate (%)</Label>
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

              {/* Tax type */}
              <div className="space-y-2">
                <Label>Tax Type</Label>
                <div className="flex flex-col gap-2">
                  {[
                    {
                      value: false,
                      label: "Exclusive",
                      description: "Tax is added on top of item prices",
                    },
                    {
                      value: true,
                      label: "Inclusive",
                      description: "Prices already include tax",
                    },
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

              {/* Service charge */}
              <div className="space-y-1.5">
                <Label htmlFor="service-charge">Service Charge (%)</Label>
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

              {/* Minimum order */}
              <div className="space-y-1.5">
                <Label htmlFor="min-order">Minimum Order ($)</Label>
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

              {/* Currency */}
              <div className="space-y-1.5">
                <Label>Currency</Label>
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
                  {taxSaving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save changes"
                  )}
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
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your restaurant configuration, branding, and preferences.
        </p>
      </div>

      {/* Unsaved changes banner */}
      <AnimatePresence>
        {hasUnsaved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30"
          >
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertCircle className="size-4 flex-shrink-0" />
              <span className="font-medium">You have unsaved changes</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleDiscard}>
                Discard
              </Button>
              <Button size="sm" onClick={handleSaveAll}>
                Save all
              </Button>
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
