"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MoreHorizontal, UserPlus, Users } from "lucide-react";

import { mockStaff } from "@/mock/staff";
import { mockBranches } from "@/mock/tenant";
import type { StaffMember, UserRole } from "@/types";
import { cn, timeAgo, roleLabels } from "@/lib/utils";
import { useDashboardStore } from "@/store/dashboard";
import { useT } from "@/lib/i18n";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const STAFF_LIMIT = 10;

const INVITABLE_ROLES: UserRole[] = ["manager", "kitchen", "waiter", "cashier", "read_only"];

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["manager", "kitchen", "waiter", "cashier", "read_only"]),
  branch_scope: z.array(z.string()),
});
type InviteFormValues = z.infer<typeof inviteSchema>;

function generateId() { return `s${Date.now()}`; }

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS: Record<string, string> = {
  owner: "bg-violet-500", manager: "bg-blue-500", kitchen: "bg-orange-500",
  waiter: "bg-green-500", cashier: "bg-amber-500", read_only: "bg-zinc-500",
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  owner: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  manager: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  kitchen: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  waiter: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cashier: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  read_only: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  removed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function getBranchNames(branchScope: string[] | undefined, allBranchesLabel: string): string {
  if (!branchScope || branchScope.length === 0) return allBranchesLabel;
  return branchScope.map((id) => mockBranches.find((b) => b.id === id)?.name ?? id).join(", ");
}

function InviteDialog({ open, onOpenChange, onInvite }: {
  open: boolean; onOpenChange: (v: boolean) => void; onInvite: (values: InviteFormValues) => void;
}) {
  const t = useT();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "waiter", branch_scope: [] },
  });
  const selectedBranches = watch("branch_scope");

  function toggleBranch(id: string) {
    const current = selectedBranches ?? [];
    setValue("branch_scope", current.includes(id) ? current.filter((b) => b !== id) : [...current, id]);
  }

  async function onSubmit(values: InviteFormValues) {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    onInvite(values);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.stf_inviteTitle}</DialogTitle>
          <DialogDescription>{t.stf_inviteDesc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">{t.stf_emailLabel} *</Label>
            <Input id="invite-email" type="email" placeholder="staff@example.com" {...register("email")} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>{t.stf_roleLabel} *</Label>
            <Controller control={control} name="role" render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => field.onChange(v as UserRole)}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t.stf_selectRole} /></SelectTrigger>
                <SelectContent>
                  {INVITABLE_ROLES.map((role) => <SelectItem key={role} value={role}>{roleLabels[role]}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="space-y-2">
            <Label>{t.stf_branchAccess}</Label>
            <p className="text-xs text-muted-foreground">{t.stf_branchAccessDesc}</p>
            <div className="space-y-2">
              {mockBranches.map((branch) => (
                <div key={branch.id} className="flex items-center gap-2">
                  <Checkbox id={`branch-${branch.id}`} checked={selectedBranches?.includes(branch.id) ?? false} onCheckedChange={() => toggleBranch(branch.id)} />
                  <Label htmlFor={`branch-${branch.id}`} className="font-normal cursor-pointer">{branch.name}</Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={saving} />}>{t.dashCancel}</DialogClose>
            <Button type="submit" disabled={saving}>{saving ? t.stf_sending : t.stf_sendInvite}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoveStaffDialog({ open, onOpenChange, member, onConfirm }: {
  open: boolean; onOpenChange: (v: boolean) => void; member: StaffMember | null; onConfirm: () => void;
}) {
  const t = useT();
  if (!member) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.stf_removeTitle}</DialogTitle>
          <DialogDescription>
            {t.stf_remove} <strong>{member.name}</strong>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>{t.dashCancel}</DialogClose>
          <Button type="button" variant="destructive" onClick={() => { onConfirm(); onOpenChange(false); }}>{t.stf_remove}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangeRoleDialog({ open, onOpenChange, member, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; member: StaffMember | null; onSave: (role: UserRole) => void;
}) {
  const t = useT();
  const [selectedRole, setSelectedRole] = useState<UserRole>(member?.role ?? "waiter");
  const [saving, setSaving] = useState(false);
  if (!member) return null;

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    onSave(selectedRole);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{t.stf_changeRoleTitle}</DialogTitle>
          <DialogDescription>{member.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>{t.stf_newRole}</Label>
          <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {INVITABLE_ROLES.map((role) => <SelectItem key={role} value={role}>{roleLabels[role]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>{t.dashCancel}</DialogClose>
          <Button type="button" disabled={saving} onClick={handleSave}>{saving ? t.stf_saving : t.dashSave}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StaffRow({ member, canManage, onRemove, onChangeRole, onResendInvite, onCancelInvite, t, allBranchesLabel, statusLabelsMap }: {
  member: StaffMember; canManage: boolean;
  onRemove: (m: StaffMember) => void; onChangeRole: (m: StaffMember) => void;
  onResendInvite: (m: StaffMember) => void; onCancelInvite: (m: StaffMember) => void;
  t: ReturnType<typeof useT>; allBranchesLabel: string;
  statusLabelsMap: Record<string, string>;
}) {
  const isSelf = member.user_id === "u1";
  const lastSeen = member.status === "pending" ? `${t.stf_invited} ${timeAgo(member.invited_at)}` : member.last_login ? timeAgo(member.last_login) : t.stf_never;

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className={cn("text-white text-xs font-semibold", AVATAR_COLORS[member.role] ?? "bg-zinc-500")}>
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-none truncate">{member.name}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{member.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", ROLE_BADGE_COLORS[member.role] ?? ROLE_BADGE_COLORS.read_only)}>
          {roleLabels[member.role] ?? member.role}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
        {getBranchNames(member.branch_scope, allBranchesLabel)}
      </td>
      <td className="py-3 px-4">
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_BADGE_COLORS[member.status] ?? STATUS_BADGE_COLORS.active)}>
          {statusLabelsMap[member.status] ?? member.status}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground hidden lg:table-cell whitespace-nowrap">{lastSeen}</td>
      <td className="py-3 px-4 text-right">
        {isSelf || !canManage ? <span className="text-sm text-muted-foreground">—</span> : (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <MoreHorizontal className="size-4" /><span className="sr-only">Member actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {member.status === "active" && (
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t.stf_manage}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onChangeRole(member)}>{t.stf_changeRole}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => onRemove(member)}>{t.stf_remove}</DropdownMenuItem>
                </DropdownMenuGroup>
              )}
              {member.status === "pending" && (
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t.stf_invite}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onResendInvite(member)}>{t.stf_resendInvite}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => onCancelInvite(member)}>{t.stf_cancelInvite}</DropdownMenuItem>
                </DropdownMenuGroup>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  );
}

function StaffCard({ member, canManage, onRemove, onChangeRole, onResendInvite, onCancelInvite, t, allBranchesLabel, statusLabelsMap }: {
  member: StaffMember; canManage: boolean;
  onRemove: (m: StaffMember) => void; onChangeRole: (m: StaffMember) => void;
  onResendInvite: (m: StaffMember) => void; onCancelInvite: (m: StaffMember) => void;
  t: ReturnType<typeof useT>; allBranchesLabel: string;
  statusLabelsMap: Record<string, string>;
}) {
  const isSelf = member.user_id === "u1";
  const lastSeen = member.status === "pending" ? `${t.stf_invited} ${timeAgo(member.invited_at)}` : member.last_login ? timeAgo(member.last_login) : t.stf_never;

  return (
    <div className="flex items-start justify-between gap-3 p-4 border-b border-border last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        <Avatar>
          <AvatarFallback className={cn("text-white text-xs font-semibold", AVATAR_COLORS[member.role] ?? "bg-zinc-500")}>
            {getInitials(member.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium leading-none truncate">{member.name}</p>
          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", ROLE_BADGE_COLORS[member.role] ?? ROLE_BADGE_COLORS.read_only)}>
              {roleLabels[member.role] ?? member.role}
            </span>
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_BADGE_COLORS[member.status] ?? STATUS_BADGE_COLORS.active)}>
              {statusLabelsMap[member.status] ?? member.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{getBranchNames(member.branch_scope, allBranchesLabel)}</p>
          <p className="text-xs text-muted-foreground">{lastSeen}</p>
        </div>
      </div>
      {!isSelf && canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontal className="size-4" /><span className="sr-only">Member actions</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            {member.status === "active" && (
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t.stf_manage}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onChangeRole(member)}>{t.stf_changeRole}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onRemove(member)}>{t.stf_remove}</DropdownMenuItem>
              </DropdownMenuGroup>
            )}
            {member.status === "pending" && (
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t.stf_invite}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onResendInvite(member)}>{t.stf_resendInvite}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onCancelInvite(member)}>{t.stf_cancelInvite}</DropdownMenuItem>
              </DropdownMenuGroup>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export default function StaffPage() {
  const t = useT();
  const [staff, setStaff] = useState<StaffMember[]>(mockStaff);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState<StaffMember | null>(null);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [changingRoleMember, setChangingRoleMember] = useState<StaffMember | null>(null);

  const currentRole = useDashboardStore((s) => s.currentRole);
  const canManage = currentRole === "owner" || currentRole === "manager";
  const activeCount = staff.filter((s) => s.status === "active").length;
  const planLabel = "Pro plan";
  const usagePct = Math.min(100, Math.round((staff.length / STAFF_LIMIT) * 100));

  const statusLabelsMap: Record<string, string> = {
    active: t.stf_statusActive,
    pending: t.stf_statusPending,
    removed: t.stf_statusRemoved,
  };

  function handleInvite(values: InviteFormValues) {
    const newMember: StaffMember = {
      id: generateId(), tenant_id: "t1", user_id: `u${Date.now()}`,
      name: values.email.split("@")[0], email: values.email, role: values.role as UserRole,
      branch_scope: values.branch_scope.length > 0 ? values.branch_scope : undefined,
      status: "pending", invited_at: new Date().toISOString(),
    };
    setStaff((prev) => [...prev, newMember]);
    toast.success(`${t.stf_sendInvite}: ${values.email}`);
  }

  function handleRemoveConfirm() {
    if (!removingMember) return;
    setStaff((prev) => prev.map((s) => s.id === removingMember.id ? { ...s, status: "removed" as const } : s));
    toast.success(`${removingMember.name} — ${t.stf_statusRemoved}`);
    setRemovingMember(null);
  }

  function handleChangeRoleSave(newRole: UserRole) {
    if (!changingRoleMember) return;
    setStaff((prev) => prev.map((s) => s.id === changingRoleMember.id ? { ...s, role: newRole } : s));
    toast.success(`${t.stf_changeRoleTitle}: ${roleLabels[newRole]}`);
    setChangingRoleMember(null);
  }

  const actionProps = {
    canManage, t, allBranchesLabel: t.stf_allBranches, statusLabelsMap,
    onRemove: (m: StaffMember) => { setRemovingMember(m); setRemoveOpen(true); },
    onChangeRole: (m: StaffMember) => { setChangingRoleMember(m); setChangeRoleOpen(true); },
    onResendInvite: (m: StaffMember) => toast.success(`${t.stf_resendInvite}: ${m.email}`),
    onCancelInvite: (m: StaffMember) => { setStaff((prev) => prev.filter((s) => s.id !== m.id)); toast.success(`${t.stf_cancelInvite}: ${m.email}`); },
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{t.stf_pageTitle}</h1>
          <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
            {activeCount} {t.stf_active} · {planLabel}
          </span>
        </div>
        {canManage && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" />{t.stf_inviteBtn}
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {staff.filter((s) => s.status !== "removed").length} / {STAFF_LIMIT} {t.stf_slotsUsed}
          </span>
          <Badge variant="outline" className="text-[11px]">{planLabel}</Badge>
        </div>
        <Progress value={usagePct} />
      </div>

      <div className="hidden sm:block rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground">{t.stf_colMember}</th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground">{t.stf_colRole}</th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">{t.stf_colScope}</th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground">{t.stf_colStatus}</th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">{t.stf_colLastSeen}</th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground text-right">{t.dashActions}</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => <StaffRow key={member.id} member={member} {...actionProps} />)}
          </tbody>
        </table>
        {staff.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <Users className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t.stf_noMembers}</p>
          </div>
        )}
      </div>

      <div className="sm:hidden rounded-xl border border-border bg-card overflow-hidden">
        {staff.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <Users className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t.stf_noMembers}</p>
          </div>
        ) : staff.map((member) => <StaffCard key={member.id} member={member} {...actionProps} />)}
      </div>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} onInvite={handleInvite} />
      <RemoveStaffDialog open={removeOpen} onOpenChange={setRemoveOpen} member={removingMember} onConfirm={handleRemoveConfirm} />
      <ChangeRoleDialog open={changeRoleOpen} onOpenChange={(v) => { setChangeRoleOpen(v); if (!v) setChangingRoleMember(null); }} member={changingRoleMember} onSave={handleChangeRoleSave} />
    </div>
  );
}
