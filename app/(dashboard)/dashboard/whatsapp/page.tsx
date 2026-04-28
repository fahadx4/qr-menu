"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  MessageCircle,
  CheckCircle2,
  Loader2,
  PauseCircle,
  XCircle,
  Check,
  MoreHorizontal,
  Eye,
  Copy,
  Trash2,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectionStatus =
  | "not_connected"
  | "pending"
  | "connected"
  | "paused"
  | "banned";

type TemplateStatus = "approved" | "pending" | "rejected" | "paused";
type TemplateCategory =
  | "Transactional"
  | "Marketing"
  | "Authentication"
  | "Utility";
type BillingModel = "direct" | "managed";

interface MessageTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  language: string;
  status: TemplateStatus;
  body: string;
  rejectionReason?: string;
}

interface Invoice {
  id: string;
  date: string;
  period: string;
  messages: number;
  cost: string;
  status: "paid" | "pending";
}

interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: string;
  balanceAfter: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TEMPLATES: MessageTemplate[] = [
  {
    id: "1",
    name: "order_confirmation",
    category: "Transactional",
    language: "English",
    status: "approved",
    body: "Hi {{1}}, your order #{{2}} has been confirmed! Estimated time: {{3}} minutes.",
  },
  {
    id: "2",
    name: "order_ready",
    category: "Transactional",
    language: "English",
    status: "approved",
    body: "Your order is ready! {{1}}, please collect your order or our delivery partner is on the way.",
  },
  {
    id: "3",
    name: "order_status_update",
    category: "Transactional",
    language: "English",
    status: "pending",
    body: "Hi {{1}}, your order #{{2}} status: {{3}}.",
  },
  {
    id: "4",
    name: "promotional_offer",
    category: "Marketing",
    language: "English",
    status: "rejected",
    body: "🎉 {{1}}, special offer just for you! {{2}} off your next order. Valid until {{3}}.",
    rejectionReason: "Missing opt-out instructions. Add STOP reply option.",
  },
  {
    id: "5",
    name: "reservation_confirmation",
    category: "Transactional",
    language: "English",
    status: "approved",
    body: "Hi {{1}}, your table for {{2}} at {{3}} on {{4}} is confirmed. Ref: {{5}}.",
  },
  {
    id: "6",
    name: "birthday_voucher",
    category: "Marketing",
    language: "English",
    status: "approved",
    body: "🎂 Happy Birthday {{1}}! Enjoy {{2}} off your next visit. Code: {{3}}. Valid today only.",
  },
  {
    id: "7",
    name: "payment_reminder",
    category: "Utility",
    language: "English",
    status: "pending",
    body: "Reminder: Your invoice #{{1}} for {{2}} is due on {{3}}.",
  },
  {
    id: "8",
    name: "otp_verification",
    category: "Authentication",
    language: "English",
    status: "approved",
    body: "Your OTP for Burger House is {{1}}. Valid for 10 minutes.",
  },
];

const MOCK_INVOICES: Invoice[] = [
  {
    id: "INV-001",
    date: "Apr 1, 2026",
    period: "Mar 2026",
    messages: 2847,
    cost: "$4.23",
    status: "paid",
  },
  {
    id: "INV-002",
    date: "Mar 1, 2026",
    period: "Feb 2026",
    messages: 3210,
    cost: "$18.90",
    status: "paid",
  },
  {
    id: "INV-003",
    date: "Feb 1, 2026",
    period: "Jan 2026",
    messages: 1540,
    cost: "$0.00",
    status: "paid",
  },
  {
    id: "INV-004",
    date: "Jan 1, 2026",
    period: "Dec 2025",
    messages: 4102,
    cost: "$99.18",
    status: "paid",
  },
  {
    id: "INV-005",
    date: "Dec 1, 2025",
    period: "Nov 2025",
    messages: 2980,
    cost: "$0.00",
    status: "paid",
  },
  {
    id: "INV-006",
    date: "Nov 1, 2025",
    period: "Oct 2025",
    messages: 1200,
    cost: "$0.00",
    status: "pending",
  },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "T1",
    date: "Apr 18, 2026",
    type: "Manual top-up",
    amount: "+$25.00",
    balanceAfter: "$45.20",
  },
  {
    id: "T2",
    date: "Apr 10, 2026",
    type: "WhatsApp charge",
    amount: "-$4.23",
    balanceAfter: "$20.20",
  },
  {
    id: "T3",
    date: "Apr 1, 2026",
    type: "Auto top-up",
    amount: "+$10.00",
    balanceAfter: "$24.43",
  },
  {
    id: "T4",
    date: "Mar 28, 2026",
    type: "WhatsApp charge",
    amount: "-$18.90",
    balanceAfter: "$14.43",
  },
  {
    id: "T5",
    date: "Mar 15, 2026",
    type: "Manual top-up",
    amount: "+$50.00",
    balanceAfter: "$33.33",
  },
];

