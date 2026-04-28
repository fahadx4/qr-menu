"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ShoppingCart, Globe, UtensilsCrossed, X, Plus, Minus, Clock, Flame, SlidersHorizontal, Bell } from "lucide-react";
import { toast } from "sonner";
import { mockTenant, mockSettings } from "@/mock/tenant";
import { mockCategories, mockItems } from "@/mock/menu";
import { useCartStore } from "@/store/cart";
import { cn, formatPrice } from "@/lib/utils";
import type { Item, ItemTag, DietaryTag, Allergen } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

// ─── Allergen & Dietary Filter constants ──────────────────────────────────────

const EU_ALLERGENS: { id: Allergen; label: string }[] = [
  { id: "gluten",      label: "Gluten" },
  { id: "crustaceans", label: "Crustaceans" },
  { id: "eggs",        label: "Eggs" },
  { id: "fish",        label: "Fish" },
  { id: "peanuts",     label: "Peanuts" },
  { id: "soy",         label: "Soybeans" },
  { id: "dairy",       label: "Milk" },
  { id: "nuts",        label: "Nuts" },
  { id: "celery",      label: "Celery" },
  { id: "mustard",     label: "Mustard" },
  { id: "sesame",      label: "Sesame" },
  { id: "sulfites",    label: "Sulphur Dioxide" },
  { id: "lupin",       label: "Lupin" },
  { id: "molluscs",    label: "Molluscs" },
];

const DIETARY_FILTERS: { id: DietaryTag; label: string }[] = [
  { id: "vegan",       label: "Vegan" },
  { id: "vegetarian",  label: "Vegetarian" },
  { id: "halal",       label: "Halal" },
  { id: "kosher",      label: "Kosher" },
  { id: "gluten_free", label: "Gluten-Free" },
  { id: "dairy_free",  label: "Dairy-Free" },
];

// ─── Mock allergen check (deterministic: ~30% of items contain each allergen) ─

function itemHasAllergen(item: Item, allergen: Allergen): boolean {
  // Use actual allergen data if present, otherwise fall back to mock
  if (item.allergens.length > 0) {
    return item.allergens.includes(allergen);
  }
  const allergenIndex = EU_ALLERGENS.findIndex((a) => a.id === allergen);
  return (item.id.charCodeAt(0) + allergenIndex) % 3 === 0;
}

// ─── Allergen Filter Sheet ────────────────────────────────────────────────────

