"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  X,
  Check,
  Loader2,
  Globe,
  ChevronDown,
  Languages,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVE_LANGS_INITIAL: ActiveLanguage[] = [
  { code: "en", name: "English", flag: "🇬🇧", itemCount: 8 },
  { code: "ar", name: "Arabic", flag: "🇸🇦", itemCount: 8 },
  { code: "ur", name: "Urdu", flag: "🇵🇰", itemCount: 0 },
];

const AVAILABLE_LANGUAGES: { code: string; name: string; flag: string }[] = [
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "fa", name: "Persian", flag: "🇮🇷" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", flag: "🇧🇩" },
  { code: "zh-hans", name: "Chinese (Simplified)", flag: "🇨🇳" },
  { code: "zh-hant", name: "Chinese (Traditional)", flag: "🇹🇼" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "id", name: "Indonesian", flag: "🇮🇩" },
  { code: "ms", name: "Malay", flag: "🇲🇾" },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
];

const MOCK_ITEMS: { id: string; name: string; description: string }[] = [
  { id: "i1", name: "Classic Smash Burger", description: "Double smash patty, American cheese, caramelized onions, pickles, special sauce on a brioche bun." },
  { id: "i2", name: "Crispy Chicken Burger", description: "Southern-fried crispy chicken breast, coleslaw, pickled jalapeños, honey mustard." },
  { id: "i3", name: "Vegan Beyond Burger", description: "Beyond Meat patty, vegan cheddar, lettuce, tomato, vegan mayo on a whole-wheat bun." },
  { id: "i4", name: "Hand-Cut Fries", description: "Hand-cut fries, double fried and seasoned with sea salt." },
  { id: "i5", name: "Onion Rings", description: "Beer-battered onion rings." },
  { id: "i6", name: "Classic Milkshake", description: "Thick and creamy milkshake in multiple flavours." },
  { id: "i7", name: "Fresh Lemonade", description: "Fresh-squeezed lemonade with fresh mint." },
  { id: "i8", name: "Stuffed Brownie", description: "Warm brownie with vanilla ice cream and chocolate sauce." },
];

