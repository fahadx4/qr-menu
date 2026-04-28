"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Globe, CheckCircle2, Eye, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Template config ──────────────────────────────────────────────────────────

interface TemplateDef {
  id: string;
  name: string;
  description: string;
  gradient: string;
  accent: string;
  dark?: boolean;
}

const TEMPLATES: TemplateDef[] = [
  {
    id: "modern",
    name: "Modern Dark",
    description: "Sleek dark UI with violet & amber accents",
    gradient: "from-zinc-900 via-zinc-800 to-violet-950",
    accent: "#8B5CF6",
  },
  {
    id: "classic",
    name: "Classic Elegant",
    description: "Timeless cream & gold for fine dining",
    gradient: "from-amber-950 to-stone-900",
    accent: "#C9A84C",
  },
  {
    id: "bold",
    name: "Bold & Energetic",
    description: "High-energy red & orange for fast casual",
    gradient: "from-red-500 to-orange-500",
    accent: "#EF4444",
  },
  {
    id: "minimal",
    name: "Minimalist Premium",
    description: "Pure white ultra-minimal fine dining",
    gradient: "from-gray-50 to-white",
    accent: "#000000",
    dark: false,
  },
  {
    id: "photo",
    name: "Photo-First Immersive",
    description: "Magazine-style full-bleed photography",
    gradient: "from-zinc-800 to-zinc-950",
    accent: "#F97316",
  },
  {
    id: "bistro",
    name: "Cozy Bistro",
    description: "Warm cream & coffee tones, handcrafted feel",
    gradient: "from-amber-100 to-orange-200",
    accent: "#C17A32",
    dark: false,
  },
];

type TemplateId = "modern" | "classic" | "bold" | "minimal" | "photo" | "bistro";

// ─── Website Builder Page ─────────────────────────────────────────────────────

export default function WebsitePage() {
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>("modern");
  const [settings, setSettings] = useState({
    tagline: "Fresh, handcrafted burgers made with love.",
    about: "We've been serving up the best burgers in New York since 2018. Using only the freshest locally sourced ingredients.",
    estYear: "2018",
    instagram: "burgerhouse",
    facebook: "burgerhouse",
    customDomain: "",
    showOrdering: true,
    showReservations: true,
    showMenu: true,
    showGallery: true,
  });
  const [seo, setSeo] = useState({
    metaTitle: "Burger House – Best Burgers in New York",
    metaDescription: "Fresh, handcrafted burgers made with love. Order online or reserve a table at Burger House, New York.",
  });

  const handleSaveTemplate = (id: TemplateId) => {
    setActiveTemplate(id);
    toast.success("Template updated!");
  };

  const handleSaveSettings = () => {
    toast.success("Website settings saved!");
  };

  const handleConnectDomain = () => {
    if (!settings.customDomain) {
      toast.error("Please enter a domain name first");
      return;
    }
    toast.info(`Connecting ${settings.customDomain}…`);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Website Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Customise your public restaurant website template
          </p>
        </div>
        <Link
          href="/r/burger-house"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Preview site
        </Link>
      </div>

      {/* Template Selector */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Choose a Template</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {TEMPLATES.map((tpl) => {
            const isActive = activeTemplate === tpl.id;
            return (
              <div
                key={tpl.id}
                className={cn(
                  "rounded-xl border overflow-hidden transition-all",
                  isActive
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-muted-foreground/40"
                )}
              >
                {/* Preview thumbnail */}
                <div className={cn("h-[150px] bg-gradient-to-br relative", tpl.gradient)}>
                  {/* Simulated UI chrome */}
                  <div className="absolute top-3 left-3 right-3 flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                    <div className="h-1.5 w-12 rounded-full bg-white/20" />
                    <div className="flex-1" />
                    <div className="h-5 w-12 rounded bg-white/10 border border-white/10" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className={cn("h-3 w-24 rounded mb-1.5", tpl.dark === false ? "bg-black/10" : "bg-white/20")} />
                    <div className={cn("h-2 w-16 rounded mb-3", tpl.dark === false ? "bg-black/5" : "bg-white/10")} />
                    <div className="h-6 w-20 rounded" style={{ backgroundColor: tpl.accent + "cc" }} />
                  </div>
                  {isActive && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 bg-card">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-sm">{tpl.name}</p>
                    {isActive && (
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs mb-4">{tpl.description}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveTemplate(tpl.id as TemplateId)}
                      disabled={isActive}
                      className={cn(
                        "flex-1 h-8 rounded-lg text-xs font-semibold transition-colors",
                        isActive
                          ? "bg-muted text-muted-foreground cursor-default"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      {isActive ? "In use" : "Use this template"}
                    </button>
                    <Link
                      href="/r/burger-house"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => toast.info("Opening preview…")}
                      className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Website Settings */}
      <section>
        <h2 className="text-base font-semibold mb-4">Website Settings</h2>
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          {/* Text fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Restaurant tagline</label>
              <input
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Est. year</label>
              <input
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={settings.estYear}
                onChange={(e) => setSettings({ ...settings, estYear: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">About us</label>
            <textarea
              className="w-full h-24 px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              value={settings.about}
              onChange={(e) => setSettings({ ...settings, about: e.target.value })}
            />
          </div>

          {/* Social media */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Instagram handle</label>
              <div className="flex h-9">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-muted text-muted-foreground text-sm">@</span>
                <input
                  className="flex-1 h-9 px-3 rounded-r-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  value={settings.instagram}
                  onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Facebook page</label>
              <input
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={settings.facebook}
                onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
              />
            </div>
          </div>

          {/* Custom domain */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Custom domain</label>
            <div className="flex gap-2">
              <input
                className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="www.myrestaurant.com"
                value={settings.customDomain}
                onChange={(e) => setSettings({ ...settings, customDomain: e.target.value })}
              />
              <button
                onClick={handleConnectDomain}
                className="h-9 px-4 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors whitespace-nowrap"
              >
                Connect domain
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium text-muted-foreground">Visible sections</p>
            {[
              { key: "showOrdering" as const, label: "Show online ordering" },
              { key: "showReservations" as const, label: "Show reservations" },
              { key: "showMenu" as const, label: "Show menu section" },
              { key: "showGallery" as const, label: "Show photo gallery" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm">{label}</span>
                <button
                  role="switch"
                  aria-checked={settings[key]}
                  onClick={() => setSettings({ ...settings, [key]: !settings[key] })}
                  className={cn(
                    "relative inline-flex h-6 w-11 rounded-full transition-colors",
                    settings[key] ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span className={cn(
                    "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                    settings[key] ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </label>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveSettings}
              className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save changes
            </button>
          </div>
        </div>
      </section>

      {/* SEO Settings */}
      <section>
        <h2 className="text-base font-semibold mb-4">SEO Settings</h2>
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Meta title</label>
            <input
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={seo.metaTitle}
              onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">{seo.metaTitle.length}/60 characters</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Meta description</label>
            <textarea
              className="w-full h-20 px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              value={seo.metaDescription}
              onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground">{seo.metaDescription.length}/160 characters</p>
          </div>

          {/* OG Image upload area */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">OG image (social share preview)</label>
            <div
              className="border-2 border-dashed border-border rounded-xl h-32 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
              onClick={() => toast.info("Image upload coming soon")}
            >
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Drop an image here or click to upload</p>
              <p className="text-xs text-muted-foreground">Recommended: 1200×630px · PNG or JPG</p>
            </div>
          </div>

          <button
            onClick={() => toast.success("SEO settings saved!")}
            className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save SEO
          </button>
        </div>
      </section>
    </div>
  );
}
