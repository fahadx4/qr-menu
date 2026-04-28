"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  MapPin,
  MoreHorizontal,
  Plus,
  Phone,
  Building2,
} from "lucide-react";

import { mockBranches, mockTenant } from "@/mock/tenant";
import type { Branch } from "@/types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

const PRO_BRANCH_LIMIT = 3;

// ─── Zod schema ───────────────────────────────────────────────────────────────

const branchSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  phone: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return `b${Date.now()}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BranchFormDialog({
  open,
  onOpenChange,
  branch,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  branch: Branch | null;
  onSave: (values: BranchFormValues, editingId: string | null) => void;
}) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    values: branch
      ? {
          name: branch.name,
          address: branch.address,
          phone: branch.phone ?? "",
          lat: branch.lat !== undefined ? String(branch.lat) : "",
          lng: branch.lng !== undefined ? String(branch.lng) : "",
        }
      : {
          name: "",
          address: "",
          phone: "",
          lat: "",
          lng: "",
        },
  });

  async function onSubmit(values: BranchFormValues) {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    onSave(values, branch?.id ?? null);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{branch ? "Edit branch" : "Add branch"}</DialogTitle>
          <DialogDescription>
            {branch
              ? "Update this branch's details."
              : "Fill in the details for your new branch."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="branch-name">Branch name *</Label>
            <Input
              id="branch-name"
              placeholder="e.g. Downtown"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="branch-address">Address *</Label>
            <Input
              id="branch-address"
              placeholder="123 Main Street, City, State"
              {...register("address")}
              aria-invalid={!!errors.address}
            />
            {errors.address && (
              <p className="text-xs text-destructive">
                {errors.address.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="branch-phone">Phone</Label>
            <Input
              id="branch-phone"
              placeholder="+1 212 555 0100"
              {...register("phone")}
            />
          </div>

          {/* Lat / Lng */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="branch-lat">Latitude</Label>
              <Input
                id="branch-lat"
                placeholder="40.7128"
                {...register("lat")}
                aria-invalid={!!errors.lat}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="branch-lng">Longitude</Label>
              <Input
                id="branch-lng"
                placeholder="-74.0060"
                {...register("lng")}
                aria-invalid={!!errors.lng}
              />
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
              {saving ? "Saving…" : branch ? "Save changes" : "Add branch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  branch,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  branch: Branch | null;
  onConfirm: () => void;
}) {
  if (!branch) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove branch?</DialogTitle>
          <DialogDescription>
            Remove <strong>{branch.name}</strong>? This cannot be undone.
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

function BranchCard({
  branch,
  onToggleActive,
  onEdit,
  onSetDefault,
  onDelete,
}: {
  branch: Branch;
  onToggleActive: (id: string) => void;
  onEdit: (branch: Branch) => void;
  onSetDefault: (id: string) => void;
  onDelete: (branch: Branch) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Map placeholder */}
      <div className="relative h-32 bg-muted flex items-center justify-center">
        <MapPin className="size-8 text-muted-foreground/40" />
        {branch.lat && branch.lng && (
          <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-background/80 rounded px-1.5 py-0.5">
            {branch.lat.toFixed(4)}, {branch.lng.toFixed(4)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold truncate">{branch.name}</h3>
              {branch.is_default && (
                <Badge variant="secondary" className="text-[11px]">
                  Default
                </Badge>
              )}
            </div>
          </div>

          {/* Three-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" className="flex-shrink-0" />
              }
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Branch actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(branch)}>
                  Edit
                </DropdownMenuItem>
                {!branch.is_default && (
                  <DropdownMenuItem onClick={() => onSetDefault(branch.id)}>
                    Set as default
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(branch)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Address */}
        <div className="space-y-1">
          <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 mt-0.5 flex-shrink-0" />
            <span className="leading-snug">{branch.address}</span>
          </div>
          {branch.phone && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="size-3.5 flex-shrink-0" />
              <span>{branch.phone}</span>
            </div>
          )}
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                branch.is_active ? "bg-green-500" : "bg-zinc-400"
              )}
            />
            <span className="text-sm text-muted-foreground">
              {branch.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <Switch
            checked={branch.is_active}
            onCheckedChange={() => onToggleActive(branch.id)}
            aria-label={`Toggle ${branch.name} active state`}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>(mockBranches);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);

  const plan = mockTenant.plan;
  const planLabel = plan === "pro" ? "Pro plan" : plan === "business" ? "Business plan" : "Starter plan";
  const branchLimit = PRO_BRANCH_LIMIT;
  const atLimit = branches.length >= branchLimit;
  const usagePct = Math.min(100, Math.round((branches.length / branchLimit) * 100));

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleToggleActive(id: string) {
    setBranches((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, is_active: !b.is_active } : b
      )
    );
    const branch = branches.find((b) => b.id === id);
    if (branch) {
      toast.success(
        branch.is_active
          ? `${branch.name} set to inactive`
          : `${branch.name} set to active`
      );
    }
  }

  function handleOpenEdit(branch: Branch) {
    setEditingBranch(branch);
    setFormOpen(true);
  }

  function handleOpenAdd() {
    setEditingBranch(null);
    setFormOpen(true);
  }

  function handleSave(values: BranchFormValues, editingId: string | null) {
    const latNum = values.lat && values.lat !== "" ? parseFloat(values.lat) : undefined;
    const lngNum = values.lng && values.lng !== "" ? parseFloat(values.lng) : undefined;
    if (editingId) {
      setBranches((prev) =>
        prev.map((b) =>
          b.id === editingId
            ? {
                ...b,
                name: values.name,
                address: values.address,
                phone: values.phone ?? b.phone,
                lat: latNum ?? b.lat,
                lng: lngNum ?? b.lng,
              }
            : b
        )
      );
    } else {
      const newBranch: Branch = {
        id: generateId(),
        tenant_id: "t1",
        name: values.name,
        address: values.address,
        phone: values.phone,
        lat: latNum,
        lng: lngNum,
        is_default: branches.length === 0,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setBranches((prev) => [...prev, newBranch]);
    }
    toast.success("Branch saved");
  }

  function handleSetDefault(id: string) {
    setBranches((prev) =>
      prev.map((b) => ({ ...b, is_default: b.id === id }))
    );
    toast.success("Default branch updated");
  }

  function handleDeleteClick(branch: Branch) {
    if (branch.is_default) {
      toast.error("Cannot delete the default branch");
      return;
    }
    setDeletingBranch(branch);
    setDeleteOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deletingBranch) return;
    setBranches((prev) => prev.filter((b) => b.id !== deletingBranch.id));
    toast.success(`${deletingBranch.name} removed`);
    setDeletingBranch(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
        </div>
        <div
          title={atLimit ? "Upgrade your plan to add more branches" : undefined}
        >
          <Button
            onClick={handleOpenAdd}
            disabled={atLimit}
            className={cn(atLimit && "cursor-not-allowed opacity-60")}
          >
            <Plus className="size-4" />
            Add branch
          </Button>
        </div>
      </div>

      {/* Plan usage */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {branches.length} / {branchLimit} branches
          </span>
          <Badge variant="outline" className="text-[11px]">
            {planLabel}
          </Badge>
        </div>
        <Progress value={usagePct} className="h-1.5" />
        {atLimit && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            You&apos;ve reached your branch limit. Upgrade your plan to add more branches.
          </p>
        )}
      </div>

      {/* Branch grid */}
      {branches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 flex flex-col items-center justify-center gap-3 text-center">
          <Building2 className="size-10 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium">No branches yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add your first branch to get started.
            </p>
          </div>
          <Button size="sm" onClick={handleOpenAdd}>
            <Plus className="size-3.5" />
            Add branch
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onToggleActive={handleToggleActive}
              onEdit={handleOpenEdit}
              onSetDefault={handleSetDefault}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <BranchFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditingBranch(null);
        }}
        branch={editingBranch}
        onSave={handleSave}
      />

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        branch={deletingBranch}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