const mockArabicTranslations: Record<string, { name: string; description: string }> = {
  "i1": { name: "برجر سماش كلاسيك",     description: "باتي مزدوج مع جبنة أمريكية وبصل مكرمل ومخلل وصلصة خاصة على خبز بريوش" },
  "i2": { name: "برجر دجاج مقرمش",       description: "صدر دجاج مقلي مع كولسلو وفلفل حار وخردل عسل" },
  "i3": { name: "برجر نباتي بيوند",       description: "باتي نباتي مع جبنة نباتية وخس وطماطم" },
  "i4": { name: "بطاطس مقرمشة",          description: "بطاطس مقطعة يدويًا ومقلية مرتين ومتبلة بملح البحر" },
  "i5": { name: "حلقات البصل",           description: "حلقات بصل مخبوزة بعجينة البيرة" },
  "i6": { name: "ميلكشيك كلاسيك",       description: "ميلكشيك كثيف وكريمي بنكهات متعددة" },
  "i7": { name: "عصير ليمون طازج",       description: "عصير ليمون طازج مع نعناع طازج" },
  "i8": { name: "براوني محشو",           description: "براوني دافئ مع آيس كريم فانيليا وصلصة شوكولاتة" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActiveLanguage {
  code: string;
  name: string;
  flag: string;
  itemCount: number;
}

type TranslationRow = {
  itemId: string;
  name: string;
  description: string;
  approved: boolean;
};

const RTL_LANGS = ["ar", "ur", "fa", "he"];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MenuTranslatorPage() {
  const t = useT();
  const [activeLangs, setActiveLangs] = useState<ActiveLanguage[]>(ACTIVE_LANGS_INITIAL);
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  // Bulk translate section
  const [bulkTarget, setBulkTarget] = useState("ar");
  const [translating, setTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] = useState(0);
  const [translationDone, setTranslationDone] = useState(false);
  const [translationRows, setTranslationRows] = useState<TranslationRow[]>([]);

  // RTL preview
  const [rtlPreview, setRtlPreview] = useState(false);

  // Derived: languages not yet active
  const inactiveLangs = AVAILABLE_LANGUAGES.filter(
    (l) => !activeLangs.some((a) => a.code === l.code)
  );

  const handleAddLanguage = (lang: { code: string; name: string; flag: string }) => {
    setActiveLangs((prev) => [...prev, { ...lang, itemCount: 0 }]);
    setShowAddDropdown(false);
    toast.success(`${lang.flag} ${lang.name} added`);
  };

  const handleRemoveLang = (code: string) => {
    if (code === "en") {
      toast.error("Cannot remove the default language");
      return;
    }
    setActiveLangs((prev) => prev.filter((l) => l.code !== code));
  };

  const untranslatedCount = MOCK_ITEMS.filter((item) => {
    const targetLang = activeLangs.find((l) => l.code === bulkTarget);
    return !targetLang || targetLang.itemCount === 0;
  }).length;

  const handleTranslate = async () => {
    setTranslating(true);
    setTranslateProgress(0);
    setTranslationDone(false);

    // Animate progress 0 → 100 over 2 seconds
    const start = Date.now();
    const duration = 2000;
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setTranslateProgress(pct);
      if (pct < 100) {
        requestAnimationFrame(tick);
      } else {
        // Build rows
        const rows: TranslationRow[] = MOCK_ITEMS.map((item) => {
          const t = bulkTarget === "ar" ? mockArabicTranslations[item.id] : null;
          return {
            itemId: item.id,
            name: t ? t.name : `[${item.name}]`,
            description: t ? t.description : `[${item.description}]`,
            approved: false,
          };
        });
        setTranslationRows(rows);
        setTranslationDone(true);
        setTranslating(false);
        // Update item count for target lang
        setActiveLangs((prev) =>
          prev.map((l) => (l.code === bulkTarget ? { ...l, itemCount: MOCK_ITEMS.length } : l))
        );
      }
    };
    requestAnimationFrame(tick);
  };

  const handleApproveAll = () => {
    setTranslationRows((prev) => prev.map((r) => ({ ...r, approved: true })));
    toast.success(t.mtr_allApproved);
  };

  const handleApproveRow = (itemId: string) => {
    setTranslationRows((prev) =>
      prev.map((r) => (r.itemId === itemId ? { ...r, approved: true } : r))
    );
  };

  const handleRowChange = (itemId: string, field: "name" | "description", value: string) => {
    setTranslationRows((prev) =>
      prev.map((r) => (r.itemId === itemId ? { ...r, [field]: value } : r))
    );
  };

  const showRtlToggle = ["ar", "ur"].includes(bulkTarget);
  const reviewDir = rtlPreview && showRtlToggle ? "rtl" : "ltr";

  const targetLangMeta = [...AVAILABLE_LANGUAGES, ...ACTIVE_LANGS_INITIAL].find(
    (l) => l.code === bulkTarget
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-8">

        {/* ── Page header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Languages className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t.mtr_pageTitle}</h1>
              <p className="text-sm text-muted-foreground">{t.mtr_pageSubtitle}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Badge variant="default" className="w-fit">
              Pro
            </Badge>
            <p className="text-xs text-muted-foreground">847 / 2,000 {t.mtr_translationsUsed}</p>
            <div className="w-48">
              <div className="relative flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: "42.35%" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Active languages ── */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t.mtr_activeLanguages}</h2>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setShowAddDropdown((v) => !v)}
              >
                <Plus className="h-3.5 w-3.5" />
                {t.mtr_addLanguage}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <AnimatePresence>
                {showAddDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full z-20 mt-1 max-h-60 w-52 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg ring-1 ring-foreground/10"
                  >
                    {inactiveLangs.length === 0 ? (
                      <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                        {t.mtr_allLangsAdded}
                      </p>
                    ) : (
                      inactiveLangs.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleAddLanguage(lang)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-2">
            {activeLangs.map((lang) => (
              <div
                key={lang.code}
                className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{lang.flag}</span>
                  <div>
                    <p className="text-sm font-medium">{lang.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {lang.itemCount === 0
                        ? t.mtr_noItemsTranslated
                        : `${lang.itemCount} ${lang.itemCount === 1 ? t.mtr_itemTranslated : t.mtr_itemsTranslated}`}
                    </p>
                  </div>
                </div>
                {lang.code !== "en" ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveLang(lang.code)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span className="sr-only">Remove {lang.name}</span>
                  </Button>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">{t.mtr_defaultBadge}</Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Bulk translate ── */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold">{t.mtr_bulkTranslate}</h2>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">{t.mtr_translateAllTo}</span>
            <Select
              value={bulkTarget}
              onValueChange={(v) => {
                setBulkTarget(v as string);
                setTranslationDone(false);
                setTranslationRows([]);
                setTranslateProgress(0);
              }}
            >
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeLangs
                  .filter((l) => l.code !== "en")
                  .map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              className="gap-1.5"
              disabled={translating}
              onClick={handleTranslate}
            >
              {translating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.mtr_translating}
                </>
              ) : (
                <>
                  {MOCK_ITEMS.length} {t.mtr_translateItems}
                </>
              )}
            </Button>
          </div>

          {/* Progress bar */}
          <AnimatePresence>
            {(translating || translationDone) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {translating && (
                  <p className="text-sm text-muted-foreground">
                    {t.mtr_translatingProgress} {targetLangMeta?.name ?? bulkTarget}…
                  </p>
                )}
                {translationDone && (
                  <p className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
                    <Check className="h-4 w-4" />
                    {MOCK_ITEMS.length} {t.mtr_translationDone}
                  </p>
                )}
                <div className="relative flex h-2 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: `${translateProgress}%` }}
                    transition={{ ease: "linear" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Translation review grid ── */}
        <AnimatePresence>
          {translationRows.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-border bg-card p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold">{t.mtr_reviewTranslations}</h2>
                <div className="flex items-center gap-3">
                  {showRtlToggle && (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="rtl-toggle"
                        checked={rtlPreview}
                        onCheckedChange={(checked) => setRtlPreview(checked)}
                        size="sm"
                      />
                      <Label htmlFor="rtl-toggle" className="text-xs cursor-pointer">
                        {t.mtr_previewRtl}
                      </Label>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={handleApproveAll}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {t.mtr_approveAll}
                  </Button>
                </div>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
                  {t.mtr_originalEnglish}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
                  {targetLangMeta?.flag} {targetLangMeta?.name ?? bulkTarget}
                </div>
              </div>

              <div className="space-y-4">
                {translationRows.map((row, idx) => {
                  const original = MOCK_ITEMS[idx];
                  return (
                    <div
                      key={row.itemId}
                      className={cn(
                        "grid grid-cols-2 gap-3 rounded-xl border p-3 transition-all",
                        row.approved
                          ? "border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-900/10"
                          : "border-border bg-background"
                      )}
                    >
                      {/* Original */}
                      <div className="space-y-1" dir="ltr">
                        <p className="text-sm font-medium">{original.name}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {original.description}
                        </p>
                      </div>

                      {/* Translated — editable */}
                      <div className="space-y-1.5" dir={reviewDir}>
                        <Input
                          value={row.name}
                          onChange={(e) => handleRowChange(row.itemId, "name", e.target.value)}
                          className="h-7 text-sm"
                          placeholder={t.mtr_translatedName}
                        />
                        <Textarea
                          value={row.description}
                          onChange={(e) => handleRowChange(row.itemId, "description", e.target.value)}
                          className="min-h-12 text-xs"
                          placeholder={t.mtr_translatedDesc}
                        />
                        {!row.approved && (
                          <Button
                            size="xs"
                            variant="outline"
                            className="gap-1 h-6 text-xs"
                            onClick={() => handleApproveRow(row.itemId)}
                          >
                            <Check className="h-3 w-3" />
                            {t.mtr_approve}
                          </Button>
                        )}
                        {row.approved && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <Check className="h-3 w-3" />
                            {t.mtr_approved}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Close dropdown on outside click */}
      {showAddDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowAddDropdown(false)}
        />
      )}
    </div>
  );
}