// ─── Status Banner Config ──────────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
  border: string;
  pulse?: boolean;
}

const STATUS_CONFIG: Record<ConnectionStatus, StatusConfig> = {
  not_connected: {
    label: "Not Connected",
    icon: <MessageCircle className="size-5" />,
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
  pending: {
    label: "Awaiting Meta Verification",
    icon: <Loader2 className="size-5 animate-spin" />,
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    pulse: true,
  },
  connected: {
    label: "Connected & Active",
    icon: <CheckCircle2 className="size-5" />,
    bg: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
  },
  paused: {
    label: "Account Paused",
    icon: <PauseCircle className="size-5" />,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  banned: {
    label: "Account Banned by Meta",
    icon: <XCircle className="size-5" />,
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/30",
  },
};

// ─── Template Status Badge ─────────────────────────────────────────────────────

function TemplateStatusBadge({ status }: { status: TemplateStatus }) {
  const map: Record<TemplateStatus, { label: string; className: string }> = {
    approved: {
      label: "Approved",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    },
    pending: {
      label: "Pending",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    },
    rejected: {
      label: "Rejected",
      className: "bg-destructive/10 text-destructive",
    },
    paused: {
      label: "Paused",
      className: "bg-muted text-muted-foreground",
    },
  };
  const cfg = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        cfg.className
      )}
    >
      {cfg.label}
    </span>
  );
}

// ─── Not Connected Section ─────────────────────────────────────────────────────

