"use client";

import { createContext, useContext } from "react";
import type { Plan, TenantSettings } from "@/types";

const planFeatures: Record<Plan, Set<string>> = {
  free: new Set([
    "menu_basic", "qr_master", "web_ordering", "allergen_filters",
    "call_waiter", "order_dashboard", "order_pipeline", "whatsapp_connect",
    "whatsapp_notifications_100",
  ]),
  starter: new Set([
    "menu_basic", "qr_master", "qr_table", "web_ordering", "allergen_filters",
    "call_waiter", "request_bill", "order_dashboard", "order_pipeline", "kds",
    "whatsapp_connect", "whatsapp_notifications_500", "guest_memory",
    "table_management", "staff_3",
  ]),
  pro: new Set([
    "menu_basic", "qr_master", "qr_table", "qr_campaign", "web_ordering",
    "allergen_filters", "call_waiter", "request_bill", "order_dashboard",
    "order_pipeline", "kds", "whatsapp_connect", "whatsapp_notifications_2000",
    "guest_memory", "table_management", "staff_10", "ar_viewer", "3d_viewer",
    "ai_translator", "floor_plan", "multi_branch_3", "analytics_advanced",
    "custom_domain",
  ]),
  business: new Set([
    "menu_basic", "qr_master", "qr_table", "qr_campaign", "web_ordering",
    "allergen_filters", "call_waiter", "request_bill", "order_dashboard",
    "order_pipeline", "kds", "whatsapp_connect", "whatsapp_notifications_unlimited",
    "whatsapp_managed_billing", "guest_memory", "table_management",
    "staff_unlimited", "ar_viewer", "3d_viewer", "ai_translator",
    "floor_plan", "multi_branch_unlimited", "analytics_advanced",
    "analytics_export", "custom_domain", "api_access",
  ]),
};

interface FeatureFlagContextValue {
  plan: Plan;
  settings: TenantSettings | null;
  canUse: (feature: string) => boolean;
  isEnabled: (settingKey: keyof TenantSettings) => boolean;
}

export const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  plan: "free",
  settings: null,
  canUse: () => false,
  isEnabled: () => false,
});

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}

export function createFeatureChecker(plan: Plan, settings: TenantSettings | null) {
  return {
    canUse: (feature: string) => planFeatures[plan]?.has(feature) ?? false,
    isEnabled: (settingKey: keyof TenantSettings) => {
      if (!settings) return false;
      const planAllows = planFeatures[plan]?.has(
        settingKey.replace(/_/g, "_")
      );
      return Boolean(settings[settingKey]);
    },
  };
}
