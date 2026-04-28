"use client";

import React, { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Award, Star, Crown, Gem,
  Copy, Eye, Loader2, Plus, Trash2,
  Gift, Ticket, Settings2, MoreHorizontal,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
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
import { Separator } from "@/components/ui/separator";
import { cn, formatPrice, generateId } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Voucher {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_order: number;
  uses: number;
  max_uses: number | null;
  expires: string;
  active: boolean;
}

interface TierConfig {
  id: string;
  name: string;
  color: string;
  min_points: number;
  benefits: string;
}

interface PointsConfig {
  currency_name: string;
  earn_rate: number;
  redeem_rate: number;
  min_redeem: number;
  expiry: string;
}

interface BirthdayReward {
  enabled: boolean;
  type: "percent" | "fixed" | "free_item";
  value: string;
  days_before: string;
}

// ─── Initial data ─────────────────────────────────────────────────────────────

const INITIAL_VOUCHERS: Voucher[] = [
  { id: "v1", code: "WELCOME10", type: "percent",  value: 10,   min_order: 0,    uses: 47,  max_uses: null, expires: "2026-12-31", active: true  },
  { id: "v2", code: "LOYAL5",    type: "fixed",    value: 500,  min_order: 1500, uses: 23,  max_uses: 100,  expires: "2026-06-30", active: true  },
  { id: "v3", code: "BDAY2026",  type: "percent",  value: 20,   min_order: 0,    uses: 8,   max_uses: 50,   expires: "2026-12-31", active: true  },
  { id: "v4", code: "FLASH50",   type: "fixed",    value: 5000, min_order: 5000, uses: 100, max_uses: 100,  expires: "2026-01-01", active: false },
];

const INITIAL_TIERS: TierConfig[] = [
  { id: "t1", name: "Bronze",   color: "#CD7F32", min_points: 0,    benefits: "Welcome rewards" },
  { id: "t2", name: "Silver",   color: "#A8A9AD", min_points: 500,  benefits: "+5% points multiplier, free drink on birthday" },
  { id: "t3", name: "Gold",     color: "#FFD700", min_points: 2000, benefits: "+10% multiplier, monthly free item, priority seating" },
  { id: "t4", name: "Platinum", color: "#E5E4E2", min_points: 5000, benefits: "+20% multiplier, all Gold benefits, dedicated concierge" },
];

const TIER_ICONS = [Award, Star, Crown, Gem];

// ─── Disabled overlay ─────────────────────────────────────────────────────────

function DisabledOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
      <p className="text-sm font-medium text-muted-foreground">
        Enable loyalty program to configure
      </p>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
  disabled = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      {disabled && <DisabledOverlay />}
      <div className={cn("space-y-4", disabled && "pointer-events-none select-none opacity-50")}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="size-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Create voucher dialog ────────────────────────────────────────────────────

interface CreateVoucherDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (v: Voucher) => void;
}

