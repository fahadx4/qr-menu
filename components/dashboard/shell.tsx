"use client";

import { useState, useEffect } from "react";
import { useDashboardStore } from "@/store/dashboard";
import { useLanguageStore } from "@/store/language";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { TrialBanner } from "./trial-banner";
import { RoleSwitcher } from "./role-switcher";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useDashboardStore();
  const lang = useLanguageStore((s) => s.lang);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const collapsed = mounted ? sidebarCollapsed : false;
  const isAr = mounted && lang === "ar";

  return (
    <div
      className={cn("flex min-h-screen bg-background", isAr && "font-arabic")}
      dir={isAr ? "rtl" : "ltr"}
      lang={isAr ? "ar" : "en"}
    >
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar flex-shrink-0 transition-all duration-300",
          collapsed ? "w-16" : "w-[260px]"
        )}
      >
        <Sidebar collapsed={collapsed} />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 bg-sidebar border-sidebar-border" showCloseButton={false}>
          <Sidebar isMobile onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        <TrialBanner />
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>

      <RoleSwitcher />
    </div>
  );
}
