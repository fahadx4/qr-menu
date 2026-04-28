"use client";

import { use, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Box, Clock, Flame, ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart } from "lucide-react";
import { ModelViewerModal } from "@/components/public/model-viewer-modal";
import { toast } from "sonner";

import { mockItems, mockModifierGroups } from "@/mock/menu";
import { useCartStore } from "@/store/cart";
import { cn, formatPrice } from "@/lib/utils";
import type { ModifierGroup } from "@/types";

/* ──────────────────────────────────────────────
   Allergen & dietary icon maps
────────────────────────────────────────────── */
const allergenEmoji: Record<string, string> = {
  gluten: "🌾",
  crustaceans: "🦐",
  eggs: "🥚",
  fish: "🐟",
  peanuts: "🥜",
  soy: "🫘",
  dairy: "🥛",
  nuts: "🌰",
  celery: "🌿",
  mustard: "🌱",
  sesame: "🌾",
  sulfites: "🍷",
  lupin: "🌸",
  molluscs: "🐚",
};

const dietaryLabel: Record<string, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  halal: "Halal",
  kosher: "Kosher",
  gluten_free: "GF",
  dairy_free: "DF",
  nut_free: "NF",
  low_carb: "Low Carb",
};

const tagLabel: Record<string, string> = {
  spicy: "🌶 Spicy",
  new: "✨ New",
  popular: "🔥 Popular",
  vegan: "🌱 Vegan",
  halal: "Halal",
  bestseller: "⭐ Bestseller",
  chefs_pick: "👨‍🍳 Chef's Pick",
};

/* ──────────────────────────────────────────────
   Selection state helpers
────────────────────────────────────────────── */
type SelectedModifiers = Record<string, Set<string>>; // groupId → Set of optionIds

function getInitialSelections(groups: ModifierGroup[]): SelectedModifiers {
  const result: SelectedModifiers = {};
  for (const group of groups) {
    const defaultOptions = group.options.filter((o) => o.is_default && o.is_available);
    if (defaultOptions.length > 0) {
      result[group.id] = new Set(defaultOptions.map((o) => o.id));
    } else {
      result[group.id] = new Set();
    }
  }
  return result;
}

function calcModifierDelta(groups: ModifierGroup[], selections: SelectedModifiers): number {
  let total = 0;
  for (const group of groups) {
    const selected = selections[group.id] ?? new Set();
    for (const option of group.options) {
      if (selected.has(option.id)) {
        total += option.price_delta;
      }
    }
  }
  return total;
}

