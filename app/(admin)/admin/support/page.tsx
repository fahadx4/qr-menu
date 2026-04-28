"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Search,
  UserPlus,
  XCircle,
  ShieldAlert,
  AlertCircle,
  Rocket,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = "signup" | "cancellation" | "ban" | "error" | "milestone";

interface RecentEvent {
  id: string;
  type: EventType;
  description: string;
  timeAgo: string;
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
  tenant: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const SEARCH_RESULTS: SearchResult[] = [
  { id: "r1", name: "Ahmed Al-Rashid",   email: "ahmed@spicechain.ng",    tenant: "Spice Chain Lagos"     },
  { id: "r2", name: "Maria García",      email: "maria@tapas.es",         tenant: "Casa Tapas Barcelona"  },
  { id: "r3", name: "Kenji Nakamura",    email: "kenji@ramenhq.jp",       tenant: "Ramen HQ Tokyo"        },
  { id: "r4", name: "Fatima Hassan",     email: "fatima@cloudkitchen.pk", tenant: "Cloud Kitchen Karachi" },
  { id: "r5", name: "System Admin",      email: "admin@qrmenu.app",       tenant: "QR Menu Platform"      },
];

const RECENT_EVENTS: RecentEvent[] = [
  { id: "e1",  type: "signup",       description: "New signup: Cloud Kitchen Riyadh — Pro trial",                     timeAgo: "2 min ago"   },
  { id: "e2",  type: "cancellation", description: "Cancellation: Pizza Planet London — cited pricing",                 timeAgo: "15 min ago"  },
  { id: "e3",  type: "ban",          description: "WhatsApp banned: Taco Bell Dubai — template spam",                  timeAgo: "32 min ago"  },
  { id: "e4",  type: "signup",       description: "New signup: Sushi Garden Vancouver — Starter trial",                timeAgo: "45 min ago"  },
  { id: "e5",  type: "error",        description: "KDS connection error: Ramen HQ Tokyo — auto-recovered",             timeAgo: "1 hr ago"    },
  { id: "e6",  type: "milestone",    description: "Milestone: Spice House Dubai reached 10,000 orders",                timeAgo: "1 hr ago"    },
  { id: "e7",  type: "signup",       description: "New signup: Kebab Express Berlin — Free plan",                      timeAgo: "2 hrs ago"   },
  { id: "e8",  type: "error",        description: "Payment retry failed: Dim Sum Palace HK — 2nd attempt",             timeAgo: "2 hrs ago"   },
  { id: "e9",  type: "cancellation", description: "Cancellation: Noodle Bar Singapore — trial ended no conversion",    timeAgo: "3 hrs ago"   },
  { id: "e10", type: "ban",          description: "WhatsApp banned: Spice Chain Lagos — resolved via appeal",          timeAgo: "4 hrs ago"   },
  { id: "e11", type: "milestone",    description: "Platform milestone: 50,000 active restaurants reached",             timeAgo: "5 hrs ago"   },
  { id: "e12", type: "signup",       description: "New signup: Mezze House Beirut — Business trial",                   timeAgo: "6 hrs ago"   },
  { id: "e13", type: "error",        description: "Webhook failure: Order sync for Curry Leaf Mumbai — retried OK",    timeAgo: "7 hrs ago"   },
  { id: "e14", type: "signup",       description: "New signup: Pho House Hanoi — Starter plan",                        timeAgo: "8 hrs ago"   },
  { id: "e15", type: "cancellation", description: "Cancellation: Tacos El Pastor Mexico City — moved to competitor",   timeAgo: "9 hrs ago"   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<EventType, { icon: React.ElementType; label: string; style: string }> = {
  signup:       { icon: UserPlus,     label: "Signup",       style: "bg-emerald-100 text-emerald-700" },
  cancellation: { icon: XCircle,      label: "Cancellation", style: "bg-red-100 text-red-700"         },
  ban:          { icon: ShieldAlert,  label: "Ban",          style: "bg-amber-100 text-amber-700"     },
  error:        { icon: AlertCircle,  label: "Error",        style: "bg-rose-100 text-rose-700"       },
  milestone:    { icon: Rocket,       label: "Milestone",    style: "bg-violet-100 text-violet-700"   },
};

// ─── Services ─────────────────────────────────────────────────────────────────

const SERVICES = ["API", "Database", "WhatsApp Gateway", "Storage", "Email"] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupportToolsPage() {
  const [query,           setQuery]          = useState("");
  const [announcement,    setAnnouncement]   = useState("");
  const [confirmOpen,     setConfirmOpen]    = useState(false);

  const showResults = query.trim().length > 0;
  const filteredResults = showResults
    ? SEARCH_RESULTS.filter(
        (r) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.email.toLowerCase().includes(query.toLowerCase()) ||
          r.tenant.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  function handleSendAnnouncement() {
    toast.success("Announcement sent to all restaurants.");
    setAnnouncement("");
    setConfirmOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Support Tools</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Lookup users, review recent events, and communicate with tenants.</p>
      </div>

      {/* 1 — User search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">User / Tenant Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or tenant…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          {showResults && (
            <div className="rounded-lg border border-border bg-popover shadow-sm overflow-hidden">
              {filteredResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">No results found.</div>
              ) : (
                filteredResults.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                    onClick={() => {
                      toast.info(`Opening profile: ${r.name} (${r.tenant})`);
                      setQuery("");
                    }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.email} — {r.tenant}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2 — Recent events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Platform Events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {RECENT_EVENTS.map((ev) => {
              const cfg = EVENT_CONFIG[ev.type];
              const Icon = cfg.icon;
              return (
                <li key={ev.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                  <div className={cn("mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full", cfg.style)}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium", cfg.style)}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{ev.timeAgo}</span>
                    </div>
                    <p className="mt-0.5 text-sm">{ev.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {/* 3 — Announcement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Send Announcement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Write an announcement to send to all restaurant owners…"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            className="min-h-24"
          />
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={announcement.trim().length === 0}
          >
            Send to all restaurants
          </Button>
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={(o) => { if (!o) setConfirmOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Announcement</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will send the following message to all restaurant owners on the platform:
          </p>
          <blockquote className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm italic text-foreground">
            {announcement}
          </blockquote>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleSendAnnouncement}>Confirm &amp; Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4 — Service status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {SERVICES.map((svc) => (
              <div
                key={svc}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <p className="text-xs font-medium text-center">{svc}</p>
                <span className="text-[10px] text-emerald-600 font-medium">Operational</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
