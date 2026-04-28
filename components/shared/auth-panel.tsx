"use client";

import { motion, type Variants } from "framer-motion";
import { QrCode } from "lucide-react";

const stats = [
  { value: "50K+", label: "Restaurants" },
  { value: "2M+",  label: "Orders / month" },
  { value: "4.9★", label: "Average rating" },
];

const floatingItems = [
  { emoji: "🍔", x: "15%", y: "20%", delay: 0 },
  { emoji: "🍕", x: "75%", y: "15%", delay: 0.4 },
  { emoji: "🍜", x: "80%", y: "65%", delay: 0.8 },
  { emoji: "🧁", x: "10%", y: "70%", delay: 1.2 },
  { emoji: "🥗", x: "45%", y: "80%", delay: 0.6 },
  { emoji: "🍣", x: "50%", y: "10%", delay: 1.0 },
];

export function AuthPanel() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 text-white">
      {/* Background mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,_oklch(0.8_0.15_280_/_0.3)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,_oklch(0.5_0.25_240_/_0.4)_0%,_transparent_60%)]" />

      {/* Floating food emojis */}
      {floatingItems.map((item, i) => (
        <motion.div
          key={i}
          className="absolute text-3xl select-none"
          style={{ left: item.x, top: item.y }}
          animate={{
            y: [0, -12, 0],
            rotate: [-5, 5, -5],
          }}
          transition={{
            duration: 4 + i * 0.5,
            delay: item.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {item.emoji}
        </motion.div>
      ))}

      {/* Logo */}
      <motion.div
        className="relative flex items-center gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
          <QrCode className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-semibold tracking-tight">QR Menu</span>
      </motion.div>

      {/* Headline */}
      <motion.div
        className="relative space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-4xl font-bold leading-tight tracking-tight">
          Your menu,<br />
          <span className="text-violet-200">everywhere</span> your<br />
          customers are.
        </h1>
        <p className="text-lg text-violet-200/80 leading-relaxed max-w-sm">
          QR codes, WhatsApp ordering, AR previews, and real-time kitchen management — all in one platform.
        </p>

        {/* Stats */}
        <div className="flex gap-8 pt-2">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-violet-200/70">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Testimonial card */}
      <motion.div
        className="relative glass rounded-2xl p-5 space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-sm text-white/90 leading-relaxed italic">
          "We went from pen-and-paper to 300 orders a day in two weeks. The WhatsApp bot alone saved us two waiters."
        </p>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
            A
          </div>
          <div>
            <div className="text-xs font-semibold">Ahmed Al-Rashid</div>
            <div className="text-xs text-violet-200/60">Al-Salam Restaurant, Dubai</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
