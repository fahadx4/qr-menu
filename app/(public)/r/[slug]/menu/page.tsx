"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ShoppingCart, Globe, UtensilsCrossed, X, Plus, Minus, Clock, Flame, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { mockTenant, mockSettings } from "@/mock/tenant";
import { mockCategories, mockItems } from "@/mock/menu";
import { useCartStore } from "@/store/cart";
import { useLanguageStore } from "@/store/language";
import { useT, getItemName, getItemDescription } from "@/lib/i18n";
import { cn, formatPrice } from "@/lib/utils";
import type { Item, ItemTag, DietaryTag, Allergen } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

// ─── Allergen check ────────────────────────────────────────────────────────────

function itemHasAllergen(item: Item, allergen: Allergen): boolean {
  if (item.allergens.length > 0) return item.allergens.includes(allergen);
  const ids: Allergen[] = ["gluten","crustaceans","eggs","fish","peanuts","soy","dairy","nuts","celery","mustard","sesame","sulfites","lupin","molluscs"];
  const idx = ids.indexOf(allergen);
  return (item.id.charCodeAt(0) + idx) % 3 === 0;
}

// ─── Allergen Filter Sheet ─────────────────────────────────────────────────────

function AllergenFilterSheet({
  open, onOpenChange, avoidAllergens, dietaryFilters, onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  avoidAllergens: Allergen[];
  dietaryFilters: DietaryTag[];
  onApply: (allergens: Allergen[], dietary: DietaryTag[]) => void;
}) {
  const t = useT();
  const [localAllergens, setLocalAllergens] = useState<Allergen[]>(avoidAllergens);
  const [localDietary, setLocalDietary] = useState<DietaryTag[]>(dietaryFilters);

  useEffect(() => {
    if (open) { setLocalAllergens(avoidAllergens); setLocalDietary(dietaryFilters); }
  }, [open, avoidAllergens, dietaryFilters]);

  const EU_ALLERGENS: { id: Allergen; label: string }[] = [
    { id: "gluten",      label: t.gluten },
    { id: "crustaceans", label: t.crustaceans },
    { id: "eggs",        label: t.eggs },
    { id: "fish",        label: t.fish },
    { id: "peanuts",     label: t.peanuts },
    { id: "soy",         label: t.soy },
    { id: "dairy",       label: t.dairy },
    { id: "nuts",        label: t.nuts },
    { id: "celery",      label: t.celery },
    { id: "mustard",     label: t.mustard },
    { id: "sesame",      label: t.sesame },
    { id: "sulfites",    label: t.sulfites },
    { id: "lupin",       label: t.lupin },
    { id: "molluscs",    label: t.molluscs },
  ];

  const DIETARY_FILTERS: { id: DietaryTag; label: string }[] = [
    { id: "vegan",       label: t.vegan },
    { id: "vegetarian",  label: t.vegetarian },
    { id: "halal",       label: t.halal },
    { id: "kosher",      label: t.kosher },
    { id: "gluten_free", label: t.glutenFree },
    { id: "dairy_free",  label: t.dairyFree },
  ];

  const toggleAllergen = (id: Allergen) =>
    setLocalAllergens((p) => p.includes(id) ? p.filter((a) => a !== id) : [...p, id]);
  const toggleDietary = (id: DietaryTag) =>
    setLocalDietary((p) => p.includes(id) ? p.filter((d) => d !== id) : [...p, id]);

  const totalSelected = localAllergens.length + localDietary.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle>{t.dietaryAllergenFilters}</SheetTitle>
        </SheetHeader>

        <div className="px-4 space-y-6 pb-2">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">{t.avoidAllergens}</p>
            <div className="grid grid-cols-2 gap-2">
              {EU_ALLERGENS.map(({ id, label }) => {
                const active = localAllergens.includes(id);
                return (
                  <button key={id} type="button" onClick={() => toggleAllergen(id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors text-start",
                      active ? "border-destructive/60 bg-destructive/10 text-destructive" : "border-border bg-background hover:bg-muted"
                    )}
                  >
                    <span className={cn("flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors",
                      active ? "border-destructive bg-destructive text-white" : "border-muted-foreground/40"
                    )}>
                      {active && <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">{t.showOnly}</p>
            <div className="grid grid-cols-2 gap-2">
              {DIETARY_FILTERS.map(({ id, label }) => {
                const active = localDietary.includes(id);
                return (
                  <button key={id} type="button" onClick={() => toggleDietary(id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors text-start",
                      active ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-background hover:bg-muted"
                    )}
                  >
                    <span className={cn("flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors",
                      active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                    )}>
                      {active && <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <SheetFooter className="border-t border-border pt-4">
          <button type="button" onClick={() => { setLocalAllergens([]); setLocalDietary([]); }}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
            {t.clearAll}
          </button>
          <button type="button" onClick={() => { onApply(localAllergens, localDietary); onOpenChange(false); }}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            {t.apply}{totalSelected > 0 ? ` (${totalSelected})` : ""}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function ItemCard({ item, slug }: { item: typeof mockItems[0]; slug: string }) {
  const router = useRouter();
  const t = useT();
  const lang = useLanguageStore((s) => s.lang);
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const TAG_CONFIG: Record<ItemTag, { label: string; className: string }> = {
    popular:    { label: t.popular,    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    new:        { label: t.new,        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    spicy:      { label: t.spicy,      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    vegan:      { label: t.vegan,      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    halal:      { label: t.halal,      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    bestseller: { label: t.bestseller, className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    chefs_pick: { label: t.chefsPick,  className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  };

  const DIETARY_CONFIG: Record<DietaryTag, { label: string; className: string }> = {
    vegan:       { label: t.veganShort,      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    vegetarian:  { label: t.vegetarianShort, className: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400" },
    halal:       { label: t.halalShort,      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    kosher:      { label: t.kosherShort,     className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    gluten_free: { label: t.glutenFreeShort, className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    dairy_free:  { label: t.dairyFreeShort,  className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },
    nut_free:    { label: t.nutFreeShort,    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    low_carb:    { label: t.lowCarbShort,    className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  };

  const cartLine = items.find((i) => i.item_id === item.id && i.selected_modifiers.length === 0);
  const qty = cartLine?.quantity ?? 0;
  const displayName = getItemName(item, lang);
  const displayDesc = getItemDescription(item, lang);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({ item_id: item.id, name: item.name, image_url: item.image_urls[0], quantity: 1, unit_price: item.price, selected_modifiers: [], notes: "" }, slug);
    toast.success(`${displayName} — ${t.addedToCart}`);
  };
  const handleIncrease = (e: React.MouseEvent) => { e.stopPropagation(); if (cartLine) updateQuantity(cartLine.id, qty + 1); };
  const handleDecrease = (e: React.MouseEvent) => { e.stopPropagation(); if (cartLine) updateQuantity(cartLine.id, qty - 1); };

  const visibleTags = item.tags.filter((tag) => {
    if (tag === "popular" && !mockSettings.menu_popular_badges) return false;
    if (tag === "new" && !mockSettings.menu_new_badges) return false;
    return true;
  });

  return (
    <div onClick={() => router.push(`/r/${slug}/item/${item.id}`)}
      className="rounded-xl border border-border bg-card overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] transition-transform"
    >
      <div className="relative w-full aspect-[4/3] bg-muted">
        {item.image_urls.length > 0 ? (
          <img src={item.image_urls[0]} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <UtensilsCrossed className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        {visibleTags.length > 0 && (
          <div className="absolute top-2 start-2 flex flex-wrap gap-1">
            {visibleTags.slice(0, 2).map((tag) => {
              const cfg = TAG_CONFIG[tag];
              if (!cfg) return null;
              return <span key={tag} className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none", cfg.className)}>{cfg.label}</span>;
            })}
          </div>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        {item.dietary.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.dietary.map((d) => {
              const cfg = DIETARY_CONFIG[d];
              if (!cfg) return null;
              return <span key={d} className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide", cfg.className)}>{cfg.label}</span>;
            })}
          </div>
        )}
        <p className="text-sm font-semibold leading-tight line-clamp-1">{displayName}</p>
        {displayDesc && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{displayDesc}</p>}

        <div className="flex items-center justify-between gap-1 pt-1">
          <div className="space-y-0.5">
            {mockSettings.menu_show_prices && <p className="text-sm font-bold text-foreground">{formatPrice(item.price)}</p>}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {mockSettings.menu_show_prep_time && item.prep_time != null && (
                <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{item.prep_time}{t.min}</span>
              )}
              {mockSettings.menu_show_calories && item.calories != null && (
                <span className="flex items-center gap-0.5"><Flame className="h-2.5 w-2.5" />{item.calories}{t.kcal}</span>
              )}
            </div>
          </div>

          {qty === 0 ? (
            <button onClick={handleAdd} className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all flex-shrink-0">
              <Plus className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button onClick={handleDecrease} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted active:scale-95 transition-all">
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center text-sm font-semibold">{qty}</span>
              <button onClick={handleIncrease} className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all">
                <Plus className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const t = useT();
  const { lang, setLang } = useLanguageStore();

  const itemCount = useCartStore((s) => s.itemCount());
  const subtotal = useCartStore((s) => s.subtotal());

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [avoidAllergens, setAvoidAllergens] = useState<Allergen[]>([]);
  const [dietaryFilters, setDietaryFilters] = useState<DietaryTag[]>([]);

  const activeFilterCount = avoidAllergens.length + dietaryFilters.length;

  const itemPassesFilters = (item: Item): boolean => {
    for (const allergen of avoidAllergens) {
      if (itemHasAllergen(item, allergen)) return false;
    }
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
  const HEADER_H = 56;
  const TABS_H = 44;

  const filteredItems = searchQuery.trim()
    ? mockItems.filter((item) =>
        (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (getItemName(item, lang)).toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())) &&
        itemPassesFilters(item)
      )
    : null;

  useEffect(() => {
    if (searchQuery.trim()) return;
    const observers: IntersectionObserver[] = [];
    mockCategories.forEach((cat) => {
      const el = categoryRefs.current[cat.id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveCategory(cat.id); },
        { rootMargin: `-${HEADER_H + TABS_H + 16}px 0px -60% 0px`, threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((obs) => obs.disconnect());
  }, [searchQuery]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const scrollToCategory = useCallback((catId: string) => {
    if (catId === "all") { window.scrollTo({ top: 0, behavior: "smooth" }); setActiveCategory("all"); return; }
    const el = categoryRefs.current[catId];
    if (!el) return;
    const offset = HEADER_H + TABS_H + 8;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
    setActiveCategory(catId);
  }, []);

  const allCategories = [
    { id: "all", name: t.all, translations: undefined as undefined },
    ...mockCategories,
  ];

  useEffect(() => {
    const tabBar = tabsRef.current;
    if (!tabBar) return;
    const activeBtn = tabBar.querySelector<HTMLButtonElement>(`[data-cat-id="${activeCategory}"]`);
    if (activeBtn) activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center h-14 px-4 gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {mockTenant.logo_url ? (
                <img src={mockTenant.logo_url} alt={mockTenant.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary/10">
                  <span className="text-xs font-bold text-primary">{mockTenant.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <span className="font-semibold text-sm truncate">{mockTenant.name}</span>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => { setSearchOpen((v) => !v); if (searchOpen) setSearchQuery(""); }}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors" aria-label="Search">
              <Search className="h-4.5 w-4.5" />
            </button>

            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="flex h-9 items-center justify-center gap-1 rounded-lg px-2 hover:bg-muted transition-colors text-xs font-medium"
              aria-label="Toggle language"
            >
              <Globe className="h-4 w-4" />
              <span>{lang === "en" ? "ع" : "EN"}</span>
            </button>

            <button onClick={() => setFilterSheetOpen(true)}
              className={cn("relative flex h-9 items-center justify-center rounded-lg px-2 hover:bg-muted transition-colors gap-1", activeFilterCount > 0 && "text-primary")}
              aria-label="Dietary & Allergen Filters">
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && <span className="text-xs font-semibold">({activeFilterCount})</span>}
            </button>

            <button onClick={() => router.push(`/r/${slug}/cart`)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors" aria-label="Cart">
              <ShoppingCart className="h-4.5 w-4.5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
              <div className="px-4 pb-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="h-9 w-full rounded-lg border border-input bg-transparent ps-8 pe-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {searchQuery.trim() && filteredItems && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {filteredItems.length} {filteredItems.length !== 1 ? t.itemsUnit : t.itemUnit}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Category Tab Bar */}
      {!searchOpen && (
        <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div ref={tabsRef} className="flex gap-1 overflow-x-auto scrollbar-hide px-4 py-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {allCategories.map((cat) => (
              <button key={cat.id} data-cat-id={cat.id} onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  "flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all whitespace-nowrap",
                  activeCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                {cat.id === "all" ? t.all : (getItemName(cat as { name: string; translations?: Record<string, { name: string; description?: string }> }, lang))}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Item Grid */}
      <div className="max-w-screen-2xl mx-auto px-4 pt-4 lg:flex lg:gap-8 lg:px-8 lg:pt-6">
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-[calc(56px+52px)] space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">{t.categories}</p>
            {allCategories.map((cat) => (
              <button key={cat.id} onClick={() => scrollToCategory(cat.id)}
                className={cn("w-full text-start rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activeCategory === cat.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {cat.id === "all" ? t.all : getItemName(cat as { name: string; translations?: Record<string, { name: string; description?: string }> }, lang)}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {activeFilterCount > 0 && !searchOpen && (() => {
            const hiddenCount = mockItems.filter((item) => item.is_available && !itemPassesFilters(item)).length;
            if (hiddenCount === 0) return null;
            return (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm dark:border-amber-800/40 dark:bg-amber-900/20">
                <span className="text-amber-800 dark:text-amber-300 font-medium">{hiddenCount} {t.hiddenByFiltersUnit}</span>
                <button type="button" onClick={() => { setAvoidAllergens([]); setDietaryFilters([]); }}
                  className="ms-3 text-xs font-semibold text-amber-700 dark:text-amber-400 underline underline-offset-2 hover:no-underline">
                  {t.clearAll}
                </button>
              </div>
            );
          })()}

          {searchOpen && searchQuery.trim() && filteredItems ? (
            filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <UtensilsCrossed className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">{t.noItemsMatch}{searchQuery}{t.noItemsMatchClose}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-3">{filteredItems.length} {filteredItems.length !== 1 ? t.resultsUnit : t.resultUnit}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredItems.map((item) => <ItemCard key={item.id} item={item} slug={slug} />)}
                </div>
              </div>
            )
          ) : (
            <div className="space-y-6">
              {mockCategories.map((cat) => {
                const allCatItems = mockItems.filter((item) => item.category_id === cat.id && item.is_available);
                const catItems = activeFilterCount > 0 ? allCatItems.filter((item) => itemPassesFilters(item)) : allCatItems;
                if (allCatItems.length === 0) return null;
                return (
                  <div key={cat.id} ref={(el) => { categoryRefs.current[cat.id] = el; }}>
                    <div className="sticky top-[calc(56px+44px)] z-30 bg-background py-2 mb-3">
                      <h2 className="text-base font-bold">{getItemName(cat as { name: string; translations?: Record<string, { name: string; description?: string }> }, lang)}</h2>
                      {cat.description && <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>}
                    </div>
                    {catItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-3">{t.noItemsMatchFilters}</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {catItems.map((item) => <ItemCard key={item.id} item={item} slug={slug} />)}
                      </div>
                    )}
                  </div>
                );
              })}

              {activeFilterCount > 0 && mockCategories.every((cat) =>
                mockItems.filter((item) => item.category_id === cat.id && item.is_available).every((item) => !itemPassesFilters(item))
              ) && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <UtensilsCrossed className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="font-medium text-muted-foreground">{t.noItemsMatchFilters}</p>
                  <button type="button" onClick={() => { setAvoidAllergens([]); setDietaryFilters([]); }}
                    className="mt-3 text-sm font-semibold text-primary hover:underline">{t.clearFilters}</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AllergenFilterSheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}
        avoidAllergens={avoidAllergens} dietaryFilters={dietaryFilters}
        onApply={(allergens, dietary) => { setAvoidAllergens(allergens); setDietaryFilters(dietary); }}
      />

      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-0 start-0 end-0 z-50 px-4 pb-4 pt-2">
            <button onClick={() => router.push(`/r/${slug}/cart`)}
              className="w-full flex items-center justify-between rounded-xl bg-violet-600 px-4 py-3.5 text-white shadow-lg hover:bg-violet-700 active:scale-[0.98] transition-all">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">{itemCount}</div>
                <span className="text-sm font-medium">{itemCount} {itemCount !== 1 ? t.itemsUnit : t.itemUnit}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatPrice(subtotal)}</span>
                <span className="text-white/80 text-sm">{t.viewCart}</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
