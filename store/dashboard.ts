"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserRole } from "@/types";

interface DashboardState {
  currentRole: UserRole;
  currentBranchId: string;
  sidebarCollapsed: boolean;
  setRole: (role: UserRole) => void;
  setBranch: (id: string) => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      currentRole: "owner",
      currentBranchId: "b1",
      sidebarCollapsed: false,
      setRole: (role) => set({ currentRole: role }),
      setBranch: (id) => set({ currentBranchId: id }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: "qrmenu_dashboard",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
      ),
      partialize: (s) => ({
        currentRole: s.currentRole,
        currentBranchId: s.currentBranchId,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    }
  )
);
