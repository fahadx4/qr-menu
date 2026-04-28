"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "@/types";
import { generateId } from "@/lib/utils";

interface CartState {
  tenantSlug: string | null;
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "line_total">, tenantSlug: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  subtotal: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      tenantSlug: null,
      items: [],

      addItem: (item, tenantSlug) => {
        set((state) => {
          // Clear cart if switching tenants
          if (state.tenantSlug && state.tenantSlug !== tenantSlug) {
            return {
              tenantSlug,
              items: [
                {
                  ...item,
                  id: generateId(),
                  line_total: item.unit_price * item.quantity +
                    item.selected_modifiers.reduce((s, m) => s + m.price_delta, 0) * item.quantity,
                },
              ],
            };
          }

          // Check for identical existing line
          const modKey = JSON.stringify(item.selected_modifiers.map(m => m.option_id).sort());
          const existing = state.items.find(
            (i) =>
              i.item_id === item.item_id &&
              JSON.stringify(i.selected_modifiers.map(m => m.option_id).sort()) === modKey
          );

          if (existing) {
            return {
              tenantSlug,
              items: state.items.map((i) =>
                i.id === existing.id
                  ? {
                      ...i,
                      quantity: i.quantity + item.quantity,
                      line_total:
                        (i.quantity + item.quantity) *
                        (i.unit_price + i.selected_modifiers.reduce((s, m) => s + m.price_delta, 0)),
                    }
                  : i
              ),
            };
          }

          const modifierTotal = item.selected_modifiers.reduce((s, m) => s + m.price_delta, 0);
          const newItem: CartItem = {
            ...item,
            id: generateId(),
            line_total: (item.unit_price + modifierTotal) * item.quantity,
          };

          return { tenantSlug, items: [...state.items, newItem] };
        });
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) =>
                  i.id === id
                    ? {
                        ...i,
                        quantity,
                        line_total:
                          quantity *
                          (i.unit_price + i.selected_modifiers.reduce((s, m) => s + m.price_delta, 0)),
                      }
                    : i
                ),
        })),

      clearCart: () => set({ items: [], tenantSlug: null }),

      subtotal: () => get().items.reduce((s, i) => s + i.line_total, 0),

      total: () => {
        const sub = get().subtotal();
        const tax = Math.round(sub * 0.085);
        return sub + tax;
      },

      itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    {
      name: "qr-menu-cart",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : localStorage
      ),
    }
  )
);
