"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Store,
  Users,
  CreditCard,
  MessageCircle,
  BarChart2,
  Flag,
  HeadphonesIcon,
  Server,
  Bell,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Nav config ───────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV: NavItem[] = [
  { label: "Dashboard",      href: "/admin",                icon: LayoutDashboard },
  { label: "Restaurants",    href: "/admin/restaurants",    icon: Store },
  { label: "Users",          href: "/admin/users",          icon: Users },
  { label: "Subscriptions",  href: "/admin/subscriptions",  icon: CreditCard },
  { label: "WhatsApp",       href: "/admin/whatsapp",       icon: MessageCircle },
  { label: "Analytics",      href: "/admin/analytics",      icon: BarChart2 },
  { label: "Feature Flags",  href: "/admin/flags",          icon: Flag },
  { label: "Support",        href: "/admin/support",        icon: HeadphonesIcon },
  { label: "System",         href: "/admin/system",         icon: Server },
];

const PAGE_TITLES: Record<string, string> = {
  "/admin":                "Platform Overview",
  "/admin/restaurants":    "Restaurants",
  "/admin/users":          "Users",
  "/admin/subscriptions":  "Subscriptions",
  "/admin/whatsapp":       "WhatsApp",
  "/admin/analytics":      "Analytics",
  "/admin/flags":          "Feature Flags",
  "/admin/support":        "Support",
  "/admin/system":         "System",
};

// ─── NavLink ──────────────────────────────────────────────────────────────────

function AdminNavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive =
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href);

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-white/10 text-white"
          : "text-zinc-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Find the longest matching path
  const pageTitle =
    Object.entries(PAGE_TITLES)
      .filter(([path]) => pathname === path || pathname.startsWith(path + "/"))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? "Admin";

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[220px] flex-shrink-0 bg-zinc-900 text-white">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-zinc-800">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-white">QR Menu Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV.map((item) => (
            <AdminNavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Bottom: signed in + sign out */}
        <div className="border-t border-zinc-800 px-4 py-3 space-y-2">
          <p className="text-xs text-zinc-500 truncate">admin@qrmenu.app</p>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Sticky header */}
        <header className="sticky top-0 z-10 flex h-12 items-center justify-between gap-4 border-b border-zinc-200 bg-zinc-900 px-4 dark:border-zinc-800">
          <h1 className="text-sm font-semibold text-white">{pageTitle}</h1>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Bell className="h-4 w-4" />
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
