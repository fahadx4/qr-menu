"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "owner" | "manager" | "staff" | "platform_admin";
type UserStatus = "active" | "suspended";

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenant: string;
  lastLogin: string;
  status: UserStatus;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockUsers: PlatformUser[] = [
  { id: "u1",  name: "Ahmed Al-Rashid",   email: "ahmed@spicechain.ng",      role: "owner",          tenant: "Spice Chain",        lastLogin: "2026-04-24T08:12:00Z", status: "active"    },
  { id: "u2",  name: "Yuki Tanaka",        email: "yuki@ramenhouse.jp",       role: "manager",        tenant: "Ramen House",        lastLogin: "2026-04-23T14:30:00Z", status: "active"    },
  { id: "u3",  name: "Maria García",       email: "maria@tapas.es",           role: "owner",          tenant: "Maria's Tapas",      lastLogin: "2026-04-22T09:45:00Z", status: "active"    },
  { id: "u4",  name: "Oliver Schmidt",     email: "oliver@burgerbrothers.de", role: "owner",          tenant: "Burger Brothers",    lastLogin: "2026-04-24T06:00:00Z", status: "active"    },
  { id: "u5",  name: "Priya Patel",        email: "priya@cloudkitchen.pk",    role: "staff",          tenant: "Cloud Kitchen Co",   lastLogin: "2026-04-21T11:20:00Z", status: "active"    },
  { id: "u6",  name: "Jean Dupont",        email: "jean@bistro.fr",           role: "manager",        tenant: "Le Petit Bistro",    lastLogin: "2026-04-23T16:55:00Z", status: "active"    },
  { id: "u7",  name: "Tariq Mahmood",      email: "tariq@grillhouse.pk",      role: "owner",          tenant: "Karachi Grill House",lastLogin: "2026-04-20T10:05:00Z", status: "suspended" },
  { id: "u8",  name: "Sakura Ito",         email: "sakura@sakurasushi.jp",    role: "staff",          tenant: "Sakura Sushi",       lastLogin: "2026-04-19T07:30:00Z", status: "active"    },
  { id: "u9",  name: "Carlos Vega",        email: "carlos@naanrepublic.ca",   role: "manager",        tenant: "Naan Republic",      lastLogin: "2026-04-18T13:00:00Z", status: "active"    },
  { id: "u10", name: "Fatima Al-Zahra",    email: "fatima@kitchen.ae",        role: "owner",          tenant: "Ahmed's Kitchen",    lastLogin: "2026-04-24T07:10:00Z", status: "active"    },
  { id: "u11", name: "Platform Admin",     email: "admin@qrmenu.app",         role: "platform_admin", tenant: "—",                  lastLogin: "2026-04-24T08:59:00Z", status: "active"    },
  { id: "u12", name: "Support Agent",      email: "support@qrmenu.app",       role: "platform_admin", tenant: "—",                  lastLogin: "2026-04-24T08:45:00Z", status: "active"    },
];

// ─── Badge configs ────────────────────────────────────────────────────────────

const roleBadgeConfig: Record<UserRole, { label: string; className: string }> = {
  owner:          { label: "Owner",          className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  manager:        { label: "Manager",        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  staff:          { label: "Staff",          className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  platform_admin: { label: "Platform Admin", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

const statusBadgeConfig: Record<UserStatus, { label: string; className: string }> = {
  active:    { label: "Active",    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  suspended: { label: "Suspended", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = roleBadgeConfig[role];
  return (
    <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-xs font-medium", cfg.className)}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const cfg = statusBadgeConfig[status];
  return (
    <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-xs font-medium", cfg.className)}>
      {cfg.label}
    </span>
  );
}

// ─── Row actions ──────────────────────────────────────────────────────────────

function UserActions({
  user,
  onToggleSuspend,
}: {
  user: PlatformUser;
  onToggleSuspend: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors"
          />
        }
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => toast.info(`Viewing profile: ${user.name}`)}>
            View profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast.info(`Edit email dialog — requires backend`)}>
            Edit email
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast.info(`Password reset email sent to ${user.email}`)}>
            Reset password
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast.info(`All sessions revoked for ${user.name}`)}>
            Revoke sessions
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onToggleSuspend(user.id)}>
            {user.status === "suspended" ? "Unsuspend" : "Suspend"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => toast.info("Impersonation requires backend integration")}
          >
            Impersonate
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [users, setUsers] = useState<PlatformUser[]>(mockUsers);

  const handleToggleSuspend = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const next: UserStatus = u.status === "suspended" ? "active" : "suspended";
        toast.success(`${u.name} is now ${next}`);
        return { ...u, status: next };
      })
    );
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Platform Users</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All users across every tenant on the platform.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Users",       value: "142,847" },
          { label: "Active Today",      value: "8,421"   },
          { label: "New This Month",    value: "2,103"   },
          { label: "Suspended",         value: String(users.filter((u) => u.status === "suspended").length) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-card ring-1 ring-foreground/10 px-4 py-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-52">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as string)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="platform_admin">Platform Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as string)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl ring-1 ring-foreground/10 overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Tenant</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Last Login</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{u.tenant}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.lastLogin).toLocaleString("en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3">
                      <UserActions user={u} onToggleSuspend={handleToggleSuspend} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          Showing {filtered.length} of {users.length} local results (platform total: 142,847)
        </div>
      </div>
    </div>
  );
}
