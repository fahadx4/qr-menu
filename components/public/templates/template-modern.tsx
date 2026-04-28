"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Mail, Link2, Clock, ChevronRight, Menu, X } from "lucide-react";
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

const ITEM_GRADIENTS = [
  "from-violet-600 to-indigo-700",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-700",
  "from-cyan-500 to-teal-600",
  "from-emerald-500 to-green-700",
  "from-fuchsia-500 to-purple-700",
];

export default function TemplateModern({
  restaurant,
  featuredItems,
  categories,
  isOpen,
  orderingEnabled,
  reservationsEnabled,
  slug,
}: TemplateProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const today = DAYS[new Date().getDay()];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Sticky Header */}
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled ? "bg-zinc-950/95 backdrop-blur border-b border-zinc-800 shadow-xl" : "bg-transparent"
        )}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight text-white">{restaurant.name}</span>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
            <Link href={`/r/${slug}/menu`} className="hover:text-white transition-colors">Menu</Link>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            {orderingEnabled && (
              <Link
                href={`/r/${slug}/menu`}
                className="hidden md:inline-flex h-9 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm items-center transition-colors"
              >
                Order Now
              </Link>
            )}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-zinc-300 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[60] bg-zinc-950 flex flex-col p-6"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 30 }}
          >
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-xl">{restaurant.name}</span>
              <button onClick={() => setMobileOpen(false)}><X className="h-6 w-6" /></button>
            </div>
            <nav className="flex flex-col gap-4 text-xl font-medium">
              <Link href={`/r/${slug}/menu`} onClick={() => setMobileOpen(false)} className="hover:text-amber-400 transition-colors">Menu</Link>
              <a href="#about" onClick={() => setMobileOpen(false)} className="hover:text-amber-400 transition-colors">About</a>
              <a href="#contact" onClick={() => setMobileOpen(false)} className="hover:text-amber-400 transition-colors">Contact</a>
            </nav>
            {orderingEnabled && (
              <Link
                href={`/r/${slug}/menu`}
                className="mt-8 h-12 rounded-xl bg-amber-500 text-zinc-950 font-bold text-base flex items-center justify-center"
                onClick={() => setMobileOpen(false)}
              >
                Order Now
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-violet-950" />

        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6",
              isOpen ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
            )}>
              <span className={cn("w-2 h-2 rounded-full", isOpen ? "bg-green-400 animate-pulse" : "bg-red-400")} />
              {isOpen ? "Open Now" : "Closed"}
            </span>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-4 leading-none">
              {restaurant.name}
            </h1>
            <p className="text-zinc-300 text-lg mb-2">{restaurant.cuisine}</p>
            <p className="text-zinc-400 text-sm mb-10 max-w-md mx-auto">{restaurant.description}</p>

            <div className="flex flex-wrap gap-3 justify-center">
              {orderingEnabled && (
                <Link
                  href={`/r/${slug}/menu`}
                  className="h-12 px-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm inline-flex items-center gap-2 transition-all hover:scale-105"
                >
                  Order Now <ChevronRight className="h-4 w-4" />
                </Link>
              )}
              <Link
                href={`/r/${slug}/menu`}
                className="h-12 px-8 rounded-xl border border-zinc-600 hover:border-zinc-400 text-white font-semibold text-sm inline-flex items-center transition-all hover:bg-white/5"
              >
                View Menu
              </Link>
              {reservationsEnabled && (
                <Link
                  href={`/r/${slug}/reserve`}
                  className="h-12 px-8 rounded-xl border border-violet-500/50 hover:border-violet-400 text-violet-300 font-semibold text-sm inline-flex items-center transition-all hover:bg-violet-500/10"
                >
                  Reserve Table
                </Link>
              )}
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-zinc-600 flex items-start justify-center pt-2"
          >
            <div className="w-1 h-2 rounded-full bg-zinc-400" />
          </motion.div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="text-amber-500 text-sm font-semibold uppercase tracking-widest mb-2">Taste the Best</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">Our Signature Dishes</h2>
          </motion.div>

          <div className="overflow-x-auto -mx-4 px-4 md:overflow-visible md:px-0">
            <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 min-w-max md:min-w-0">
              {featuredItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="w-72 md:w-auto flex-shrink-0 md:flex-shrink bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300"
                >
                  <div className={cn("h-48 bg-gradient-to-br", ITEM_GRADIENTS[i % ITEM_GRADIENTS.length], "relative overflow-hidden")}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white/20 text-7xl font-black">{item.name[0]}</span>
                    </div>
                    {item.tags?.includes("popular") && (
                      <span className="absolute top-3 left-3 bg-amber-500 text-zinc-950 text-xs font-bold px-2 py-1 rounded-full">Popular</span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-bold text-lg">{formatPrice(item.price)}</span>
                      {orderingEnabled && (
                        <Link
                          href={`/r/${slug}/menu`}
                          className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                        >
                          Order <ChevronRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 px-4 bg-zinc-900">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-amber-500 text-sm font-semibold uppercase tracking-widest mb-3">Our Story</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Crafted with Passion</h2>
            <p className="text-zinc-300 text-base leading-relaxed mb-4">{restaurant.description}</p>
            <p className="text-zinc-400 text-sm">{restaurant.cuisine} cuisine · {restaurant.city}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-4"
          >
            {[
              { label: "Menu Items", value: "50+", icon: "🍽️" },
              { label: "Rating", value: "4.8★", icon: "⭐" },
              { label: "Happy Guests", value: "10K+", icon: "😊" },
            ].map((stat) => (
              <div key={stat.label} className="bg-zinc-800 border border-zinc-700 rounded-2xl p-5 text-center">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-zinc-400 text-xs">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <h2 className="text-3xl font-black text-white">Explore the Menu</h2>
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
                  <Link
                    href={`/r/${slug}/menu`}
                    className="block bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center hover:border-amber-500/50 hover:bg-zinc-800 transition-all group"
                  >
                    <span className="text-3xl mb-3 block">
                      {["🍔","🍟","🥤","🍰"][i % 4]}
                    </span>
                    <p className="font-semibold text-white group-hover:text-amber-400 transition-colors">{cat.name}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hours & Contact */}
      <section id="contact" className="py-24 px-4 bg-zinc-900">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Clock className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-bold text-white">Opening Hours</h2>
            </div>
            <div className="space-y-2">
              {restaurant.hours.map((h) => (
                <div
                  key={h.day}
                  className={cn(
                    "flex justify-between items-center py-2.5 px-4 rounded-lg text-sm",
                    h.day === today ? "bg-amber-500/10 border border-amber-500/20 text-white" : "text-zinc-400"
                  )}
                >
                  <span className={cn("font-medium", h.day === today && "text-amber-400")}>{h.day}</span>
                  {h.closed ? (
                    <span className="text-red-400 text-xs">Closed</span>
                  ) : (
                    <span>{h.open} – {h.close}</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-bold text-white mb-6">Find Us</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-zinc-300">
                <MapPin className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{restaurant.address}</p>
                  <p className="text-zinc-500">{restaurant.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <Phone className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <p>{restaurant.phone}</p>
              </div>
              {restaurant.email && (
                <div className="flex items-center gap-3 text-zinc-300">
                  <Mail className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <p>{restaurant.email}</p>
                </div>
              )}
            </div>

            {/* Map placeholder */}
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl h-40 flex flex-col items-center justify-center gap-3 relative overflow-hidden"
              style={{ backgroundImage: "linear-gradient(#3f3f4680 1px, transparent 1px), linear-gradient(90deg, #3f3f4680 1px, transparent 1px)", backgroundSize: "24px 24px" }}
            >
              <MapPin className="h-8 w-8 text-amber-500" />
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.address + " " + restaurant.city)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline"
              >
                View on Google Maps
              </a>
            </div>

            {(restaurant.social?.instagram || restaurant.social?.facebook) && (
              <div className="flex gap-3 pt-2">
                {restaurant.social.instagram && (
                  <a href={`https://instagram.com/${restaurant.social.instagram}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm transition-colors">
                    <Link2 className="h-4 w-4" />
                    Instagram
                  </a>
                )}
                {restaurant.social.facebook && (
                  <a href={`https://facebook.com/${restaurant.social.facebook}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm transition-colors">
                    <Link2 className="h-4 w-4" />
                    Facebook
                  </a>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white text-lg">{restaurant.name}</p>
            <p className="text-zinc-500 text-sm">{restaurant.cuisine} · {restaurant.city}</p>
          </div>
          <div className="flex gap-6 text-sm text-zinc-400">
            <Link href={`/r/${slug}/menu`} className="hover:text-white transition-colors">Menu</Link>
            {reservationsEnabled && <Link href={`/r/${slug}/reserve`} className="hover:text-white transition-colors">Reserve</Link>}
          </div>
          <p className="text-zinc-600 text-xs">© {new Date().getFullYear()} {restaurant.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
