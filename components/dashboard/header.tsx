"use client";

import { Bell, Menu, LogOut, User, Settings, ChevronDown, Globe } from "lucide-react";
import { useDashboardStore } from "@/store/dashboard";
import { useLanguageStore } from "@/store/language";
import { useT } from "@/lib/i18n";
import { mockTenant, mockBranches } from "@/mock/tenant";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { currentBranchId, setBranch } = useDashboardStore();
  const { lang, setLang } = useLanguageStore();
  const t = useT();
  const currentBranch = mockBranches.find((b) => b.id === currentBranchId) ?? mockBranches[0];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 backdrop-blur-sm px-4 lg:px-6">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden h-8 w-8 p-0"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Branch selector */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
          <span className="max-w-[140px] truncate">{currentBranch.name}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t.headerBranchesLabel}</DropdownMenuLabel>
            {mockBranches.map((branch) => (
              <DropdownMenuItem
                key={branch.id}
                onClick={() => setBranch(branch.id)}
                className={cn(currentBranchId === branch.id && "font-medium")}
              >
                <span className={cn(
                  "me-2 h-2 w-2 rounded-full flex-shrink-0",
                  branch.is_active ? "bg-green-500" : "bg-muted-foreground/40"
                )} />
                <span className="flex-1 truncate">{branch.name}</span>
                {branch.is_default && (
                  <span className="text-[10px] text-muted-foreground">{t.headerDefaultBadge}</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1" />

      {/* Language toggle */}
      <button
        onClick={() => setLang(lang === "en" ? "ar" : "en")}
        className="relative flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-semibold hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Toggle language"
      >
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">{lang === "en" ? "EN" : "ع"}</span>
      </button>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            3
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t.headerNotificationsLabel}</DropdownMenuLabel>
            {[
              { title: "New order #1042", time: "2m ago", dot: "bg-blue-500" },
              { title: "Table 4 — Call waiter", time: "5m ago", dot: "bg-yellow-500" },
              { title: "Item 'Burger' out of stock", time: "12m ago", dot: "bg-red-500" },
            ].map((n) => (
              <DropdownMenuItem key={n.title} className="flex items-start gap-3 py-2.5">
                <span className={cn("mt-1.5 h-2 w-2 flex-shrink-0 rounded-full", n.dot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.time}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center text-xs text-muted-foreground">
            {t.headerViewAllNotif}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-8 items-center gap-2 rounded-md px-2 text-sm font-medium hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold flex-shrink-0">
            {mockTenant.name.charAt(0)}
          </div>
          <span className="hidden sm:inline max-w-[100px] truncate">
            {mockTenant.name}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="text-sm font-semibold">{mockTenant.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{mockTenant.plan} plan</div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <User className="me-2 h-4 w-4" />
              {t.headerProfileLabel}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="me-2 h-4 w-4" />
              {t.navSettings}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive">
              <LogOut className="me-2 h-4 w-4" />
              {t.headerSignOut}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