function CreateVoucherDialog({ open, onOpenChange, onSave }: CreateVoucherDialogProps) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expires, setExpires] = useState("");

  const handleSave = () => {
    if (!code.trim() || !value) {
      toast.error("Code and value are required");
      return;
    }
    onSave({
      id: generateId(),
      code: code.toUpperCase().trim(),
      type,
      value: parseFloat(value) * (type === "fixed" ? 100 : 1),
      min_order: minOrder ? parseFloat(minOrder) * 100 : 0,
      uses: 0,
      max_uses: maxUses ? parseInt(maxUses) : null,
      expires: expires || "2027-12-31",
      active: true,
    });
    setCode(""); setType("percent"); setValue(""); setMinOrder(""); setMaxUses(""); setExpires("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Voucher</DialogTitle>
          <DialogDescription>
            Configure a new discount voucher for your customers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="v-code">Voucher Code</Label>
            <div className="flex gap-2">
              <Input
                id="v-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER20"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCode(generateId().toUpperCase().slice(0, 8))}
              >
                <Settings2 className="size-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "percent" | "fixed")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">% Off</SelectItem>
                <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="v-value">Value</Label>
            <Input
              id="v-value"
              type="number"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "percent" ? "e.g. 10" : "e.g. 5.00"}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="v-min">Minimum Order ($) — optional</Label>
            <Input
              id="v-min"
              type="number"
              min={0}
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              placeholder="e.g. 20"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="v-max">Max Uses — optional</Label>
            <Input
              id="v-max"
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Leave blank for unlimited"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="v-expires">Expiry Date</Label>
            <Input
              id="v-expires"
              type="date"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleSave}>Create Voucher</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LoyaltyPage() {
  // ── Master enable ──
  const [enabled, setEnabled] = useState(true);

  // ── Points config ──
  const [points, setPoints] = useState<PointsConfig>({
    currency_name: "Points",
    earn_rate: 1,
    redeem_rate: 100,
    min_redeem: 100,
    expiry: "never",
  });
  const [pointsSaving, setPointsSaving] = useState(false);

  // ── Tier system ──
  const [tiersEnabled, setTiersEnabled] = useState(true);
  const [tiers, setTiers] = useState<TierConfig[]>(INITIAL_TIERS);

  // ── Vouchers ──
  const [vouchers, setVouchers] = useState<Voucher[]>(INITIAL_VOUCHERS);
  const [createVoucherOpen, setCreateVoucherOpen] = useState(false);

  // ── Birthday rewards ──
  const [bday, setBday] = useState<BirthdayReward>({
    enabled: true,
    type: "percent",
    value: "15",
    days_before: "3",
  });

  // ── Tier colour picker refs ──
  const colorRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Handlers ──

  const handleSavePoints = () => {
    setPointsSaving(true);
    setTimeout(() => {
      setPointsSaving(false);
      toast.success("Points configuration saved");
    }, 700);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(
      () => toast.success(`Copied "${code}" to clipboard`),
      () => toast.error("Failed to copy code"),
    );
  };

  const handleDeactivateVoucher = (id: string) => {
    setVouchers((prev) =>
      prev.map((v) => (v.id === id ? { ...v, active: false } : v))
    );
    toast.success("Voucher deactivated");
  };

  const handleDeleteVoucher = (id: string) => {
    setVouchers((prev) => prev.filter((v) => v.id !== id));
    toast.success("Voucher deleted");
  };

  const birthdayMessage = `Hi [Customer Name]! 🎂 Happy Birthday from ${
    "Burger House"
  }! As our valued loyalty member, enjoy ${
    bday.type === "percent"
      ? `${bday.value}% off`
      : bday.type === "fixed"
      ? `$${bday.value} off`
      : "a free item"
  } on your next order. Use code BDAY-[code] — valid today only!`;

  return (
    <div className="max-w-4xl space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Loyalty Program</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Reward your customers and build lasting relationships.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Customer loyalty widget preview coming soon")}
          >
            <Eye className="size-4" />
            Preview customer view
          </Button>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <span className="text-sm font-medium text-muted-foreground">
              {enabled ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              size="default"
            />
          </div>
        </div>
      </div>

      {/* ── Section 1: Points Config ── */}
      <Section title="Points Configuration" icon={Settings2} disabled={!enabled}>
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="currency-name">Points currency name</Label>
                <Input
                  id="currency-name"
                  value={points.currency_name}
                  onChange={(e) =>
                    setPoints((p) => ({ ...p, currency_name: e.target.value }))
                  }
                  placeholder="e.g. Stars, Stamps, Coins"
                />
                <p className="text-xs text-muted-foreground">
                  Shown to customers on their loyalty card
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="earn-rate">Earn rate</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">$1 spent =</span>
                  <Input
                    id="earn-rate"
                    type="number"
                    min={0}
                    step={0.5}
                    value={points.earn_rate}
                    onChange={(e) =>
                      setPoints((p) => ({ ...p, earn_rate: parseFloat(e.target.value) || 1 }))
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">{points.currency_name || "points"}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="redeem-rate">Redeem rate</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="redeem-rate"
                    type="number"
                    min={1}
                    value={points.redeem_rate}
                    onChange={(e) =>
                      setPoints((p) => ({ ...p, redeem_rate: parseInt(e.target.value) || 100 }))
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {points.currency_name || "points"} = $1 discount
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="min-redeem">Minimum redeem threshold</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Minimum</span>
                  <Input
                    id="min-redeem"
                    type="number"
                    min={0}
                    value={points.min_redeem}
                    onChange={(e) =>
                      setPoints((p) => ({ ...p, min_redeem: parseInt(e.target.value) || 100 }))
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">{points.currency_name || "points"} to redeem</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label>{points.currency_name || "Points"} expiry</Label>
              <Select
                value={points.expiry}
                onValueChange={(v) => setPoints((p) => ({ ...p, expiry: v as string }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select expiry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="6m">6 months</SelectItem>
                  <SelectItem value="1y">1 year</SelectItem>
                  <SelectItem value="2y">2 years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSavePoints} disabled={pointsSaving}>
                {pointsSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ── Section 2: Tier System ── */}
      <Section title="Tier System" icon={Award} disabled={!enabled}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Enable tier system</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Reward customers who accumulate more {points.currency_name.toLowerCase() || "points"}
            </p>
          </div>
          <Switch
            checked={tiersEnabled}
            onCheckedChange={setTiersEnabled}
            size="sm"
          />
        </div>

        {tiersEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tiers.map((tier, idx) => {
              const TierIcon = TIER_ICONS[idx] ?? Award;
              return (
                <Card key={tier.id} className="relative overflow-visible">
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                    style={{ backgroundColor: tier.color }}
                  />
                  <CardHeader className="pt-5 pb-2">
                    <div className="flex items-center gap-2">
                      <TierIcon className="size-5" style={{ color: tier.color }} />
                      <Input
                        value={tier.name}
                        onChange={(e) =>
                          setTiers((prev) =>
                            prev.map((t) =>
                              t.id === tier.id ? { ...t, name: e.target.value } : t
                            )
                          )
                        }
                        className="h-7 text-sm font-semibold border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:border-b focus-visible:border-border rounded-none"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Badge colour</Label>
                        <button
                          type="button"
                          onClick={() => colorRefs.current[idx]?.click()}
                          className="block h-8 w-8 rounded-full border-2 border-white shadow cursor-pointer hover:ring-2 hover:ring-ring transition-all"
                          style={{ backgroundColor: tier.color }}
                          aria-label="Pick badge colour"
                        />
                        <input
                          ref={(el) => { colorRefs.current[idx] = el; }}
                          type="color"
                          value={tier.color}
                          onChange={(e) =>
                            setTiers((prev) =>
                              prev.map((t) =>
                                t.id === tier.id ? { ...t, color: e.target.value } : t
                              )
                            )
                          }
                          className="sr-only"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Min {points.currency_name.toLowerCase() || "points"}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={tier.min_points}
                          onChange={(e) =>
                            setTiers((prev) =>
                              prev.map((t) =>
                                t.id === tier.id
                                  ? { ...t, min_points: parseInt(e.target.value) || 0 }
                                  : t
                              )
                            )
                          }
                          className="h-7 text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Benefits</Label>
                      <Textarea
                        value={tier.benefits}
                        onChange={(e) =>
                          setTiers((prev) =>
                            prev.map((t) =>
                              t.id === tier.id ? { ...t, benefits: e.target.value } : t
                            )
                          )
                        }
                        rows={2}
                        className="text-xs resize-none"
                        placeholder="e.g. Free dessert on birthday, 10% off all orders"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {tiersEnabled && (
          <div className="flex justify-end">
            <Button onClick={() => toast.success("Tier configuration saved")}>
              Save tiers
            </Button>
          </div>
        )}
      </Section>

      {/* ── Section 3: Vouchers ── */}
      <Section title="Vouchers" icon={Ticket} disabled={!enabled}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {vouchers.length} voucher{vouchers.length !== 1 ? "s" : ""} configured
          </p>
          <Button size="sm" onClick={() => setCreateVoucherOpen(true)}>
            <Plus className="size-4" />
            Create voucher
          </Button>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Code</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Value</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Min order</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Uses</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Expires</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold">{v.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {v.type === "percent" ? "% off" : "Fixed"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {v.type === "percent" ? `${v.value}%` : formatPrice(v.value)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {v.min_order > 0 ? formatPrice(v.min_order) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {v.uses}
                      {v.max_uses !== null && (
                        <span className="text-muted-foreground"> / {v.max_uses}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {v.expires}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={v.active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {v.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleCopyCode(v.code)}
                          title="Copy code"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon-sm" title="More actions" />
                          }>
                            <span className="sr-only">More</span>
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              {v.active && (
                                <DropdownMenuItem
                                  onClick={() => handleDeactivateVoucher(v.id)}
                                >
                                  Deactivate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDeleteVoucher(v.id)}
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <CreateVoucherDialog
          open={createVoucherOpen}
          onOpenChange={setCreateVoucherOpen}
          onSave={(v) => {
            setVouchers((prev) => [v, ...prev]);
            toast.success(`Voucher "${v.code}" created`);
          }}
        />
      </Section>

      {/* ── Section 4: Birthday Rewards ── */}
      <Section title="Birthday Rewards" icon={Gift} disabled={!enabled}>
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Send birthday reward automatically</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Customers who share their birthday receive a reward via WhatsApp or SMS
                </p>
              </div>
              <Switch
                checked={bday.enabled}
                onCheckedChange={(v) => setBday((b) => ({ ...b, enabled: v }))}
                size="sm"
              />
            </div>

            {bday.enabled && (
              <>
                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Reward type</Label>
                    <Select
                      value={bday.type}
                      onValueChange={(v) => setBday((b) => ({ ...b, type: v as BirthdayReward["type"] }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">% Off</SelectItem>
                        <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                        <SelectItem value="free_item">Free Item</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {bday.type !== "free_item" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="bday-value">Value</Label>
                      <Input
                        id="bday-value"
                        type="number"
                        min={0}
                        value={bday.value}
                        onChange={(e) =>
                          setBday((b) => ({ ...b, value: e.target.value }))
                        }
                        placeholder={bday.type === "percent" ? "e.g. 15" : "e.g. 10.00"}
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label>Send before birthday</Label>
                    <Select
                      value={bday.days_before}
                      onValueChange={(v) => setBday((b) => ({ ...b, days_before: v as string }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select timing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 day before</SelectItem>
                        <SelectItem value="3">3 days before</SelectItem>
                        <SelectItem value="7">7 days before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Message preview</Label>
                  <div className="rounded-lg bg-muted/50 border border-border px-4 py-3">
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {birthdayMessage}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => toast.success("Birthday reward settings saved")}>
                    Save
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
