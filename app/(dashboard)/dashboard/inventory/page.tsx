"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Plus,
  Search,
  MoreHorizontal,
  ArrowDownToLine,
  Trash2,
  Edit,
  ArrowUpFromLine,
  RefreshCw,
  Minus,
  X,
  ChefHat,
} from "lucide-react";

import { cn, formatPrice, generateId, timeAgo } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
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
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ─────────────────────────────────────────────────────────────────────

type IngredientUnit = "kg" | "g" | "L" | "ml" | "unit" | "portion" | "dozen";

interface Ingredient {
  id: string;
  name: string;
  unit: IngredientUnit;
  current_stock: number;
  reorder_level: number;
  unit_cost: number;
  supplier?: string;
  category: "produce" | "meat" | "dairy" | "dry_goods" | "beverages" | "packaging";
  last_updated: string;
}

type MovementType = "received" | "used" | "wasted" | "adjusted" | "returned";

interface StockMovement {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  type: MovementType;
  quantity: number;
  unit: IngredientUnit;
  note?: string;
  created_at: string;
  created_by: string;
}

interface RecipeIngredient {
  ingredient_id: string;
  quantity: number;
}

interface Recipe {
  item_id: string;
  item_name: string;
  item_price: number;
  ingredients: RecipeIngredient[];
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: "ing1",  name: "Beef patty (180g)",    unit: "unit",  current_stock: 145,  reorder_level: 50,  unit_cost: 280,  supplier: "Premium Meats Co",  category: "meat",      last_updated: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "ing2",  name: "Brioche bun",           unit: "unit",  current_stock: 200,  reorder_level: 80,  unit_cost: 45,   supplier: "Artisan Bakery",    category: "dry_goods", last_updated: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: "ing3",  name: "American cheese",       unit: "unit",  current_stock: 18,   reorder_level: 40,  unit_cost: 15,   supplier: "Dairy Direct",      category: "dairy",     last_updated: new Date(Date.now() - 1 * 3600000).toISOString() },
  { id: "ing4",  name: "Lettuce",               unit: "kg",    current_stock: 3.2,  reorder_level: 2,   unit_cost: 180,  supplier: "Fresh Farms",       category: "produce",   last_updated: new Date(Date.now() - 6 * 3600000).toISOString() },
  { id: "ing5",  name: "Tomato",                unit: "kg",    current_stock: 4.5,  reorder_level: 2,   unit_cost: 220,  supplier: "Fresh Farms",       category: "produce",   last_updated: new Date(Date.now() - 6 * 3600000).toISOString() },
  { id: "ing6",  name: "Russet potatoes",       unit: "kg",    current_stock: 28,   reorder_level: 10,  unit_cost: 85,   supplier: "Root & Stem",       category: "produce",   last_updated: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: "ing7",  name: "Chicken breast",        unit: "kg",    current_stock: 12,   reorder_level: 5,   unit_cost: 520,  supplier: "Premium Meats Co",  category: "meat",      last_updated: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: "ing8",  name: "Whole milk",            unit: "L",     current_stock: 20,   reorder_level: 8,   unit_cost: 90,   supplier: "Dairy Direct",      category: "dairy",     last_updated: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: "ing9",  name: "Vanilla ice cream",     unit: "L",     current_stock: 6,    reorder_level: 4,   unit_cost: 380,  supplier: "Creamery Plus",     category: "dairy",     last_updated: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: "ing10", name: "Fudge brownie mix",     unit: "kg",    current_stock: 2.1,  reorder_level: 3,   unit_cost: 420,  supplier: "Baking Essentials", category: "dry_goods", last_updated: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: "ing11", name: "Lemon",                 unit: "unit",  current_stock: 45,   reorder_level: 20,  unit_cost: 25,   supplier: "Fresh Farms",       category: "produce",   last_updated: new Date(Date.now() - 6 * 3600000).toISOString() },
  { id: "ing12", name: "Takeaway containers",   unit: "unit",  current_stock: 312,  reorder_level: 100, unit_cost: 8,    supplier: "PackRight",         category: "packaging", last_updated: new Date(Date.now() - 2 * 24 * 3600000).toISOString() },
];

