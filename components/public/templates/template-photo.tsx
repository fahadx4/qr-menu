"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";
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

const PHOTO_GRADIENTS = [
  "from-orange-400 to-red-600",
  "from-amber-400 to-orange-600",
  "from-rose-400 to-pink-600",
  "from-yellow-400 to-amber-600",
  "from-red-400 to-rose-600",
  "from-orange-500 to-yellow-600",
  "from-pink-400 to-rose-600",
  "from-amber-500 to-red-600",
];

const GALLERY_GRADIENTS = [
  "from-orange-300 to-red-500",
  "from-yellow-300 to-orange-500",
  "from-rose-300 to-pink-500",
  "from-amber-300 to-yellow-500",
  "from-red-300 to-rose-500",
];

export default function TemplatePhoto({
  restaurant,
  featuredItems,
  categories,
  isOpen,
  orderingEnabled,
  reservationsEnabled,
  slug,
}: TemplateProps) {
  const today = DAYS[new Date().getDay()];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero — full viewport with photo grid background */}
      <section className="relative min-h-screen flex items-end pb-20 overflow-hidden">
        {/* Photo grid background */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1">
          {PHOTO_GRADIENTS.slice(0, 6).map((g, i) => (
            <div key={i} className={cn("bg-gradient-to-br", g)} />
          ))}
        </div>
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/20" />

        {/* Content */}
        <div className="relative z-10 w-full px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className={cn(
              "inline-block px-3 py-1 text-xs font-semibold uppercase tracking-widest rounded-full mb-6",
              isOpen ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
            )}>
              {isOpen ? "● Open" : "○ Closed"}
            </span>
            <h1 className="text-5xl md:text-8xl font-black tracking-tight text-white mb-4 max-w-4xl leading-none">
              {restaurant.name}
            </h1>
            <p className="text-white/50 text-sm uppercase tracking-widest mb-8">{restaurant.cuisine} · {restaurant.city}</p>
            <div className="flex flex-wrap gap-3">
              {orderingEnabled && (
                <Link href={`/r/${slug}/menu`}
                  className="h-12 px-8 bg-white text-zinc-950 font-bold text-sm inline-flex items-center hover:bg-white/90 transition-colors rounded">
                  Order Online
                </Link>
              )}
              <Link href={`/r/${slug}/menu`}
                className="h-12 px-8 border border-white/30 text-white font-semibold text-sm inline-flex items-center hover:bg-white/10 transition-colors rounded">
                View Menu
              </Link>
              {reservationsEnabled && (
                <Link href={`/r/${slug}/reserve`}
                  className="h-12 px-8 border border-white/20 text-white/60 font-semibold text-sm inline-flex items-center hover:bg-white/5 transition-colors rounded">
                  Reserve
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Masonry menu preview */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-3">Featured</p>
            <h2 className="text-3xl md:text-5xl font-black text-white">A Feast for the Eyes</h2>
          </motion.div>

          {/* CSS grid masonry-style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[160px]">
            {featuredItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "relative rounded-xl overflow-hidden group cursor-pointer",
                  i === 0 || i === 3 ? "row-span-2" : "row-span-1"
                )}
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br transition-transform duration-500 group-hover:scale-110", PHOTO_GRADIENTS[i % PHOTO_GRADIENTS.length])} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-bold text-white text-sm leading-tight">{item.name}</p>
                  <p className="text-white/60 text-xs mt-1">{formatPrice(item.price)}</p>
                </div>
                {item.tags?.[0] && (
                  <div className="absolute top-3 left-3 bg-white/20 backdrop-blur px-2 py-0.5 rounded text-white text-xs font-semibold">
                    {item.tags[0]}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Full-bleed order section */}
      {orderingEnabled && (
        <motion.section
          className="py-32 px-6 text-center relative overflow-hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-rose-700" />
          <div className="absolute inset-0 bg-zinc-950/40" />
          <div className="relative z-10">
            <p className="text-white/50 text-xs uppercase tracking-[0.4em] mb-4">Hungry?</p>
            <h2 className="text-4xl md:text-7xl font-black text-white mb-10 leading-none">
              Order <span className="italic font-light">Online</span>
            </h2>
            <Link href={`/r/${slug}/menu`}
              className="h-14 px-12 bg-white text-zinc-950 font-black text-base inline-flex items-center rounded hover:bg-white/90 transition-colors">
              Browse Full Menu
            </Link>
          </div>
        </motion.section>
      )}

      {/* Photo Gallery row */}
      <section className="py-16 overflow-hidden">
        <p className="text-white/20 text-xs uppercase tracking-[0.4em] text-center mb-6">Gallery</p>
        <div className="flex gap-2 px-4">
          {GALLERY_GRADIENTS.map((g, i) => (
            <motion.div
              key={i}
              className={cn("flex-1 h-48 rounded-lg bg-gradient-to-br overflow-hidden relative group cursor-pointer", g)}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Hours + Contact */}
      <section id="contact" className="py-24 px-6 bg-zinc-900/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-6">Hours</p>
            <div className="space-y-2">
              {restaurant.hours.map((h) => (
                <div key={h.day}
                  className={cn("flex justify-between text-sm", h.day === today ? "text-white" : "text-white/30")}>
                  <span>{h.day}</span>
                  {h.closed ? <span>Closed</span> : <span>{h.open}–{h.close}</span>}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-6">Location</p>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-white/60 text-sm">
                <MapPin className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div><p>{restaurant.address}</p><p className="text-white/30">{restaurant.city}</p></div>
              </div>
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <Phone className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <p>{restaurant.phone}</p>
              </div>
              {restaurant.email && (
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <Mail className="h-4 w-4 text-orange-400 flex-shrink-0" />
                  <p>{restaurant.email}</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-6">Categories</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/r/${slug}/menu`}
                  className="px-3 py-1.5 rounded-full border border-white/10 text-white/50 text-xs hover:border-orange-500/50 hover:text-orange-400 transition-colors">
                  {cat.name}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="font-black text-xl text-white">{restaurant.name}</p>
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} {restaurant.name}</p>
        </div>
      </footer>
    </div>
  );
}