function NotConnectedSection({
  connectDialogOpen,
  setConnectDialogOpen,
  setStatus,
}: {
  connectDialogOpen: boolean;
  setConnectDialogOpen: (v: boolean) => void;
  setStatus: (s: ConnectionStatus) => void;
}) {
  const prereqs = [
    { label: "Facebook Business account", met: true },
    {
      label: "Verified business phone number (not linked to personal WhatsApp)",
      met: true,
    },
    {
      label: "WhatsApp Business app NOT installed on this number",
      met: true,
    },
    { label: "Business verification completed", met: false, link: true },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prerequisites</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {prereqs.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    p.met
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {p.met ? <Check className="size-3" /> : "✕"}
                </span>
                <span className="text-sm text-foreground/80">
                  {p.label}
                  {p.link && (
                    <button
                      className="ml-2 text-primary underline underline-offset-2 hover:no-underline text-sm"
                      onClick={() =>
                        toast("Opening Meta Business Manager...")
                      }
                    >
                      Complete verification →
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogTrigger render={<Button className="w-full sm:w-auto" />}>
          Start Connection
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect WhatsApp Business</DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-0">
            {["Review prerequisites", "Launch Meta", "Verify"].map(
              (step, i) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                        i + 1 === 2
                          ? "bg-primary text-primary-foreground"
                          : i + 1 < 2
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {i + 1 < 2 ? (
                        <Check className="size-3.5" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[11px] text-center max-w-[72px]",
                        i + 1 === 2
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {step}
                    </span>
                  </div>
                  {i < 2 && (
                    <div
                      className={cn(
                        "mb-4 h-px flex-1",
                        i + 1 < 2 ? "bg-green-400" : "bg-border"
                      )}
                    />
                  )}
                </React.Fragment>
              )
            )}
          </div>

          <DialogDescription>
            You&apos;ll be redirected to Meta&apos;s Business Manager to
            authorize the connection. This opens in a new window.
          </DialogDescription>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full"
              onClick={() => toast("Opening Meta Business Manager...")}
            >
              Launch Meta Business Manager →
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setStatus("pending");
                setConnectDialogOpen(false);
              }}
            >
              Check connection status
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setConnectDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Pending Section ───────────────────────────────────────────────────────────

function PendingSection({
  setStatus,
}: {
  setStatus: (s: ConnectionStatus) => void;
}) {
  const timelineSteps = [
    { label: "Prerequisites met", done: true },
    { label: "Meta popup launched", done: true },
    { label: "Awaiting verification", done: false, active: true },
    { label: "Templates review", done: false },
    { label: "Live", done: false },
  ];

  const verificationDocs = [
    "Business name",
    "Business address",
    "Business phone",
    "Business website",
    "Government-issued ID / registration",
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {timelineSteps.map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    step.done
                      ? "bg-green-500 text-white"
                      : step.active
                      ? "bg-blue-500 text-white"
                      : "bg-muted text-muted-foreground border border-border"
                  )}
                >
                  {step.done ? (
                    <Check className="size-3.5" />
                  ) : step.active ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    step.done
                      ? "text-muted-foreground line-through"
                      : step.active
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
        Meta typically verifies Business API applications within 24–72 hours.
        You&apos;ll receive an email notification.
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => toast("Checking with Meta API...")}
        >
          Check status
        </Button>
        <Button variant="destructive" onClick={() => setStatus("not_connected")}>
          Cancel application
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Business Verification</CardTitle>
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0">
            Required for unlimited messaging
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Submit your business documents in Meta Business Manager.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast("Opening Meta Business Manager...")}
          >
            Open Meta Business Manager →
          </Button>
          <ul className="space-y-2 pt-1">
            {verificationDocs.map((doc) => (
              <li key={doc} className="flex items-center gap-2 text-sm">
                <span className="size-4 rounded border border-border flex items-center justify-center shrink-0" />
                {doc}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Connected Section ─────────────────────────────────────────────────────────

function ConnectedSection({
  setStatus,
}: {
  setStatus: (s: ConnectionStatus) => void;
}) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: "Phone number", value: "+44 20 7946 0958" },
              { label: "Display name", value: "Burger House" },
              {
                label: "Quality rating",
                value: (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                    High
                  </Badge>
                ),
              },
              { label: "Messaging limit", value: "1,000 messages / 24h" },
            ].map((item, i) => (
              <div key={i}>
                <dt className="text-xs text-muted-foreground">{item.label}</dt>
                <dd className="mt-0.5 text-sm font-medium">{item.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phone Number Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Quality Rating</span>
              <span className="font-medium text-green-600">High</span>
            </div>
            <Progress value={85}>
              <ProgressTrack>
                <ProgressIndicator className="bg-green-500" />
              </ProgressTrack>
            </Progress>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Message limit tier: </span>
            <span className="font-medium">Tier 2 — 1,000 / 24h</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Recent violations: </span>
            <span className="font-medium text-green-600">None</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => setStatus("paused")}>
          <PauseCircle className="size-4" />
          Pause account
        </Button>
        <Button variant="destructive" onClick={() => setStatus("not_connected")}>
          Disconnect
        </Button>
      </div>
    </div>
  );
}

// ─── Paused Section ────────────────────────────────────────────────────────────

function PausedSection({
  pauseReason,
  setPauseReason,
  setStatus,
}: {
  pauseReason: string;
  setPauseReason: (v: string) => void;
  setStatus: (s: ConnectionStatus) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
          Account paused — messages are not being sent.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Pause reason</label>
        <Select
          value={pauseReason}
          onValueChange={(v) => setPauseReason(v as string)}
        >
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Select reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual pause</SelectItem>
            <SelectItem value="rate_limit">Rate limit reached</SelectItem>
            <SelectItem value="policy">Policy violation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setStatus("connected")}>Resume account</Button>
        <Button
          variant="outline"
          onClick={() => toast("Opening Meta support...")}
        >
          Contact Meta support
        </Button>
      </div>
    </div>
  );
}

// ─── Banned Section ────────────────────────────────────────────────────────────

function BannedSection({
  appealDialogOpen,
  setAppealDialogOpen,
  appealText,
  setAppealText,
}: {
  appealDialogOpen: boolean;
  setAppealDialogOpen: (v: boolean) => void;
  appealText: string;
  setAppealText: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
        <p className="text-sm font-medium text-destructive">
          This WhatsApp Business account has been banned by Meta.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Common reasons for banning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Sending spam messages</li>
            <li>Violating WhatsApp Business Policy</li>
            <li>Too many blocked / reported messages</li>
          </ul>
        </CardContent>
      </Card>

      <div className="rounded-lg border p-4 text-sm space-y-1">
        <div>
          <span className="text-muted-foreground">Ban date: </span>
          <span className="font-medium">Apr 10, 2026</span>
        </div>
        <div>
          <span className="text-muted-foreground">Estimated review: </span>
          <span className="font-medium">
            Appeals typically reviewed in 5–7 business days
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Dialog open={appealDialogOpen} onOpenChange={setAppealDialogOpen}>
          <DialogTrigger render={<Button variant="outline" />}>
            Submit appeal
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Meta Appeal</DialogTitle>
              <DialogDescription>
                Explain why you believe this ban was in error. Be concise and
                professional.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Describe your appeal..."
              className="min-h-32"
              value={appealText}
              onChange={(e) => setAppealText(e.target.value)}
            />
            <DialogFooter>
              <Button
                onClick={() => {
                  toast("Appeal submitted to Meta.");
                  setAppealDialogOpen(false);
                }}
                disabled={!appealText.trim()}
              >
                Submit appeal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          variant="ghost"
          onClick={() => toast("Opening WhatsApp policy page...")}
        >
          Learn more about WhatsApp policies
        </Button>
      </div>
    </div>
  );
}

// ─── Billing Model Selector ────────────────────────────────────────────────────

function BillingModelSelector({
  billingModel,
  setBillingModel,
}: {
  billingModel: BillingModel;
  setBillingModel: (m: BillingModel) => void;
}) {
  const isOnBusinessPlan = false;

  return (
    <div className="space-y-3">
      <Separator />
      <div>
        <h3 className="text-sm font-semibold">Billing Model</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Choose how WhatsApp API usage is billed.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Direct billing */}
        <button
          type="button"
          onClick={() => setBillingModel("direct")}
          className={cn(
            "rounded-xl border-2 p-4 text-left transition-colors",
            billingModel === "direct"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/30"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Direct billing</span>
            <span
              className={cn(
                "size-4 rounded-full border-2 transition-colors",
                billingModel === "direct"
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/40"
              )}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Meta bills your payment method directly. Standard Meta pricing
            applies.
          </p>
        </button>

        {/* Managed billing */}
        <button
          type="button"
          onClick={() => {
            if (!isOnBusinessPlan) {
              toast("Upgrade to Business plan to use managed billing.");
              return;
            }
            setBillingModel("managed");
          }}
          className={cn(
            "relative rounded-xl border-2 p-4 text-left transition-colors",
            !isOnBusinessPlan
              ? "cursor-not-allowed border-border opacity-60"
              : billingModel === "managed"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/30"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Managed billing</span>
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-muted text-[10px] text-muted-foreground">
                Business plan
              </Badge>
              <span
                className={cn(
                  "size-4 rounded-full border-2 transition-colors",
                  billingModel === "managed" && isOnBusinessPlan
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40"
                )}
              />
            </div>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            We manage your WhatsApp spend. Add funds to your wallet and we
            handle Meta billing.
          </p>
          {!isOnBusinessPlan && (
            <p className="mt-2 text-xs font-medium text-primary">
              Upgrade to Business plan →
            </p>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Connection Tab ────────────────────────────────────────────────────────────

function ConnectionTab({
  status,
  setStatus,
  billingModel,
  setBillingModel,
}: {
  status: ConnectionStatus;
  setStatus: (s: ConnectionStatus) => void;
  billingModel: BillingModel;
  setBillingModel: (m: BillingModel) => void;
}) {
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [appealDialogOpen, setAppealDialogOpen] = useState(false);
  const [appealText, setAppealText] = useState("");
  const [pauseReason, setPauseReason] = useState("manual");

  const cfg = STATUS_CONFIG[status];

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18 }}
          className={cn(
            "flex items-center gap-3 rounded-xl border px-4 py-3",
            cfg.bg,
            cfg.text,
            cfg.border,
            cfg.pulse && "animate-pulse"
          )}
        >
          {cfg.icon}
          <span className="font-semibold">{cfg.label}</span>
        </motion.div>
      </AnimatePresence>

      {status === "not_connected" && (
        <NotConnectedSection
          connectDialogOpen={connectDialogOpen}
          setConnectDialogOpen={setConnectDialogOpen}
          setStatus={setStatus}
        />
      )}

      {status === "pending" && <PendingSection setStatus={setStatus} />}

      {status === "connected" && <ConnectedSection setStatus={setStatus} />}

      {status === "paused" && (
        <PausedSection
          pauseReason={pauseReason}
          setPauseReason={setPauseReason}
          setStatus={setStatus}
        />
      )}

      {status === "banned" && (
        <BannedSection
          appealDialogOpen={appealDialogOpen}
          setAppealDialogOpen={setAppealDialogOpen}
          appealText={appealText}
          setAppealText={setAppealText}
        />
      )}

      {status !== "not_connected" && (
        <BillingModelSelector
          billingModel={billingModel}
          setBillingModel={setBillingModel}
        />
      )}
    </div>
  );
}

// ─── Template Card ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onPreview,
}: {
  template: MessageTemplate;
  onPreview: (t: MessageTemplate) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-sm font-semibold">
                {template.name}
              </code>
              <Badge variant="outline" className="text-xs">
                {template.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {template.language}
              </Badge>
              <TemplateStatusBadge status={template.status} />
            </div>
            <p className="line-clamp-2 text-sm italic text-muted-foreground">
              {template.body}
            </p>
            {template.rejectionReason && (
              <p className="text-xs text-destructive">
                <strong>Reason:</strong> {template.rejectionReason}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                />
              }
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onPreview(template)}>
                  <Eye className="size-4" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => toast(`Duplicating ${template.name}...`)}
                >
                  <Copy className="size-4" />
                  Duplicate
                </DropdownMenuItem>
                {template.status !== "approved" && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => toast(`Deleting ${template.name}...`)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Templates Tab ─────────────────────────────────────────────────────────────

function TemplatesTab() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [previewTemplate, setPreviewTemplate] =
    useState<MessageTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const filtered = MOCK_TEMPLATES.filter((t) => {
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchCategory =
      categoryFilter === "all" || t.category === categoryFilter;
    return matchStatus && matchCategory;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Message Templates</h2>
        <Button onClick={() => toast("Template builder coming soon")}>
          Submit new template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as string)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as string)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="Transactional">Transactional</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
            <SelectItem value="Authentication">Authentication</SelectItem>
            <SelectItem value="Utility">Utility</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onPreview={(t) => {
              setPreviewTemplate(t);
              setPreviewOpen(true);
            }}
          />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            No templates match the selected filters.
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-muted px-2 py-0.5 font-mono text-sm">
                  {previewTemplate.name}
                </code>
                <Badge variant="outline">{previewTemplate.category}</Badge>
                <Badge variant="outline">{previewTemplate.language}</Badge>
                <TemplateStatusBadge status={previewTemplate.status} />
              </div>
              <div className="rounded-xl border bg-muted/40 p-4 text-sm italic text-muted-foreground">
                {previewTemplate.body}
              </div>
              {previewTemplate.rejectionReason && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <strong>Rejection reason:</strong>{" "}
                  {previewTemplate.rejectionReason}
                </div>
              )}
            </div>
          )}
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Billing & Usage Tab ───────────────────────────────────────────────────────

function BillingUsageTab({ billingModel }: { billingModel: BillingModel }) {
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [autoTopup, setAutoTopup] = useState(false);
  const [topupThreshold, setTopupThreshold] = useState("");
  const [topupAmount, setTopupAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const usedMessages = 2847;
  const freeTier = 3000;
  const usagePct = Math.round((usedMessages / freeTier) * 1000) / 10;

  return (
    <div className="space-y-8">
      {/* Section 1: Usage stats */}
      <div className="space-y-5">
        <h2 className="text-base font-semibold">Usage This Month</h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Messages sent", value: "2,847" },
            { label: "Free tier remaining", value: "153 / 3,000" },
            { label: "Paid conversations", value: "47" },
            { label: "Estimated cost", value: "$4.23" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4">
                <div className="text-xl font-bold tabular-nums">
                  {stat.value}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Usage progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {usedMessages.toLocaleString()} /{" "}
              {freeTier.toLocaleString()} free tier messages used ({usagePct}%)
            </span>
            <span className="text-xs font-medium text-amber-600">High</span>
          </div>
          <Progress value={usagePct}>
            <ProgressTrack>
              <ProgressIndicator className="bg-amber-500" />
            </ProgressTrack>
          </Progress>
        </div>

        {/* Cost breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                    Count
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                    Rate
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    cat: "Free tier messages",
                    count: "3,000",
                    rate: "$0.00",
                    cost: "$0.00",
                  },
                  {
                    cat: "Business-initiated (paid)",
                    count: "47",
                    rate: "$0.09",
                    cost: "$4.23",
                  },
                  {
                    cat: "User-initiated",
                    count: "0",
                    rate: "$0.00",
                    cost: "$0.00",
                  },
                ].map((row) => (
                  <tr key={row.cat} className="border-b last:border-0">
                    <td className="px-4 py-2 text-foreground/80">{row.cat}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {row.count}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {row.rate}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {row.cost}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/40">
                  <td className="px-4 py-2 font-semibold">Total</td>
                  <td />
                  <td />
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">
                    $4.23
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Wallet (managed billing only) */}
      {billingModel === "managed" && (
        <div className="space-y-5">
          <Separator />
          <h2 className="text-base font-semibold">Wallet</h2>
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold tabular-nums">$45.20</div>
                  <div className="text-xs text-muted-foreground">
                    Current balance
                  </div>
                </div>
                <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
                  <DialogTrigger render={<Button />}>Add funds</DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Add Funds</DialogTitle>
                      <DialogDescription>
                        Select a preset or enter a custom amount.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-4 gap-2">
                      {["10", "25", "50", "100"].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setSelectedPreset(amt);
                            setCustomAmount("");
                          }}
                          className={cn(
                            "rounded-lg border py-2 text-sm font-medium transition-colors",
                            selectedPreset === amt
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-muted-foreground/40"
                          )}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder="Custom amount"
                      type="number"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedPreset(null);
                      }}
                    />
                    <DialogFooter>
                      <Button
                        onClick={() => {
                          const amt = selectedPreset ?? customAmount;
                          if (amt) {
                            toast(`Adding $${amt} to wallet...`);
                            setAddFundsOpen(false);
                            setSelectedPreset(null);
                            setCustomAmount("");
                          }
                        }}
                        disabled={!selectedPreset && !customAmount}
                      >
                        Add funds
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Separator />

              {/* Auto top-up */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Auto top-up</div>
                    <div className="text-xs text-muted-foreground">
                      Automatically add funds when balance drops below threshold
                    </div>
                  </div>
                  <Switch
                    checked={autoTopup}
                    onCheckedChange={setAutoTopup}
                  />
                </div>

                {autoTopup && (
                  <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Top-up when balance below
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">$</span>
                        <Input
                          type="number"
                          placeholder="10"
                          value={topupThreshold}
                          onChange={(e) => setTopupThreshold(e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Add each time
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">$</span>
                        <Input
                          type="number"
                          placeholder="25"
                          value={topupAmount}
                          onChange={(e) => setTopupAmount(e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Transaction history */}
              <div>
                <h4 className="mb-3 text-sm font-semibold">
                  Recent Transactions
                </h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {["Date", "Type", "Amount", "Balance after"].map((h) => (
                        <th
                          key={h}
                          className="py-1.5 text-left text-xs font-medium text-muted-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_TRANSACTIONS.map((tx) => (
                      <tr key={tx.id} className="border-b last:border-0">
                        <td className="py-2 text-xs text-muted-foreground">
                          {tx.date}
                        </td>
                        <td className="py-2">{tx.type}</td>
                        <td
                          className={cn(
                            "py-2 font-medium tabular-nums",
                            tx.amount.startsWith("+")
                              ? "text-green-600"
                              : "text-destructive"
                          )}
                        >
                          {tx.amount}
                        </td>
                        <td className="py-2 tabular-nums text-muted-foreground">
                          {tx.balanceAfter}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Section 3: Invoice history */}
      <div className="space-y-4">
        <Separator />
        <h2 className="text-base font-semibold">Invoice History</h2>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {[
                    "Invoice",
                    "Period",
                    "Messages",
                    "Cost",
                    "Status",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2 text-left text-xs font-medium text-muted-foreground last:text-right"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_INVOICES.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{inv.id}</div>
                      <div className="text-xs text-muted-foreground">
                        {inv.date}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {inv.period}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">
                      {inv.messages.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-medium tabular-nums">
                      {inv.cost}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          inv.status === "paid"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        )}
                      >
                        {inv.status === "paid" ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => toast(`Downloading ${inv.id}...`)}
                      >
                        <Download className="size-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const [status, setStatus] = useState<ConnectionStatus>("not_connected");
  const [activeTab, setActiveTab] = useState("connection");
  const [billingModel, setBillingModel] = useState<BillingModel>("direct");

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">WhatsApp Business API</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your WhatsApp Business API connection, message templates, and
          billing.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="billing">Billing &amp; Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="mt-6">
          <ConnectionTab
            status={status}
            setStatus={setStatus}
            billingModel={billingModel}
            setBillingModel={setBillingModel}
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <BillingUsageTab billingModel={billingModel} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