const INITIAL_MOVEMENTS: StockMovement[] = [
  { id: "m1", ingredient_id: "ing1",  ingredient_name: "Beef patty (180g)", type: "used",     quantity: 32,   unit: "unit", note: "Evening service",         created_at: new Date(Date.now() - 1 * 3600000).toISOString(),      created_by: "System (orders)" },
  { id: "m2", ingredient_id: "ing1",  ingredient_name: "Beef patty (180g)", type: "received", quantity: 100,  unit: "unit", note: "PO #1042",                created_at: new Date(Date.now() - 5 * 3600000).toISOString(),      created_by: "Maria G." },
  { id: "m3", ingredient_id: "ing3",  ingredient_name: "American cheese",   type: "used",     quantity: 45,   unit: "unit", note: "Lunch + dinner service",  created_at: new Date(Date.now() - 2 * 3600000).toISOString(),      created_by: "System (orders)" },
  { id: "m4", ingredient_id: "ing10", ingredient_name: "Fudge brownie mix", type: "wasted",   quantity: 0.3,  unit: "kg",   note: "Expired — disposal",      created_at: new Date(Date.now() - 3 * 3600000).toISOString(),      created_by: "James C." },
  { id: "m5", ingredient_id: "ing6",  ingredient_name: "Russet potatoes",   type: "received", quantity: 20,   unit: "kg",   note: "Regular delivery",        created_at: new Date(Date.now() - 8 * 3600000).toISOString(),      created_by: "Maria G." },
  { id: "m6", ingredient_id: "ing4",  ingredient_name: "Lettuce",           type: "adjusted", quantity: -0.5, unit: "kg",   note: "Manual count correction", created_at: new Date(Date.now() - 10 * 3600000).toISOString(),     created_by: "You (Owner)" },
];

const mockRecipes: Recipe[] = [
  {
    item_id: "i1",
    item_name: "Classic Smash Burger",
    item_price: 1299,
    ingredients: [
      { ingredient_id: "ing1", quantity: 1 },
      { ingredient_id: "ing2", quantity: 1 },
      { ingredient_id: "ing3", quantity: 2 },
      { ingredient_id: "ing4", quantity: 0.05 },
      { ingredient_id: "ing5", quantity: 0.08 },
    ],
  },
  {
    item_id: "i4",
    item_name: "Crispy Fries",
    item_price: 499,
    ingredients: [
      { ingredient_id: "ing6", quantity: 0.2 },
    ],
  },
  {
    item_id: "i6",
    item_name: "Classic Milkshake",
    item_price: 699,
    ingredients: [
      { ingredient_id: "ing8", quantity: 0.3 },
      { ingredient_id: "ing9", quantity: 0.15 },
    ],
  },
  {
    item_id: "i8",
    item_name: "Loaded Brownie",
    item_price: 799,
    ingredients: [
      { ingredient_id: "ing10", quantity: 0.1 },
      { ingredient_id: "ing9",  quantity: 0.12 },
    ],
  },
];

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ["produce", "meat", "dairy", "dry_goods", "beverages", "packaging"] as const;

function getCategoryLabels(t: ReturnType<typeof useT>): Record<Ingredient["category"], string> {
  return {
    produce:   t.inv_catProduce,
    meat:      t.inv_catMeat,
    dairy:     t.inv_catDairy,
    dry_goods: t.inv_catDryGoods,
    beverages: t.inv_catBeverages,
    packaging: t.inv_catPackaging,
  };
}

