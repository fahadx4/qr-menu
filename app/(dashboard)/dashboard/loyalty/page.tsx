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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn, formatPrice, generateId } from "@/lib/utils";
import { useT } from "@/lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Voucher {
  id: string; code: string; type: "percent" | "fixed"; value: number;
  min_order: number; uses: number; max_uses: number | null; expires: string; active: boolean;
}

interface TierConfig { id: string; name: string; color: string; min_points: number; benefits: string; }
interface PointsConfig { currency_name: string; earn_rate: number; redeem_rate: number; min_redeem: number; expiry: string; }
interface BirthdayReward { enabled: boolean; type: "percent" | "fixed" | "free_item"; value: string; days_before: string; }

// ─── Initial data ─────────────────────────────────────────────────────────────

const INITIAL_VOUCHERS: Voucher[] = [
  { id: "v1", code: "WELCOME10", type: "percent", value: 10,   min_order: 0,    uses: 47,  max_uses: null, expires: "2026-12-31", active: true  },
  { id: "v2", code: "LOYAL5",    type: "fixed",   value: 500,  min_order: 1500, uses: 23,  max_uses: 100,  expires: "2026-06-30", active: true  },
  { id: "v3", code: "BDAY2026",  type: "percent", value: 20,   min_order: 0,    uses: 8,   max_uses: 50,   expires: "2026-12-31", active: true  },
  { id: "v4", code: "FLASH50",   type: "fixed",   value: 5000, min_order: 5000, uses: 100, max_uses: 100,  expires: "2026-01-01", active: false },
];

const INITIAL_TIERS: TierConfig[] = [
  { id: "t1", name: "Bronze",   color: "#CD7F32", min_points: 0,    benefits: "Welcome rewards" },
  { id: "t2", name: "Silver",   color: "#A8A9AD", min_points: 500,  benefits: "+5% points multiplier, free drink on birthday" },
  { id: "t3", name: "Gold",     color: "#FFD700", min_points: 2000, benefits: "+10% multiplier, monthly free item, priority seating" },
  { id: "t4", name: "Platinum", color: "#E5E4E2", min_points: 5000, benefits: "+20% multiplier, all Gold benefits, dedicated concierge" },
];

const TIER_ICONS = [Award, Star, Crown, Gem];

// ─── Disabled overlay ─────────────────────────────────────────────────────────