function AllergenFilterSheet({
  open,
  onOpenChange,
  avoidAllergens,
  dietaryFilters,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  avoidAllergens: Allergen[];
  dietaryFilters: DietaryTag[];
  onApply: (allergens: Allergen[], dietary: DietaryTag[]) => void;
}) {
  const [localAllergens, setLocalAllergens] = useState<Allergen[]>(avoidAllergens);
  const [localDietary, setLocalDietary] = useState<DietaryTag[]>(dietaryFilters);

  // Sync when sheet opens
  useEffect(() => {
    if (open) {
      setLocalAllergens(avoidAllergens);
      setLocalDietary(dietaryFilters);
    }
  }, [open, avoidAllergens, dietaryFilters]);

  const toggleAllergen = (id: Allergen) => {
    setLocalAllergens((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleDietary = (id: DietaryTag) => {
    setLocalDietary((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleClear = () => {
    setLocalAllergens([]);
    setLocalDietary([]);
  };

  const handleApply = () => {
    onApply(localAllergens, localDietary);
    onOpenChange(false);
  };

  const totalSelected = localAllergens.length + localDietary.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle>Dietary &amp; Allergen Filters</SheetTitle>
        </SheetHeader>

        <div className="px-4 space-y-6 pb-2">
          {/* Avoid allergens */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Avoid allergens</p>
            <div className="grid grid-cols-2 gap-2">
              {EU_ALLERGENS.map(({ id, label }) => {
                const active = localAllergens.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleAllergen(id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors text-left",
                      active
                        ? "border-destructive/60 bg-destructive/10 text-destructive"
                        : "border-border bg-background hover:bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors",
                        active
                          ? "border-destructive bg-destructive text-white"
                          : "border-muted-foreground/40"
                      )}
                    >
                      {active && (
                        <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Show only */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Show only</p>
            <div className="grid grid-cols-2 gap-2">
              {DIETARY_FILTERS.map(({ id, label }) => {
                const active = localDietary.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleDietary(id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors text-left",
                      active
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40"
                      )}
                    >
                      {active && (
                        <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <SheetFooter className="border-t border-border pt-4">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Apply{totalSelected > 0 ? ` (${totalSelected})` : ""}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Tag badge config ─────────────────────────────────────────────────────────

const TAG_CONFIG: Record<ItemTag, { label: string; className: string }> = {
  popular:    { label: "Popular",    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  new:        { label: "New",        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  spicy:      { label: "Spicy",      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  vegan:      { label: "Vegan",      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  halal:      { label: "Halal",      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  bestseller: { label: "Bestseller", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  chefs_pick: { label: "Chef's Pick", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

const DIETARY_CONFIG: Record<DietaryTag, { label: string; className: string }> = {
  vegan:       { label: "VE",   className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  vegetarian:  { label: "VG",   className: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400" },
  halal:       { label: "HL",   className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  kosher:      { label: "KS",   className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  gluten_free: { label: "GF",   className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  dairy_free:  { label: "DF",   className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },
  nut_free:    { label: "NF",   className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  low_carb:    { label: "LC",   className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
};

// ─── Item Card ───────────────────────────────────────────────────────────────

function ItemCard({
  item,
  slug,
}: {
  item: Item;
  slug: string;
}) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  // Find cart line for this item (no modifiers — simple quick-add)
  const cartLine = items.find(
    (i) => i.item_id === item.id && i.selected_modifiers.length === 0
  );
  const qty = cartLine?.quantity ?? 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(
      {
        item_id: item.id,
        name: item.name,
        image_url: item.image_urls[0],
        quantity: 1,
        unit_price: item.price,
        selected_modifiers: [],
        notes: "",
      },
      slug
    );
    toast.success(`${item.name} added to cart`);
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartLine) updateQuantity(cartLine.id, qty + 1);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartLine) updateQuantity(cartLine.id, qty - 1);
  };

  const visibleTags = item.tags.filter((t) => {
    if (t === "popular" && !mockSettings.menu_popular_badges) return false;
    if (t === "new" && !mockSettings.menu_new_badges) return false;
    return true;
  });

  return (
    <div
      onClick={() => router.push(`/r/${slug}/item/${item.id}`)}
      className="rounded-xl border border-border bg-card overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] transition-transform"
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/3] bg-muted">
        {item.image_urls.length > 0 ? (
          <img
            src={item.image_urls[0]}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <UtensilsCrossed className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}

        {/* Tag badges */}
        {visibleTags.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {visibleTags.slice(0, 2).map((tag) => {
              const cfg = TAG_CONFIG[tag];
              if (!cfg) return null;
              return (
                <span
                  key={tag}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none",
                    cfg.className
                  )}
                >
                  {cfg.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {/* Dietary tags */}
        {item.dietary.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.dietary.map((d) => {
              const cfg = DIETARY_CONFIG[d];
              if (!cfg) return null;
              return (
                <span
                  key={d}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                    cfg.className
                  )}
                >
                  {cfg.label}
                </span>
              );
            })}
          </div>
        )}

        <p className="text-sm font-semibold leading-tight line-clamp-1">{item.name}</p>

        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Price row */}
        <div className="flex items-center justify-between gap-1 pt-1">
          <div className="space-y-0.5">
            {mockSettings.menu_show_prices && (
              <p className="text-sm font-bold text-foreground">
                {formatPrice(item.price)}
              </p>
            )}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {mockSettings.menu_show_prep_time && item.prep_time != null && (
                <span className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {item.prep_time}min
                </span>
              )}
              {mockSettings.menu_show_calories && item.calories != null && (
                <span className="flex items-center gap-0.5">
                  <Flame className="h-2.5 w-2.5" />
                  {item.calories}kcal
                </span>
              )}
            </div>
          </div>

          {/* Add / Stepper */}
          {qty === 0 ? (
            <button
              onClick={handleAdd}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
            </button>
          ) : (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleDecrease}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted active:scale-95 transition-all"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center text-sm font-semibold">{qty}</span>
              <button
                onClick={handleIncrease}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const itemCount = useCartStore((s) => s.itemCount());
  const subtotal = useCartStore((s) => s.subtotal());

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // ─── Allergen / dietary filter state ───────────────────────────────────────
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [avoidAllergens, setAvoidAllergens] = useState<Allergen[]>([]);
  const [dietaryFilters, setDietaryFilters] = useState<DietaryTag[]>([]);

  const handleApplyFilters = (allergens: Allergen[], dietary: DietaryTag[]) => {
    setAvoidAllergens(allergens);
    setDietaryFilters(dietary);
  };

  const clearAllFilters = () => {
    setAvoidAllergens([]);
    setDietaryFilters([]);
  };

  const activeFilterCount = avoidAllergens.length + dietaryFilters.length;

  // Filter an item against active allergen/dietary filters
  const itemPassesFilters = (item: Item): boolean => {
    // Hide if item contains any avoided allergen
    for (const allergen of avoidAllergens) {
      if (itemHasAllergen(item, allergen)) return false;
    }
    // If dietary filters active, item must match ALL selected dietary tags
    if (dietaryFilters.length > 0) {
      for (const tag of dietaryFilters) {
        if (!item.dietary.includes(tag)) return false;
      }
    }
    return true;
  };


  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const tabsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const HEADER_H = 56;   // px — sticky header height
  const TABS_H   = 44;   // px — sticky tabs height

  // Filtered items when searching (also applies allergen/dietary filters)
  const filteredItems = searchQuery.trim()
    ? mockItems.filter(
        (item) =>
          (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())) &&
          itemPassesFilters(item)
      )
    : null; // null = show all grouped

  // Intersection observer for active tab highlighting
  useEffect(() => {
    if (searchQuery.trim()) return;

    const observers: IntersectionObserver[] = [];

    mockCategories.forEach((cat) => {
      const el = categoryRefs.current[cat.id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveCategory(cat.id);
        },
        {
          rootMargin: `-${HEADER_H + TABS_H + 16}px 0px -60% 0px`,
          threshold: 0,
        }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, [searchQuery]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Escape key closes search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const scrollToCategory = useCallback((catId: string) => {
    if (catId === "all") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActiveCategory("all");
      return;
    }
    const el = categoryRefs.current[catId];
    if (!el) return;
    const offset = HEADER_H + TABS_H + 8;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveCategory(catId);
  }, []);

  const allCategories = [{ id: "all", name: "All" }, ...mockCategories];

  // Scroll active tab into view
  useEffect(() => {
    const tabBar = tabsRef.current;
    if (!tabBar) return;
    const activeBtn = tabBar.querySelector<HTMLButtonElement>(
      `[data-cat-id="${activeCategory}"]`
    );
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ─── Sticky Header ─── */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center h-14 px-4 gap-3">
          {/* Logo + Name */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {mockTenant.logo_url ? (
                <img
                  src={mockTenant.logo_url}
                  alt={mockTenant.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary/10">
                  <span className="text-xs font-bold text-primary">
                    {mockTenant.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <span className="font-semibold text-sm truncate">{mockTenant.name}</span>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              onClick={() => {
                setSearchOpen((v) => !v);
                if (searchOpen) setSearchQuery("");
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors"
              aria-label="Search"
            >
              <Search className="h-4.5 w-4.5" />
            </button>

            {/* Language */}
            <button
              onClick={() => toast.info("Language selection coming soon")}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors"
              aria-label="Language"
            >
              <Globe className="h-4.5 w-4.5" />
            </button>

            {/* Allergen / Dietary filter */}
            <button
              onClick={() => setFilterSheetOpen(true)}
              className={cn(
                "relative flex h-9 items-center justify-center rounded-lg px-2 hover:bg-muted transition-colors gap-1",
                activeFilterCount > 0 && "text-primary"
              )}
              aria-label="Dietary & Allergen Filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="text-xs font-semibold">
                  ({activeFilterCount})
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={() => router.push(`/r/${slug}/cart`)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search menu…"
                    className="h-9 w-full rounded-lg border border-input bg-transparent pl-8 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {searchQuery.trim() && filteredItems && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} match
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Category Tab Bar ─── */}
      {!searchOpen && (
        <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div
            ref={tabsRef}
            className="flex gap-1 overflow-x-auto scrollbar-hide px-4 py-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                data-cat-id={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  "flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all whitespace-nowrap",
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Item Grid ─── */}
      <div className="max-w-screen-2xl mx-auto px-4 pt-4 lg:flex lg:gap-8 lg:px-8 lg:pt-6">

        {/* Desktop category sidebar */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-[calc(56px+52px)] space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">Categories</p>
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  "w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activeCategory === cat.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
        {/* Filter banner */}
        {activeFilterCount > 0 && !searchOpen && (() => {
          const hiddenCount = mockItems.filter(
            (item) => item.is_available && !itemPassesFilters(item)
          ).length;
          if (hiddenCount === 0) return null;
          return (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm dark:border-amber-800/40 dark:bg-amber-900/20">
              <span className="text-amber-800 dark:text-amber-300 font-medium">
                {hiddenCount} item{hiddenCount !== 1 ? "s" : ""} hidden by your filters
              </span>
              <button
                type="button"
                onClick={clearAllFilters}
                className="ml-3 text-xs font-semibold text-amber-700 dark:text-amber-400 underline underline-offset-2 hover:no-underline"
              >
                Clear all
              </button>
            </div>
          );
        })()}

        {/* Search results mode */}
        {searchOpen && searchQuery.trim() && filteredItems ? (
          filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UtensilsCrossed className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No items match &quot;{searchQuery}&quot;</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground mb-3">
                {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredItems.map((item) => (
                  <ItemCard key={item.id} item={item} slug={slug} />
                ))}
              </div>
            </div>
          )
        ) : (
          /* Normal grouped mode */
          <div className="space-y-6">
            {mockCategories.map((cat) => {
              const allCatItems = mockItems.filter(
                (item) => item.category_id === cat.id && item.is_available
              );
              const catItems = activeFilterCount > 0
                ? allCatItems.filter((item) => itemPassesFilters(item))
                : allCatItems;
              if (allCatItems.length === 0) return null;
              return (
                <div
                  key={cat.id}
                  ref={(el) => {
                    categoryRefs.current[cat.id] = el;
                  }}
                >
                  {/* Sticky category heading */}
                  <div className="sticky top-[calc(56px+44px)] z-30 bg-background py-2 mb-3">
                    <h2 className="text-base font-bold">{cat.name}</h2>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                    )}
                  </div>

                  {/* Items grid or empty state for this category */}
                  {catItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-3">
                      No items in this category match your filters.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {catItems.map((item) => (
                        <ItemCard key={item.id} item={item} slug={slug} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Global empty state when every item is filtered out */}
            {activeFilterCount > 0 &&
              mockCategories.every((cat) =>
                mockItems
                  .filter((item) => item.category_id === cat.id && item.is_available)
                  .every((item) => !itemPassesFilters(item))
              ) && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <UtensilsCrossed className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="font-medium text-muted-foreground">No items match your filters</p>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="mt-3 text-sm font-semibold text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
          </div>
        )}
        </div>{/* end flex-1 */}
      </div>

      {/* ─── Allergen Filter Sheet ─── */}
      <AllergenFilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        avoidAllergens={avoidAllergens}
        dietaryFilters={dietaryFilters}
        onApply={handleApplyFilters}
      />

      {/* ─── Sticky Cart Bar ─── */}
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
          >
            <button
              onClick={() => router.push(`/r/${slug}/cart`)}
              className="w-full flex items-center justify-between rounded-xl bg-violet-600 px-4 py-3.5 text-white shadow-lg hover:bg-violet-700 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                  {itemCount}
                </div>
                <span className="text-sm font-medium">
                  {itemCount} item{itemCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatPrice(subtotal)}</span>
                <span className="text-white/80 text-sm">View cart →</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