function getMovementBadge(t: ReturnType<typeof useT>): Record<MovementType, { label: string; className: string }> {
  return {
    received: { label: t.inv_typeReceived, className: "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400"  },
    used:     { label: t.inv_typeUsed,     className: "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400"   },
    wasted:   { label: t.inv_typeWasted,   className: "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400"    },
    adjusted: { label: t.inv_typeAdjusted, className: "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400"  },
    returned: { label: t.inv_typeReturned, className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toDollar(minor: number) {
  return (minor / 100).toFixed(2);
}

function toMinor(s: string) {
  return Math.round((parseFloat(s) || 0) * 100);
}

function stockBarColor(current: number, reorder: number) {
  if (current <= reorder) return "bg-red-500";
  if (current <= reorder * 1.5) return "bg-amber-500";
  return "bg-green-500";
}

function stockBarValue(current: number, reorder: number) {
  return Math.min(100, Math.round((current / (reorder * 3)) * 100));
}

// ─── Blank ingredient form ─────────────────────────────────────────────────────

interface IngredientForm {
  name: string;
  unit: IngredientUnit;
  current_stock: string;
  reorder_level: string;
  unit_cost: string;
  supplier: string;
  category: Ingredient["category"];
}

function blankForm(): IngredientForm {
  return {
    name:          "",
    unit:          "unit",
    current_stock: "",
    reorder_level: "",
    unit_cost:     "",
    supplier:      "",
    category:      "produce",
  };
}

function ingredientToForm(ing: Ingredient): IngredientForm {
  return {
    name:          ing.name,
    unit:          ing.unit,
    current_stock: String(ing.current_stock),
    reorder_level: String(ing.reorder_level),
    unit_cost:     toDollar(ing.unit_cost),
    supplier:      ing.supplier ?? "",
    category:      ing.category,
  };
}

// ─── Ingredient Sheet ──────────────────────────────────────────────────────────

interface IngredientSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Ingredient | null;
  onSave: (data: IngredientForm, id: string | null) => void;
}

function IngredientSheet({ open, onOpenChange, editing, onSave }: IngredientSheetProps) {
  const t = useT();
  const CATEGORY_LABELS = getCategoryLabels(t);
  const [form, setForm] = useState<IngredientForm>(blankForm());

  function handleOpenChange(v: boolean) {
    if (v) setForm(editing ? ingredientToForm(editing) : blankForm());
    onOpenChange(v);
  }

  function set(field: keyof IngredientForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error(t.inv_colName + " " + t.required);
      return;
    }
    onSave(form, editing?.id ?? null);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? t.inv_editIngTitle : t.inv_addIngTitle}</SheetTitle>
          <SheetDescription>{editing ? t.inv_editIngDesc : t.inv_addIngDesc}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ing-name">{t.inv_colName} <span className="text-destructive">*</span></Label>
            <Input
              id="ing-name"
              placeholder="e.g. Beef patty (180g)"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ing-unit">{t.inv_unitLabel}</Label>
              <Select
                value={form.unit}
                onValueChange={(v) => set("unit", v as string)}
              >
                <SelectTrigger id="ing-unit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["kg", "g", "L", "ml", "unit", "portion", "dozen"] as IngredientUnit[]).map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ing-category">{t.inv_colCategory}</Label>
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v as string)}
              >
                <SelectTrigger id="ing-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ing-stock">{t.inv_currentStockLabel}</Label>
              <Input
                id="ing-stock"
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
                value={form.current_stock}
                onChange={(e) => set("current_stock", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ing-reorder">{t.inv_reorderLevelLabel}</Label>
              <Input
                id="ing-reorder"
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
                value={form.reorder_level}
                onChange={(e) => set("reorder_level", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ing-cost">{t.inv_unitCostLabel}</Label>
            <Input
              id="ing-cost"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={form.unit_cost}
              onChange={(e) => set("unit_cost", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ing-supplier">{t.inv_supplierLabel}</Label>
            <Input
              id="ing-supplier"
              placeholder="e.g. Fresh Farms"
              value={form.supplier}
              onChange={(e) => set("supplier", e.target.value)}
            />
          </div>
        </div>

        <SheetFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-transparent px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {t.dashCancel}
          </button>
          <Button onClick={handleSave}>
            {editing ? t.dashUpdate : t.inv_addIngTitle}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Log Movement Dialog ───────────────────────────────────────────────────────

interface LogMovementDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ingredients: Ingredient[];
  defaultIngredientId?: string;
  defaultType?: MovementType;
  onLog: (movement: Omit<StockMovement, "id" | "created_at" | "created_by">) => void;
}

function LogMovementDialog({
  open,
  onOpenChange,
  ingredients,
  defaultIngredientId = "",
  defaultType = "received",
  onLog,
}: LogMovementDialogProps) {
  const t = useT();
  const [ingredientId, setIngredientId] = useState(defaultIngredientId);
  const [type, setType]                 = useState<MovementType>(defaultType);
  const [quantity, setQuantity]         = useState("");
  const [note, setNote]                 = useState("");

  function handleOpenChange(v: boolean) {
    if (v) {
      setIngredientId(defaultIngredientId);
      setType(defaultType);
      setQuantity("");
      setNote("");
    }
    onOpenChange(v);
  }

  function handleSubmit() {
    if (!ingredientId) { toast.error(t.inv_selectIngredient); return; }
    if (!quantity || isNaN(Number(quantity))) { toast.error(t.inv_colQuantity); return; }

    const ing = ingredients.find((i) => i.id === ingredientId);
    if (!ing) return;

    onLog({
      ingredient_id:   ing.id,
      ingredient_name: ing.name,
      type,
      quantity:        Number(quantity),
      unit:            ing.unit,
      note:            note.trim() || undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.inv_logMovTitle}</DialogTitle>
          <DialogDescription>{t.inv_logMovDesc}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>{t.inv_colIngredient}</Label>
            <Select value={ingredientId} onValueChange={(v) => setIngredientId(v as string)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t.inv_selectIngredient} />
              </SelectTrigger>
              <SelectContent>
                {ingredients.map((ing) => (
                  <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t.inv_movementType}</Label>
            <Select value={type} onValueChange={(v) => setType(v as MovementType)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="received">{t.inv_typeReceived}</SelectItem>
                <SelectItem value="used">{t.inv_typeUsed}</SelectItem>
                <SelectItem value="wasted">{t.inv_typeWasted}</SelectItem>
                <SelectItem value="adjusted">{t.inv_adjustedManual}</SelectItem>
                <SelectItem value="returned">{t.inv_returnedSupplier}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mov-qty">
              {t.inv_colQuantity}
              {type === "adjusted" && <span className="ms-1 text-xs text-muted-foreground">{t.inv_negToDecrease}</span>}
            </Label>
            <Input
              id="mov-qty"
              type="number"
              step={0.01}
              placeholder={type === "adjusted" ? "e.g. -0.5" : "e.g. 10"}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mov-note">{t.inv_noteOptional}</Label>
            <Textarea
              id="mov-note"
              placeholder="e.g. PO #1042, Evening service…"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">{t.dashCancel}</Button>
          <Button onClick={handleSubmit}>{t.inv_logMovBtn}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Recipe Card ───────────────────────────────────────────────────────────────

interface RecipeCardProps {
  recipe: Recipe;
  ingredients: Ingredient[];
  onUpdate: (r: Recipe) => void;
}

function RecipeCard({ recipe, ingredients, onUpdate }: RecipeCardProps) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [editRecipe, setEditRecipe] = useState<Recipe>(recipe);

  const ingMap = useMemo(() => {
    const m: Record<string, Ingredient> = {};
    ingredients.forEach((i) => { m[i.id] = i; });
    return m;
  }, [ingredients]);

  const cogs = recipe.ingredients.reduce((sum, ri) => {
    const ing = ingMap[ri.ingredient_id];
    return sum + (ing ? ing.unit_cost * ri.quantity : 0);
  }, 0);

  const grossMargin = recipe.item_price - cogs;
  const marginPct   = recipe.item_price > 0 ? (grossMargin / recipe.item_price) * 100 : 0;

  const marginColor =
    marginPct > 60 ? "text-green-600 dark:text-green-400" :
    marginPct >= 40 ? "text-amber-600 dark:text-amber-400" :
    "text-red-600 dark:text-red-400";

  function saveEdit() {
    onUpdate(editRecipe);
    setEditing(false);
  }

  function addIngredientLine() {
    const unused = ingredients.find(
      (i) => !editRecipe.ingredients.some((ri) => ri.ingredient_id === i.id)
    );
    if (!unused) { toast.error(t.inv_ingredientsLabel); return; }
    setEditRecipe((r) => ({
      ...r,
      ingredients: [...r.ingredients, { ingredient_id: unused.id, quantity: 1 }],
    }));
  }

  function updateLine(idx: number, field: "ingredient_id" | "quantity", value: string | number) {
    setEditRecipe((r) => ({
      ...r,
      ingredients: r.ingredients.map((ri, i) =>
        i === idx ? { ...ri, [field]: value } : ri
      ),
    }));
  }

  function removeLine(idx: number) {
    setEditRecipe((r) => ({
      ...r,
      ingredients: r.ingredients.filter((_, i) => i !== idx),
    }));
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{recipe.item_name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t.inv_sellingPrice}: {formatPrice(recipe.item_price)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditRecipe(recipe);
              setEditing(!editing);
            }}
          >
            {editing ? <X className="h-3.5 w-3.5 me-1" /> : <Edit className="h-3.5 w-3.5 me-1" />}
            {editing ? t.dashCancel : t.inv_editRecipe}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Ingredient table */}
        <div className="mt-2 w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">{t.inv_colIngredient}</th>
                <th className="pb-2 pr-4 font-medium">{t.inv_colQty}</th>
                <th className="pb-2 pr-4 font-medium">{t.inv_colUnitCost}</th>
                <th className="pb-2 font-medium text-right">{t.inv_colLineCost}</th>
                {editing && <th className="pb-2 pl-2" />}
              </tr>
            </thead>
            <tbody>
              {(editing ? editRecipe : recipe).ingredients.map((ri, idx) => {
                const ing      = ingMap[ri.ingredient_id];
                const lineCost = ing ? ing.unit_cost * ri.quantity : 0;

                if (editing) {
                  return (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-1.5 pr-2">
                        <Select
                          value={ri.ingredient_id}
                          onValueChange={(v) => updateLine(idx, "ingredient_id", v as string)}
                        >
                          <SelectTrigger className="h-7 w-44 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ingredients.map((i) => (
                              <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-1.5 pr-2">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          className="h-7 w-20 text-xs"
                          value={ri.quantity}
                          onChange={(e) => updateLine(idx, "quantity", parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="py-1.5 pr-2 text-muted-foreground">
                        {ing ? formatPrice(ing.unit_cost) + "/" + ing.unit : "—"}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">
                        {ing ? formatPrice(lineCost) : "—"}
                      </td>
                      <td className="py-1.5 pl-2">
                        <button
                          onClick={() => removeLine(idx)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Remove ingredient"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={ri.ingredient_id} className="border-b last:border-0">
                    <td className="py-1.5 pr-4">{ing?.name ?? ri.ingredient_id}</td>
                    <td className="py-1.5 pr-4 tabular-nums text-muted-foreground">
                      {ri.quantity >= 1
                        ? `${ri.quantity}×`
                        : `${Math.round(ri.quantity * 1000)}g`}
                    </td>
                    <td className="py-1.5 pr-4 text-muted-foreground">
                      {ing ? `${formatPrice(ing.unit_cost)}/${ing.unit}` : "—"}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {formatPrice(lineCost)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {editing && (
          <div className="mt-2">
            <Button variant="outline" size="sm" onClick={addIngredientLine} className="w-full">
              <Plus className="h-3.5 w-3.5 me-1" />
              {t.inv_addIngredient}
            </Button>
          </div>
        )}

        <Separator className="my-3" />

        {/* Totals */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.inv_totalCogs}</span>
            <span className="tabular-nums font-medium">{formatPrice(cogs)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.inv_grossMargin}</span>
            <span className={cn("tabular-nums font-medium", marginColor)}>
              {formatPrice(grossMargin)}{" "}
              <span className="text-xs">({marginPct.toFixed(1)}%)</span>
            </span>
          </div>
        </div>

        {editing && (
          <div className="mt-4">
            <Button onClick={saveEdit} className="w-full">{t.inv_saveRecipe}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Add Recipe Dialog ─────────────────────────────────────────────────────────

interface AddRecipeDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ingredients: Ingredient[];
  onAdd: (r: Recipe) => void;
}

function AddRecipeDialog({ open, onOpenChange, ingredients, onAdd }: AddRecipeDialogProps) {
  const t = useT();
  const [itemName, setItemName]     = useState("");
  const [itemPrice, setItemPrice]   = useState("");
  const [lines, setLines]           = useState<RecipeIngredient[]>([
    { ingredient_id: ingredients[0]?.id ?? "", quantity: 1 },
  ]);

  function handleOpenChange(v: boolean) {
    if (v) {
      setItemName("");
      setItemPrice("");
      setLines([{ ingredient_id: ingredients[0]?.id ?? "", quantity: 1 }]);
    }
    onOpenChange(v);
  }

  function addLine() {
    const unused = ingredients.find((i) => !lines.some((l) => l.ingredient_id === i.id));
    if (!unused) { toast.error(t.inv_ingredientsLabel); return; }
    setLines((ls) => [...ls, { ingredient_id: unused.id, quantity: 1 }]);
  }

  function updateLine(idx: number, field: "ingredient_id" | "quantity", value: string | number) {
    setLines((ls) => ls.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  }

  function removeLine(idx: number) {
    setLines((ls) => ls.filter((_, i) => i !== idx));
  }

  function handleAdd() {
    if (!itemName.trim()) { toast.error(t.inv_itemNameLabel); return; }
    if (!itemPrice || isNaN(Number(itemPrice))) { toast.error(t.inv_sellingPriceLabel); return; }
    if (lines.length === 0) { toast.error(t.inv_addIngredient); return; }

    onAdd({
      item_id:     generateId(),
      item_name:   itemName.trim(),
      item_price:  toMinor(itemPrice),
      ingredients: lines,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.inv_addRecipeTitle}</DialogTitle>
          <DialogDescription>{t.inv_addRecipeDesc}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recipe-name">{t.inv_itemNameLabel} <span className="text-destructive">*</span></Label>
              <Input
                id="recipe-name"
                placeholder="e.g. Caesar Salad"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recipe-price">{t.inv_sellingPriceLabel}</Label>
              <Input
                id="recipe-price"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">{t.inv_ingredientsLabel}</Label>
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Select
                    value={line.ingredient_id}
                    onValueChange={(v) => updateLine(idx, "ingredient_id", v as string)}
                  >
                    <SelectTrigger className="flex-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map((ing) => (
                        <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-20 h-8 text-xs"
                    placeholder="Qty"
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, "quantity", parseFloat(e.target.value) || 0)}
                  />
                  <button
                    onClick={() => removeLine(idx)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={addLine}>
              <Plus className="h-3.5 w-3.5 me-1" /> {t.inv_addIngredient}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">{t.dashCancel}</Button>
          <Button onClick={handleAdd}>{t.inv_addRecipe}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const t = useT();
  const CATEGORY_LABELS = getCategoryLabels(t);
  const MOVEMENT_BADGE = getMovementBadge(t);
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [movements,   setMovements]   = useState<StockMovement[]>(INITIAL_MOVEMENTS);
  const [recipes,     setRecipes]     = useState<Recipe[]>(mockRecipes);

  // Ingredient tab state
  const [search,           setSearch]           = useState("");
  const [categoryFilter,   setCategoryFilter]   = useState("all");
  const [sheetOpen,        setSheetOpen]        = useState(false);
  const [editingIng,       setEditingIng]       = useState<Ingredient | null>(null);
  const [logDialogOpen,    setLogDialogOpen]    = useState(false);
  const [logDefaultId,     setLogDefaultId]     = useState("");
  const [logDefaultType,   setLogDefaultType]   = useState<MovementType>("received");

  // Stock movements tab state
  const [movTypeFilter, setMovTypeFilter] = useState("all");
  const [dateFilter,    setDateFilter]    = useState("all");

  // Recipe costing
  const [addRecipeOpen, setAddRecipeOpen] = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────

  const lowStockIngredients = useMemo(
    () => ingredients.filter((i) => i.current_stock <= i.reorder_level),
    [ingredients]
  );

  const totalInventoryValue = useMemo(
    () => ingredients.reduce((sum, i) => sum + i.current_stock * i.unit_cost, 0),
    [ingredients]
  );

  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchSearch   = ing.name.toLowerCase().includes(search.toLowerCase()) ||
                            (ing.supplier ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || ing.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [ingredients, search, categoryFilter]);

  const filteredMovements = useMemo(() => {
    const now = Date.now();
    return movements.filter((m) => {
      const matchType = movTypeFilter === "all" || m.type === movTypeFilter;
      const ts        = new Date(m.created_at).getTime();
      const matchDate =
        dateFilter === "all"       ? true :
        dateFilter === "today"     ? now - ts < 86400000 :
        dateFilter === "this_week" ? now - ts < 7 * 86400000 :
        dateFilter === "this_month"? now - ts < 30 * 86400000 :
        true;
      return matchType && matchDate;
    });
  }, [movements, movTypeFilter, dateFilter]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function openAddIngredient() {
    setEditingIng(null);
    setSheetOpen(true);
  }

  function openEditIngredient(ing: Ingredient) {
    setEditingIng(ing);
    setSheetOpen(true);
  }

  function handleSaveIngredient(form: IngredientForm, id: string | null) {
    const now = new Date().toISOString();
    if (id) {
      setIngredients((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                name:          form.name.trim(),
                unit:          form.unit,
                current_stock: parseFloat(form.current_stock) || 0,
                reorder_level: parseFloat(form.reorder_level) || 0,
                unit_cost:     toMinor(form.unit_cost),
                supplier:      form.supplier.trim() || undefined,
                category:      form.category,
                last_updated:  now,
              }
            : i
        )
      );
      toast.success(t.inv_toastIngUpdated);
    } else {
      const newIng: Ingredient = {
        id:            generateId(),
        name:          form.name.trim(),
        unit:          form.unit,
        current_stock: parseFloat(form.current_stock) || 0,
        reorder_level: parseFloat(form.reorder_level) || 0,
        unit_cost:     toMinor(form.unit_cost),
        supplier:      form.supplier.trim() || undefined,
        category:      form.category,
        last_updated:  now,
      };
      setIngredients((prev) => [...prev, newIng]);
      toast.success(t.inv_toastIngAdded);
    }
  }

  function handleDeleteIngredient(id: string) {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    toast.success(t.inv_toastIngRemoved);
  }

  function openLogReceived(ingId: string) {
    setLogDefaultId(ingId);
    setLogDefaultType("received");
    setLogDialogOpen(true);
  }

  function openLogWaste(ingId: string) {
    setLogDefaultId(ingId);
    setLogDefaultType("wasted");
    setLogDialogOpen(true);
  }

  function openLogMovement() {
    setLogDefaultId("");
    setLogDefaultType("received");
    setLogDialogOpen(true);
  }

  function handleLogMovement(data: Omit<StockMovement, "id" | "created_at" | "created_by">) {
    const now  = new Date().toISOString();
    const move: StockMovement = {
      ...data,
      id:         generateId(),
      created_at: now,
      created_by: "You (Owner)",
    };
    setMovements((prev) => [move, ...prev]);

    // Update ingredient stock
    const delta =
      data.type === "received" || data.type === "returned" ?  data.quantity :
      data.type === "adjusted"                              ?  data.quantity :
      -Math.abs(data.quantity);

    setIngredients((prev) =>
      prev.map((i) =>
        i.id === data.ingredient_id
          ? { ...i, current_stock: Math.max(0, i.current_stock + delta), last_updated: now }
          : i
      )
    );
    toast.success(`${t.inv_toastMovLogged} — ${data.ingredient_name}`);
  }

  function handleUpdateRecipe(updated: Recipe) {
    setRecipes((prev) => prev.map((r) => r.item_id === updated.item_id ? updated : r));
    toast.success(t.inv_toastRecipeUpdated);
  }

  function handleAddRecipe(r: Recipe) {
    setRecipes((prev) => [...prev, r]);
    toast.success(t.inv_toastRecipeAdded);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="font-heading text-2xl font-semibold">{t.inv_pageTitle}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t.inv_pageSubtitle}</p>
      </div>

      <Tabs defaultValue="ingredients">
        <TabsList>
          <TabsTrigger value="ingredients">{t.inv_tabIngredients}</TabsTrigger>
          <TabsTrigger value="movements">{t.inv_tabMovements}</TabsTrigger>
          <TabsTrigger value="recipes">{t.inv_tabRecipes}</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Ingredients ──────────────────────────────────────── */}
        <TabsContent value="ingredients">
          <div className="flex flex-col gap-4 mt-4">

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={t.inv_searchPlaceholder}
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as string)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t.inv_allCategories} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.inv_allCategories}</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={openLogMovement}>
                <RefreshCw className="h-3.5 w-3.5 me-1.5" />{t.inv_logMovement}
              </Button>
              <Button onClick={openAddIngredient}>
                <Plus className="h-3.5 w-3.5 me-1.5" />{t.inv_addIngredient}
              </Button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card size="sm">
                <CardContent className="pt-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Package className="h-3.5 w-3.5" />{t.inv_totalSkus}
                  </div>
                  <p className="text-2xl font-semibold tabular-nums">{ingredients.length}</p>
                </CardContent>
              </Card>

              <Card size="sm">
                <CardContent className="pt-3">
                  <div className="flex items-center gap-2 text-xs mb-1 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-3.5 w-3.5" />{t.inv_lowStockAlerts}
                  </div>
                  <p className="text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
                    {lowStockIngredients.length}
                  </p>
                </CardContent>
              </Card>

              <Card size="sm">
                <CardContent className="pt-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <DollarSign className="h-3.5 w-3.5" />{t.inv_inventoryValue}
                  </div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {formatPrice(totalInventoryValue)}
                  </p>
                </CardContent>
              </Card>

              <Card size="sm">
                <CardContent className="pt-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <TrendingDown className="h-3.5 w-3.5" />{t.inv_needReorder}
                  </div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {lowStockIngredients.length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Low stock banner */}
            {lowStockIngredients.length > 0 && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20 px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    <strong>{lowStockIngredients.length} {t.inv_belowReorderLevel}:</strong>{" "}
                    {lowStockIngredients.map((i) => i.name).join(", ")}
                  </span>
                </div>
                <button
                  onClick={() => toast.info(t.inv_createPO)}
                  className="shrink-0 text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline"
                >
                  {t.inv_createPO}
                </button>
              </div>
            )}

            {/* Ingredients table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t.inv_colName}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t.inv_colCategory}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t.inv_colCurrentStock}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t.inv_colReorderLevel}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t.inv_colUnitCost}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t.inv_colSupplier}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t.inv_colUpdated}</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t.dashActions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIngredients.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            {t.inv_noFound}
                          </td>
                        </tr>
                      )}
                      {filteredIngredients.map((ing) => {
                        const isLow       = ing.current_stock <= ing.reorder_level;
                        const barValue    = stockBarValue(ing.current_stock, ing.reorder_level);
                        const barColor    = stockBarColor(ing.current_stock, ing.reorder_level);

                        return (
                          <tr
                            key={ing.id}
                            className={cn(
                              "border-b last:border-0 transition-colors hover:bg-muted/40",
                              isLow && "bg-red-50/60 dark:bg-red-900/10"
                            )}
                          >
                            <td className="px-4 py-3 font-medium">
                              <div className="flex items-center gap-2">
                                {isLow && (
                                  <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                                )}
                                {ing.name}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-xs">
                                {CATEGORY_LABELS[ing.category]}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1 min-w-24">
                                <span className={cn("tabular-nums font-medium", isLow && "text-red-600 dark:text-red-400")}>
                                  {ing.current_stock} {ing.unit}
                                </span>
                                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={cn("h-full rounded-full transition-all", barColor)}
                                    style={{ width: `${barValue}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 tabular-nums text-muted-foreground">
                              {ing.reorder_level} {ing.unit}
                            </td>
                            <td className="px-4 py-3 tabular-nums">
                              {formatPrice(ing.unit_cost)}/{ing.unit}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {ing.supplier ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {timeAgo(ing.last_updated)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <button className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground" />
                                  }
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuGroup>
                                    <DropdownMenuLabel>{t.dashActions}</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => openLogReceived(ing.id)}>
                                      <ArrowDownToLine className="h-4 w-4" />{t.inv_logReceived}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openLogWaste(ing.id)}>
                                      <Trash2 className="h-4 w-4" />{t.inv_logWaste}
                                    </DropdownMenuItem>
                                  </DropdownMenuGroup>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuGroup>
                                    <DropdownMenuLabel>{t.inv_manage}</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => openEditIngredient(ing)}>
                                      <Edit className="h-4 w-4" />{t.dashEdit}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive" onClick={() => handleDeleteIngredient(ing.id)}>
                                      <Trash2 className="h-4 w-4" />{t.dashDelete}
                                    </DropdownMenuItem>
                                  </DropdownMenuGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 2: Stock Movements ──────────────────────────────────── */}
        <TabsContent value="movements">
          <div className="flex flex-col gap-4 mt-4">

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={movTypeFilter} onValueChange={(v) => setMovTypeFilter(v as string)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder={t.inv_allTypes} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.inv_allTypes}</SelectItem>
                  <SelectItem value="received">{t.inv_typeReceived}</SelectItem>
                  <SelectItem value="used">{t.inv_typeUsed}</SelectItem>
                  <SelectItem value="wasted">{t.inv_typeWasted}</SelectItem>
                  <SelectItem value="adjusted">{t.inv_typeAdjusted}</SelectItem>
                  <SelectItem value="returned">{t.inv_typeReturned}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as string)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t.inv_allTime} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.inv_allTime}</SelectItem>
                  <SelectItem value="today">{t.today}</SelectItem>
                  <SelectItem value="this_week">{t.inv_thisWeek}</SelectItem>
                  <SelectItem value="this_month">{t.inv_thisMonth}</SelectItem>
                </SelectContent>
              </Select>

              <div className="ms-auto text-xs text-muted-foreground">
                {filteredMovements.length} {filteredMovements.length !== 1 ? t.inv_movementPlural : t.inv_movementSingular}
              </div>
            </div>

            {/* Movements table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t.inv_colIngredient}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t.inv_colType}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t.inv_colQuantity}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t.inv_colNote}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t.inv_colBy}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t.inv_colTime}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMovements.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            {t.inv_noMovements}
                          </td>
                        </tr>
                      )}
                      {filteredMovements.map((m) => {
                        const badge = MOVEMENT_BADGE[m.type];
                        return (
                          <tr key={m.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                            <td className="px-4 py-3 font-medium">{m.ingredient_name}</td>
                            <td className="px-4 py-3">
                              <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-xs font-medium", badge.className)}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 tabular-nums">
                              {m.quantity > 0 ? "+" : ""}{m.quantity} {m.unit}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs max-w-48 truncate">
                              {m.note ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{m.created_by}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{timeAgo(m.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 3: Recipe Costing ───────────────────────────────────── */}
        <TabsContent value="recipes">
          <div className="flex flex-col gap-4 mt-4">

            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-medium">{t.inv_recipeCostingTitle}</h2>
                <p className="text-sm text-muted-foreground">{t.inv_recipeCostingDesc}</p>
              </div>
              <Button onClick={() => setAddRecipeOpen(true)}>
                <Plus className="h-3.5 w-3.5 me-1.5" />{t.inv_addRecipe}
              </Button>
            </div>

            {recipes.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <ChefHat className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t.inv_noRecipes}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.item_id}
                  recipe={recipe}
                  ingredients={ingredients}
                  onUpdate={handleUpdateRecipe}
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Sheets & Dialogs ─────────────────────────────────────────── */}

      <IngredientSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editingIng}
        onSave={handleSaveIngredient}
      />

      <LogMovementDialog
        open={logDialogOpen}
        onOpenChange={setLogDialogOpen}
        ingredients={ingredients}
        defaultIngredientId={logDefaultId}
        defaultType={logDefaultType}
        onLog={handleLogMovement}
      />

      <AddRecipeDialog
        open={addRecipeOpen}
        onOpenChange={setAddRecipeOpen}
        ingredients={ingredients}
        onAdd={handleAddRecipe}
      />
    </div>
  );
}
