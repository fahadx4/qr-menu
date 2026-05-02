"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckIcon, MinusIcon, CreditCard, Download, AlertTriangle } from "lucide-react";

import { mockTenant } from "@/mock/tenant";
import { cn, formatPrice } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";

// ─── Data ─────────────────────────────────────────────────────────────────────

const invoices = [
  { id: "inv_001", date: "2026-04-01", amount: 7900, status: "paid" },
  { id: "inv_002", date: "2026-03-01", amount: 7900, status: "paid" },
  { id: "inv_003", date: "2026-02-01", amount: 7900, status: "paid" },
];

type Plan = "free" | "starter" | "pro" | "business";

interface PlanDef { id: Plan; name: string; price: number | null; priceLabel: string; color: string; badge: string; }

const PLANS: PlanDef[] = [
  { id: "free",     name: "Free",     price: 0,     priceLabel: "$0",   color: "text-zinc-500",   badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  { id: "starter",  name: "Starter",  price: 2900,  priceLabel: "$29",  color: "text-blue-500",   badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { id: "pro",      name: "Pro",      price: 7900,  priceLabel: "$79",  color: "text-violet-500", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  { id: "business", name: "Business", price: 19900, priceLabel: "$199", color: "text-amber-500",  badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
];

type FeatureValue = string | boolean;
interface Feature { label: string; free: FeatureValue; starter: FeatureValue; pro: FeatureValue; business: FeatureValue; }

const FEATURES: Feature[] = [
  { label: "Price/month",    free: "$0",       starter: "$29",      pro: "$79",       business: "$199"      },
  { label: "Menu items",     free: "30",        starter: "150",      pro: "Unlimited", business: "Unlimited" },
  { label: "Staff accounts", free: "1",         starter: "3",        pro: "10",        business: "Unlimited" },
  { label: "Branches",       free: "1",         starter: "1",        pro: "3",         business: "Unlimited" },
  { label: "QR campaigns",   free: false,       starter: false,      pro: true,        business: true        },
  { label: "AI translator",  free: false,       starter: false,      pro: true,        business: true        },
  { label: "AR/3D viewer",   free: false,       starter: false,      pro: true,        business: true        },
  { label: "Analytics",      free: "Basic",     starter: "Basic",    pro: "Advanced",  business: "Advanced"  },
  { label: "WhatsApp",       free: "100 msgs",  starter: "500 msgs", pro: "2,000 msgs",business: "Unlimited" },
  { label: "Custom domain",  free: false,       starter: false,      pro: true,        business: true        },
  { label: "API access",     free: false,       starter: false,      pro: false,       business: true        },
  { label: "Support",        free: "Email",     starter: "Email",    pro: "Priority",  business: "Dedicated" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(isoDate?: string): number {
  if (!isoDate) return 0;
  return Math.max(0, Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86400000));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true)  return <CheckIcon className="mx-auto size-4 text-violet-500" />;
  if (value === false) return <MinusIcon className="mx-auto size-4 text-muted-foreground/40" />;
  return <span className="text-sm text-center block">{value as string}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const t = useT();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const currentPlan    = mockTenant.plan as Plan;
  const planStatus     = mockTenant.plan_status;
  const trialEndsAt    = mockTenant.trial_ends_at;
  const daysLeft       = daysUntil(trialEndsAt);
  const isTrial        = planStatus === "trial";
  const currentPlanDef = PLANS.find((p) => p.id === currentPlan)!;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.bil_pageTitle}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{t.bil_pageSubtitle}</p>
      </div>

      {/* Current plan */}
      <Card>
        <CardHeader><CardTitle>{t.bil_currentPlan}</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold", currentPlanDef.badge)}>
                  {currentPlanDef.name} {t.bil_plan}
                </span>
                {isTrial && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 dark:border-amber-700 dark:text-amber-400">
                    {t.bil_trial}
                  </Badge>
                )}
              </div>
              {isTrial && trialEndsAt && (
                <p className="text-sm text-muted-foreground">
                  14-day Pro trial &mdash;{" "}
                  <span className="font-semibold text-foreground">{daysLeft} {t.bil_daysRemaining}</span>
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {t.bil_nextRenewal}{" "}
                <span className="text-foreground font-medium">May 8, 2026</span>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" onClick={() => toast.info("Stripe integration coming soon")}>
                <CreditCard className="size-4" />{t.bil_managePayment}
              </Button>
              <Button variant="destructive" onClick={() => setCancelDialogOpen(true)}>
                {t.bil_cancelSubscription}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <Card>
        <CardHeader>
          <CardTitle>{t.bil_plans}</CardTitle>
          <p className="text-xs text-muted-foreground">{t.bil_comparePlans}</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-start py-2 pe-4 text-muted-foreground font-medium w-40">{t.bil_feature}</th>
                {PLANS.map((plan) => (
                  <th key={plan.id} className={cn("text-center py-2 px-3 font-semibold rounded-t-lg",
                    plan.id === currentPlan ? "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300" : "text-foreground")}>
                    <div className="space-y-1">
                      <div>{plan.name}</div>
                      {plan.id === currentPlan && (
                        <div className="text-[10px] font-normal bg-violet-200 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 rounded-full px-2 py-0.5 inline-block">
                          {t.bil_current}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature, idx) => (
                <tr key={feature.label} className={cn("border-t border-border/50", idx % 2 !== 0 && "bg-muted/20")}>
                  <td className="py-2.5 pe-4 text-muted-foreground font-medium">{feature.label}</td>
                  {PLANS.map((plan) => (
                    <td key={plan.id} className={cn("py-2.5 px-3 text-center", plan.id === currentPlan && "bg-violet-50/60 dark:bg-violet-950/20")}>
                      <FeatureCell value={feature[plan.id]} />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-border">
                <td />
                {PLANS.map((plan) => (
                  <td key={plan.id} className={cn("py-3 px-3 text-center", plan.id === currentPlan && "bg-violet-50/60 dark:bg-violet-950/20")}>
                    {plan.id === currentPlan ? (
                      <span className="text-xs text-muted-foreground">{t.bil_active}</span>
                    ) : plan.id === "business" ? (
                      <Button size="sm" onClick={() => toast.info("Stripe integration coming soon")}>{t.bil_upgrade}</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => toast.info("Stripe integration coming soon")}>{t.bil_downgrade}</Button>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>{t.bil_usage}</CardTitle>
          <p className="text-xs text-muted-foreground">{t.bil_billingPeriod}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{t.bil_menuItems}</span>
              <span className="text-muted-foreground">8 / ∞</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden"><div className="h-full w-0 rounded-full bg-violet-500" /></div>
            <p className="text-xs text-muted-foreground">{t.bil_unlimitedOnPro}</p>
          </div>
          <Separator />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{t.bil_staffAccounts}</span>
              <span className="text-muted-foreground">2 / 10</span>
            </div>
            <Progress value={20} />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{t.navBranches}</span>
              <span className="text-muted-foreground">2 / 3</span>
            </div>
            <Progress value={67} />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{t.bil_whatsappMessages}</span>
              <span className="text-muted-foreground">847 / 2,000</span>
            </div>
            <Progress value={42} />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{t.bil_qrCampaigns}</span>
              <span className="text-muted-foreground">3 / ∞</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden"><div className="h-full w-0 rounded-full bg-violet-500" /></div>
            <p className="text-xs text-muted-foreground">{t.bil_unlimitedOnPro}</p>
          </div>
        </CardContent>
      </Card>

      {/* Invoice history */}
      <Card>
        <CardHeader><CardTitle>{t.bil_invoiceHistory}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-start py-2 font-medium text-muted-foreground">{t.dashDate}</th>
                <th className="text-start py-2 font-medium text-muted-foreground">{t.bil_invoiceHistory}</th>
                <th className="text-end py-2 font-medium text-muted-foreground">{t.dashAmount}</th>
                <th className="text-center py-2 font-medium text-muted-foreground">{t.dashStatus}</th>
                <th className="text-end py-2 font-medium text-muted-foreground" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 text-muted-foreground">{formatDate(inv.date)}</td>
                  <td className="py-3 font-mono text-xs text-muted-foreground">{inv.id}</td>
                  <td className="py-3 text-end font-semibold">{formatPrice(inv.amount)}</td>
                  <td className="py-3 text-center">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {t.bil_paid}
                    </span>
                  </td>
                  <td className="py-3 text-end">
                    <Button variant="ghost" size="sm" onClick={() => toast.info("PDF download coming soon")}>
                      <Download className="size-3.5" />{t.bil_downloadPdf}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Cancel dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              <DialogTitle>{t.bil_cancelTitle}</DialogTitle>
            </div>
            <DialogDescription>{t.bil_cancelDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {t.bil_keepSubscription}
            </DialogClose>
            <Button type="button" variant="destructive" onClick={() => { toast.info("Cancellation flow coming soon"); setCancelDialogOpen(false); }}>
              {t.bil_yesCancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
