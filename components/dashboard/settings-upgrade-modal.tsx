"use client";

import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types";
import { CheckIcon, XIcon } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredPlan: Plan;
  currentPlan: Plan;
  featureName: string;
}

const PLANS: { plan: Plan; label: string; price: string }[] = [
  { plan: "free",     label: "Free",     price: "$0"   },
  { plan: "starter",  label: "Starter",  price: "$29"  },
  { plan: "pro",      label: "Pro",      price: "$79"  },
  { plan: "business", label: "Business", price: "$199" },
];

const PLAN_ORDER: Record<Plan, number> = {
  free: 0, starter: 1, pro: 2, business: 3,
};

const FEATURES: { label: string; plans: Plan[] }[] = [
  {
    label: "Unlimited menu items",
    plans: ["free", "starter", "pro", "business"],
  },
  {
    label: "QR code generation",
    plans: ["free", "starter", "pro", "business"],
  },
  {
    label: "Multiple branches",
    plans: ["starter", "pro", "business"],
  },
  {
    label: "AR / 3D menu viewer",
    plans: ["pro", "business"],
  },
  {
    label: "JazzCash / Easypaisa / Bizum",
    plans: ["starter", "pro", "business"],
  },
  {
    label: "Priority support & SLA",
    plans: ["business"],
  },
];

export function SettingsUpgradeModal({
  open,
  onOpenChange,
  requiredPlan,
  currentPlan,
  featureName,
}: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl w-full"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>Upgrade your plan</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{featureName}</span>{" "}
            requires the{" "}
            <span className="font-semibold capitalize">{requiredPlan}</span>{" "}
            plan or higher.
          </DialogDescription>
        </DialogHeader>

        {/* Plan comparison table */}
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium w-44">
                  Feature
                </th>
                {PLANS.map(({ plan, label, price }) => {
                  const isCurrent = plan === currentPlan;
                  const isHigher = PLAN_ORDER[plan] > PLAN_ORDER[currentPlan];
                  return (
                    <th
                      key={plan}
                      className={cn(
                        "text-center py-2 px-2 font-medium min-w-[80px]",
                        isCurrent && "text-primary"
                      )}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn(isCurrent ? "text-primary" : "text-foreground")}>
                          {label}
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {price}/mo
                        </span>
                        {isCurrent && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            Current
                          </Badge>
                        )}
                        {isHigher && (
                          <Button
                            size="xs"
                            variant="default"
                            className="mt-1 text-[10px]"
                            onClick={() => {
                              toast.info("Stripe integration coming soon");
                            }}
                          >
                            Upgrade
                          </Button>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map(({ label, plans }) => (
                <tr key={label} className="border-t border-border">
                  <td className="py-2.5 pr-4 text-muted-foreground">{label}</td>
                  {PLANS.map(({ plan }) => {
                    const included = plans.includes(plan);
                    return (
                      <td key={plan} className="text-center py-2.5 px-2">
                        {included ? (
                          <CheckIcon className="size-4 text-green-500 mx-auto" />
                        ) : (
                          <XIcon className="size-4 text-muted-foreground/40 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter showCloseButton>
          <Button
            variant="default"
            onClick={() => {
              toast.info("Stripe integration coming soon");
              onOpenChange(false);
            }}
          >
            View pricing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
