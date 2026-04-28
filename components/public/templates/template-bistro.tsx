"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Link2, Leaf } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "sonner";

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

const CATEGORY_EMOJIS = ["🍔", "🍟", "🥤", "🍰", "🥗", "🍜"];

export default function TemplateBistro({
  restaurant,
  featuredItems,
  categories,
  isOpen,
  orderingEnabled,
  reservationsEnabled,
  slug,
}: TemplateProps) {
  const [email, setEmail] = useState("");
  const today = DAYS[new Date().getDay()];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Welcome to our community! ☕");
    setEmail("");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FDF6EC", color: "#2C1810" }}>
      {/* Nav */}
      <header className="border-b" style={{ backgroundColor: "#FDF6EC", borderColor: "#E8D5BA" }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5" style={{ color: "#6B7C5E" }} />
            <span className="font-bold text-base" style={{ color: "#5C3317" }}>{restaurant.name}</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: "#7A5C3E" }}>
            <Link href={`/r/${slug}/menu`} className="hover:opacity-70 transition-opacity">Menu</Link>
            <a href="#specials" className="hover:opacity-70 transition-opacity">Today's Specials</a>
            <a href="#contact" className="hover:opacity-70 transition-opacity">Visit Us</a>
          </nav>
          {orderingEnabled && (
            <Link
              href={`/r/${slug}/menu`}
              className="hidden md:inline-flex h-9 px-5 rounded-full text-sm font-semibold items-center transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#C17A32", color: "#FDF6EC" }}
            >
              Order Now
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ backgroundColor: "#FDF6EC" }}>
        {/* Paper texture */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")",
            backgroundSize: "200px 200px",
          }}
        />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
              style={{ backgroundColor: "#6B7C5E22", color: "#6B7C5E", border: "1px solid #6B7C5E44" }}
            >
              Est. 2019
            </span>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 leading-tight" style={{ color: "#5C3317", fontFamily: "Georgia, serif" }}>
              {restaurant.name}
            </h1>
            {/* Wavy divider */}
            <svg className="mx-auto mb-4 opacity-40" width="200" height="20" viewBox="0 0 200 20">
              <path d="M0,10 C25,0 50,20 75,10 C100,0 125,20 150,10 C175,0 200,20 200,10" fill="none" stroke="#C17A32" strokeWidth="2" />
            </svg>
            <p className="text-base leading-relaxed mb-8 max-w-md mx-auto" style={{ color: "#7A5C3E" }}>{restaurant.description}</p>

            <span className={cn(
              "inline-block text-xs px-3 py-1 rounded-full font-semibold mb-8",
              isOpen
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            )}>
              {isOpen ? "● Open Now" : "○ Closed"}
            </span>

            <div className="flex flex-wrap gap-3 justify-center">
              {orderingEnabled && (
                <Link href={`/r/${slug}/menu`}
                  className="h-12 px-8 rounded-full font-semibold text-sm inline-flex items-center transition-all hover:scale-105"
                  style={{ backgroundColor: "#C17A32", color: "#FDF6EC" }}>
                  View Menu
                </Link>
              )}
              {reservationsEnabled && (
                <Link href={`/r/${slug}/reserve`}
                  className="h-12 px-8 rounded-full font-semibold text-sm border inline-flex items-center transition-all hover:opacity-70"
                  style={{ borderColor: "#C17A32", color: "#C17A32" }}>
                  Reserve a table
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Today's Specials */}
      <section id="specials" className="py-20 px-6" style={{ backgroundColor: "#F5EAD8" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs uppercase tracking-widest mb-2 font-semibold" style={{ color: "#6B7C5E" }}>Daily Picks</p>
            <h2 className="text-3xl font-bold" style={{ color: "#5C3317", fontFamily: "Georgia, serif" }}>
              Today&apos;s Specials
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {featuredItems.slice(0, 3).map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-6 border-dashed border-2"
                style={{ backgroundColor: "#3D2B1A", borderColor: "#6B7C5E55" }}
              >
                <div className="text-3xl mb-3">{CATEGORY_EMOJIS[i % CATEGORY_EMOJIS.length]}</div>
                <h3 className="font-bold text-base mb-2" style={{ color: "#F5EAD8" }}>{item.name}</h3>
                <p className="text-sm mb-4 line-clamp-2" style={{ color: "#A08060" }}>{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold" style={{ color: "#C17A32" }}>{formatPrice(item.price)}</span>
                  {item.tags?.[0] && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#6B7C5E22", color: "#9AB08A" }}>
                      {item.tags[0]}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20 px-6" style={{ backgroundColor: "#FDF6EC" }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: "#6B7C5E" }}>Our Story</p>
            <h2 className="text-3xl font-bold mb-6" style={{ color: "#5C3317", fontFamily: "Georgia, serif" }}>
              Family-Owned Since 2019
            </h2>
            <svg className="mx-auto mb-6 opacity-40" width="120" height="16" viewBox="0 0 120 16">
              <path d="M0,8 C15,0 30,16 45,8 C60,0 75,16 90,8 C105,0 120,16 120,8" fill="none" stroke="#C17A32" strokeWidth="1.5" />
            </svg>
            <p className="leading-relaxed" style={{ color: "#7A5C3E" }}>{restaurant.description}</p>
            <p className="mt-4 text-sm" style={{ color: "#A08060" }}>{restaurant.cuisine} · {restaurant.city}</p>
          </motion.div>
        </div>
      </section>

      {/* Menu Categories */}
      <section className="py-20 px-6" style={{ backgroundColor: "#F5EAD8" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div className="mb-10 text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold" style={{ color: "#5C3317", fontFamily: "Georgia, serif" }}>Our Menu</h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/r/${slug}/menu`}
                  className="block rounded-xl p-5 text-center border hover:shadow-md transition-shadow group"
                  style={{ backgroundColor: "#FDF6EC", borderColor: "#E8D5BA" }}>
                  <span className="text-3xl mb-3 block">{CATEGORY_EMOJIS[i % CATEGORY_EMOJIS.length]}</span>
                  <p className="font-bold text-sm mb-1" style={{ color: "#5C3317" }}>{cat.name}</p>
                  <p className="text-xs" style={{ color: "#A08060" }}>Explore →</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hours - Chalkboard style */}
      <section className="py-20 px-6" style={{ backgroundColor: "#FDF6EC" }}>
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl p-8" style={{ backgroundColor: "#2C1810", color: "#F5EAD8" }}>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ fontFamily: "Georgia, serif" }}>
              ☕ Opening Hours
            </h2>
            <div className="space-y-3">
              {restaurant.hours.map((h) => (
                <div
                  key={h.day}
                  className={cn(
                    "flex justify-between py-2 border-b border-dashed text-sm",
                    h.day === today ? "font-bold" : "opacity-60"
                  )}
                  style={{ borderColor: "#6B7C5E44" }}
                >
                  <span style={{ color: h.day === today ? "#C17A32" : "#F5EAD8" }}>{h.day}</span>
                  {h.closed
                    ? <span style={{ color: "#9AB08A" }}>Closed</span>
                    : <span style={{ color: "#F5EAD8" }}>{h.open} – {h.close}</span>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Find Us */}
      <section id="contact" className="py-20 px-6" style={{ backgroundColor: "#F5EAD8" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: "#5C3317", fontFamily: "Georgia, serif" }}>
              Find Us
            </h2>
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 text-sm" style={{ color: "#7A5C3E" }}>
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#C17A32" }} />
                <div><p>{restaurant.address}</p><p style={{ color: "#A08060" }}>{restaurant.city}</p></div>
              </div>
              <div className="flex items-center gap-3 text-sm" style={{ color: "#7A5C3E" }}>
                <Phone className="h-4 w-4 flex-shrink-0" style={{ color: "#C17A32" }} />
                <p>{restaurant.phone}</p>
              </div>
              {restaurant.email && (
                <div className="flex items-center gap-3 text-sm" style={{ color: "#7A5C3E" }}>
                  <Mail className="h-4 w-4 flex-shrink-0" style={{ color: "#C17A32" }} />
                  <p>{restaurant.email}</p>
                </div>
              )}
            </div>

            {/* Warm map placeholder */}
            <div
              className="rounded-xl h-36 flex items-center justify-center border-2"
              style={{
                backgroundColor: "#FDF6EC",
                borderColor: "#E8D5BA",
                backgroundImage: "linear-gradient(#C17A3215 1px, transparent 1px), linear-gradient(90deg, #C17A3215 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              <div className="text-center">
                <MapPin className="h-6 w-6 mx-auto mb-2" style={{ color: "#C17A32" }} />
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold underline"
                  style={{ color: "#C17A32" }}
                >
                  Get Directions
                </a>
              </div>
            </div>

            {(restaurant.social?.instagram || restaurant.social?.facebook) && (
              <div className="flex gap-3 mt-5">
                {restaurant.social.instagram && (
                  <a href={`https://instagram.com/${restaurant.social.instagram}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity" style={{ color: "#C17A32" }}>
                    <Link2 className="h-4 w-4" /> Instagram
                  </a>
                )}
                {restaurant.social.facebook && (
                  <a href={`https://facebook.com/${restaurant.social.facebook}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity" style={{ color: "#C17A32" }}>
                    <Link2 className="h-4 w-4" /> Facebook
                  </a>
                )}
              </div>
            )}
          </motion.div>

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-8"
            style={{ backgroundColor: "#FDF6EC", border: "1px solid #E8D5BA" }}
          >
            <Leaf className="h-8 w-8 mb-4" style={{ color: "#6B7C5E" }} />
            <h3 className="text-xl font-bold mb-2" style={{ color: "#5C3317", fontFamily: "Georgia, serif" }}>
              Join Our Community
            </h3>
            <p className="text-sm mb-6" style={{ color: "#7A5C3E" }}>
              Get the latest specials, seasonal menus, and community events delivered to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full h-11 px-4 rounded-xl border text-sm outline-none focus:ring-2"
                style={{
                  backgroundColor: "#FDF6EC",
                  borderColor: "#E8D5BA",
                  color: "#2C1810",
                  // @ts-ignore
                  "--tw-ring-color": "#C17A3260",
                }}
              />
              <button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80"
                style={{ backgroundColor: "#6B7C5E", color: "#FDF6EC" }}
              >
                Subscribe ☕
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 text-center" style={{ backgroundColor: "#3D2B1A" }}>
        <p className="text-2xl font-bold mb-2" style={{ color: "#C17A32", fontFamily: "Georgia, serif" }}>{restaurant.name}</p>
        <p className="text-sm mb-4" style={{ color: "#7A5C3E" }}>{restaurant.cuisine} · {restaurant.city}</p>
        <div className="flex justify-center gap-6 text-sm mb-4" style={{ color: "#7A5C3E" }}>
          <Link href={`/r/${slug}/menu`} className="hover:opacity-70 transition-opacity">Menu</Link>
          {reservationsEnabled && <Link href={`/r/${slug}/reserve`} className="hover:opacity-70 transition-opacity">Reserve</Link>}
        </div>
        <p className="text-xs" style={{ color: "#5C3317" }}>© {new Date().getFullYear()} {restaurant.name}. Made with ☕</p>
      </footer>
    </div>
  );
}
