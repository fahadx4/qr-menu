"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { MapPin, Phone, Clock } from "lucide-react";
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

const CATEGORY_COLORS = [
  "border-t-red-500",
  "border-t-orange-500",
  "border-t-yellow-400",
  "border-t-rose-500",
];

function CountUp({ end, suffix = "" }: { end: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
      >
        {inView ? (
          <motion.span
            initial={0 as unknown as undefined}
            animate={end as unknown as undefined}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            {end}
          </motion.span>
        ) : "0"}
        {suffix}
      </motion.span>
    </motion.span>
  );
}

export default function TemplateBold({
  restaurant,
  featuredItems,
  categories,
  isOpen,
  orderingEnabled,
  reservationsEnabled,
  slug,
}: TemplateProps) {
  const today = DAYS[new Date().getDay()];
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Split */}
      <section className="min-h-screen flex flex-col md:flex-row">
        {/* Left */}
        <div className="flex-[6] flex items-center justify-center p-10 md:p-16 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #EF4444, #F97316)" }}>
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="relative z-10 max-w-lg">
            <span className={cn(
              "inline-block px-3 py-1 rounded text-xs font-black tracking-widest uppercase mb-6",
              isOpen ? "bg-yellow-400 text-red-800" : "bg-gray-800 text-gray-200"
            )}>
              {isOpen ? "● Open Now" : "● Closed"}
            </span>
            <h1 className="text-6xl md:text-8xl font-black uppercase text-white leading-none mb-4">
              {restaurant.name}
            </h1>
            <p className="text-yellow-300 text-xl font-bold uppercase tracking-wider mb-3">{restaurant.cuisine}</p>
            <p className="text-white/80 text-base mb-8">{restaurant.description}</p>
            <div className="flex flex-wrap gap-3">
              {orderingEnabled && (
                <Link href={`/r/${slug}/menu`}
                  className="h-14 px-8 bg-yellow-400 hover:bg-yellow-300 text-red-900 font-black text-sm uppercase tracking-wider inline-flex items-center transition-all hover:scale-105 rounded">
                  Order Now →
                </Link>
              )}
              <Link href={`/r/${slug}/menu`}
                className="h-14 px-8 border-2 border-white text-white font-black text-sm uppercase tracking-wider inline-flex items-center hover:bg-white/10 transition-colors rounded">
                See Menu
              </Link>
            </div>
          </div>
        </div>

        {/* Right food image placeholder */}
        <div
          className="flex-[4] min-h-[40vh] md:min-h-0 flex items-center justify-center relative overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #FCD34D, #F97316, #EF4444)",
            clipPath: "polygon(8% 0%, 100% 0%, 100% 100%, 0% 100%)",
          }}
        >
          <div className="text-white/20 text-[200px] font-black leading-none select-none">🍔</div>
          <div className="absolute bottom-8 right-8 bg-white/20 backdrop-blur px-4 py-2 rounded">
            <p className="text-white font-black text-sm uppercase">Fresh Daily</p>
          </div>
        </div>
      </section>

      {/* MENU HIGHLIGHTS */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <p className="text-red-500 text-xs font-black uppercase tracking-[0.4em] mb-2">Hot & Fresh</p>
            <h2 className="text-4xl md:text-5xl font-black uppercase text-gray-900">Menu Highlights</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {featuredItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={cn("border-t-4 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow bg-gray-50", CATEGORY_COLORS[i % CATEGORY_COLORS.length])}
              >
                <div className="h-36 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-4 overflow-hidden relative">
                  <span className="text-white/20 text-7xl font-black">{item.name[0]}</span>
                  {item.tags?.includes("spicy") && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">🌶 Spicy</span>
                  )}
                </div>
                <h3 className="font-black text-gray-900 text-base mb-1">{item.name}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-red-500 font-black text-xl">{formatPrice(item.price)}</span>
                  {orderingEnabled && (
                    <Link href={`/r/${slug}/menu`}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase px-3 py-1.5 rounded transition-colors">
                      Add +
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <div ref={statsRef} className="py-16 px-6" style={{ background: "linear-gradient(135deg, #EF4444, #F97316)" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { label: "Orders Delivered", value: 50000, suffix: "+" },
            { label: "Happy Customers", value: 12000, suffix: "+" },
            { label: "Menu Items", value: 80, suffix: "+" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={statsInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <motion.div
                className="text-4xl md:text-6xl font-black text-white mb-1"
                initial={{ opacity: 0 }}
                animate={statsInView ? { opacity: 1 } : {}}
                transition={{ delay: i * 0.2 + 0.3, duration: 0.5 }}
              >
                {stat.value.toLocaleString()}{stat.suffix}
              </motion.div>
              <p className="text-yellow-200 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Order Banner */}
      {orderingEnabled && (
        <section className="py-16 px-6 text-center relative overflow-hidden bg-yellow-400">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "repeating-linear-gradient(-45deg, #000 0, #000 1px, transparent 0, transparent 50%)",
              backgroundSize: "8px 8px",
            }}
          />
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-black uppercase text-red-900 mb-6">
              Order Online Now!
            </h2>
            <Link
              href={`/r/${slug}/menu`}
              className="h-14 px-10 bg-red-600 hover:bg-red-700 text-white font-black text-base uppercase tracking-widest inline-flex items-center rounded transition-all hover:scale-105"
            >
              Start Order →
            </Link>
          </motion.div>
        </section>
      )}

      {/* Hours */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-6">
              <Clock className="h-6 w-6 text-red-500" />
              <h2 className="text-2xl font-black uppercase text-gray-900">Hours</h2>
            </div>
            <div className="space-y-2">
              {restaurant.hours.map((h) => (
                <div
                  key={h.day}
                  className={cn(
                    "flex justify-between items-center p-3 rounded-lg text-sm font-bold",
                    h.day === today ? "bg-red-500 text-white" : "bg-gray-100 text-gray-700"
                  )}
                >
                  <span className="uppercase tracking-wide">{h.day}</span>
                  {h.closed
                    ? <span className={h.day === today ? "text-red-200" : "text-gray-400"}>Closed</span>
                    : <span>{h.open} – {h.close}</span>
                  }
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-5">
            <h2 className="text-2xl font-black uppercase text-gray-900 mb-6">Contact</h2>
            <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl border-l-4 border-orange-500">
              <Phone className="h-6 w-6 text-orange-500 flex-shrink-0" />
              <p className="text-2xl font-black text-gray-900">{restaurant.phone}</p>
            </div>
            <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl border-l-4 border-red-500">
              <MapPin className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <p className="font-black text-gray-900">{restaurant.address}</p>
                <p className="text-gray-500 text-sm">{restaurant.city}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-red-600">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-4xl font-black uppercase text-white">{restaurant.name}</p>
          <div className="flex gap-4 text-white/70 text-sm font-bold uppercase">
            <Link href={`/r/${slug}/menu`} className="hover:text-white transition-colors">Menu</Link>
            {reservationsEnabled && <Link href={`/r/${slug}/reserve`} className="hover:text-white transition-colors">Reserve</Link>}
          </div>
          <p className="text-red-300 text-xs">© {new Date().getFullYear()} {restaurant.name}</p>
        </div>
      </footer>
    </div>
  );
}
