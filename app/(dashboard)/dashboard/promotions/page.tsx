"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, MoreHorizontal, Pencil, Copy, Clock, Zap, Megaphone, ArrowUpDown } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn, formatPrice, generateId } from "@/lib/utils";
import { useT } from "@/lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

type DiscountType = "percent" | "fixed" | "bxgy" | "free_item";

interface DiscountRule { id: string; name: string; type: DiscountType; value: number; conditions: string; active: boolean; uses_this_month: number; }
interface HappyHour   { id: string; name: string; days: number[]; from: string; to: string; discount: number; active: boolean; }
interface Upsell      { id: string; trigger_item: string; trigger_name: string; suggest_item: string; suggest_name: string; active: boolean; }
interface PromoBanner { enabled: boolean; text: string; bg_color: string; text_color: string; show_on: string; cta_text: string; schedule: "always" | "dates"; from_date: string; to_date: string; }

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_RULES: DiscountRule[] = [
  { id: "d1", name: "First order",         type: "percent", value: 15,  conditions: "First order only",          active: true,  uses_this_month: 11 },
  { id: "d2", name: "Spend $50 get $5",    type: "fixed",   value: 500, conditions: "Min order $50.00",          active: true,  uses_this_month: 34 },
  { id: "d3", name: "Buy 2 burgers get 1", type: "bxgy",    value: 1,   conditions: "Buy 2 burgers, 3rd free",   active: true,  uses_this_month: 28 },
  { id: "d4", name: "Weekend special",     type: "percent", value: 10,  conditions: "Sat & Sun only",            active: false, uses_this_month: 0  },
  { id: "d5", name: "Loyalty member 5%",   type: "percent", value: 5,   conditions: "Regular or VIP customers", active: true,  uses_this_month: 89 },
];

const INITIAL_HAPPY_HOURS: HappyHour[] = [
  { id: "hh1", name: "Lunch Deal",     days: [1,2,3,4,5], from: "12:00", to: "14:00", discount: 15, active: true  },
  { id: "hh2", name: "Happy Hour",     days: [1,2,3,4,5], from: "17:00", to: "19:00", discount: 20, active: true  },
  { id: "hh3", name: "Weekend Brunch", days: [6,0],        from: "10:00", to: "13:00", discount: 10, active: false },
];

const INITIAL_UPSELLS: Upsell[] = [
  { id: "u1", trigger_item: "i1", trigger_name: "Classic Smash Burger", suggest_item: "i4", suggest_name: "Crispy Fries",      active: true  },
  { id: "u2", trigger_item: "i1", trigger_name: "Classic Smash Burger", suggest_item: "i6", suggest_name: "Classic Milkshake", active: true  },
  { id: "u3", trigger_item: "i4", trigger_name: "Crispy Fries",          suggest_item: "i6", suggest_name: "Classic Milkshake", active: false },
];

const MOCK_ITEMS = [
  { id: "i1", name: "Classic Smash Burger" }, { id: "i2", name: "BBQ Bacon Burger" },
  { id: "i3", name: "Mushroom Swiss Burger" }, { id: "i4", name: "Crispy Fries" },
  { id: "i5", name: "Onion Rings" }, { id: "i6", name: "Classic Milkshake" }, { id: "i7", name: "Lemonade" },
];

