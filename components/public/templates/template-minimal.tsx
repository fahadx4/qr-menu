"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn, formatPrice } from "@/lib/utils";

interface TemplateProps {
  restaurant: {
    name: string;
    description: string;
    logo?: string;
    cover_image?: string;
    cuisine: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    hours: { day: string; open: string; close: string; closed: boolean }[];
    social?: { instagram?: string; facebook?: string };
  };
  featuredItems: { id: string; name: string; description: string; price: number; image_url?: string; tags?: string[] }[];
  categories: { id: string; name: string }[];
  isOpen: boolean;
  orderingEnabled: boolean;
  reservationsEnabled: boolean;
  slug: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Group items by a simple category label via tags
function groupByCategory(items: TemplateProps["featuredItems"], categories: TemplateProps["categories"]) {
  return categories.map((cat) => ({
    ...cat,
    items: items.slice(0, 3),
  })).slice(0, 3);
}

export default function TemplateMinimal({
  restaurant,
  featuredItems,
  categories,
  isOpen,
  orderingEnabled,
  reservationsEnabled,
  slug,
}: TemplateProps) {
  const [scrolled, setScrolled] = useState(false);
  const today = DAYS[new Date().getDay()];
  const grouped = groupByCategory(featuredItems, categories);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div
      className="min-h-screen bg-white text-black relative"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
      }}
    >
      {/* Navigation */}
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled ? "border-b border-black/10" : ""
        )}
        style={{ backgroundColor: "rgba(255,255,255,0.97)" }}
      >
        <div className="max-w-5xl mx-auto px-8 h-14 flex items-center justify-between">
          <span className="text-sm font-light tracking-[0.2em] uppercase">{restaurant.name}</span>
          <nav className="hidden md:flex items-center gap-8 text-xs tracking-[0.15em] uppercase text-black/50">
            <Link href={`/r/${slug}/menu`} className="hover:text-black transition-colors">Menu</Link>
            <a href="#about" className="hover:text-black transition-colors">About</a>
            <a href="#contact" className="hover:text-black transition-colors">Contact</a>
          </nav>
          {reservationsEnabled && (
            <Link
              href={`/r/${slug}/reserve`}
              className="text-xs tracking-[0.15em] uppercase text-black/50 hover:text-black transition-colors hidden md:block"
            >
              Reserve →
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center px-8 pt-14">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs tracking-[0.4em] uppercase text-black/30 mb-10">{restaurant.cuisine}</p>
          <h1 className="text-6xl md:text-9xl font-light tracking-widest text-black mb-8 leading-none">
            {restaurant.name}
          </h1>
          <div className="w-full max-w-xs mx-auto h-px bg-black/10 mb-8" />
          <p className="text-sm font-light tracking-widest text-black/40 mb-12 max-w-md mx-auto leading-relaxed">
            {restaurant.description}
          </p>
          <div className="flex items-center justify-center gap-8">
            {orderingEnabled && (
              <Link
                href={`/r/${slug}/menu`}
                className="h-11 px-8 bg-black text-white text-xs tracking-[0.2em] uppercase font-medium inline-flex items-center hover:bg-black/80 transition-colors"
              >
                View Menu
              </Link>
            )}
            {reservationsEnabled && (
              <Link
                href={`/r/${slug}/reserve`}
                className="text-xs tracking-[0.2em] uppercase text-black/40 hover:text-black transition-colors"
              >
                Reserve a table
              </Link>
            )}
          </div>
          <div className="mt-12">
            <span className={cn("text-xs tracking-widest uppercase", isOpen ? "text-black/30" : "text-black/20")}>
              {isOpen ? "● Open" : "○ Closed"}
            </span>
          </div>
        </motion.div>
      </section>

      {/* Menu */}
      <section className="py-32 px-8" id="menu">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-xs tracking-[0.4em] uppercase text-black/30 mb-4 text-center">The Menu</p>
            <div className="w-16 h-px bg-black/10 mx-auto" />
          </motion.div>

          {grouped.map((group, gi) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: gi * 0.1 }}
              className="mb-12"
            >
              <p className="text-xs tracking-[0.3em] uppercase text-black/40 mb-6 pb-2 border-b border-black/5">{group.name}</p>
              <div className="space-y-0">
                {group.items.map((item, i) => (
                  <div
                    key={item.id + gi}
                    className="flex items-baseline justify-between py-4 border-b border-black/5 group"
                  >
                    <div className="flex-1 mr-4">
                      <span className="text-sm font-medium text-black group-hover:text-black/60 transition-colors">{item.name}</span>
                      <span className="text-xs text-black/25 ml-3">{item.description.substring(0, 50)}...</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-black/25 flex-1 overflow-hidden">
                        {"···".repeat(6)}
                      </span>
                      <span className="text-sm font-light text-black whitespace-nowrap">{formatPrice(item.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          <div className="text-center mt-12">
            <Link
              href={`/r/${slug}/menu`}
              className="text-xs tracking-[0.2em] uppercase text-black/30 hover:text-black transition-colors"
            >
              Full menu →
            </Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-32 px-8 border-t border-black/5">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-4xl md:text-5xl font-light italic text-black/20 mb-12 leading-relaxed">
              &ldquo;{restaurant.description}&rdquo;
            </p>
            <div className="w-8 h-px bg-black/10 mx-auto mb-10" />
            <p className="text-xs tracking-[0.3em] uppercase text-black/30">
              {restaurant.cuisine} · {restaurant.city}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-32 px-8 border-t border-black/5">
        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-20">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-xs tracking-[0.3em] uppercase text-black/30 mb-8">Location</p>
            <p className="text-sm font-light leading-relaxed text-black/60 mb-1">{restaurant.address}</p>
            <p className="text-sm font-light text-black/40 mb-6">{restaurant.city}</p>
            <p className="text-sm font-light text-black/60">{restaurant.phone}</p>
            {restaurant.email && <p className="text-sm font-light text-black/40">{restaurant.email}</p>}

            {/* Map */}
            <div
              className="mt-8 border border-black/10 h-32 flex items-center justify-center"
              style={{
                backgroundImage: "linear-gradient(rgba(0,0,0,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.03) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-[0.2em] uppercase text-black/30 hover:text-black transition-colors"
              >
                View map →
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <p className="text-xs tracking-[0.3em] uppercase text-black/30 mb-8">Hours</p>
            <div className="space-y-3">
              {restaurant.hours.map((h) => (
                <div
                  key={h.day}
                  className={cn("flex justify-between text-sm", h.day === today ? "text-black" : "text-black/30")}
                >
                  <span className={cn("font-light", h.day === today && "font-medium")}>{h.day}</span>
                  {h.closed ? <span>Closed</span> : <span className="font-light">{h.open} – {h.close}</span>}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-black/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs tracking-[0.3em] uppercase text-black/30">{restaurant.name}</span>
          <span className="text-xs text-black/20">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
