"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  QrCode, Zap, Globe, ChefHat, BarChart2, MessageCircle,
  Star, ArrowRight, Check, Menu, X, ShoppingBag, Users,
  Smartphone, Layers, Shield, Clock,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Features",  href: "#features" },
  { label: "Pricing",   href: "#pricing" },
  { label: "Demo",      href: "/r/burger-house" },
  { label: "Dashboard", href: "/dashboard" },
];

const FEATURES = [
  {
    icon: QrCode,
    title: "Smart QR Ordering",
    desc: "Table, takeaway, and campaign QR codes — each scanned directly into your kitchen. No app download needed.",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Ordering",
    desc: "Customers order, pay, and track via WhatsApp. 98% open rate. Works on any phone in any country.",
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  {
    icon: ChefHat,
    title: "Live Kitchen Display",
    desc: "Full-screen KDS with bump animations, prep timers, and urgency colours. Works on any tablet or screen.",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    icon: Layers,
    title: "Enterprise Menu Builder",
    desc: "Standard, weighted, combo, and market-price items. Modifier groups, variants (S/M/L), allergens, dietary flags, kitchen station routing.",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    icon: BarChart2,
    title: "Real-time Analytics",
    desc: "Revenue trends, peak hour heatmaps, top items, customer segments, QR scan conversion — all in one view.",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    icon: Globe,
    title: "Multi-language & RTL",
    desc: "AI-powered translations for your menu. RTL support for Arabic and Urdu. Allergen disclosures auto-shown in EU markets.",
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  {
    icon: Users,
    title: "Staff & Role Management",
    desc: "Owner, manager, kitchen, waiter, cashier — granular permissions, branch-scoped access, invite by email.",
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
  {
    icon: Smartphone,
    title: "AR Menu Viewer",
    desc: "Customers see your dishes in 3D or AR before ordering. Upload a GLB model and it works on iOS and Android.",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "For single-location restaurants getting started.",
    cta: "Start free",
    ctaVariant: "outline" as const,
    highlighted: false,
    features: ["30 menu items", "1 branch", "Master QR code", "100 WhatsApp msgs/mo", "Basic analytics", "Web ordering"],
  },
  {
    name: "Starter",
    price: "$29",
    period: "per month",
    desc: "Everything you need to run a growing restaurant.",
    cta: "Start trial",
    ctaVariant: "outline" as const,
    highlighted: false,
    features: ["150 menu items", "1 branch", "Table QR codes", "500 WhatsApp msgs/mo", "Guest memory", "KDS", "3 staff accounts"],
  },
  {
    name: "Pro",
    price: "$79",
    period: "per month",
    desc: "For multi-location restaurants and chains.",
    cta: "Start 14-day trial",
    ctaVariant: "default" as const,
    highlighted: true,
    badge: "Most popular",
    features: ["Unlimited items", "3 branches", "Campaign QR codes", "2,000 WhatsApp msgs/mo", "AR / 3D viewer", "AI translator", "Floor plan", "Advanced analytics", "10 staff accounts"],
  },
  {
    name: "Business",
    price: "$199",
    period: "per month",
    desc: "Enterprise-grade for large chains and franchises.",
    cta: "Contact sales",
    ctaVariant: "outline" as const,
    highlighted: false,
    features: ["Everything in Pro", "Unlimited branches", "Unlimited staff", "Unlimited WhatsApp", "Franchise dashboard", "API access", "Dedicated support", "Custom domain", "White-label"],
  },
];

const TESTIMONIALS = [
  {
    quote: "We went from pen-and-paper to 300 orders a day in two weeks. The WhatsApp bot alone saved us two full-time waiters.",
    name: "Ahmed Al-Rashid",
    role: "Owner, Al-Salam Restaurant",
    location: "Dubai, UAE",
    initials: "AA",
    color: "bg-violet-500",
  },
  {
    quote: "The KDS is a game-changer. Our kitchen runs faster and our error rate dropped by 80% in the first month.",
    name: "Maria García",
    role: "Operations Manager, Tapas & Co",
    location: "Barcelona, Spain",
    initials: "MG",
    color: "bg-blue-500",
  },
  {
    quote: "Running 12 branches and all our menus are synced in real time. The analytics alone are worth the price.",
    name: "James Okonkwo",
    role: "CEO, Spice Chain",
    location: "Lagos, Nigeria",
    initials: "JO",
    color: "bg-green-500",
  },
];

const STATS = [
  { value: "50K+",   label: "Restaurants" },
  { value: "2M+",    label: "Orders / month" },
  { value: "120+",   label: "Countries" },
  { value: "4.9 ★",  label: "Average rating" },
];

const SPRING = [0.16, 1, 0.3, 1] as const;

// ─── Components ───────────────────────────────────────────────────────────────

function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ ease: SPRING, duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <QrCode className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg tracking-tight">QR Menu</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map((l) => (
                <Link key={l.label} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:flex")}>Sign in</Link>
              <Link href="/signup" className={cn(buttonVariants({ size: "sm" }), "hidden sm:flex gap-1.5")}>
                Start free <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button className="md:hidden p-2 text-muted-foreground" onClick={() => setMobileOpen((v) => !v)}>
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <motion.div
            className="md:hidden border-t border-border bg-background px-4 pb-4 pt-3 space-y-1"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {NAV_LINKS.map((l) => (
              <Link key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
                className="block px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors">
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1 justify-center")}>Sign in</Link>
              <Link href="/signup" className={cn(buttonVariants({ size: "sm" }), "flex-1 justify-center")}>Start free</Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-28 lg:pt-28 lg:pb-36">
        {/* Background gradients */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-40 right-0 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl px-4 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: SPRING, duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Now serving 50,000+ restaurants worldwide
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              The restaurant OS
              <br />
              <span className="gradient-text">for every scale</span>
            </h1>

            <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed">
              From a single food truck to a multinational chain — QR ordering, WhatsApp bot, live KDS,
              table reservations, loyalty, inventory, and enterprise analytics. All in one platform.
            </p>
          </motion.div>

          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: SPRING, duration: 0.7, delay: 0.15 }}
          >
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "gap-2 h-12 px-7 text-base font-semibold")}>
              Start 14-day free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/r/burger-house" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2 h-12 px-7 text-base")}>
              <ShoppingBag className="h-4 w-4" />
              See live demo
            </Link>
          </motion.div>

          <motion.p
            className="mt-4 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            No credit card required · 14-day Pro trial · Cancel anytime
          </motion.p>

          {/* Stats */}
          <motion.div
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: SPRING, duration: 0.7, delay: 0.25 }}
          >
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl lg:text-4xl font-extrabold tracking-tight gradient-text">{value}</div>
                <div className="text-sm text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Dashboard preview */}
        <FadeIn delay={0.35} className="mx-auto mt-20 max-w-6xl px-4 lg:px-8">
          <div className="relative rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-500 to-green-500" />
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4 h-6 rounded-md bg-muted/60 flex items-center px-3">
                <span className="text-[11px] text-muted-foreground">qrmenu.app/dashboard</span>
              </div>
            </div>
            {/* Mock dashboard grid */}
            <div className="grid grid-cols-4 gap-3 p-4 bg-background/50">
              {/* Sidebar stub */}
              <div className="col-span-1 hidden sm:block space-y-1.5">
                {["Overview","Orders","Kitchen","Menu","QR Codes","Tables","Staff","Analytics"].map((item, i) => (
                  <div key={item} className={cn("h-7 rounded-lg px-3 flex items-center text-xs font-medium",
                    i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
                  )}>
                    {item}
                  </div>
                ))}
              </div>
              {/* Content area */}
              <div className="col-span-4 sm:col-span-3 space-y-3">
                {/* KPI row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Orders today", value: "47", delta: "+20%" },
                    { label: "Revenue",       value: "$1,983", delta: "+22%" },
                    { label: "Avg order",     value: "$42.20", delta: "+1%" },
                    { label: "QR scans",      value: "213",  delta: "-4%" },
                  ].map((kpi) => (
                    <div key={kpi.label} className="rounded-xl border border-border bg-card p-3">
                      <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                      <p className="text-lg font-bold mt-0.5">{kpi.value}</p>
                      <p className={cn("text-[10px] font-medium", kpi.delta.startsWith("+") ? "text-green-500" : "text-red-500")}>{kpi.delta}</p>
                    </div>
                  ))}
                </div>
                {/* Chart placeholder */}
                <div className="rounded-xl border border-border bg-card h-24 flex items-center justify-center">
                  <div className="flex items-end gap-1 h-14">
                    {[40,65,52,78,90,72,85].map((h, i) => (
                      <div key={i} className="w-4 rounded-t-sm bg-primary/60" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                {/* Orders table stub */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  {["#1042 · T-5 · Ahmed K · Preparing · $43.36",
                    "#1041 · Takeaway · Sara L · Ready · $21.68",
                    "#1040 · T-8 · Maria G · Accepted · $26.84"].map((row, i) => (
                    <div key={i} className={cn("px-3 py-2 text-[11px] text-muted-foreground flex justify-between", i > 0 && "border-t border-border")}>
                      <span>{row.split("·").slice(0, 3).join(" · ")}</span>
                      <span className={cn("font-semibold",
                        row.includes("Preparing") ? "text-orange-500" :
                        row.includes("Ready") ? "text-green-500" : "text-blue-500"
                      )}>{row.split("·")[3]?.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Everything a restaurant needs
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              From a single food truck to a chain with 500 branches — every feature is built to enterprise scale from day one.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <FadeIn key={title} delay={i * 0.06}>
                <div className="rounded-2xl border border-border bg-card p-5 h-full hover:shadow-md transition-shadow card-hover">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl mb-4", color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live demo strip ── */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold">Try the live demo restaurant</h3>
            <p className="text-primary-foreground/70 text-sm mt-1">
              Browse Burger House's full menu, add items to cart, and go through checkout — right now.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link href="/r/burger-house" className={cn(buttonVariants({ size: "default" }), "bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2 font-semibold")}>
              <ShoppingBag className="h-4 w-4" />
              Customer view
            </Link>
            <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline", size: "default" }), "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2")}>
              <BarChart2 className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Simple, honest pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free. Scale when you're ready. No hidden fees.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {PLANS.map(({ name, price, period, desc, cta, ctaVariant, highlighted, badge, features }, i) => (
              <FadeIn key={name} delay={i * 0.07}>
                <div className={cn(
                  "relative rounded-2xl border p-6 h-full flex flex-col",
                  highlighted
                    ? "border-primary bg-primary/[0.04] shadow-lg shadow-primary/10"
                    : "border-border bg-card"
                )}>
                  {badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold text-primary-foreground">
                      {badge}
                    </span>
                  )}
                  <div className="mb-4">
                    <h3 className="font-bold text-base">{name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold">{price}</span>
                      <span className="text-sm text-muted-foreground">/{period}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <ul className="space-y-2 flex-1 mb-6">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs">
                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={ctaVariant === "default" ? "/signup" : name === "Business" ? "#" : "/signup"}
                    className={cn(buttonVariants({ variant: ctaVariant, size: "sm" }), "w-full justify-center")}
                  >
                    {cta}
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 border-t border-border/50 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <FadeIn className="text-center mb-14">
            <div className="flex justify-center gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Loved by restaurants worldwide</h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ quote, name, role, location, initials, color }, i) => (
              <FadeIn key={name} delay={i * 0.1}>
                <div className="rounded-2xl border border-border bg-card p-6 h-full flex flex-col justify-between gap-6 hover:shadow-md transition-shadow">
                  <p className="text-sm leading-relaxed text-muted-foreground italic">&ldquo;{quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold flex-shrink-0", color)}>
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{name}</p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                      <p className="text-xs text-muted-foreground/60">{location}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="py-12 border-t border-border/50">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: "SOC 2 compliant",      sub: "Enterprise security" },
              { icon: Zap,    label: "99.9% uptime SLA",     sub: "Reliability guarantee" },
              { icon: Globe,  label: "GDPR & data residency", sub: "EU & global compliance" },
              { icon: Clock,  label: "24/7 support",          sub: "Priority on Pro & Business" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 border-t border-border/50">
        <div className="mx-auto max-w-3xl px-4 lg:px-8 text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Ready to transform your restaurant?
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Join 50,000+ restaurants already using QR Menu. Set up in under 15 minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "gap-2 h-12 px-8 text-base font-semibold")}>
                Start your free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-8 text-base")}>
                Sign in
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">14-day Pro trial · No credit card · Cancel anytime</p>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-12 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <QrCode className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-bold">QR Menu</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Privacy", "Terms", "Security", "Status", "Contact"].map((l) => (
                <a key={l} href="#" className="hover:text-foreground transition-colors">{l}</a>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">© 2026 QR Menu. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