function DisabledOverlay({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, disabled = false, disabledLabel = "" }: {
  title: string; icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode; disabled?: boolean; disabledLabel?: string;
}) {
  return (
    <div className="relative">
      {disabled && <DisabledOverlay label={disabledLabel} />}
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

function CreateVoucherDialog({ open, onOpenChange, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; onSave: (v: Voucher) => void;
}) {
  const t = useT();
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expires, setExpires] = useState("");

  const handleSave = () => {
    if (!code.trim() || !value) { toast.error(t.loy_codeValueRequired); return; }
    onSave({
      id: generateId(), code: code.toUpperCase().trim(), type,
      value: parseFloat(value) * (type === "fixed" ? 100 : 1),
      min_order: minOrder ? parseFloat(minOrder) * 100 : 0,
      uses: 0, max_uses: maxUses ? parseInt(maxUses) : null,
      expires: expires || "2027-12-31", active: true,
    });
    setCode(""); setType("percent"); setValue(""); setMinOrder(""); setMaxUses(""); setExpires("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.loy_createVoucherTitle}</DialogTitle>
          <DialogDescription>{t.loy_createVoucherDesc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="v-code">{t.loy_voucherCode}</Label>
            <div className="flex gap-2">
              <Input id="v-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. SUMMER20" className="flex-1" />
              <Button variant="outline" size="icon" onClick={() => setCode(generateId().toUpperCase().slice(0, 8))}><Settings2 className="size-4" /></Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t.loy_type}</Label>
            <Select value={type} onValueChange={(v) => setType(v as "percent" | "fixed")}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t.loy_selectType} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">{t.loy_percentOff2}</SelectItem>
                <SelectItem value="fixed">{t.loy_fixedAmount}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-value">{t.loy_value}</Label>
            <Input id="v-value" type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "percent" ? "e.g. 10" : "e.g. 5.00"} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-min">{t.loy_minOrderOptional}</Label>
            <Input id="v-min" type="number" min={0} value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="e.g. 20" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-max">{t.loy_maxUsesOptional}</Label>
            <Input id="v-max" type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder={t.loy_unlimitedPlaceholder} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-expires">{t.loy_expiryDate}</Label>
            <Input id="v-expires" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>{t.dashCancel}</DialogClose>
          <Button onClick={handleSave}>{t.loy_createVoucherBtn}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LoyaltyPage() {
  const t = useT();
  const [enabled, setEnabled] = useState(true);
  const [points, setPoints] = useState<PointsConfig>({ currency_name: "Points", earn_rate: 1, redeem_rate: 100, min_redeem: 100, expiry: "never" });
  const [pointsSaving, setPointsSaving] = useState(false);
  const [tiersEnabled, setTiersEnabled] = useState(true);
  const [tiers, setTiers] = useState<TierConfig[]>(INITIAL_TIERS);
  const [vouchers, setVouchers] = useState<Voucher[]>(INITIAL_VOUCHERS);
  const [createVoucherOpen, setCreateVoucherOpen] = useState(false);
  const [bday, setBday] = useState<BirthdayReward>({ enabled: true, type: "percent", value: "15", days_before: "3" });
  const colorRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSavePoints = () => {
    setPointsSaving(true);
    setTimeout(() => { setPointsSaving(false); toast.success(t.loy_pointsSaved); }, 700);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(
      () => toast.success(`Copied "${code}" to clipboard`),
      () => toast.error(t.loy_copyFailed),
    );
  };

  const birthdayMessage = `Hi [Customer Name]! 🎂 Happy Birthday from Burger House! As our valued loyalty member, enjoy ${
    bday.type === "percent" ? `${bday.value}% off` : bday.type === "fixed" ? `$${bday.value} off` : "a free item"
  } on your next order. Use code BDAY-[code] — valid today only!`;

  return (
    <div className="max-w-4xl space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t.loy_pageTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t.loy_pageSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => toast.info("Customer loyalty widget preview coming soon")}>
            <Eye className="size-4" />{t.loy_previewCustomer}
          </Button>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <span className="text-sm font-medium text-muted-foreground">{enabled ? t.loy_enabled : t.loy_disabled}</span>
            <Switch checked={enabled} onCheckedChange={setEnabled} size="default" />
          </div>
        </div>
      </div>

      {/* Points Config */}
      <Section title={t.loy_pointsConfig} icon={Settings2} disabled={!enabled} disabledLabel={t.loy_enableToConfigure}>
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="currency-name">{t.loy_currencyName}</Label>
                <Input id="currency-name" value={points.currency_name} onChange={(e) => setPoints((p) => ({ ...p, currency_name: e.target.value }))} placeholder="e.g. Stars, Stamps, Coins" />
                <p className="text-xs text-muted-foreground">{t.loy_currencyNameHint}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="earn-rate">{t.loy_earnRate}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{t.loy_dollarSpent}</span>
                  <Input id="earn-rate" type="number" min={0} step={0.5} value={points.earn_rate} onChange={(e) => setPoints((p) => ({ ...p, earn_rate: parseFloat(e.target.value) || 1 }))} className="w-24" />
                  <span className="text-sm text-muted-foreground">{points.currency_name || "points"}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="redeem-rate">{t.loy_redeemRate}</Label>
                <div className="flex items-center gap-2">
                  <Input id="redeem-rate" type="number" min={1} value={points.redeem_rate} onChange={(e) => setPoints((p) => ({ ...p, redeem_rate: parseInt(e.target.value) || 100 }))} className="w-24" />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{points.currency_name || "points"} {t.loy_dollarDiscount}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="min-redeem">{t.loy_minRedeemThreshold}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{t.loy_minimum}</span>
                  <Input id="min-redeem" type="number" min={0} value={points.min_redeem} onChange={(e) => setPoints((p) => ({ ...p, min_redeem: parseInt(e.target.value) || 100 }))} className="w-24" />
                  <span className="text-sm text-muted-foreground">{points.currency_name || "points"} {t.loy_toRedeem}</span>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label>{points.currency_name || "Points"} {t.loy_expiry}</Label>
              <Select value={points.expiry} onValueChange={(v) => setPoints((p) => ({ ...p, expiry: v as string }))}>
                <SelectTrigger className="w-48"><SelectValue placeholder={t.loy_selectExpiry} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">{t.loy_never}</SelectItem>
                  <SelectItem value="6m">{t.loy_6months}</SelectItem>
                  <SelectItem value="1y">{t.loy_1year}</SelectItem>
                  <SelectItem value="2y">{t.loy_2years}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSavePoints} disabled={pointsSaving}>
                {pointsSaving ? (<><Loader2 className="size-4 animate-spin" />{t.loy_saving}</>) : t.dashSave}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Tier System */}
      <Section title={t.loy_tierSystem} icon={Award} disabled={!enabled} disabledLabel={t.loy_enableToConfigure}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t.loy_enableTiers}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t.loy_enableTiersDesc}</p>
          </div>
          <Switch checked={tiersEnabled} onCheckedChange={setTiersEnabled} size="sm" />
        </div>
        {tiersEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tiers.map((tier, idx) => {
              const TierIcon = TIER_ICONS[idx] ?? Award;
              return (
                <Card key={tier.id} className="relative overflow-visible">
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ backgroundColor: tier.color }} />
                  <CardHeader className="pt-5 pb-2">
                    <div className="flex items-center gap-2">
                      <TierIcon className="size-5" style={{ color: tier.color }} />
                      <Input value={tier.name} onChange={(e) => setTiers((prev) => prev.map((t2) => t2.id === tier.id ? { ...t2, name: e.target.value } : t2))}
                        className="h-7 text-sm font-semibold border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:border-b focus-visible:border-border rounded-none" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">{t.loy_badgeColour}</Label>
                        <button type="button" onClick={() => colorRefs.current[idx]?.click()}
                          className="block h-8 w-8 rounded-full border-2 border-white shadow cursor-pointer hover:ring-2 hover:ring-ring transition-all"
                          style={{ backgroundColor: tier.color }} aria-label="Pick badge colour" />
                        <input ref={(el) => { colorRefs.current[idx] = el; }} type="color" value={tier.color}
                          onChange={(e) => setTiers((prev) => prev.map((t2) => t2.id === tier.id ? { ...t2, color: e.target.value } : t2))} className="sr-only" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">{t.loy_minPoints}</Label>
                        <Input type="number" min={0} value={tier.min_points}
                          onChange={(e) => setTiers((prev) => prev.map((t2) => t2.id === tier.id ? { ...t2, min_points: parseInt(e.target.value) || 0 } : t2))}
                          className="h-7 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t.loy_benefits}</Label>
                      <Textarea value={tier.benefits}
                        onChange={(e) => setTiers((prev) => prev.map((t2) => t2.id === tier.id ? { ...t2, benefits: e.target.value } : t2))}
                        rows={2} className="text-xs resize-none" placeholder={t.loy_benefitsPlaceholder} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {tiersEnabled && (
          <div className="flex justify-end">
            <Button onClick={() => toast.success(t.loy_tiersSaved)}>{t.loy_saveTiers}</Button>
          </div>
        )}
      </Section>

      {/* Vouchers */}
      <Section title={t.loy_vouchers} icon={Ticket} disabled={!enabled} disabledLabel={t.loy_enableToConfigure}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {vouchers.length} {vouchers.length !== 1 ? t.loy_vouchersUnit : t.loy_voucherUnit} {t.loy_vouchersConfigured}
          </p>
          <Button size="sm" onClick={() => setCreateVoucherOpen(true)}><Plus className="size-4" />{t.loy_createVoucher}</Button>
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{t.loy_code}</th>
                  <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{t.loy_type}</th>
                  <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{t.loy_value}</th>
                  <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{t.loy_minOrder}</th>
                  <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{t.loy_uses}</th>
                  <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{t.loy_expires}</th>
                  <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{t.dashStatus}</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">{t.dashActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3"><span className="font-mono text-sm font-semibold">{v.code}</span></td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{v.type === "percent" ? t.loy_percentOff : t.loy_fixed}</Badge></td>
                    <td className="px-4 py-3 text-sm">{v.type === "percent" ? `${v.value}%` : formatPrice(v.value)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{v.min_order > 0 ? formatPrice(v.min_order) : "—"}</td>
                    <td className="px-4 py-3 text-sm">{v.uses}{v.max_uses !== null && <span className="text-muted-foreground"> / {v.max_uses}</span>}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{v.expires}</td>
                    <td className="px-4 py-3"><Badge variant={v.active ? "default" : "secondary"} className="text-xs">{v.active ? t.loy_activeStatus : t.loy_inactiveStatus}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleCopyCode(v.code)} title={t.loy_copyCode}><Copy className="size-3.5" /></Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" title={t.dashActions} />}>
                            <span className="sr-only">{t.dashActions}</span>
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>{t.dashActions}</DropdownMenuLabel>
                              {v.active && <DropdownMenuItem onClick={() => { setVouchers((prev) => prev.map((vv) => vv.id === v.id ? { ...vv, active: false } : vv)); toast.success(t.loy_voucherDeactivated); }}>{t.loy_deactivate}</DropdownMenuItem>}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onClick={() => { setVouchers((prev) => prev.filter((vv) => vv.id !== v.id)); toast.success(t.loy_voucherDeleted); }}>
                                <Trash2 className="size-4" />{t.dashDelete}
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
        <CreateVoucherDialog open={createVoucherOpen} onOpenChange={setCreateVoucherOpen}
          onSave={(v) => { setVouchers((prev) => [v, ...prev]); toast.success(`Voucher "${v.code}" created`); }} />
      </Section>

      {/* Birthday Rewards */}
      <Section title={t.loy_birthdayRewards} icon={Gift} disabled={!enabled} disabledLabel={t.loy_enableToConfigure}>
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t.loy_sendBdayAuto}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.loy_sendBdayDesc}</p>
              </div>
              <Switch checked={bday.enabled} onCheckedChange={(v) => setBday((b) => ({ ...b, enabled: v }))} size="sm" />
            </div>
            {bday.enabled && (
              <>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t.loy_rewardType}</Label>
                    <Select value={bday.type} onValueChange={(v) => setBday((b) => ({ ...b, type: v as BirthdayReward["type"] }))}>
                      <SelectTrigger className="w-full"><SelectValue placeholder={t.loy_selectType} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">{t.loy_percentOff2}</SelectItem>
                        <SelectItem value="fixed">{t.loy_fixedAmount}</SelectItem>
                        <SelectItem value="free_item">{t.loy_freeItem}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {bday.type !== "free_item" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="bday-value">{t.loy_value}</Label>
                      <Input id="bday-value" type="number" min={0} value={bday.value} onChange={(e) => setBday((b) => ({ ...b, value: e.target.value }))} placeholder={bday.type === "percent" ? "e.g. 15" : "e.g. 10.00"} />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>{t.loy_sendBefore}</Label>
                    <Select value={bday.days_before} onValueChange={(v) => setBday((b) => ({ ...b, days_before: v as string }))}>
                      <SelectTrigger className="w-full"><SelectValue placeholder={t.loy_selectTiming} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{t.loy_1dayBefore}</SelectItem>
                        <SelectItem value="3">{t.loy_3daysBefore}</SelectItem>
                        <SelectItem value="7">{t.loy_7daysBefore}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{t.loy_messagePreview}</Label>
                  <div className="rounded-lg bg-muted/50 border border-border px-4 py-3">
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{birthdayMessage}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => toast.success(t.loy_bdaySaved)}>{t.dashSave}</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
