"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

import { useCartStore } from "@/store/cart";
import { useT } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils";

const TAX_RATE = 0.15;

export default function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const t = useT();

  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const subtotalMinor = useCartStore((s) => s.subtotal());

  const [orderNotes, setOrderNotes] = useState("");

  const taxMinor = Math.round(subtotalMinor * TAX_RATE);
  const totalMinor = subtotalMinor + taxMinor;
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <button onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-muted/80 transition-colors shrink-0" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </button>
          <h1 className="text-base font-semibold">{t.cart}</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-lg font-semibold">{t.cartEmpty}</p>
            <p className="text-sm text-muted-foreground mt-1">{t.addItemsToStart}</p>
          </div>
          <button onClick={() => router.push(`/r/${slug}`)}
            className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
            {t.browseMenu}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40">
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <button onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-muted/80 transition-colors shrink-0" aria-label="Go back">
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
        </button>
        <h1 className="text-base font-semibold">
          {t.cart} ({totalQty} {totalQty === 1 ? t.itemUnit : t.itemsUnit})
        </h1>
      </header>

      <div className="divide-y divide-border">
        {items.map((cartItem) => (
          <div key={cartItem.id} className="px-4 py-4 flex gap-3">
            {cartItem.image_url && (
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0 relative">
                <Image src={cartItem.image_url} alt={cartItem.name} fill className="object-cover" sizes="64px" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-snug">{cartItem.name}</p>
                <p className="text-sm font-bold shrink-0">{formatPrice(cartItem.line_total)}</p>
              </div>
              {cartItem.selected_modifiers.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {cartItem.selected_modifiers.map((m) => m.option_name).join(", ")}
                </p>
              )}
              {cartItem.notes && (
                <p className="text-xs text-muted-foreground italic mt-0.5">&ldquo;{cartItem.notes}&rdquo;</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-border overflow-hidden bg-muted/40">
                  <button onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors" aria-label="Decrease quantity">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold tabular-nums">{cartItem.quantity}</span>
                  <button onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors" aria-label="Increase quantity">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button onClick={() => removeItem(cartItem.id)}
                  className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10">
                  <Trash2 className="w-3.5 h-3.5" />
                  {t.remove}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-4 border-t border-border">
        <label className="block text-sm font-semibold mb-2" htmlFor="order-notes">{t.orderNotes}</label>
        <textarea id="order-notes" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)}
          placeholder={t.orderNotesPlaceholder} rows={3}
          className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
        />
      </div>

      <div className="px-4 py-4 border-t border-border space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t.subtotal}</span>
          <span className="font-medium">{formatPrice(subtotalMinor)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t.tax} (15%)</span>
          <span className="font-medium">{formatPrice(taxMinor)}</span>
        </div>
        <div className="pt-2 border-t border-border flex justify-between">
          <span className="font-bold">{t.total}</span>
          <span className="font-bold text-lg">{formatPrice(totalMinor)}</span>
        </div>
      </div>

      <div className="fixed bottom-0 start-0 end-0 z-20 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3">
        <button onClick={() => router.push(`/r/${slug}/checkout`)}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all">
          {t.continueToCheckout}
          <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0" />
        </button>
      </div>
    </div>
  );
}
