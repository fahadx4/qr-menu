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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// ─── Constants ────────────────────────────────────────────────────────────────

const STAFF_LIMIT = 10;

const INVITABLE_ROLES: UserRole[] = [
  "manager",
  "kitchen",
  "waiter",
  "cashier",
  "read_only",
];

// ─── Zod schema ───────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["manager", "kitchen", "waiter", "cashier", "read_only"]),
  branch_scope: z.array(z.string()),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return `s${Date.now()}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS: Record<string, string> = {
  owner: "bg-violet-500",
  manager: "bg-blue-500",
  kitchen: "bg-orange-500",
  waiter: "bg-green-500",
  cashier: "bg-amber-500",
  read_only: "bg-zinc-500",
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  owner:
    "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  manager: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  kitchen:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  waiter: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cashier:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  read_only: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  removed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  pending: "Pending invite",
  removed: "Removed",
};

function getBranchNames(branchScope: string[] | undefined): string {
  if (!branchScope || branchScope.length === 0) return "All branches";
  return branchScope
    .map((id) => mockBranches.find((b) => b.id === id)?.name ?? id)
    .join(", ");
}

function getLastSeenLabel(member: StaffMember): string {
  if (member.status === "pending") {
    return `Invited ${timeAgo(member.invited_at)}`;
  }
  if (member.last_login) {
    return timeAgo(member.last_login);
  }
  return "Never";
}

// ─── Invite Dialog ────────────────────────────────────────────────────────────

function InviteDialog({
  open,
  onOpenChange,
  onInvite,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onInvite: (values: InviteFormValues) => void;
}) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "waiter",
      branch_scope: [],
    },
  });

  const selectedBranches = watch("branch_scope");

  function toggleBranch(id: string) {
    const current = selectedBranches ?? [];
    if (current.includes(id)) {
      setValue(
        "branch_scope",
        current.filter((b) => b !== id)
      );
    } else {
      setValue("branch_scope", [...current, id]);
    }
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
          <DialogTitle>Invite staff member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email address *</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="staff@example.com"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label>Role *</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) =>
                    field.onChange(v as UserRole)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVITABLE_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>

          {/* Branch scope */}
          <div className="space-y-2">
            <Label>Branch access</Label>
            <p className="text-xs text-muted-foreground">
              Leave unchecked to grant access to all branches.
            </p>
            <div className="space-y-2">
              {mockBranches.map((branch) => (
                <div key={branch.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`branch-${branch.id}`}
                    checked={selectedBranches?.includes(branch.id) ?? false}
                    onCheckedChange={() => toggleBranch(branch.id)}
                  />
                  <Label
                    htmlFor={`branch-${branch.id}`}
                    className="font-normal cursor-pointer"
                  >
                    {branch.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={saving} />
              }
            >
              Cancel
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Remove Confirmation Dialog ───────────────────────────────────────────────

function RemoveStaffDialog({
  open,
  onOpenChange,
  member,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  member: StaffMember | null;
  onConfirm: () => void;
}) {
  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove team member?</DialogTitle>
          <DialogDescription>
            Remove <strong>{member.name}</strong> from your team? They will lose
            access immediately.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Change Role Dialog ───────────────────────────────────────────────────────

function ChangeRoleDialog({
  open,
  onOpenChange,
  member,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  member: StaffMember | null;
  onSave: (role: UserRole) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    member?.role ?? "waiter"
  );
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
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            Update the role for <strong>{member.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>New role</Label>
          <Select
            value={selectedRole}
            onValueChange={(v) => setSelectedRole(v as UserRole)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVITABLE_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {roleLabels[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button type="button" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Staff Row ────────────────────────────────────────────────────────────────

function StaffRow({
  member,
  canManage,
  onRemove,
  onChangeRole,
  onResendInvite,
  onCancelInvite,
}: {
  member: StaffMember;
  canManage: boolean;
  onRemove: (member: StaffMember) => void;
  onChangeRole: (member: StaffMember) => void;
  onResendInvite: (member: StaffMember) => void;
  onCancelInvite: (member: StaffMember) => void;
}) {
  const isSelf = member.user_id === "u1";

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      {/* Member */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback
              className={cn(
                "text-white text-xs font-semibold",
                AVATAR_COLORS[member.role] ?? "bg-zinc-500"
              )}
            >
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-none truncate">
              {member.name}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {member.email}
            </p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="py-3 px-4">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            ROLE_BADGE_COLORS[member.role] ?? ROLE_BADGE_COLORS.read_only
          )}
        >
          {roleLabels[member.role] ?? member.role}
        </span>
      </td>

      {/* Scope */}
      <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
        {getBranchNames(member.branch_scope)}
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            STATUS_BADGE_COLORS[member.status] ?? STATUS_BADGE_COLORS.active
          )}
        >
          {STATUS_LABELS[member.status] ?? member.status}
        </span>
      </td>

      {/* Last seen */}
      <td className="py-3 px-4 text-sm text-muted-foreground hidden lg:table-cell whitespace-nowrap">
        {getLastSeenLabel(member)}
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-right">
        {isSelf || !canManage ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" />
              }
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Member actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {member.status === "active" && (
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Manage</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onChangeRole(member)}>
                    Change role
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onRemove(member)}
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              )}
              {member.status === "pending" && (
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Invite</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onResendInvite(member)}>
                    Resend invite
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onCancelInvite(member)}
                  >
                    Cancel invite
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  );
}

// ─── Staff Card (mobile) ──────────────────────────────────────────────────────

function StaffCard({
  member,
  canManage,
  onRemove,
  onChangeRole,
  onResendInvite,
  onCancelInvite,
}: {
  member: StaffMember;
  canManage: boolean;
  onRemove: (member: StaffMember) => void;
  onChangeRole: (member: StaffMember) => void;
  onResendInvite: (member: StaffMember) => void;
  onCancelInvite: (member: StaffMember) => void;
}) {
  const isSelf = member.user_id === "u1";

  return (
    <div className="flex items-start justify-between gap-3 p-4 border-b border-border last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        <Avatar>
          <AvatarFallback
            className={cn(
              "text-white text-xs font-semibold",
              AVATAR_COLORS[member.role] ?? "bg-zinc-500"
            )}
          >
            {getInitials(member.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium leading-none truncate">
            {member.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                ROLE_BADGE_COLORS[member.role] ?? ROLE_BADGE_COLORS.read_only
              )}
            >
              {roleLabels[member.role] ?? member.role}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                STATUS_BADGE_COLORS[member.status] ?? STATUS_BADGE_COLORS.active
              )}
            >
              {STATUS_LABELS[member.status] ?? member.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {getBranchNames(member.branch_scope)}
          </p>
          <p className="text-xs text-muted-foreground">
            {getLastSeenLabel(member)}
          </p>
        </div>
      </div>

      {!isSelf && canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Member actions</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            {member.status === "active" && (
              <DropdownMenuGroup>
                <DropdownMenuLabel>Manage</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onChangeRole(member)}>
                  Change role
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onRemove(member)}
                >
                  Remove
                </DropdownMenuItem>
              </DropdownMenuGroup>
            )}
            {member.status === "pending" && (
              <DropdownMenuGroup>
                <DropdownMenuLabel>Invite</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onResendInvite(member)}>
                  Resend invite
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onCancelInvite(member)}
                >
                  Cancel invite
                </DropdownMenuItem>
              </DropdownMenuGroup>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(mockStaff);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState<StaffMember | null>(null);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [changingRoleMember, setChangingRoleMember] =
    useState<StaffMember | null>(null);

  const currentRole = useDashboardStore((s) => s.currentRole);
  const canManage = currentRole === "owner" || currentRole === "manager";

  const activeCount = staff.filter((s) => s.status === "active").length;
  const planLabel = "Pro plan";
  const usagePct = Math.min(100, Math.round((staff.length / STAFF_LIMIT) * 100));

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleInvite(values: InviteFormValues) {
    const newMember: StaffMember = {
      id: generateId(),
      tenant_id: "t1",
      user_id: `u${Date.now()}`,
      name: values.email.split("@")[0],
      email: values.email,
      role: values.role as UserRole,
      branch_scope: values.branch_scope.length > 0 ? values.branch_scope : undefined,
      status: "pending",
      invited_at: new Date().toISOString(),
    };
    setStaff((prev) => [...prev, newMember]);
    toast.success(`Invite sent to ${values.email}`);
  }

  function handleRemoveClick(member: StaffMember) {
    setRemovingMember(member);
    setRemoveOpen(true);
  }

  function handleRemoveConfirm() {
    if (!removingMember) return;
    setStaff((prev) =>
      prev.map((s) =>
        s.id === removingMember.id ? { ...s, status: "removed" as const } : s
      )
    );
    toast.success(`${removingMember.name} has been removed`);
    setRemovingMember(null);
  }

  function handleChangeRoleClick(member: StaffMember) {
    setChangingRoleMember(member);
    setChangeRoleOpen(true);
  }

  function handleChangeRoleSave(newRole: UserRole) {
    if (!changingRoleMember) return;
    setStaff((prev) =>
      prev.map((s) =>
        s.id === changingRoleMember.id ? { ...s, role: newRole } : s
      )
    );
    toast.success(`Role updated to ${roleLabels[newRole]}`);
    setChangingRoleMember(null);
  }

  function handleResendInvite(member: StaffMember) {
    toast.success(`Invite resent to ${member.email}`);
  }

  function handleCancelInvite(member: StaffMember) {
    setStaff((prev) => prev.filter((s) => s.id !== member.id));
    toast.success(`Invite to ${member.email} cancelled`);
  }

  // Shared action props
  const actionProps = {
    canManage,
    onRemove: handleRemoveClick,
    onChangeRole: handleChangeRoleClick,
    onResendInvite: handleResendInvite,
    onCancelInvite: handleCancelInvite,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
            {activeCount} active · {planLabel}
          </span>
        </div>
        {canManage && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" />
            Invite staff member
          </Button>
        )}
      </div>

      {/* Plan usage */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {staff.filter((s) => s.status !== "removed").length} / {STAFF_LIMIT} staff slots used
          </span>
          <Badge variant="outline" className="text-[11px]">
            {planLabel}
          </Badge>
        </div>
        <Progress value={usagePct} />
      </div>

      {/* Staff table — desktop */}
      <div className="hidden sm:block rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground">
                Member
              </th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground">
                Role
              </th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">
                Scope
              </th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground">
                Status
              </th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                Last seen
              </th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <StaffRow key={member.id} member={member} {...actionProps} />
            ))}
          </tbody>
        </table>

        {staff.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <Users className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No team members yet.</p>
          </div>
        )}
      </div>

      {/* Staff cards — mobile */}
      <div className="sm:hidden rounded-xl border border-border bg-card overflow-hidden">
        {staff.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <Users className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No team members yet.</p>
          </div>
        ) : (
          staff.map((member) => (
            <StaffCard key={member.id} member={member} {...actionProps} />
          ))
        )}
      </div>

      {/* Invite dialog */}
      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={handleInvite}
      />

      {/* Remove confirmation */}
      <RemoveStaffDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        member={removingMember}
        onConfirm={handleRemoveConfirm}
      />

      {/* Change role dialog */}
      <ChangeRoleDialog
        open={changeRoleOpen}
        onOpenChange={(v) => {
          setChangeRoleOpen(v);
          if (!v) setChangingRoleMember(null);
        }}
        member={changingRoleMember}
        onSave={handleChangeRoleSave}
      />
    </div>
  );
}