const DAY_LABELS_EN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAY_FULL_EN   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_LABELS_AR = ["أحد","اثن","ثلا","أرب","خمي","جمع","سبت"];
const DAY_FULL_AR   = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeBadgeVariant(t: DiscountType): "default" | "secondary" | "outline" {
  switch (t) {
    case "percent":   return "default";
    case "fixed":     return "secondary";
    default:          return "outline";
  }
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

const TIMELINE_START = 6;
const TIMELINE_END   = 24;
const TIMELINE_SPAN  = TIMELINE_END - TIMELINE_START;
const HH_COLORS = ["#7C3AED","#0891B2","#D97706","#059669"];

function HappyHourTimeline({ happyHours, label }: { happyHours: HappyHour[]; label: string }) {
  const ticks = Array.from({ length: TIMELINE_SPAN + 1 }, (_, i) => TIMELINE_START + i);
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="relative h-10">
        <div className="absolute inset-x-0 bottom-0 flex">
          {ticks.map((h) => (
            <div key={h} className="flex-1 border-s border-border/50 text-[9px] text-muted-foreground pt-0.5 ps-0.5" style={{ minWidth: 0 }}>
              {h % 3 === 0 ? `${h}:00` : ""}
            </div>
          ))}
        </div>
        {happyHours.map((hh, idx) => {
          const fromMin  = timeToMinutes(hh.from);
          const toMin    = timeToMinutes(hh.to);
          const startPct = ((fromMin / 60 - TIMELINE_START) / TIMELINE_SPAN) * 100;
          const widthPct = ((toMin - fromMin) / 60 / TIMELINE_SPAN) * 100;
          const color = HH_COLORS[idx % HH_COLORS.length] ?? "#7C3AED";
          return (
            <div key={hh.id} title={`${hh.name}: ${hh.from}–${hh.to} (${hh.discount}% off)`}
              className={cn("absolute top-1 h-6 rounded flex items-center justify-center text-[9px] font-semibold text-white overflow-hidden", !hh.active && "opacity-40")}
              style={{ left: `${startPct}%`, width: `${widthPct}%`, backgroundColor: color, border: hh.active ? "none" : `2px dashed ${color}` }}>
              {widthPct > 8 && hh.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab 1: Discount Rules ────────────────────────────────────────────────────

function DiscountRulesTab() {
  const t = useT();
  const lang = (useT as unknown as { _lang?: string })._lang;
  void lang;
  const [rules, setRules] = useState<DiscountRule[]>(INITIAL_RULES);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editRule, setEditRule] = useState<DiscountRule | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<DiscountType>("percent");
  const [formValue, setFormValue] = useState("");
  const [formMinOrder, setFormMinOrder] = useState("");
  const [formAppliesTo, setFormAppliesTo] = useState("all");
  const [formDays, setFormDays] = useState<number[]>([0,1,2,3,4,5,6]);
  const [formFromTime, setFormFromTime] = useState("");
  const [formToTime, setFormToTime] = useState("");
  const [formMaxUses, setFormMaxUses] = useState("");
  const [formActive, setFormActive] = useState(true);

  function typeLabel(type: DiscountType): string {
    switch (type) {
      case "percent":   return t.prm_typePercentLabel;
      case "fixed":     return t.prm_typeFixedLabel;
      case "bxgy":      return t.prm_typeBxgyLabel;
      case "free_item": return t.prm_typeFreeItemLabel;
    }
  }

  const openCreate = () => {
    setEditRule(null);
    setFormName(""); setFormType("percent"); setFormValue("");
    setFormMinOrder(""); setFormAppliesTo("all"); setFormDays([0,1,2,3,4,5,6]);
    setFormFromTime(""); setFormToTime(""); setFormMaxUses(""); setFormActive(true);
    setSheetOpen(true);
  };

  const openEdit = (rule: DiscountRule) => {
    setEditRule(rule);
    setFormName(rule.name); setFormType(rule.type); setFormValue(String(rule.value)); setFormActive(rule.active);
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) { toast.error(t.prm_ruleNameRequired); return; }
    if (editRule) {
      setRules((prev) => prev.map((r) => r.id === editRule.id ? { ...r, name: formName, type: formType, value: parseFloat(formValue) || 0, active: formActive } : r));
      toast.success(t.prm_ruleUpdated);
    } else {
      setRules((prev) => [{ id: generateId(), name: formName, type: formType, value: parseFloat(formValue) || 0, conditions: `Min order ${formMinOrder ? `$${formMinOrder}` : "none"}`, active: formActive, uses_this_month: 0 }, ...prev]);
      toast.success(t.prm_ruleCreated);
    }
    setSheetOpen(false);
  };

  const toggleDay = (d: number) => setFormDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rules.length} {t.prm_rulesConfigured}</p>
        <Button size="sm" onClick={openCreate}><Plus className="size-4" />{t.prm_createRule}</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className={cn(!rule.active && "opacity-60")}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm leading-snug">{rule.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{rule.conditions}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>{t.dashActions}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => openEdit(rule)}><Pencil className="size-4" />{t.dashEdit}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setRules((prev) => [...prev, { ...rule, id: generateId(), name: `${rule.name} (copy)`, uses_this_month: 0 }]); toast.success(t.prm_ruleDuplicated); }}>
                        <Copy className="size-4" />{t.frn_duplicate}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => { setRules((prev) => prev.filter((r) => r.id !== rule.id)); toast.success(t.prm_ruleDeleted); }}>
                        <Trash2 className="size-4" />{t.dashDelete}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={typeBadgeVariant(rule.type)} className="text-xs">{typeLabel(rule.type)}</Badge>
                {rule.type === "percent"   && <span className="text-sm font-semibold">{rule.value}{t.prm_percentOff}</span>}
                {rule.type === "fixed"     && <span className="text-sm font-semibold">{formatPrice(rule.value)} {t.prm_typePercentLabel}</span>}
                {rule.type === "bxgy"      && <span className="text-sm font-semibold">{t.prm_getFree} {rule.value} {t.prm_free}</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{rule.uses_this_month} {t.prm_usesThisMonth}</span>
                <Switch checked={rule.active} onCheckedChange={(v) => setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, active: v } : r))} size="sm" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editRule ? t.prm_editRuleTitle : t.prm_createRuleTitle}</SheetTitle>
            <SheetDescription>{t.prm_ruleDesc}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="rule-name">{t.prm_ruleName}</Label>
              <Input id="rule-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Weekend Special" />
            </div>
            <div className="space-y-1.5">
              <Label>{t.prm_ruleType}</Label>
              <Select value={formType} onValueChange={(v) => setFormType(v as DiscountType)}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t.prm_selectType} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">{t.prm_typePercent}</SelectItem>
                  <SelectItem value="fixed">{t.prm_typeFixed}</SelectItem>
                  <SelectItem value="bxgy">{t.prm_typeBxgy}</SelectItem>
                  <SelectItem value="free_item">{t.prm_typeFreeItem}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-value">{t.prm_ruleValue}</Label>
              <Input id="rule-value" type="number" min={0} value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder={formType === "percent" ? "e.g. 15" : "e.g. 5.00"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-min">{t.prm_minOrder}</Label>
              <Input id="rule-min" type="number" min={0} value={formMinOrder} onChange={(e) => setFormMinOrder(e.target.value)} placeholder="e.g. 20" />
            </div>
            <div className="space-y-1.5">
              <Label>{t.prm_appliesTo}</Label>
              <Select value={formAppliesTo} onValueChange={(v) => setFormAppliesTo(v as string)}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t.prm_selectScope} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.prm_allItems}</SelectItem>
                  <SelectItem value="category">{t.prm_specificCategory}</SelectItem>
                  <SelectItem value="items">{t.prm_specificItems}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.prm_daysOfWeek}</Label>
              <div className="flex flex-wrap gap-2">
                {DAY_LABELS_EN.map((label, idx) => (
                  <label key={idx} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox checked={formDays.includes(idx)} onCheckedChange={() => toggleDay(idx)} />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rule-from">{t.prm_activeFrom}</Label>
                <Input id="rule-from" type="time" value={formFromTime} onChange={(e) => setFormFromTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rule-to">{t.prm_activeTo}</Label>
                <Input id="rule-to" type="time" value={formToTime} onChange={(e) => setFormToTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-max">{t.prm_maxUses}</Label>
              <Input id="rule-max" type="number" min={1} value={formMaxUses} onChange={(e) => setFormMaxUses(e.target.value)} placeholder={t.prm_unlimitedPlaceholder} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t.prm_active}</Label>
              <Switch checked={formActive} onCheckedChange={setFormActive} size="sm" />
            </div>
          </div>
          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>{t.dashCancel}</SheetClose>
            <Button onClick={handleSave}>{editRule ? t.prm_updateRule : t.prm_createRule}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Tab 2: Happy Hour ────────────────────────────────────────────────────────

function HappyHourTab() {
  const t = useT();
  const [happyHours, setHappyHours] = useState<HappyHour[]>(INITIAL_HAPPY_HOURS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editHH, setEditHH] = useState<HappyHour | null>(null);
  const [formName, setFormName] = useState("");
  const [formDays, setFormDays] = useState<number[]>([1,2,3,4,5]);
  const [formFrom, setFormFrom] = useState("12:00");
  const [formTo, setFormTo] = useState("14:00");
  const [formDiscount, setFormDiscount] = useState("15");
  const [formAppliesTo, setFormAppliesTo] = useState("all");

  const openCreate = () => {
    setEditHH(null); setFormName(""); setFormDays([1,2,3,4,5]);
    setFormFrom("12:00"); setFormTo("14:00"); setFormDiscount("15"); setFormAppliesTo("all");
    setDialogOpen(true);
  };

  const openEdit = (hh: HappyHour) => {
    setEditHH(hh); setFormName(hh.name); setFormDays(hh.days);
    setFormFrom(hh.from); setFormTo(hh.to); setFormDiscount(String(hh.discount)); setFormAppliesTo("all");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) { toast.error(t.prm_nameRequired); return; }
    if (editHH) {
      setHappyHours((prev) => prev.map((h) => h.id === editHH.id ? { ...h, name: formName, days: formDays, from: formFrom, to: formTo, discount: parseInt(formDiscount) || 0 } : h));
      toast.success(t.prm_hhUpdated);
    } else {
      setHappyHours((prev) => [...prev, { id: generateId(), name: formName, days: formDays, from: formFrom, to: formTo, discount: parseInt(formDiscount) || 0, active: true }]);
      toast.success(t.prm_hhAdded);
    }
    setDialogOpen(false);
  };

  const toggleDay = (d: number) => setFormDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  return (
    <div className="space-y-5">
      <HappyHourTimeline happyHours={happyHours} label={t.prm_24hSchedule} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{happyHours.length} {happyHours.length !== 1 ? t.prm_schedules : t.prm_schedule}</p>
        <Button size="sm" onClick={openCreate}><Plus className="size-4" />{t.prm_addHappyHour}</Button>
      </div>
      <div className="space-y-3">
        {happyHours.map((hh, idx) => {
          const color = HH_COLORS[idx % HH_COLORS.length] ?? "#7C3AED";
          return (
            <Card key={hh.id} className={cn(!hh.active && "opacity-60")}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{hh.name}</span>
                    <Badge variant="secondary" className="text-xs">{hh.discount}{t.prm_percentOff}</Badge>
                    {!hh.active && <Badge variant="outline" className="text-xs">{t.prm_inactive}</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="size-3" />{hh.from}–{hh.to}</span>
                    <span>{hh.days.length === 7 ? t.prm_everyDay : hh.days.map((d) => DAY_LABELS_EN[d]).join(", ")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch checked={hh.active} onCheckedChange={(v) => setHappyHours((prev) => prev.map((h) => h.id === hh.id ? { ...h, active: v } : h))} size="sm" />
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}><MoreHorizontal className="size-4" /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>{t.dashActions}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEdit(hh)}><Pencil className="size-4" />{t.dashEdit}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => { setHappyHours((prev) => prev.filter((h) => h.id !== hh.id)); toast.success(t.prm_hhDeleted); }}>
                          <Trash2 className="size-4" />{t.dashDelete}
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editHH ? t.prm_editHappyHour : t.prm_addHappyHourTitle}</DialogTitle>
            <DialogDescription>{t.prm_happyHourDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="hh-name">{t.prm_ruleName}</Label>
              <Input id="hh-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Lunch Deal" />
            </div>
            <div className="space-y-2">
              <Label>{t.prm_days}</Label>
              <div className="flex flex-wrap gap-2">
                {DAY_FULL_EN.map((label, idx) => (
                  <label key={idx} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox checked={formDays.includes(idx)} onCheckedChange={() => toggleDay(idx)} />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="hh-from">{t.prm_from}</Label><Input id="hh-from" type="time" value={formFrom} onChange={(e) => setFormFrom(e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="hh-to">{t.prm_to}</Label><Input id="hh-to" type="time" value={formTo} onChange={(e) => setFormTo(e.target.value)} /></div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hh-discount">{t.prm_discountPct}</Label>
              <Input id="hh-discount" type="number" min={1} max={100} value={formDiscount} onChange={(e) => setFormDiscount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.prm_appliesTo}</Label>
              <Select value={formAppliesTo} onValueChange={(v) => setFormAppliesTo(v as string)}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t.prm_selectScope} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.prm_allItems}</SelectItem>
                  <SelectItem value="category">{t.prm_specificCategory}</SelectItem>
                  <SelectItem value="items">{t.prm_specificItems}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>{t.dashCancel}</DialogClose>
            <Button onClick={handleSave}>{editHH ? t.prm_update : t.dashAdd}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab 3: Promo Banner ──────────────────────────────────────────────────────

function PromoBannerTab() {
  const t = useT();
  const [banner, setBanner] = useState<PromoBanner>({
    enabled: true, text: "Happy Hour: 20% off all items 5-7PM!", bg_color: "#7C3AED", text_color: "#FFFFFF",
    show_on: "all", cta_text: "Order now", schedule: "always", from_date: "", to_date: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); toast.success(t.prm_bannerSaved); }, 700);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label>{t.prm_livePreview}</Label>
        <div className={cn("flex items-center justify-between gap-3 rounded-xl px-5 py-3 transition-all", !banner.enabled && "opacity-40")} style={{ backgroundColor: banner.bg_color }}>
          <p className="text-sm font-medium flex-1 min-w-0 truncate" style={{ color: banner.text_color }}>
            {banner.text || t.prm_bannerPlaceholder}
          </p>
          {banner.cta_text && (
            <span className="flex-shrink-0 rounded-lg border px-3 py-1 text-xs font-semibold cursor-pointer" style={{ borderColor: banner.text_color, color: banner.text_color }}>
              {banner.cta_text}
            </span>
          )}
        </div>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{t.prm_enableBanner}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t.prm_enableBannerDesc}</p>
        </div>
        <Switch checked={banner.enabled} onCheckedChange={(v) => setBanner((b) => ({ ...b, enabled: v }))} size="sm" />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="banner-text">{t.prm_bannerText}</Label>
          <span className="text-xs text-muted-foreground">{banner.text.length}/80</span>
        </div>
        <Input id="banner-text" value={banner.text} onChange={(e) => { if (e.target.value.length <= 80) setBanner((b) => ({ ...b, text: e.target.value })); }} maxLength={80} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t.prm_bgColor}</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={banner.bg_color} onChange={(e) => setBanner((b) => ({ ...b, bg_color: e.target.value }))} className="h-9 w-14 cursor-pointer rounded-lg border border-input bg-transparent p-1 outline-none" />
            <Input value={banner.bg_color} onChange={(e) => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setBanner((b) => ({ ...b, bg_color: e.target.value })); }} className="w-28 font-mono" maxLength={7} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t.prm_textColor}</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={banner.text_color} onChange={(e) => setBanner((b) => ({ ...b, text_color: e.target.value }))} className="h-9 w-14 cursor-pointer rounded-lg border border-input bg-transparent p-1 outline-none" />
            <Input value={banner.text_color} onChange={(e) => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setBanner((b) => ({ ...b, text_color: e.target.value })); }} className="w-28 font-mono" maxLength={7} />
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>{t.prm_showOn}</Label>
        <Select value={banner.show_on} onValueChange={(v) => setBanner((b) => ({ ...b, show_on: v as string }))}>
          <SelectTrigger className="w-56"><SelectValue placeholder={t.prm_selectPage} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.prm_allPages}</SelectItem>
            <SelectItem value="menu">{t.prm_menuPageOnly}</SelectItem>
            <SelectItem value="landing">{t.prm_landingPageOnly}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="banner-cta">{t.prm_ctaText}</Label>
        <Input id="banner-cta" value={banner.cta_text} onChange={(e) => setBanner((b) => ({ ...b, cta_text: e.target.value }))} className="w-56" />
      </div>
      <div className="space-y-3">
        <Label>{t.prm_scheduleLabel}</Label>
        <div className="flex flex-col gap-2">
          {([{ value: "always", label: t.prm_alwaysVisible }, { value: "dates", label: t.prm_specificDateRange }] as const).map((opt) => (
            <label key={opt.value} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors", banner.schedule === opt.value ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
              <input type="radio" name="banner-schedule" checked={banner.schedule === opt.value} onChange={() => setBanner((b) => ({ ...b, schedule: opt.value }))} className="accent-primary" />
              <span className="text-sm font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
        {banner.schedule === "dates" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="banner-from">{t.prm_from}</Label><Input id="banner-from" type="date" value={banner.from_date} onChange={(e) => setBanner((b) => ({ ...b, from_date: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label htmlFor="banner-to">{t.prm_to}</Label><Input id="banner-to" type="date" value={banner.to_date} onChange={(e) => setBanner((b) => ({ ...b, to_date: e.target.value }))} /></div>
          </div>
        )}
      </div>
      <Button onClick={handleSave} disabled={saving}>
        {saving ? (<><span className="size-4 animate-spin border-2 border-white/30 border-t-white rounded-full" />{t.prm_saving}</>) : t.prm_saveBanner}
      </Button>
    </div>
  );
}

// ─── Tab 4: Upsell Prompts ────────────────────────────────────────────────────

function UpsellTab() {
  const t = useT();
  const [upsells, setUpsells] = useState<Upsell[]>(INITIAL_UPSELLS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formTrigger, setFormTrigger] = useState("i1");
  const [formSuggest, setFormSuggest] = useState("i4");
  const [minOrderThreshold, setMinOrderThreshold] = useState("30");
  const [minOrderItem, setMinOrderItem] = useState("i4");

  const handleAddUpsell = () => {
    if (formTrigger === formSuggest) { toast.error(t.prm_triggerError); return; }
    const triggerItem = MOCK_ITEMS.find((i) => i.id === formTrigger);
    const suggestItem = MOCK_ITEMS.find((i) => i.id === formSuggest);
    if (!triggerItem || !suggestItem) return;
    setUpsells((prev) => [...prev, { id: generateId(), trigger_item: formTrigger, trigger_name: triggerItem.name, suggest_item: formSuggest, suggest_name: suggestItem.name, active: true }]);
    toast.success(t.prm_upsellAdded);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{t.prm_upsellPrompts}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t.prm_upsellDesc}</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="size-4" />{t.prm_addUpsell}</Button>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground"><div className="flex items-center gap-1"><ArrowUpDown className="size-3" />{t.prm_whenCustomerAdds}</div></th>
                <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{t.prm_suggest}</th>
                <th className="text-end px-4 py-2.5 text-xs font-medium text-muted-foreground">{t.prm_active}</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {upsells.map((u) => (
                <tr key={u.id} className={cn("hover:bg-muted/30 transition-colors", !u.active && "opacity-50")}>
                  <td className="px-4 py-3"><span className="font-medium">{u.trigger_name}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{u.suggest_name}</td>
                  <td className="px-4 py-3 text-end"><Switch checked={u.active} onCheckedChange={(v) => setUpsells((prev) => prev.map((x) => x.id === u.id ? { ...x, active: v } : x))} size="sm" /></td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="ghost" size="icon-sm" onClick={() => { setUpsells((prev) => prev.filter((x) => x.id !== u.id)); toast.success(t.prm_upsellRemoved); }}><Trash2 className="size-3.5" /></Button>
                  </td>
                </tr>
              ))}
              {upsells.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">{t.prm_noUpsells}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center gap-2"><Zap className="size-4 text-amber-500" /><p className="text-sm font-semibold">{t.prm_minOrderUpsell}</p></div>
        <p className="text-xs text-muted-foreground">{t.prm_minOrderUpsellDesc}</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="min-threshold">{t.prm_whenCartReaches}</Label>
            <Input id="min-threshold" type="number" min={0} value={minOrderThreshold} onChange={(e) => setMinOrderThreshold(e.target.value)} className="w-32" />
          </div>
          <div className="space-y-1.5">
            <Label>{t.prm_suggestItem}</Label>
            <Select value={minOrderItem} onValueChange={(v) => setMinOrderItem(v as string)}>
              <SelectTrigger className="w-56"><SelectValue placeholder={t.prm_selectItem} /></SelectTrigger>
              <SelectContent>{MOCK_ITEMS.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => toast.success(t.prm_minOrderSaved)}>{t.dashSave}</Button>
        </div>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.prm_addUpsellTitle}</DialogTitle>
            <DialogDescription>{t.prm_addUpsellDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t.prm_triggerItem}</Label>
              <Select value={formTrigger} onValueChange={(v) => setFormTrigger(v as string)}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t.prm_selectTriggerItem} /></SelectTrigger>
                <SelectContent>{MOCK_ITEMS.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t.prm_suggestItem}</Label>
              <Select value={formSuggest} onValueChange={(v) => setFormSuggest(v as string)}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t.prm_selectItemToSuggest} /></SelectTrigger>
                <SelectContent>{MOCK_ITEMS.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>{t.dashCancel}</DialogClose>
            <Button onClick={handleAddUpsell}>{t.prm_addUpsell}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const t = useT();
  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{t.prm_pageTitle}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t.prm_pageSubtitle}</p>
      </div>
      <Tabs defaultValue="discount-rules">
        <TabsList>
          <TabsTrigger value="discount-rules"><Zap className="size-4" />{t.prm_tabDiscountRules}</TabsTrigger>
          <TabsTrigger value="happy-hour"><Clock className="size-4" />{t.prm_tabHappyHour}</TabsTrigger>
          <TabsTrigger value="promo-banner"><Megaphone className="size-4" />{t.prm_tabPromoBanner}</TabsTrigger>
          <TabsTrigger value="upsell"><ArrowUpDown className="size-4" />{t.prm_tabUpsell}</TabsTrigger>
        </TabsList>
        <TabsContent value="discount-rules" className="mt-6"><DiscountRulesTab /></TabsContent>
        <TabsContent value="happy-hour" className="mt-6"><HappyHourTab /></TabsContent>
        <TabsContent value="promo-banner" className="mt-6"><PromoBannerTab /></TabsContent>
        <TabsContent value="upsell" className="mt-6"><UpsellTab /></TabsContent>
      </Tabs>
    </div>
  );
}
