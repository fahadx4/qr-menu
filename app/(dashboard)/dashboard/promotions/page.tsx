"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Plus, Trash2, MoreHorizontal,
  Pencil, Copy, Clock, Zap,
  Megaphone, ArrowUpDown,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn, formatPrice, generateId } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type DiscountType = "percent" | "fixed" | "bxgy" | "free_item";

interface DiscountRule {
  id: string;
  name: string;
  type: DiscountType;
  value: number;
  conditions: string;
  active: boolean;
  uses_this_month: number;
}

interface HappyHour {
  id: string;
  name: string;
  days: number[];
  from: string;
  to: string;
  discount: number;
  active: boolean;
}

interface Upsell {
  id: string;
  trigger_item: string;
  trigger_name: string;
  suggest_item: string;
  suggest_name: string;
  active: boolean;
}

interface PromoBanner {
  enabled: boolean;
  text: string;
  bg_color: string;
  text_color: string;
  show_on: string;
  cta_text: string;
  schedule: "always" | "dates";
  from_date: string;
  to_date: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_RULES: DiscountRule[] = [
  { id: "d1", name: "First order",         type: "percent", value: 15,  conditions: "First order only",             active: true,  uses_this_month: 11 },
  { id: "d2", name: "Spend $50 get $5",    type: "fixed",   value: 500, conditions: "Min order $50.00",             active: true,  uses_this_month: 34 },
  { id: "d3", name: "Buy 2 burgers get 1", type: "bxgy",    value: 1,   conditions: "Buy 2 burgers, 3rd free",      active: true,  uses_this_month: 28 },
  { id: "d4", name: "Weekend special",     type: "percent", value: 10,  conditions: "Sat & Sun only",               active: false, uses_this_month: 0  },
  { id: "d5", name: "Loyalty member 5%",   type: "percent", value: 5,   conditions: "Regular or VIP customers",    active: true,  uses_this_month: 89 },
];

const INITIAL_HAPPY_HOURS: HappyHour[] = [
  { id: "hh1", name: "Lunch Deal",    days: [1,2,3,4,5], from: "12:00", to: "14:00", discount: 15, active: true  },
  { id: "hh2", name: "Happy Hour",    days: [1,2,3,4,5], from: "17:00", to: "19:00", discount: 20, active: true  },
  { id: "hh3", name: "Weekend Brunch",days: [6,0],        from: "10:00", to: "13:00", discount: 10, active: false },
];

const INITIAL_UPSELLS: Upsell[] = [
  { id: "u1", trigger_item: "i1", trigger_name: "Classic Smash Burger",  suggest_item: "i4", suggest_name: "Crispy Fries",     active: true  },
  { id: "u2", trigger_item: "i1", trigger_name: "Classic Smash Burger",  suggest_item: "i6", suggest_name: "Classic Milkshake", active: true  },
  { id: "u3", trigger_item: "i4", trigger_name: "Crispy Fries",           suggest_item: "i6", suggest_name: "Classic Milkshake", active: false },
];

const MOCK_ITEMS = [
  { id: "i1", name: "Classic Smash Burger" },
  { id: "i2", name: "BBQ Bacon Burger" },
  { id: "i3", name: "Mushroom Swiss Burger" },
  { id: "i4", name: "Crispy Fries" },
  { id: "i5", name: "Onion Rings" },
  { id: "i6", name: "Classic Milkshake" },
  { id: "i7", name: "Lemonade" },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL   = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeLabel(t: DiscountType): string {
  switch (t) {
    case "percent":   return "% off";
    case "fixed":     return "Fixed $";
    case "bxgy":      return "Buy X Get Y";
    case "free_item": return "Free item";
  }
}

function typeBadgeVariant(t: DiscountType): "default" | "secondary" | "outline" {
  switch (t) {
    case "percent":   return "default";
    case "fixed":     return "secondary";
    case "bxgy":      return "outline";
    case "free_item": return "outline";
  }
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

const TIMELINE_START = 6;   // 6:00
const TIMELINE_END   = 24;  // 24:00
const TIMELINE_SPAN  = TIMELINE_END - TIMELINE_START;

const HH_COLORS = ["#7C3AED", "#0891B2", "#D97706", "#059669"];

function HappyHourTimeline({ happyHours }: { happyHours: HappyHour[] }) {
  const ticks = Array.from({ length: TIMELINE_SPAN + 1 }, (_, i) => TIMELINE_START + i);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <p className="text-xs font-medium text-muted-foreground">24-hour schedule</p>
      <div className="relative h-10">
        {/* Hour ticks */}
        <div className="absolute inset-x-0 bottom-0 flex">
          {ticks.map((h) => (
            <div
              key={h}
              className="flex-1 border-l border-border/50 text-[9px] text-muted-foreground pt-0.5 pl-0.5"
              style={{ minWidth: 0 }}
            >
              {h % 3 === 0 ? `${h}:00` : ""}
            </div>
          ))}
        </div>
        {/* Blocks */}
        {happyHours.map((hh, idx) => {
          const fromMin = timeToMinutes(hh.from);
          const toMin   = timeToMinutes(hh.to);
          const startPct = ((fromMin / 60 - TIMELINE_START) / TIMELINE_SPAN) * 100;
          const widthPct  = ((toMin - fromMin) / 60 / TIMELINE_SPAN) * 100;
          const color = HH_COLORS[idx % HH_COLORS.length] ?? "#7C3AED";

          return (
            <div
              key={hh.id}
              title={`${hh.name}: ${hh.from}–${hh.to} (${hh.discount}% off)`}
              className={cn(
                "absolute top-1 h-6 rounded flex items-center justify-center text-[9px] font-semibold text-white overflow-hidden",
                !hh.active && "opacity-40"
              )}
              style={{
                left: `${startPct}%`,
                width: `${widthPct}%`,
                backgroundColor: color,
                border: hh.active ? "none" : `2px dashed ${color}`,
              }}
            >
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
  const [rules, setRules] = useState<DiscountRule[]>(INITIAL_RULES);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editRule, setEditRule] = useState<DiscountRule | null>(null);

  // Form state
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

  const openCreate = () => {
    setEditRule(null);
    setFormName(""); setFormType("percent"); setFormValue("");
    setFormMinOrder(""); setFormAppliesTo("all"); setFormDays([0,1,2,3,4,5,6]);
    setFormFromTime(""); setFormToTime(""); setFormMaxUses(""); setFormActive(true);
    setSheetOpen(true);
  };

  const openEdit = (rule: DiscountRule) => {
    setEditRule(rule);
    setFormName(rule.name);
    setFormType(rule.type);
    setFormValue(String(rule.value));
    setFormActive(rule.active);
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) { toast.error("Rule name is required"); return; }
    if (editRule) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === editRule.id
            ? { ...r, name: formName, type: formType, value: parseFloat(formValue) || 0, active: formActive }
            : r
        )
      );
      toast.success("Rule updated");
    } else {
      setRules((prev) => [
        {
          id: generateId(),
          name: formName,
          type: formType,
          value: parseFloat(formValue) || 0,
          conditions: `Min order ${formMinOrder ? `$${formMinOrder}` : "none"}`,
          active: formActive,
          uses_this_month: 0,
        },
        ...prev,
      ]);
      toast.success("Rule created");
    }
    setSheetOpen(false);
  };

  const toggleDay = (d: number) => {
    setFormDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rules.length} rules configured</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Create rule
        </Button>
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
                  <DropdownMenuTrigger render={
                    <Button variant="ghost" size="icon-sm" />
                  }>
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => openEdit(rule)}>
                        <Pencil className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setRules((prev) => [
                            ...prev,
                            { ...rule, id: generateId(), name: `${rule.name} (copy)`, uses_this_month: 0 },
                          ]);
                          toast.success("Rule duplicated");
                        }}
                      >
                        <Copy className="size-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          setRules((prev) => prev.filter((r) => r.id !== rule.id));
                          toast.success("Rule deleted");
                        }}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={typeBadgeVariant(rule.type)} className="text-xs">
                  {typeLabel(rule.type)}
                </Badge>
                {rule.type === "percent" && (
                  <span className="text-sm font-semibold">{rule.value}% off</span>
                )}
                {rule.type === "fixed" && (
                  <span className="text-sm font-semibold">{formatPrice(rule.value)} off</span>
                )}
                {rule.type === "bxgy" && (
                  <span className="text-sm font-semibold">Get {rule.value} free</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {rule.uses_this_month} uses this month
                </span>
                <Switch
                  checked={rule.active}
                  onCheckedChange={(v) =>
                    setRules((prev) =>
                      prev.map((r) => (r.id === rule.id ? { ...r, active: v } : r))
                    )
                  }
                  size="sm"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editRule ? "Edit Rule" : "Create Rule"}</SheetTitle>
            <SheetDescription>
              Configure the discount rule settings.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="rule-name">Rule name</Label>
              <Input
                id="rule-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Weekend Special"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={formType} onValueChange={(v) => setFormType(v as DiscountType)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">% Off</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  <SelectItem value="bxgy">Buy X Get Y</SelectItem>
                  <SelectItem value="free_item">Free Item</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rule-value">Value</Label>
              <Input
                id="rule-value"
                type="number"
                min={0}
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                placeholder={formType === "percent" ? "e.g. 15" : "e.g. 5.00"}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rule-min">Minimum order ($) — optional</Label>
              <Input
                id="rule-min"
                type="number"
                min={0}
                value={formMinOrder}
                onChange={(e) => setFormMinOrder(e.target.value)}
                placeholder="e.g. 20"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Applies to</Label>
              <Select value={formAppliesTo} onValueChange={(v) => setFormAppliesTo(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All items</SelectItem>
                  <SelectItem value="category">Specific category</SelectItem>
                  <SelectItem value="items">Specific items</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Days of week</Label>
              <div className="flex flex-wrap gap-2">
                {DAY_LABELS.map((label, idx) => (
                  <label key={idx} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={formDays.includes(idx)}
                      onCheckedChange={() => toggleDay(idx)}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rule-from">Active from</Label>
                <Input
                  id="rule-from"
                  type="time"
                  value={formFromTime}
                  onChange={(e) => setFormFromTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rule-to">Active to</Label>
                <Input
                  id="rule-to"
                  type="time"
                  value={formToTime}
                  onChange={(e) => setFormToTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rule-max">Max uses — optional</Label>
              <Input
                id="rule-max"
                type="number"
                min={1}
                value={formMaxUses}
                onChange={(e) => setFormMaxUses(e.target.value)}
                placeholder="Leave blank for unlimited"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formActive}
                onCheckedChange={setFormActive}
                size="sm"
              />
            </div>
          </div>

          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
            <Button onClick={handleSave}>
              {editRule ? "Update rule" : "Create rule"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Tab 2: Happy Hour ────────────────────────────────────────────────────────

function HappyHourTab() {
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
    setEditHH(null);
    setFormName(""); setFormDays([1,2,3,4,5]);
    setFormFrom("12:00"); setFormTo("14:00");
    setFormDiscount("15"); setFormAppliesTo("all");
    setDialogOpen(true);
  };

  const openEdit = (hh: HappyHour) => {
    setEditHH(hh);
    setFormName(hh.name); setFormDays(hh.days);
    setFormFrom(hh.from); setFormTo(hh.to);
    setFormDiscount(String(hh.discount)); setFormAppliesTo("all");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) { toast.error("Name is required"); return; }
    if (editHH) {
      setHappyHours((prev) =>
        prev.map((h) =>
          h.id === editHH.id
            ? { ...h, name: formName, days: formDays, from: formFrom, to: formTo, discount: parseInt(formDiscount) || 0 }
            : h
        )
      );
      toast.success("Happy hour updated");
    } else {
      setHappyHours((prev) => [
        ...prev,
        { id: generateId(), name: formName, days: formDays, from: formFrom, to: formTo, discount: parseInt(formDiscount) || 0, active: true },
      ]);
      toast.success("Happy hour added");
    }
    setDialogOpen(false);
  };

  const toggleDay = (d: number) => {
    setFormDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  return (
    <div className="space-y-5">
      <HappyHourTimeline happyHours={happyHours} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{happyHours.length} schedule{happyHours.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Add happy hour
        </Button>
      </div>

      <div className="space-y-3">
        {happyHours.map((hh, idx) => {
          const color = HH_COLORS[idx % HH_COLORS.length] ?? "#7C3AED";
          return (
            <Card key={hh.id} className={cn(!hh.active && "opacity-60")}>
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className="h-10 w-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{hh.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {hh.discount}% off
                    </Badge>
                    {!hh.active && (
                      <Badge variant="outline" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {hh.from}–{hh.to}
                    </span>
                    <span>
                      {hh.days.length === 7
                        ? "Every day"
                        : hh.days.map((d) => DAY_LABELS[d]).join(", ")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch
                    checked={hh.active}
                    onCheckedChange={(v) =>
                      setHappyHours((prev) =>
                        prev.map((h) => (h.id === hh.id ? { ...h, active: v } : h))
                      )
                    }
                    size="sm"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" size="icon-sm" />
                    }>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEdit(hh)}>
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setHappyHours((prev) => prev.filter((h) => h.id !== hh.id));
                            toast.success("Happy hour deleted");
                          }}
                        >
                          <Trash2 className="size-4" />
                          Delete
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editHH ? "Edit Happy Hour" : "Add Happy Hour"}</DialogTitle>
            <DialogDescription>
              Set up a time-based discount schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="hh-name">Name</Label>
              <Input
                id="hh-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Lunch Deal"
              />
            </div>
            <div className="space-y-2">
              <Label>Days</Label>
              <div className="flex flex-wrap gap-2">
                {DAY_FULL.map((label, idx) => (
                  <label key={idx} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={formDays.includes(idx)}
                      onCheckedChange={() => toggleDay(idx)}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hh-from">From</Label>
                <Input
                  id="hh-from"
                  type="time"
                  value={formFrom}
                  onChange={(e) => setFormFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hh-to">To</Label>
                <Input
                  id="hh-to"
                  type="time"
                  value={formTo}
                  onChange={(e) => setFormTo(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hh-discount">Discount (%)</Label>
              <Input
                id="hh-discount"
                type="number"
                min={1}
                max={100}
                value={formDiscount}
                onChange={(e) => setFormDiscount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Applies to</Label>
              <Select value={formAppliesTo} onValueChange={(v) => setFormAppliesTo(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All items</SelectItem>
                  <SelectItem value="category">Specific category</SelectItem>
                  <SelectItem value="items">Specific items</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleSave}>{editHH ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab 3: Promo Banner ──────────────────────────────────────────────────────

function PromoBannerTab() {
  const [banner, setBanner] = useState<PromoBanner>({
    enabled: true,
    text: "Happy Hour: 20% off all items 5-7PM!",
    bg_color: "#7C3AED",
    text_color: "#FFFFFF",
    show_on: "all",
    cta_text: "Order now",
    schedule: "always",
    from_date: "",
    to_date: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Promo banner saved");
    }, 700);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Live preview */}
      <div className="space-y-2">
        <Label>Live preview</Label>
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl px-5 py-3 transition-all",
            !banner.enabled && "opacity-40"
          )}
          style={{ backgroundColor: banner.bg_color }}
        >
          <p
            className="text-sm font-medium flex-1 min-w-0 truncate"
            style={{ color: banner.text_color }}
          >
            {banner.text || "Your promo message will appear here"}
          </p>
          {banner.cta_text && (
            <span
              className="flex-shrink-0 rounded-lg border px-3 py-1 text-xs font-semibold cursor-pointer"
              style={{ borderColor: banner.text_color, color: banner.text_color }}
            >
              {banner.cta_text}
            </span>
          )}
        </div>
      </div>

      <Separator />

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Enable banner</p>
          <p className="text-xs text-muted-foreground mt-0.5">Show this banner on the customer menu</p>
        </div>
        <Switch
          checked={banner.enabled}
          onCheckedChange={(v) => setBanner((b) => ({ ...b, enabled: v }))}
          size="sm"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="banner-text">Banner text</Label>
          <span className="text-xs text-muted-foreground">
            {banner.text.length}/80
          </span>
        </div>
        <Input
          id="banner-text"
          value={banner.text}
          onChange={(e) => {
            if (e.target.value.length <= 80) {
              setBanner((b) => ({ ...b, text: e.target.value }));
            }
          }}
          maxLength={80}
          placeholder="e.g. Happy Hour: 20% off all items 5-7PM!"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Background colour</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={banner.bg_color}
              onChange={(e) => setBanner((b) => ({ ...b, bg_color: e.target.value }))}
              className="h-9 w-14 cursor-pointer rounded-lg border border-input bg-transparent p-1 outline-none"
            />
            <Input
              value={banner.bg_color}
              onChange={(e) => {
                if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                  setBanner((b) => ({ ...b, bg_color: e.target.value }));
                }
              }}
              className="w-28 font-mono"
              maxLength={7}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Text colour</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={banner.text_color}
              onChange={(e) => setBanner((b) => ({ ...b, text_color: e.target.value }))}
              className="h-9 w-14 cursor-pointer rounded-lg border border-input bg-transparent p-1 outline-none"
            />
            <Input
              value={banner.text_color}
              onChange={(e) => {
                if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                  setBanner((b) => ({ ...b, text_color: e.target.value }));
                }
              }}
              className="w-28 font-mono"
              maxLength={7}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Show on</Label>
        <Select
          value={banner.show_on}
          onValueChange={(v) => setBanner((b) => ({ ...b, show_on: v as string }))}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All pages</SelectItem>
            <SelectItem value="menu">Menu page only</SelectItem>
            <SelectItem value="landing">Landing page only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="banner-cta">CTA button text — optional</Label>
        <Input
          id="banner-cta"
          value={banner.cta_text}
          onChange={(e) => setBanner((b) => ({ ...b, cta_text: e.target.value }))}
          placeholder="e.g. Order now"
          className="w-56"
        />
      </div>

      <div className="space-y-3">
        <Label>Schedule</Label>
        <div className="flex flex-col gap-2">
          {[
            { value: "always", label: "Always visible" },
            { value: "dates",  label: "Specific date range" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors",
                banner.schedule === opt.value
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              )}
            >
              <input
                type="radio"
                name="banner-schedule"
                checked={banner.schedule === opt.value}
                onChange={() => setBanner((b) => ({ ...b, schedule: opt.value as PromoBanner["schedule"] }))}
                className="accent-primary"
              />
              <span className="text-sm font-medium">{opt.label}</span>
            </label>
          ))}
        </div>

        {banner.schedule === "dates" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="banner-from">From</Label>
              <Input
                id="banner-from"
                type="date"
                value={banner.from_date}
                onChange={(e) => setBanner((b) => ({ ...b, from_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="banner-to">To</Label>
              <Input
                id="banner-to"
                type="date"
                value={banner.to_date}
                onChange={(e) => setBanner((b) => ({ ...b, to_date: e.target.value }))}
              />
            </div>
          </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <>
            <span className="size-4 animate-spin border-2 border-white/30 border-t-white rounded-full" />
            Saving…
          </>
        ) : (
          "Save banner"
        )}
      </Button>
    </div>
  );
}

// ─── Tab 4: Upsell Prompts ────────────────────────────────────────────────────

function UpsellTab() {
  const [upsells, setUpsells] = useState<Upsell[]>(INITIAL_UPSELLS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formTrigger, setFormTrigger] = useState("i1");
  const [formSuggest, setFormSuggest] = useState("i4");

  // Min order upsell state
  const [minOrderThreshold, setMinOrderThreshold] = useState("30");
  const [minOrderItem, setMinOrderItem] = useState("i4");

  const handleAddUpsell = () => {
    if (formTrigger === formSuggest) {
      toast.error("Trigger and suggestion must be different items");
      return;
    }
    const triggerItem = MOCK_ITEMS.find((i) => i.id === formTrigger);
    const suggestItem = MOCK_ITEMS.find((i) => i.id === formSuggest);
    if (!triggerItem || !suggestItem) return;

    setUpsells((prev) => [
      ...prev,
      {
        id: generateId(),
        trigger_item: formTrigger,
        trigger_name: triggerItem.name,
        suggest_item: formSuggest,
        suggest_name: suggestItem.name,
        active: true,
      },
    ]);
    toast.success("Upsell added");
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Upsell Prompts</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Suggest items to customers when they add a specific item to their cart.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Add upsell
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ArrowUpDown className="size-3" />
                    When customer adds…
                  </div>
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Suggest</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Active</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {upsells.map((u) => (
                <tr key={u.id} className={cn("hover:bg-muted/30 transition-colors", !u.active && "opacity-50")}>
                  <td className="px-4 py-3">
                    <span className="font-medium">{u.trigger_name}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.suggest_name}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Switch
                      checked={u.active}
                      onCheckedChange={(v) =>
                        setUpsells((prev) =>
                          prev.map((x) => (x.id === u.id ? { ...x, active: v } : x))
                        )
                      }
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setUpsells((prev) => prev.filter((x) => x.id !== u.id));
                        toast.success("Upsell removed");
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {upsells.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No upsell prompts configured. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Min order upsell */}
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-amber-500" />
          <p className="text-sm font-semibold">Min order upsell</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Suggest an item when the cart reaches a minimum order value.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="min-threshold">When cart reaches ($)</Label>
            <Input
              id="min-threshold"
              type="number"
              min={0}
              value={minOrderThreshold}
              onChange={(e) => setMinOrderThreshold(e.target.value)}
              className="w-32"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Suggest item</Label>
            <Select value={minOrderItem} onValueChange={(v) => setMinOrderItem(v as string)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_ITEMS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => toast.success("Min order upsell saved")}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Add upsell dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Upsell Prompt</DialogTitle>
            <DialogDescription>
              When a customer adds the trigger item, suggest another item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Trigger item</Label>
              <Select value={formTrigger} onValueChange={(v) => setFormTrigger(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select trigger item" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_ITEMS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Suggest item</Label>
              <Select value={formSuggest} onValueChange={(v) => setFormSuggest(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select item to suggest" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_ITEMS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleAddUpsell}>Add upsell</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PromotionsPage() {
  return (
    <div className="max-w-5xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Marketing &amp; Promotions</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Drive revenue with discounts, happy hours, banners, and smart upsells.
        </p>
      </div>

      <Tabs defaultValue="discount-rules">
        <TabsList>
          <TabsTrigger value="discount-rules">
            <Zap className="size-4" />
            Discount Rules
          </TabsTrigger>
          <TabsTrigger value="happy-hour">
            <Clock className="size-4" />
            Happy Hour
          </TabsTrigger>
          <TabsTrigger value="promo-banner">
            <Megaphone className="size-4" />
            Promo Banner
          </TabsTrigger>
          <TabsTrigger value="upsell">
            <ArrowUpDown className="size-4" />
            Upsell Prompts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discount-rules" className="mt-6">
          <DiscountRulesTab />
        </TabsContent>

        <TabsContent value="happy-hour" className="mt-6">
          <HappyHourTab />
        </TabsContent>

        <TabsContent value="promo-banner" className="mt-6">
          <PromoBannerTab />
        </TabsContent>

        <TabsContent value="upsell" className="mt-6">
          <UpsellTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
