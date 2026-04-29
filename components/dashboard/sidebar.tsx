"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, ChefHat, UtensilsCrossed, QrCode,
  LayoutGrid, Users, UserCheck, BarChart2, MessageCircle, Settings,
  CreditCard, Building2, CalendarClock, ChevronLeft, ChevronRight, X,
  Package, Truck, Gift, Megaphone, Plug, Globe2, Languages, Printer, Globe, Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/store/dashboard";
import { useT } from "@/lib/i18n";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { UserRole } from "@/types";

// ─── Nav config ───────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

function getNav(t: ReturnType<typeof useT>): NavGroup[] {
  return [
    {
      label: null,
      items: [
        { label: t.navOverview, href: "/dashboard",          icon: LayoutDashboard, roles: ["owner", "manager"] },
        { label: t.navOrders,   href: "/dashboard/orders",   icon: ShoppingBag,     roles: ["owner", "manager", "cashier", "waiter", "read_only"] },
        { label: t.navKitchen,  href: "/dashboard/kds",      icon: ChefHat,         roles: ["owner", "manager", "kitchen"] },
      ],
    },
    {
      label: t.navGroupMenuCommerce,
      items: [
        { label: t.navMenu,         href: "/dashboard/menu",            icon: UtensilsCrossed, roles: ["owner", "manager"] },
        { label: t.navTranslator,   href: "/dashboard/menu/translator", icon: Languages,       roles: ["owner", "manager"] },
        { label: t.navQrCodes,      href: "/dashboard/qr",              icon: QrCode,          roles: ["owner", "manager"] },
        { label: t.navTables,       href: "/dashboard/tables",          icon: LayoutGrid,      roles: ["owner", "manager", "waiter"] },
        { label: t.navReservations, href: "/dashboard/reservations",    icon: CalendarClock,   roles: ["owner", "manager", "waiter"] },
        { label: t.navInventory,    href: "/dashboard/inventory",       icon: Package,         roles: ["owner", "manager"] },
        { label: t.navDelivery,     href: "/dashboard/delivery",        icon: Truck,           roles: ["owner", "manager"] },
      ],
    },
    {
      label: t.navGroupPeople,
      items: [
        { label: t.navStaff,     href: "/dashboard/staff",     icon: Users,     roles: ["owner", "manager"] },
        { label: t.navCustomers, href: "/dashboard/customers", icon: UserCheck, roles: ["owner", "manager"] },
      ],
    },
    {
      label: t.navGroupMarketing,
      items: [
        { label: t.navLoyalty,    href: "/dashboard/loyalty",    icon: Gift,      roles: ["owner", "manager"] },
        { label: t.navPromotions, href: "/dashboard/promotions", icon: Megaphone, roles: ["owner", "manager"] },
      ],
    },
    {
      label: t.navGroupInsights,
      items: [
        { label: t.navAnalytics,        href: "/dashboard/analytics",       icon: BarChart2,     roles: ["owner", "manager"] },
        { label: t.navWhatsappSettings, href: "/dashboard/whatsapp",        icon: MessageCircle, roles: ["owner", "manager"] },
        { label: t.navWhatsappInbox,    href: "/dashboard/whatsapp/inbox",  icon: Inbox,         roles: ["owner", "manager", "waiter"] },
      ],
    },
    {
      label: t.navGroupPlatform,
      items: [
        { label: t.navIntegrations, href: "/dashboard/integrations", icon: Plug,  roles: ["owner", "manager"] },
        { label: t.navFranchise,    href: "/dashboard/franchise",    icon: Globe2, roles: ["owner"] },
      ],
    },
    {
      label: t.navGroupConfig,
      items: [
        { label: t.navWebsite,  href: "/dashboard/website",           icon: Globe,      roles: ["owner", "manager"] },
        { label: t.navBranches, href: "/dashboard/branches",          icon: Building2,  roles: ["owner", "manager"] },
        { label: t.navSettings, href: "/dashboard/settings",          icon: Settings,   roles: ["owner", "manager"] },
        { label: t.navPrinters, href: "/dashboard/settings/printers", icon: Printer,    roles: ["owner", "manager"] },
        { label: t.navBilling,  href: "/dashboard/billing",           icon: CreditCard, roles: ["owner"] },
      ],
    },
  ];
}

// ─── NavItem ──────────────────────────────────────────────────────────────────

function NavLink({
  item,
  collapsed,
  onClick,
}: {
  item: NavItem;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href);

  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-primary/10 text-sidebar-primary"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-sidebar-primary")} />
      {!collapsed && <span>{item.label}</span>}
      {!collapsed && isActive && (
        <span className="ms-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="block" />}>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>{item.label}</TooltipContent>
    </Tooltip>
  );
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed?: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ collapsed = false, isMobile = false, onClose }: SidebarProps) {
  const { currentRole, sidebarCollapsed, toggleSidebar } = useDashboardStore();
  const t = useT();
  const NAV = getNav(t);

  const isCollapsed = isMobile ? false : collapsed || sidebarCollapsed;

  return (
    <div className={cn("flex flex-col h-full", isMobile ? "w-[260px]" : "w-full")}>
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border px-4 py-4 flex-shrink-0",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary">
              <QrCode className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground text-sm">QR Menu</span>
          </Link>
        )}
        {isCollapsed && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary">
            <QrCode className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
        )}
        {isMobile ? (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex rounded-md p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            {isCollapsed
              ? <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              : <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            }
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        {NAV.map((group, gi) => {
          const visible = group.items.filter((item) => item.roles.includes(currentRole));
          if (visible.length === 0) return null;

          return (
            <div key={gi}>
              {group.label && !isCollapsed && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                  {group.label}
                </p>
              )}
              {group.label && isCollapsed && <div className="my-2 mx-2 h-px bg-sidebar-border" />}
              <div className="space-y-0.5">
                {visible.map((item) => (
                  <NavLink key={item.href} item={item} collapsed={isCollapsed} onClick={onClose} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
