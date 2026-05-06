"use client";

import { useState, useEffect, useId } from "react";
import { toast } from "sonner";
import {
  Plus, Trash2, Loader2, GripVertical, ChevronDown, ChevronUp,
  Package, Scale, Layers, DollarSign, Image as ImageIcon,
  Check, Info, Languages,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { cn, formatPrice, generateId } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type {
  Item, Category, ItemTag, Allergen, DietaryTag,
  ItemType, WeightUnit, ComboComponent, ModifierGroup, ModifierOption,
  ItemVariant, TaxCategory, KitchenStation,
} from "@/types";
import { mockItems } from "@/mock/menu";

// ─── Props ────────────────────────────────────────────────────────────────────

interface MenuItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  categories: Category[];
  defaultCategoryId?: string;
  onSave: (item: Item) => void;
  onDelete?: (itemId: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_TYPES: { id: ItemType; label: string; desc: string; icon: React.ElementType }[] = [
  { id: "standard", label: "Standard",      desc: "Fixed price per unit",           icon: Package },
  { id: "weighted", label: "By weight",     desc: "Price per gram / kg / portion",  icon: Scale },
  { id: "combo",    label: "Combo / Deal",  desc: "Bundle of items at one price",   icon: Layers },
  { id: "variable", label: "Market price",  desc: "Staff sets price at order time", icon: DollarSign },
];

const WEIGHT_UNITS: WeightUnit[] = ["g", "100g", "kg", "oz", "lb", "ml", "L", "portion"];

const ALL_TAGS: { id: ItemTag; label: string; color: string }[] = [
  { id: "popular",    label: "Popular",     color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  { id: "new",        label: "New",         color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { id: "bestseller", label: "Bestseller",  color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { id: "spicy",      label: "Spicy",       color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  { id: "vegan",      label: "Vegan",       color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { id: "halal",      label: "Halal",       color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { id: "chefs_pick", label: "Chef's Pick", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
];

const ALL_ALLERGENS: { id: Allergen; label: string }[] = [
  { id: "gluten",       label: "Gluten" },
  { id: "crustaceans",  label: "Crustaceans" },
  { id: "eggs",         label: "Eggs" },
  { id: "fish",         label: "Fish" },
  { id: "peanuts",      label: "Peanuts" },
  { id: "soy",          label: "Soy" },
  { id: "dairy",        label: "Dairy" },
  { id: "nuts",         label: "Tree Nuts" },
  { id: "celery",       label: "Celery" },
  { id: "mustard",      label: "Mustard" },
  { id: "sesame",       label: "Sesame" },
  { id: "sulfites",     label: "Sulphites" },
  { id: "lupin",        label: "Lupin" },
  { id: "molluscs",     label: "Molluscs" },
];

const ALL_DIETARY: { id: DietaryTag; label: string }[] = [
  { id: "vegetarian",  label: "Vegetarian" },
  { id: "vegan",       label: "Vegan" },
  { id: "halal",       label: "Halal certified" },
  { id: "kosher",      label: "Kosher" },
  { id: "gluten_free", label: "Gluten-free" },
  { id: "dairy_free",  label: "Dairy-free" },
  { id: "nut_free",    label: "Nut-free" },
  { id: "low_carb",    label: "Low carb" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TAX_CATEGORIES: { id: TaxCategory; label: string; desc: string }[] = [
  { id: "standard",  label: "Standard rate",  desc: "Full VAT / sales tax" },
  { id: "reduced",   label: "Reduced rate",   desc: "e.g. 5% food-to-eat-in" },
  { id: "zero",      label: "Zero rated",     desc: "0% — e.g. cold takeaway food" },
  { id: "alcohol",   label: "Alcohol",        desc: "Alcoholic beverages rate" },
  { id: "tobacco",   label: "Tobacco",        desc: "Tobacco products rate" },
  { id: "exempt",    label: "Exempt",         desc: "Outside tax scope" },
];

const KITCHEN_STATIONS: { id: KitchenStation; label: string }[] = [
  { id: "default", label: "Default (unrouted)" },
  { id: "grill",   label: "Grill station" },
  { id: "fryer",   label: "Fryer station" },
  { id: "cold",    label: "Cold / Prep station" },
  { id: "bar",     label: "Bar" },
  { id: "pizza",   label: "Pizza station" },
  { id: "bakery",  label: "Bakery / Pastry" },
  { id: "expo",    label: "Expo / Pass" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDollar(minor: number) { return (minor / 100).toFixed(2); }
function toMinor(s: string)      { return Math.round((parseFloat(s) || 0) * 100); }

function blankGroup(itemId: string): ModifierGroup {
  return {
    id: generateId(),
    item_id: itemId,
    name: "",
    is_required: false,
    min_selections: 0,
    max_selections: 1,
    sort_order: 0,
    options: [],
  };
}

function blankOption(groupId: string): ModifierOption {
  return {
    id: generateId(),
    group_id: groupId,
    name: "",
    price_delta: 0,
    is_default: false,
    is_available: true,
    sort_order: 0,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{children}</h3>;
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm font-medium">{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">({hint})</span>}
      </div>
      {children}
    </div>
  );
}

// Modifier option row
function OptionRow({
  option,
  onChange,
  onRemove,
}: {
  option: ModifierOption;
  onChange: (o: ModifierOption) => void;
  onRemove: () => void;
}) {
  const deltaDisplay = option.price_delta === 0 ? "" : toDollar(Math.abs(option.price_delta));

  return (
    <div className="flex items-center gap-2 py-1.5">
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0 cursor-grab" />
      <Input
        placeholder="Option name (e.g. Large)"
        value={option.name}
        onChange={(e) => onChange({ ...option, name: e.target.value })}
        className="h-8 flex-1 text-sm"
      />
      <Input
        placeholder="بالعربية"
        value={option.name_ar ?? ""}
        onChange={(e) => onChange({ ...option, name_ar: e.target.value })}
        className="h-8 w-24 text-sm text-right text-muted-foreground"
        dir="rtl"
      />
      <div className="flex items-center gap-1 w-28 flex-shrink-0">
        <Select
          value={option.price_delta >= 0 ? "add" : "sub"}
          onValueChange={(v) =>
            onChange({ ...option, price_delta: Math.abs(option.price_delta) * (v === "sub" ? -1 : 1) })
          }
        >
          <SelectTrigger className="h-8 w-16 text-xs px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add">+</SelectItem>
            <SelectItem value="sub">−</SelectItem>
            <SelectItem value="free">Free</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="0.00"
          value={deltaDisplay}
          onChange={(e) => {
            const sign = option.price_delta < 0 ? -1 : 1;
            onChange({ ...option, price_delta: toMinor(e.target.value) * sign });
          }}
          className="h-8 w-16 text-sm text-right"
          disabled={option.price_delta === 0 && !deltaDisplay}
        />
      </div>
      <label className="flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer flex-shrink-0">
        <Checkbox
          checked={option.is_default}
          onCheckedChange={(v) => onChange({ ...option, is_default: Boolean(v) })}
          className="h-3.5 w-3.5"
        />
        Default
      </label>
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// Modifier group card
function ModifierGroupCard({
  group,
  onChange,
  onRemove,
}: {
  group: ModifierGroup;
  onChange: (g: ModifierGroup) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const addOption = () =>
    onChange({ ...group, options: [...group.options, blankOption(group.id)] });

  const updateOption = (idx: number, opt: ModifierOption) =>
    onChange({ ...group, options: group.options.map((o, i) => (i === idx ? opt : o)) });

  const removeOption = (idx: number) =>
    onChange({ ...group, options: group.options.filter((_, i) => i !== idx) });

  const isMulti = (group.max_selections ?? 1) > 1;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Group header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/30">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 cursor-grab flex-shrink-0" />
        <Input
          placeholder="Group name (e.g. Size, Toppings, Sauce)"
          value={group.name}
          onChange={(e) => onChange({ ...group, name: e.target.value })}
          className="h-7 flex-1 text-sm bg-transparent border-0 shadow-none px-0 focus-visible:ring-0"
        />
        <Input
          placeholder="الاسم بالعربية"
          value={group.name_ar ?? ""}
          onChange={(e) => onChange({ ...group, name_ar: e.target.value })}
          className="h-7 w-32 text-sm text-right bg-transparent border-0 border-l rounded-none shadow-none px-2 focus-visible:ring-0 text-muted-foreground"
          dir="rtl"
        />
        <div className="flex items-center gap-3 flex-shrink-0">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <Checkbox
              checked={group.is_required}
              onCheckedChange={(v) => onChange({ ...group, is_required: Boolean(v) })}
              className="h-3.5 w-3.5"
            />
            Required
          </label>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <Checkbox
              checked={isMulti}
              onCheckedChange={(v) =>
                onChange({ ...group, max_selections: v ? 5 : 1, min_selections: v ? 0 : group.is_required ? 1 : 0 })
              }
              className="h-3.5 w-3.5"
            />
            Multi-select
          </label>
          {isMulti && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Max:</span>
              <Input
                type="number"
                min={1}
                max={20}
                value={group.max_selections ?? 5}
                onChange={(e) => onChange({ ...group, max_selections: parseInt(e.target.value) || 1 })}
                className="h-6 w-12 text-xs text-center"
              />
            </div>
          )}
          <button type="button" onClick={() => setExpanded((v) => !v)} className="text-muted-foreground">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Options */}
      {expanded && (
        <div className="px-3 pb-2">
          {group.options.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No options yet — add one below.</p>
          )}
          {group.options.map((opt, i) => (
            <OptionRow
              key={opt.id}
              option={opt}
              onChange={(o) => updateOption(i, o)}
              onRemove={() => removeOption(i)}
            />
          ))}
          <button
            type="button"
            onClick={addOption}
            className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> Add option
          </button>
        </div>
      )}
    </div>
  );
}

// Combo component row
function ComboComponentRow({
  comp,
  categories,
  onChange,
  onRemove,
}: {
  comp: ComboComponent;
  categories: Category[];
  onChange: (c: ComboComponent) => void;
  onRemove: () => void;
}) {
  const catItems = mockItems.filter((i) => !comp.category_id || i.category_id === comp.category_id);

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Input
          placeholder='Slot label (e.g. "Choose your burger")'
          value={comp.label}
          onChange={(e) => onChange({ ...comp, label: e.target.value })}
          className="h-8 text-sm flex-1"
        />
        <label className="flex items-center gap-1.5 text-xs flex-shrink-0 cursor-pointer">
          <Checkbox
            checked={comp.is_required}
            onCheckedChange={(v) => onChange({ ...comp, is_required: Boolean(v) })}
            className="h-3.5 w-3.5"
          />
          Required
        </label>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={comp.category_id ?? ""}
          onValueChange={(v) => onChange({ ...comp, category_id: v || undefined, item_id: undefined })}
        >
          <SelectTrigger className="h-8 flex-1 text-sm">
            <SelectValue placeholder="From category…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any category</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={comp.item_id ?? ""}
          onValueChange={(v) => onChange({ ...comp, item_id: v || undefined })}
        >
          <SelectTrigger className="h-8 flex-1 text-sm">
            <SelectValue placeholder="Specific item (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any item</SelectItem>
            {catItems.map((i) => (
              <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-muted-foreground">Qty:</span>
          <Input
            type="number"
            min={1}
            max={10}
            value={comp.quantity}
            onChange={(e) => onChange({ ...comp, quantity: parseInt(e.target.value) || 1 })}
            className="h-8 w-14 text-sm text-center"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MenuItemSheet({
  open,
  onOpenChange,
  item,
  categories,
  defaultCategoryId,
  onSave,
  onDelete,
}: MenuItemSheetProps) {
  const uid = useId();
  const t = useT();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // ── Form state ──
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId]   = useState("");
  const [itemType, setItemType]       = useState<ItemType>("standard");

  // Standard pricing
  const [price, setPrice]             = useState("");
  const [cost, setCost]               = useState("");

  // Weighted pricing
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [weightUnit, setWeightUnit]     = useState<WeightUnit>("100g");
  const [minWeight, setMinWeight]       = useState("");

  // Combo
  const [comboPrice, setComboPrice]         = useState("");
  const [comboComponents, setComboComponents] = useState<ComboComponent[]>([]);

  // Modifiers
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);

  // Availability
  const [isAvailable, setIsAvailable]   = useState(true);
  const [prepTime, setPrepTime]         = useState("");
  const [calories, setCalories]         = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo]   = useState("");
  const [availableDays, setAvailableDays] = useState<number[]>([0,1,2,3,4,5,6]);
  const [stockTracked, setStockTracked] = useState(false);
  const [stockQty, setStockQty]         = useState("");

  // Classification
  const [tags, setTags]         = useState<ItemTag[]>([]);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [dietary, setDietary]   = useState<DietaryTag[]>([]);

  // Variants
  const [variants, setVariants] = useState<ItemVariant[]>([]);

  // Advanced
  const [taxCategory, setTaxCategory]         = useState<TaxCategory>("standard");
  const [kitchenStation, setKitchenStation]   = useState<KitchenStation>("default");
  const [sku, setSku]                         = useState("");
  const [ageRestricted, setAgeRestricted]     = useState(false);
  const [discountEligible, setDiscountEligible] = useState(true);
  const [loyaltyOverride, setLoyaltyOverride] = useState("");

  // Image slots
  const [images, setImages] = useState<(string | null)[]>([null, null, null, null, null]);

  // Arabic translations
  const [nameAr, setNameAr]               = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");

  // Reset form when item changes
  useEffect(() => {
    if (!open) return;
    setActiveTab("details");
    if (item) {
      setName(item.name);
      setDescription(item.description ?? "");
      setCategoryId(item.category_id);
      setItemType(item.item_type ?? "standard");
      setPrice(toDollar(item.price));
      setCost(item.cost ? toDollar(item.cost) : "");
      setPricePerUnit(item.price_per_unit ? toDollar(item.price_per_unit) : "");
      setWeightUnit(item.weight_unit ?? "100g");
      setMinWeight(item.min_weight ? String(item.min_weight) : "");
      setComboPrice(item.combo_price ? toDollar(item.combo_price) : "");
      setComboComponents(item.combo_components ?? []);
      setModifierGroups(item.modifier_groups ?? []);
      setIsAvailable(item.is_available);
      setPrepTime(item.prep_time ? String(item.prep_time) : "");
      setCalories(item.calories ? String(item.calories) : "");
      setAvailableFrom(item.available_from ?? "");
      setAvailableTo(item.available_to ?? "");
      setAvailableDays(item.available_days ?? [0,1,2,3,4,5,6]);
      setStockTracked(item.stock_tracked);
      setStockQty(item.stock_quantity ? String(item.stock_quantity) : "");
      setTags(item.tags);
      setAllergens(item.allergens);
      setDietary(item.dietary);
      setImages([...item.image_urls.slice(0, 5), ...Array(5).fill(null)].slice(0, 5) as (string | null)[]);
      setNameAr(item.translations?.ar?.name ?? "");
      setDescriptionAr(item.translations?.ar?.description ?? "");
      setVariants(item.variants ?? []);
      setTaxCategory(item.tax_category ?? "standard");
      setKitchenStation(item.kitchen_station ?? "default");
      setSku(item.sku ?? "");
      setAgeRestricted(item.age_restricted ?? false);
      setDiscountEligible(item.discount_eligible ?? true);
      setLoyaltyOverride(item.loyalty_points_override != null ? String(item.loyalty_points_override) : "");
    } else {
      setName(""); setDescription(""); setCategoryId(defaultCategoryId ?? categories[0]?.id ?? "");
      setItemType("standard"); setPrice(""); setCost(""); setPricePerUnit("");
      setWeightUnit("100g"); setMinWeight(""); setComboPrice(""); setComboComponents([]);
      setModifierGroups([]); setIsAvailable(true); setPrepTime(""); setCalories("");
      setAvailableFrom(""); setAvailableTo(""); setAvailableDays([0,1,2,3,4,5,6]);
      setStockTracked(false); setStockQty(""); setTags([]); setAllergens([]); setDietary([]);
      setImages([null, null, null, null, null]);
      setVariants([]); setTaxCategory("standard"); setKitchenStation("default");
      setSku(""); setAgeRestricted(false); setDiscountEligible(true); setLoyaltyOverride("");
      setNameAr(""); setDescriptionAr("");
    }
  }, [open, item, defaultCategoryId, categories]);

  function toggleArrayItem<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("Item name is required"); setActiveTab("details"); return; }
    if (!categoryId)  { toast.error("Please select a category"); setActiveTab("details"); return; }
    if (itemType === "standard" && !price) { toast.error("Please enter a price"); setActiveTab("pricing"); return; }
    if (itemType === "weighted" && !pricePerUnit) { toast.error("Please enter a price per unit"); setActiveTab("pricing"); return; }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);

    const basePrice =
      itemType === "standard" ? toMinor(price) :
      itemType === "weighted"  ? toMinor(pricePerUnit) :
      itemType === "combo"     ? toMinor(comboPrice) :
      0;

    const saved: Item = {
      id: item?.id ?? generateId(),
      tenant_id: "t1",
      category_id: categoryId,
      name: name.trim(),
      description: description || undefined,
      price: basePrice,
      cost: cost ? toMinor(cost) : undefined,
      prep_time: prepTime ? parseInt(prepTime) : undefined,
      calories: calories ? parseInt(calories) : undefined,
      image_urls: images.filter(Boolean) as string[],
      is_available: isAvailable,
      stock_tracked: stockTracked,
      stock_quantity: stockTracked && stockQty ? parseInt(stockQty) : undefined,
      available_from: availableFrom || undefined,
      available_to: availableTo || undefined,
      available_days: availableDays.length < 7 ? availableDays : undefined,
      tags, allergens, dietary,
      sort_order: item?.sort_order ?? 0,
      // Enterprise fields
      item_type: itemType !== "standard" ? itemType : undefined,
      weight_unit: itemType === "weighted" ? weightUnit : undefined,
      price_per_unit: itemType === "weighted" ? toMinor(pricePerUnit) : undefined,
      min_weight: itemType === "weighted" && minWeight ? parseFloat(minWeight) : undefined,
      combo_price: itemType === "combo" ? toMinor(comboPrice) : undefined,
      combo_components: itemType === "combo" ? comboComponents : undefined,
      modifier_groups: modifierGroups.length > 0 ? modifierGroups : undefined,
      variants: variants.length > 0 ? variants : undefined,
      tax_category: taxCategory !== "standard" ? taxCategory : undefined,
      kitchen_station: kitchenStation !== "default" ? kitchenStation : undefined,
      sku: sku || undefined,
      age_restricted: ageRestricted || undefined,
      discount_eligible: discountEligible ? undefined : false,
      loyalty_points_override: loyaltyOverride ? parseInt(loyaltyOverride) : undefined,
      translations: (nameAr || descriptionAr) ? {
        ...item?.translations,
        ar: { name: nameAr || name.trim(), description: descriptionAr || undefined },
      } : item?.translations,
    };

    onSave(saved);
    onOpenChange(false);
    toast.success(item ? "Item updated" : "Item created");
  }

  function handleDelete() {
    if (!item || !onDelete) return;
    onDelete(item.id);
    onOpenChange(false);
    toast.success("Item deleted");
  }

  const addModifierGroup = () =>
    setModifierGroups((prev) => [...prev, blankGroup(item?.id ?? "new")]);

  const updateModifierGroup = (idx: number, g: ModifierGroup) =>
    setModifierGroups((prev) => prev.map((gr, i) => (i === idx ? g : gr)));

  const removeModifierGroup = (idx: number) =>
    setModifierGroups((prev) => prev.filter((_, i) => i !== idx));

  const addComboComponent = () =>
    setComboComponents((prev) => [
      ...prev,
      { id: generateId(), label: "", quantity: 1, is_required: true },
    ]);

  // ── Render ──

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex flex-col p-0 w-full sm:w-[680px] max-w-[95vw]"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">
              {item ? "Edit item" : "New item"}
            </SheetTitle>
            {item && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 gap-1.5"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 min-h-0"
        >
          <TabsList className="flex-shrink-0 mx-5 mt-3 mb-0 h-9 bg-muted rounded-lg p-1 grid grid-cols-7">
            <TabsTrigger value="details"      className="text-xs rounded-md">Details</TabsTrigger>
            <TabsTrigger value="bilingual"    className="text-xs rounded-md flex items-center gap-1"><Languages className="h-3 w-3" />AR</TabsTrigger>
            <TabsTrigger value="pricing"      className="text-xs rounded-md">Pricing</TabsTrigger>
            <TabsTrigger value="variants"     className="text-xs rounded-md">Variants</TabsTrigger>
            <TabsTrigger value="attributes"   className="text-xs rounded-md">Dietary</TabsTrigger>
            <TabsTrigger value="availability" className="text-xs rounded-md">Stock</TabsTrigger>
            <TabsTrigger value="advanced"     className="text-xs rounded-md">Advanced</TabsTrigger>
          </TabsList>

          {/* ── DETAILS TAB ── */}
          <TabsContent value="details" className="flex-1 overflow-y-auto px-5 pt-4 pb-24 space-y-5 mt-0">
            <FieldRow label="Item name" hint="required">
              <Input
                id={`${uid}-name`}
                placeholder="e.g. Margherita Pizza"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10"
              />
            </FieldRow>

            <FieldRow label="Description">
              <Textarea
                placeholder="What makes this item special?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </FieldRow>

            <FieldRow label="Category" hint="required">
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v as string)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>

            <Separator />

            {/* Image slots */}
            <div>
              <SectionTitle>Photos</SectionTitle>
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toast.info("Image upload coming soon")}
                    className={cn(
                      "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors hover:border-primary/50 hover:bg-accent/30",
                      img ? "border-border" : "border-muted-foreground/30"
                    )}
                  >
                    {img
                      ? <img src={img} alt="" className="h-full w-full object-cover rounded-lg" />
                      : <>
                          <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                          <span className="text-[10px] text-muted-foreground/50 mt-1">{i === 0 ? "Main" : `#${i + 1}`}</span>
                        </>
                    }
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">First image is shown in listings. Drag to reorder (coming soon).</p>
            </div>

            {/* Tags */}
            <div>
              <SectionTitle>Menu tags</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {ALL_TAGS.map(({ id, label, color }) => {
                  const active = tags.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTags(toggleArrayItem(tags, id))}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border-2 transition-all",
                        active ? `${color} border-current` : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {active && <Check className="h-2.5 w-2.5" />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ── BILINGUAL TAB ── */}
          <TabsContent value="bilingual" className="flex-1 overflow-y-auto px-5 pt-4 pb-24 space-y-5 mt-0">
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
              <Languages className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{t.bil_bilingualHint}</p>
            </div>

            <FieldRow label={t.bil_arabicName}>
              <Input
                placeholder={t.bil_arabicNamePlaceholder}
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="h-10 text-right font-arabic"
                dir="rtl"
              />
            </FieldRow>

            <FieldRow label={t.bil_arabicDesc}>
              <Textarea
                placeholder={t.bil_arabicDescPlaceholder}
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                rows={4}
                className="resize-none text-right font-arabic"
                dir="rtl"
              />
            </FieldRow>

            <Separator />

            <div className="space-y-3">
              <SectionTitle>Preview</SectionTitle>
              {(nameAr || descriptionAr) ? (
                <div className="rounded-xl border border-border bg-card p-4 space-y-1 text-right" dir="rtl">
                  <p className="font-semibold text-base">{nameAr || name}</p>
                  {descriptionAr && <p className="text-sm text-muted-foreground">{descriptionAr}</p>}
                  {!nameAr && !descriptionAr && (
                    <p className="text-xs text-muted-foreground italic text-left" dir="ltr">No Arabic content yet.</p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Fill in the fields above to see a preview.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── PRICING TAB ── */}
          <TabsContent value="pricing" className="flex-1 overflow-y-auto px-5 pt-4 pb-24 space-y-5 mt-0">
            {/* Item type selector */}
            <div>
              <SectionTitle>Item type</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {ITEM_TYPES.map(({ id, label, desc, icon: Icon }) => {
                  const active = itemType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setItemType(id)}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all",
                        active ? "border-primary bg-primary/[0.06]" : "border-border hover:border-primary/40 hover:bg-accent/20"
                      )}
                    >
                      <div className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg mt-0.5",
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={cn("text-sm font-semibold", active && "text-primary")}>{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Standard pricing */}
            {(itemType === "standard" || itemType === "variable") && (
              <div className="space-y-4">
                <SectionTitle>{itemType === "variable" ? "Display price (optional)" : "Price"}</SectionTitle>
                {itemType === "variable" && (
                  <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
                    <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">Staff sets the final price at order time. Display price is shown as a guide (e.g. "From $12").</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <FieldRow label={itemType === "variable" ? "Display price" : "Selling price"} hint={itemType === "variable" ? "optional" : "required"}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="h-10 pl-7" type="number" step="0.01" min="0" />
                    </div>
                  </FieldRow>
                  <FieldRow label="Cost price" hint="hidden from customers">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" className="h-10 pl-7" type="number" step="0.01" min="0" />
                    </div>
                  </FieldRow>
                </div>
              </div>
            )}

            {/* Weighted pricing */}
            {itemType === "weighted" && (
              <div className="space-y-4">
                <SectionTitle>Weight-based pricing</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <FieldRow label="Price per unit" hint="required">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} placeholder="0.00" className="h-10 pl-7" type="number" step="0.01" min="0" />
                    </div>
                  </FieldRow>
                  <FieldRow label="Unit">
                    <Select value={weightUnit} onValueChange={(v) => setWeightUnit(v as WeightUnit)}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {WEIGHT_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                </div>
                <FieldRow label="Minimum order" hint="optional">
                  <div className="relative">
                    <Input value={minWeight} onChange={(e) => setMinWeight(e.target.value)} placeholder={`e.g. 100 (${weightUnit})`} className="h-10" type="number" min="0" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{weightUnit}</span>
                  </div>
                </FieldRow>
                {pricePerUnit && (
                  <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    Example: 500{weightUnit} = <span className="font-medium text-foreground">{formatPrice(toMinor(pricePerUnit) * 5)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Combo pricing */}
            {itemType === "combo" && (
              <div className="space-y-4">
                <SectionTitle>Combo / Deal</SectionTitle>
                <FieldRow label="Bundle price">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input value={comboPrice} onChange={(e) => setComboPrice(e.target.value)} placeholder="0.00" className="h-10 pl-7" type="number" step="0.01" min="0" />
                  </div>
                </FieldRow>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Combo slots</span>
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addComboComponent}>
                      <Plus className="h-3 w-3" /> Add slot
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {comboComponents.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                        Add slots — e.g. "Choose a burger", "Choose a side", "Choose a drink"
                      </p>
                    )}
                    {comboComponents.map((comp, i) => (
                      <ComboComponentRow
                        key={comp.id}
                        comp={comp}
                        categories={categories}
                        onChange={(c) => setComboComponents((prev) => prev.map((cc, ci) => ci === i ? c : cc))}
                        onRemove={() => setComboComponents((prev) => prev.filter((_, ci) => ci !== i))}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Modifier groups */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionTitle>Modifiers & Add-ons</SectionTitle>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addModifierGroup}>
                  <Plus className="h-3 w-3" /> Add group
                </Button>
              </div>
              <div className="space-y-3">
                {modifierGroups.length === 0 && (
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 text-center">
                    <p className="text-xs text-muted-foreground">No modifier groups. Add one to let customers customise this item.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Examples: Size · Crust · Toppings · Sauce · Ice level · Spice level</p>
                  </div>
                )}
                {modifierGroups.map((g, i) => (
                  <ModifierGroupCard
                    key={g.id}
                    group={g}
                    onChange={(gr) => updateModifierGroup(i, gr)}
                    onRemove={() => removeModifierGroup(i)}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── DIETARY / ALLERGENS TAB ── */}
          <TabsContent value="attributes" className="flex-1 overflow-y-auto px-5 pt-4 pb-24 space-y-6 mt-0">
            <div>
              <SectionTitle>Allergens (EU-14)</SectionTitle>
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                {ALL_ALLERGENS.map(({ id, label }) => (
                  <label key={id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={allergens.includes(id)}
                      onCheckedChange={() => setAllergens(toggleArrayItem(allergens, id))}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
              {allergens.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {allergens.map((a) => (
                    <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <SectionTitle>Dietary flags</SectionTitle>
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                {ALL_DIETARY.map(({ id, label }) => (
                  <label key={id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={dietary.includes(id)}
                      onCheckedChange={() => setDietary(toggleArrayItem(dietary, id))}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── AVAILABILITY / STOCK TAB ── */}
          <TabsContent value="availability" className="flex-1 overflow-y-auto px-5 pt-4 pb-24 space-y-6 mt-0">
            {/* Available toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <p className="text-sm font-semibold">Available for ordering</p>
                <p className="text-xs text-muted-foreground mt-0.5">Customers can see and order this item</p>
              </div>
              <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
            </div>

            {/* Prep time + calories */}
            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="Prep time" hint="minutes">
                <Input value={prepTime} onChange={(e) => setPrepTime(e.target.value)} placeholder="10" className="h-10" type="number" min="0" />
              </FieldRow>
              <FieldRow label="Calories" hint="kcal">
                <Input value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="450" className="h-10" type="number" min="0" />
              </FieldRow>
            </div>

            <Separator />

            {/* Time restrictions */}
            <div>
              <SectionTitle>Time restrictions</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Available from">
                  <Input value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} type="time" className="h-10" />
                </FieldRow>
                <FieldRow label="Available until">
                  <Input value={availableTo} onChange={(e) => setAvailableTo(e.target.value)} type="time" className="h-10" />
                </FieldRow>
              </div>
            </div>

            {/* Day restrictions */}
            <div>
              <SectionTitle>Available days</SectionTitle>
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map((day, i) => {
                  const active = availableDays.includes(i);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setAvailableDays(toggleArrayItem(availableDays, i))}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium border-2 transition-all",
                        active ? "border-primary bg-primary/[0.08] text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Stock tracking */}
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                <div>
                  <p className="text-sm font-semibold">Track stock</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Auto-disable when quantity reaches 0</p>
                </div>
                <Switch checked={stockTracked} onCheckedChange={setStockTracked} />
              </div>
              {stockTracked && (
                <FieldRow label="Current stock quantity">
                  <Input value={stockQty} onChange={(e) => setStockQty(e.target.value)} placeholder="50" type="number" min="0" className="h-10" />
                </FieldRow>
              )}
            </div>
          </TabsContent>

          {/* ── VARIANTS TAB ── */}
          <TabsContent value="variants" className="flex-1 overflow-y-auto px-5 pt-4 pb-24 space-y-5 mt-0">
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Variants are different sizes or formats of the same item (e.g. S/M/L pizza, 250ml/500ml drink).
                When variants exist, customers must choose one — the base price becomes a "from" price.
                Use <strong>Modifiers</strong> for add-ons like extra toppings or sauce choices.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <SectionTitle>Variants</SectionTitle>
              <Button
                type="button" variant="outline" size="sm" className="h-7 text-xs gap-1"
                onClick={() => setVariants((prev) => [...prev, {
                  id: generateId(), name: "", price: 0, is_available: true,
                }])}
              >
                <Plus className="h-3 w-3" /> Add variant
              </Button>
            </div>

            {variants.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 text-center space-y-1">
                <p className="text-sm font-medium text-muted-foreground">No variants</p>
                <p className="text-xs text-muted-foreground/70">This item has a single fixed price. Add variants to offer different sizes or formats.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header row */}
                <div className="grid grid-cols-[1fr_100px_90px_80px_32px] gap-2 px-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Name</span>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Price</span>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Cost</span>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Available</span>
                  <span />
                </div>
                {variants.map((v, i) => (
                  <div key={v.id} className="grid grid-cols-[1fr_100px_90px_80px_32px] gap-2 items-center">
                    <Input
                      placeholder="e.g. Large"
                      value={v.name}
                      onChange={(e) => setVariants((prev) => prev.map((vv, vi) => vi === i ? { ...vv, name: e.target.value } : vv))}
                      className="h-8 text-sm"
                    />
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <Input
                        type="number" step="0.01" min="0"
                        placeholder="0.00"
                        value={v.price ? toDollar(v.price) : ""}
                        onChange={(e) => setVariants((prev) => prev.map((vv, vi) => vi === i ? { ...vv, price: toMinor(e.target.value) } : vv))}
                        className="h-8 text-sm pl-5"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <Input
                        type="number" step="0.01" min="0"
                        placeholder="0.00"
                        value={v.cost ? toDollar(v.cost) : ""}
                        onChange={(e) => setVariants((prev) => prev.map((vv, vi) => vi === i ? { ...vv, cost: toMinor(e.target.value) || undefined } : vv))}
                        className="h-8 text-sm pl-5"
                      />
                    </div>
                    <Switch
                      checked={v.is_available}
                      onCheckedChange={(val) => setVariants((prev) => prev.map((vv, vi) => vi === i ? { ...vv, is_available: Boolean(val) } : vv))}
                    />
                    <button
                      type="button"
                      onClick={() => setVariants((prev) => prev.filter((_, vi) => vi !== i))}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {variants.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Cheapest: <span className="font-medium text-foreground">{formatPrice(Math.min(...variants.map((v) => v.price)))}</span> — shown as "From" price on customer menu.
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── ADVANCED TAB ── */}
          <TabsContent value="advanced" className="flex-1 overflow-y-auto px-5 pt-4 pb-24 space-y-6 mt-0">
            <div className="grid grid-cols-1 gap-5">
              <FieldRow label="SKU / Internal code" hint="optional">
                <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. BUR-001" className="h-10 font-mono" />
              </FieldRow>

              <FieldRow label="Tax category">
                <Select value={taxCategory} onValueChange={(v) => setTaxCategory(v as TaxCategory)}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TAX_CATEGORIES.map(({ id, label, desc }) => (
                      <SelectItem key={id} value={id}>
                        <span>{label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{desc}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow label="Kitchen station / Printer routing">
                <Select value={kitchenStation} onValueChange={(v) => setKitchenStation(v as KitchenStation)}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KITCHEN_STATIONS.map(({ id, label }) => (
                      <SelectItem key={id} value={id}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow label="Loyalty points override" hint="leave blank to use global rate">
                <div className="flex items-center gap-2">
                  <Input
                    type="number" min="0"
                    value={loyaltyOverride}
                    onChange={(e) => setLoyaltyOverride(e.target.value)}
                    placeholder="e.g. 50"
                    className="h-10 w-32"
                  />
                  <span className="text-sm text-muted-foreground">points earned per order</span>
                </div>
              </FieldRow>
            </div>

            <Separator />

            <div className="space-y-3">
              <SectionTitle>Restrictions & Rules</SectionTitle>
              <div className="space-y-3">
                {[
                  {
                    key: "age",
                    label: "Age-restricted item",
                    desc: "Staff must verify customer age before adding to order (e.g. alcohol, tobacco)",
                    checked: ageRestricted,
                    onChange: setAgeRestricted,
                  },
                  {
                    key: "discount",
                    label: "Eligible for discounts & promotions",
                    desc: "This item can be included in promotional discounts and deals",
                    checked: discountEligible,
                    onChange: setDiscountEligible,
                  },
                ].map(({ key, label, desc, checked, onChange }) => (
                  <div key={key} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                    <div>
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    <Switch checked={checked} onCheckedChange={onChange} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

        </Tabs>

        {/* Footer — fixed at bottom */}
        <SheetFooter className="flex-shrink-0 flex items-center gap-3 px-5 py-4 border-t border-border bg-background">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : item ? "Save changes" : "Add item"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
