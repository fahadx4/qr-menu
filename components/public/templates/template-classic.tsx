"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Link2, Clock } from "lucide-react";
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
  "from-amber-800 to-stone-900",
  "from-stone-700 to-amber-950",
  "from-orange-900 to-stone-900",
  "from-yellow-800 to-amber-900",
  "from-amber-700 to-orange-900",
  "from-stone-800 to-amber-950",
];

export default function TemplateClassic({
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

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAF7", color: "#1C1C1C" }}>
      {/* Sticky Nav */}
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-500",
          scrolled ? "shadow-sm border-b" : ""
        )}
        style={{ backgroundColor: "#FAFAF7", borderColor: "#E8E0D0" }}
      >
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-serif font-bold text-base tracking-wide" style={{ color: "#1C1C1C" }}>
            {restaurant.name}
          </span>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            {[
              { label: "Menu", href: `/r/${slug}/menu` },
              { label: "About", href: "#about" },
              { label: "Contact", href: "#contact" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="relative group pb-px transition-colors"
                style={{ color: "#5C5445" }}
              >
                {link.label}
                <span
                  className="absolute bottom-0 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                  style={{ backgroundColor: "#C9A84C" }}
                />
              </Link>
            ))}
          </nav>
          {reservationsEnabled && (
            <Link
              href={`/r/${slug}/reserve`}
              className="hidden md:inline-flex h-9 px-5 rounded border text-sm font-medium items-center transition-colors hover:opacity-80"
              style={{ borderColor: "#C9A84C", color: "#C9A84C" }}
            >
              Reserve
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(to bottom, #451A03, #1C0A00)" }}>
        <motion.div
          className="text-center px-6 max-w-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-16 opacity-40" style={{ backgroundColor: "#C9A84C" }} />
            <span className="text-xs tracking-[0.3em] uppercase opacity-60" style={{ color: "#C9A84C" }}>
              {restaurant.cuisine}
            </span>
            <div className="h-px w-16 opacity-40" style={{ backgroundColor: "#C9A84C" }} />
          </div>

          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-4 leading-tight">
            {restaurant.name}
          </h1>

          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-24 opacity-40" style={{ backgroundColor: "#C9A84C" }} />
            <span className="text-sm italic opacity-70 text-white">{restaurant.description}</span>
            <div className="h-px w-24 opacity-40" style={{ backgroundColor: "#C9A84C" }} />
          </div>

          <span
            className={cn("inline-block px-3 py-1 rounded text-xs tracking-widest uppercase mb-8 font-semibold", isOpen ? "" : "opacity-70")}
            style={{ backgroundColor: isOpen ? "#C9A84C22" : "#88888822", color: isOpen ? "#C9A84C" : "#aaa", border: `1px solid ${isOpen ? "#C9A84C44" : "#88888844"}` }}
          >
            {isOpen ? "Open Now" : "Closed"}
          </span>

          <div className="flex flex-wrap gap-3 justify-center">
            {orderingEnabled && (
              <Link
                href={`/r/${slug}/menu`}
                className="h-12 px-8 text-sm font-semibold tracking-widest uppercase inline-flex items-center transition-all hover:opacity-80"
                style={{ backgroundColor: "#C9A84C", color: "#1C0A00" }}
              >
                View Menu
              </Link>
            )}
            {reservationsEnabled && (
              <Link
                href={`/r/${slug}/reserve`}
                className="h-12 px-8 text-sm font-semibold tracking-widest uppercase border inline-flex items-center transition-all hover:opacity-80"
                style={{ borderColor: "#C9A84C55", color: "#C9A84C" }}
              >
                Reserve
              </Link>
            )}
          </div>
        </motion.div>
      </section>

      {/* Our Story */}
      <section id="about" className="py-24 px-6" style={{ backgroundColor: "#FAFAF7" }}>
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-xs tracking-[0.3em] uppercase mb-4 font-semibold" style={{ color: "#C9A84C" }}>Our Story</p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6" style={{ color: "#1C1C1C" }}>
            A Legacy of Fine Taste
          </h2>
          <div className="h-px max-w-[120px] mx-auto mb-8" style={{ backgroundColor: "#C9A84C" }} />
          <p className="text-base leading-relaxed mb-6" style={{ color: "#5C5445" }}>{restaurant.description}</p>
          <p className="text-2xl italic font-serif" style={{ color: "#C9A84C" }}>✦</p>
          <p className="text-sm mt-4 tracking-wide" style={{ color: "#9C8A70" }}>
            {restaurant.cuisine} · {restaurant.city}
          </p>
        </motion.div>
      </section>

      {/* Signature Dishes */}
      <section className="py-24 px-6" style={{ backgroundColor: "#F4EDE1" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs tracking-[0.3em] uppercase mb-3 font-semibold" style={{ color: "#C9A84C" }}>
              ✦ A Taste of Excellence ✦
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold" style={{ color: "#1C1C1C" }}>Signature Dishes</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: "#FAFAF7" }}
              >
                <div className={cn("h-44 bg-gradient-to-br", ITEM_GRADIENTS[i % ITEM_GRADIENTS.length], "flex items-center justify-center")}>
                  <span className="text-white/20 text-6xl font-serif font-bold">{item.name[0]}</span>
                </div>
                <div className="p-5">
                  {item.tags?.[0] && (
                    <span className="text-xs tracking-wider uppercase font-semibold mb-2 block" style={{ color: "#C9A84C" }}>
                      {item.tags[0]}
                    </span>
                  )}
                  <h3 className="font-serif font-bold text-base mb-1" style={{ color: "#1C1C1C" }}>{item.name}</h3>
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: "#9C8A70" }}>{item.description}</p>
                  <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: "#E8E0D0" }}>
                    <span className="font-bold" style={{ color: "#C9A84C" }}>{formatPrice(item.price)}</span>
                    {orderingEnabled && (
                      <Link href={`/r/${slug}/menu`} className="text-xs tracking-wide uppercase font-semibold hover:opacity-70 transition-opacity" style={{ color: "#5C5445" }}>
                        Order →
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reservation Banner */}
      {reservationsEnabled && (
        <motion.section
          className="py-20 px-6 text-center"
          style={{ background: "linear-gradient(135deg, #C9A84C, #8B6914)" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-sm tracking-[0.3em] uppercase mb-3 font-semibold text-amber-100">Book Your Experience</p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-8">Reserve Your Table</h2>
          <Link
            href={`/r/${slug}/reserve`}
            className="h-12 px-10 border-2 border-white text-white text-sm font-semibold tracking-widest uppercase inline-flex items-center hover:bg-white/10 transition-colors"
          >
            Make a Reservation
          </Link>
        </motion.section>
      )}

      {/* Hours & Location */}
      <section id="contact" className="py-24 px-6" style={{ backgroundColor: "#FAFAF7" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-6">
              <Clock className="h-4 w-4" style={{ color: "#C9A84C" }} />
              <h2 className="text-xl font-serif font-bold" style={{ color: "#1C1C1C" }}>Hours</h2>
            </div>
            <div className="space-y-3">
              {restaurant.hours.map((h) => (
                <div
                  key={h.day}
                  className={cn("flex justify-between py-2 border-b text-sm", h.day === today ? "font-semibold" : "")}
                  style={{ borderColor: "#E8E0D0", color: h.day === today ? "#C9A84C" : "#5C5445" }}
                >
                  <span className="italic">{h.day}</span>
                  {h.closed ? <span style={{ color: "#B0A090" }}>Closed</span> : <span>{h.open} – {h.close}</span>}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-5"
          >
            <h2 className="text-xl font-serif font-bold mb-6" style={{ color: "#1C1C1C" }}>Location</h2>
            <div className="flex items-start gap-3 text-sm" style={{ color: "#5C5445" }}>
              <MapPin className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: "#C9A84C" }} />
              <div className="italic">
                <p>{restaurant.address}</p>
                <p style={{ color: "#9C8A70" }}>{restaurant.city}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm" style={{ color: "#5C5445" }}>
              <Phone className="h-4 w-4 flex-shrink-0" style={{ color: "#C9A84C" }} />
              <p>{restaurant.phone}</p>
            </div>
            {restaurant.email && (
              <div className="flex items-center gap-3 text-sm" style={{ color: "#5C5445" }}>
                <Mail className="h-4 w-4 flex-shrink-0" style={{ color: "#C9A84C" }} />
                <p>{restaurant.email}</p>
              </div>
            )}
            {(restaurant.social?.instagram || restaurant.social?.facebook) && (
              <div className="flex gap-4 pt-4">
                {restaurant.social.instagram && (
                  <a href={`https://instagram.com/${restaurant.social.instagram}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity" style={{ color: "#C9A84C" }}>
                    <Link2 className="h-4 w-4" /> Instagram
                  </a>
                )}
                {restaurant.social.facebook && (
                  <a href={`https://facebook.com/${restaurant.social.facebook}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity" style={{ color: "#C9A84C" }}>
                    <Link2 className="h-4 w-4" /> Facebook
                  </a>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 text-center" style={{ backgroundColor: "#1C0A00" }}>
        <p className="font-serif font-bold text-xl mb-1" style={{ color: "#C9A84C" }}>{restaurant.name}</p>
        <p className="text-xs mb-4" style={{ color: "#9C8A70" }}>{restaurant.cuisine} · {restaurant.city}</p>
        <div className="flex justify-center gap-6 text-xs mb-6" style={{ color: "#9C8A70" }}>
          <Link href={`/r/${slug}/menu`} className="hover:text-amber-400 transition-colors">Menu</Link>
          {reservationsEnabled && <Link href={`/r/${slug}/reserve`} className="hover:text-amber-400 transition-colors">Reserve</Link>}
          <a href="#contact" className="hover:text-amber-400 transition-colors">Contact</a>
        </div>
        <p className="text-xs" style={{ color: "#5C4A30" }}>© {new Date().getFullYear()} {restaurant.name}</p>
      </footer>
    </div>
  );
}