/* ──────────────────────────────────────────────
   Page
────────────────────────────────────────────── */
export default function ItemDetailPage({
  params,
}: {
  params: Promise<{ slug: string; itemId: string }>;
}) {
  const { slug, itemId } = use(params);
  const router = useRouter();

  const item = mockItems.find((i) => i.id === itemId);
  if (!item) {
    router.replace(`/r/${slug}`);
    return null;
  }

  const modifierGroups = mockModifierGroups[item.id] ?? [];

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [imgIndex, setImgIndex] = useState(0);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [selections, setSelections] = useState<SelectedModifiers>(() =>
    getInitialSelections(modifierGroups)
  );
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [quantity, setQuantity] = useState(1);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [notes, setNotes] = useState("");
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [show3D, setShow3D] = useState(false);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const errorRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const addItem = useCartStore((s) => s.addItem);

  const images = item.image_urls.length > 0 ? item.image_urls : [""];
  const hasMultipleImages = images.length > 1;

  const prevImage = () => setImgIndex((i) => (i - 1 + images.length) % images.length);
  const nextImage = () => setImgIndex((i) => (i + 1) % images.length);

  const modifierDelta = calcModifierDelta(modifierGroups, selections);
  const lineTotal = (item.price + modifierDelta) * quantity;

  // Touch swipe for carousel
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextImage();
      else prevImage();
    }
    touchStartX.current = null;
  };

  const handleRadioSelect = (groupId: string, optionId: string) => {
    setSelections((prev) => ({ ...prev, [groupId]: new Set([optionId]) }));
    setErrors((prev) => ({ ...prev, [groupId]: false }));
  };

  const handleCheckboxToggle = (group: ModifierGroup, optionId: string) => {
    const current = selections[group.id] ?? new Set();
    const max = group.max_selections ?? Infinity;
    const next = new Set(current);
    if (next.has(optionId)) {
      next.delete(optionId);
    } else {
      if (next.size >= max) return; // enforce max
      next.add(optionId);
    }
    setSelections((prev) => ({ ...prev, [group.id]: next }));
    if (next.size > 0) {
      setErrors((prev) => ({ ...prev, [group.id]: false }));
    }
  };

  const handleAddToCart = useCallback(() => {
    // Validate required groups
    const newErrors: Record<string, boolean> = {};
    let firstErrorGroupId: string | null = null;

    for (const group of modifierGroups) {
      if (group.is_required) {
        const selected = selections[group.id] ?? new Set();
        if (selected.size < (group.min_selections || 1)) {
          newErrors[group.id] = true;
          if (!firstErrorGroupId) firstErrorGroupId = group.id;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      if (firstErrorGroupId && errorRefs.current[firstErrorGroupId]) {
        errorRefs.current[firstErrorGroupId]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Build selected_modifiers array
    const selected_modifiers: {
      group_name: string;
      option_id: string;
      option_name: string;
      price_delta: number;
    }[] = [];

    for (const group of modifierGroups) {
      const selectedIds = selections[group.id] ?? new Set();
      for (const option of group.options) {
        if (selectedIds.has(option.id)) {
          selected_modifiers.push({
            group_name: group.name,
            option_id: option.id,
            option_name: option.name,
            price_delta: option.price_delta,
          });
        }
      }
    }

    addItem(
      {
        item_id: item.id,
        name: item.name,
        image_url: item.image_urls[0] ?? undefined,
        quantity,
        unit_price: item.price,
        selected_modifiers,
        notes,
      },
      slug
    );

    toast.success("Added to cart", {
      action: {
        label: "View cart",
        onClick: () => router.push(`/r/${slug}/cart`),
      },
    });

    router.back();
  }, [addItem, item, modifierGroups, notes, quantity, router, selections, slug]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 lg:max-w-5xl lg:mx-auto lg:px-8 lg:border-b-0">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-muted/80 transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold truncate">{item.name}</h1>
      </header>

      {/* ── Two-column layout ── */}
      <div className="lg:flex lg:max-w-5xl lg:mx-auto lg:gap-10 lg:px-8 lg:py-8 lg:items-start">

      {/* ── LEFT: Image panel ── */}
      <div
        className="relative w-full aspect-[4/3] bg-zinc-100 dark:bg-zinc-900 overflow-hidden
                   lg:w-[420px] lg:flex-shrink-0 lg:aspect-square lg:rounded-2xl lg:sticky lg:top-8"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={imgIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {images[imgIndex] ? (
              <Image
                src={images[imgIndex]}
                alt={`${item.name} image ${imgIndex + 1}`}
                fill
                className="object-cover"
                priority={imgIndex === 0}
                sizes="100vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <ShoppingCart className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Arrow buttons (desktop) */}
        {hasMultipleImages && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors hidden sm:flex"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors hidden sm:flex"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIndex(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === imgIndex ? "bg-white scale-110" : "bg-white/50"
                )}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT: Content panel ── */}
      <div className="lg:flex-1 pb-10">

        {/* Item header */}
        <div className="px-5 pt-6 pb-4 lg:px-8 lg:pt-8">
          {/* Title row + 3D button */}
          <div className="flex items-start justify-between gap-3 mb-3 lg:mt-0 mt-0">
            <h2 className="text-2xl font-bold leading-tight tracking-tight lg:text-3xl">{item.name}</h2>
            <button
              onClick={() => setShow3D(true)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-1"
            >
              <Box className="w-3.5 h-3.5" />
              3D
            </button>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.description}</p>
          )}

          {/* Price + meta */}
          <div className="flex items-baseline gap-4 mb-4">
            <span className="text-3xl font-bold tracking-tight">{formatPrice(item.price)}</span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {item.prep_time != null && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {item.prep_time} min
                </span>
              )}
              {item.calories != null && (
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  {item.calories} kcal
                </span>
              )}
            </div>
          </div>

          {/* Tags + dietary */}
          {(item.tags.length > 0 || item.dietary.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {item.tags.filter(t => tagLabel[t]).map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  {tagLabel[tag]}
                </span>
              ))}
              {item.dietary.map((d) => (
                <span key={d} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  {dietaryLabel[d] ?? d}
                </span>
              ))}
            </div>
          )}

          {/* Allergens */}
          {item.allergens.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
              <span className="text-xs text-muted-foreground mr-1">Contains:</span>
              {item.allergens.map((a) => (
                <span key={a} title={a} className="text-base" aria-label={a}>
                  {allergenEmoji[a] ?? a}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Modifier groups */}
        {modifierGroups.length > 0 && (
          <div className="border-t border-border">
            {modifierGroups.map((group) => {
              const isRadio = (group.max_selections ?? Infinity) === 1;
              const selectedSet = selections[group.id] ?? new Set<string>();
              const hasError = errors[group.id] === true;
              const maxReached = !isRadio && group.max_selections != null && selectedSet.size >= group.max_selections;

              return (
                <div
                  key={group.id}
                  ref={(el) => { errorRefs.current[group.id] = el; }}
                  className="border-b border-border last:border-b-0"
                >
                  {/* Group header */}
                  <div className={cn(
                    "flex items-center justify-between px-5 py-3 lg:px-8",
                    hasError ? "bg-red-50 dark:bg-red-950/20" : "bg-muted/40"
                  )}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{group.name}</span>
                      {group.is_required ? (
                        <span className="rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                          Required
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted text-muted-foreground text-[10px] font-medium px-2 py-0.5">
                          Optional
                        </span>
                      )}
                    </div>
                    {!isRadio && group.max_selections != null && (
                      <span className="text-xs text-muted-foreground">
                        Pick up to {group.max_selections}
                      </span>
                    )}
                  </div>

                  {hasError && (
                    <p className="px-5 lg:px-8 py-1.5 text-xs text-red-500 font-medium bg-red-50/50 dark:bg-red-950/10">
                      Please make a selection to continue
                    </p>
                  )}

                  {/* Options */}
                  <div className={cn(hasError && "ring-1 ring-red-400 ring-inset")}>
                    {group.options.filter((o) => o.is_available).map((option) => {
                      const isSelected = selectedSet.has(option.id);
                      const isDisabled = !isRadio && !isSelected && maxReached;

                      return (
                        <label
                          key={option.id}
                          className={cn(
                            "flex items-center justify-between px-5 py-4 lg:px-8 cursor-pointer select-none transition-colors border-t border-border first:border-t-0",
                            isSelected ? "bg-primary/5" : "hover:bg-muted/40",
                            isDisabled && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={cn(
                              "shrink-0 flex items-center justify-center transition-all",
                              isRadio ? "w-5 h-5 rounded-full border-2" : "w-5 h-5 rounded-md border-2",
                              isSelected ? "border-primary bg-primary shadow-sm shadow-primary/30" : "border-muted-foreground/30 bg-background"
                            )}>
                              {isRadio && isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              {!isRadio && isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                            <span className={cn("text-sm font-medium", isSelected && "text-foreground")}>{option.name}</span>
                          </div>
                          <div className="flex items-center gap-3 ml-2 shrink-0">
                            {option.price_delta !== 0 && (
                              <span className="text-sm font-semibold text-primary">
                                +{formatPrice(option.price_delta)}
                              </span>
                            )}
                          </div>
                          <input
                            type={isRadio ? "radio" : "checkbox"}
                            className="sr-only"
                            name={group.id}
                            value={option.id}
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => {
                              if (isDisabled) return;
                              if (isRadio) handleRadioSelect(group.id, option.id);
                              else handleCheckboxToggle(group, option.id);
                            }}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Special instructions */}
        <div className="px-5 py-5 lg:px-8 border-t border-border">
          <label className="block text-sm font-semibold mb-2" htmlFor="item-notes">
            Special instructions <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="item-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g. no onions, extra sauce, well done..."
            rows={3}
            className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-muted-foreground/60 transition-colors"
          />
        </div>

      {/* 3D model viewer modal */}
      <ModelViewerModal
        open={show3D}
        onOpenChange={setShow3D}
        src="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
        name={item.name}
      />

      {/* ── Add to cart — embedded in right panel ── */}
      <div className="px-5 py-6 lg:px-8 border-t border-border bg-background">
        {/* Quantity + price row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 rounded-xl border border-border overflow-hidden bg-muted/50">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-11 h-11 flex items-center justify-center text-foreground hover:bg-muted transition-colors active:bg-muted"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-base font-bold tabular-nums">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-11 h-11 flex items-center justify-center text-foreground hover:bg-muted transition-colors active:bg-muted"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{formatPrice(lineTotal)}</p>
          </div>
        </div>

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-base font-bold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
        >
          <ShoppingCart className="w-5 h-5" />
          Add to Cart
        </button>
      </div>

      </div>{/* end right column */}
      </div>{/* end two-column */}
    </div>
  );
}
