"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { mockTenant } from "@/mock/tenant";

export function TrialBanner() {
  const { plan_status, trial_ends_at } = mockTenant;
  if (plan_status !== "trial" || !trial_ends_at) return null;

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(trial_ends_at).getTime() - Date.now()) / 86_400_000)
  );

  return (
    <div className="flex items-center justify-between gap-3 bg-primary px-4 py-2 text-primary-foreground text-sm">
      <div className="flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 flex-shrink-0" />
        <span>
          <span className="font-semibold">{daysLeft} day{daysLeft !== 1 ? "s" : ""} left</span>
          {" "}on your Pro trial.
        </span>
      </div>
      <Link
        href="/dashboard/billing"
        className="flex-shrink-0 rounded-md bg-primary-foreground/15 px-3 py-1 text-xs font-semibold hover:bg-primary-foreground/25 transition-colors"
      >
        Upgrade now
      </Link>
    </div>
  );
}
