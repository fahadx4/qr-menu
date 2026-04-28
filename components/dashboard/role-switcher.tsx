"use client";

import { useDashboardStore } from "@/store/dashboard";
import { roleLabels } from "@/lib/utils";
import type { UserRole } from "@/types";

const ROLES: UserRole[] = ["owner", "manager", "kitchen", "waiter", "cashier", "read_only"];

export function RoleSwitcher() {
  const { currentRole, setRole } = useDashboardStore();

  const cycle = () => {
    const idx = ROLES.indexOf(currentRole);
    setRole(ROLES[(idx + 1) % ROLES.length]);
  };

  return (
    <button
      onClick={cycle}
      title="Dev tool: cycle role"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm transition-all hover:bg-accent hover:shadow-xl"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      {roleLabels[currentRole]}
    </button>
  );
}
