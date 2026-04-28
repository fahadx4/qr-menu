"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  ArrowUp,
  Paperclip,
  Smile,
  Search,
  ArrowLeft,
  MoreHorizontal,
  User,
  X,
  Check,
  CheckCheck,
  Clock,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ─── Types ─────────────────────────────────────────────────────────────────────

type WindowStatus = "open" | "expiring" | "expired" | "closed";
type MessageStatus = "sent" | "delivered" | "read";
type MessageSender = "business" | "customer";
type FilterTab = "all" | "open" | "expired" | "closed";
type TemplateCategory = "Transactional" | "Marketing" | "Authentication" | "Utility";

interface Conversation {
  id: string;
  customer_name: string;
  customer_phone: string;
  window_status: WindowStatus;
  window_expires_in_minutes?: number;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_template_last: boolean;
}

interface Message {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  status?: MessageStatus;
  is_template?: boolean;
  template_name?: string;
  is_system?: boolean;
}

interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  body: string;
  variables: number;
}

// ─── Mock templates ────────────────────────────────────────────────────────────

const MOCK_TEMPLATES: Template[] = [
  { id: "1", name: "order_confirmation", category: "Transactional", body: "Hi {{1}}, your order #{{2}} has been confirmed! Estimated time: {{3}} minutes.", variables: 3 },
  { id: "2", name: "order_ready", category: "Transactional", body: "Your order is ready! {{1}}, please collect your order or our delivery partner is on the way.", variables: 1 },
  { id: "3", name: "order_status_update", category: "Transactional", body: "Hi {{1}}, your order #{{2}} status: {{3}}.", variables: 3 },
  { id: "4", name: "promotional_offer", category: "Marketing", body: "🎉 {{1}}, special offer just for you! {{2}} off your next order. Valid until {{3}}.", variables: 3 },
  { id: "5", name: "reservation_confirmation", category: "Transactional", body: "Hi {{1}}, your table for {{2}} at {{3}} on {{4}} is confirmed. Ref: {{5}}.", variables: 5 },
  { id: "6", name: "birthday_voucher", category: "Marketing", body: "🎂 Happy Birthday {{1}}! Enjoy {{2}} off your next visit. Code: {{3}}. Valid today only.", variables: 3 },
  { id: "7", name: "payment_reminder", category: "Utility", body: "Reminder: Your invoice #{{1}} for {{2}} is due on {{3}}.", variables: 3 },
  { id: "8", name: "otp_verification", category: "Authentication", body: "Your OTP for Burger House is {{1}}. Valid for 10 minutes.", variables: 1 },
];

// ─── Mock data ─────────────────────────────────────────────────────────────────

const INITIAL_CONVERSATIONS: Conversation[] = [
  { id: "1", customer_name: "Ahmed Al-Rashidi", customer_phone: "+971 50 123 4567", window_status: "open", window_expires_in_minutes: 1080, last_message: "Thank you! I'll be there at 7:30", last_message_at: "10:15", unread_count: 0, is_template_last: false },
  { id: "2", customer_name: "Sara Khan", customer_phone: "+92 300 987 6543", window_status: "expiring", window_expires_in_minutes: 45, last_message: "What's the status of my order?", last_message_at: "09:29", unread_count: 2, is_template_last: false },
  { id: "3", customer_name: "Carlos García", customer_phone: "+34 600 123 456", window_status: "expired", window_expires_in_minutes: 0, last_message: "Ok thanks", last_message_at: "Apr 22", unread_count: 0, is_template_last: false },
  { id: "4", customer_name: "Fatima Malik", customer_phone: "+44 7700 900123", window_status: "open", window_expires_in_minutes: 1320, last_message: "Can I change my reservation to 8pm?", last_message_at: "08:45", unread_count: 1, is_template_last: false },
  { id: "5", customer_name: "Thomas Müller", customer_phone: "+49 151 234 56789", window_status: "closed", window_expires_in_minutes: undefined, last_message: "⭐⭐⭐⭐⭐ Excellent food!", last_message_at: "Apr 21", unread_count: 0, is_template_last: false },
  { id: "6", customer_name: "Yuki Tanaka", customer_phone: "+81 90 1234 5678", window_status: "open", window_expires_in_minutes: 360, last_message: "Does the burger contain sesame?", last_message_at: "07:30", unread_count: 1, is_template_last: false },
  { id: "7", customer_name: "Omar Hassan", customer_phone: "+20 100 234 5678", window_status: "open", window_expires_in_minutes: 840, last_message: "Your order is ready for pickup!", last_message_at: "06:00", unread_count: 0, is_template_last: true },
  { id: "8", customer_name: "Isabella Santos", customer_phone: "+55 11 99876 5432", window_status: "expired", window_expires_in_minutes: 0, last_message: "🎉 Special offer: 20% off...", last_message_at: "Apr 20", unread_count: 0, is_template_last: true },
  { id: "9", customer_name: "Priya Patel", customer_phone: "+44 7911 123456", window_status: "open", window_expires_in_minutes: 1200, last_message: "Table for 6 confirmed ✓", last_message_at: "Yesterday", unread_count: 0, is_template_last: false },
  { id: "10", customer_name: "Marco Rossi", customer_phone: "+39 333 123 4567", window_status: "expiring", window_expires_in_minutes: 180, last_message: "Is there parking nearby?", last_message_at: "11:02", unread_count: 3, is_template_last: false },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  "1": [
    { id: "m1", sender: "customer", content: "Hi, do you have a table available for 4 people tonight at 7:30pm?", timestamp: "Apr 22, 14:30" },
    { id: "m2", sender: "business", content: "Hi Ahmed! Yes, we have availability at 7:30pm for 4 guests. Shall I reserve it for you? I'll need your name and phone number.", timestamp: "Apr 22, 14:32", status: "read" },
    { id: "m3", sender: "customer", content: "Yes please, Ahmed Al-Rashidi, +971 50 123 4567", timestamp: "Apr 22, 14:35" },
    { id: "m4", sender: "business", content: "Hi Ahmed, your table for 4 at 7:30 PM on April 22 is confirmed. Ref: BK-2847", timestamp: "Apr 22, 14:36", status: "read", is_template: true, template_name: "reservation_confirmation" },
    { id: "sys1", sender: "business", content: "Conversation window opened", timestamp: "Apr 22, 14:30", is_system: true },
    { id: "m5", sender: "customer", content: "We're running 10 minutes late, is that ok?", timestamp: "Apr 22, 19:45" },
    { id: "m6", sender: "business", content: "No problem at all, we'll hold your table until 8pm 😊", timestamp: "Apr 22, 19:46", status: "read" },
    { id: "m7", sender: "business", content: "Thank you for dining with us tonight! Your total was $87.50. We hope to see you again soon!", timestamp: "Apr 22, 20:52", status: "read", is_template: true, template_name: "order_confirmation" },
    { id: "sys2", sender: "business", content: "Window expires in 2 hours", timestamp: "Today, 08:15", is_system: true },
    { id: "m8", sender: "customer", content: "Thank you! I'll be there at 7:30", timestamp: "Today, 10:15", status: "read" },
  ],
  "2": [
    { id: "m1", sender: "business", content: "Hi Sara, your order #1047 has been confirmed! Estimated time: 30 minutes.", timestamp: "Today, 09:00", status: "delivered", is_template: true, template_name: "order_confirmation" },
    { id: "m2", sender: "customer", content: "What's the status of my order?", timestamp: "Today, 09:28" },
    { id: "m3", sender: "customer", content: "It's been 30 minutes already", timestamp: "Today, 09:29" },
    { id: "sys1", sender: "business", content: "Window expires in 45 minutes", timestamp: "Today, 09:45", is_system: true },
  ],
  "3": [
    { id: "m1", sender: "customer", content: "Hi, I placed an order 20 minutes ago. Any update?", timestamp: "Apr 22, 14:00" },
    { id: "m2", sender: "business", content: "Hi Carlos! Your order is being prepared. Estimated time: 15 more minutes.", timestamp: "Apr 22, 14:05", status: "read" },
    { id: "m3", sender: "customer", content: "Ok thanks", timestamp: "Apr 22, 14:10" },
    { id: "sys1", sender: "business", content: "Window expired — template only mode", timestamp: "Apr 23, 14:10", is_system: true },
  ],
  "4": [
    { id: "m1", sender: "customer", content: "Hello! I have a reservation tonight at 7pm for 2 people. Can I change it to 8pm?", timestamp: "Today, 08:45" },
  ],
  "5": [
    { id: "m1", sender: "customer", content: "I just wanted to say the food was amazing!", timestamp: "Apr 21, 20:00" },
    { id: "m2", sender: "business", content: "Thank you so much! We're glad you enjoyed your visit.", timestamp: "Apr 21, 20:05", status: "read" },
    { id: "m3", sender: "customer", content: "⭐⭐⭐⭐⭐ Excellent food!", timestamp: "Apr 21, 20:10" },
    { id: "sys1", sender: "business", content: "Conversation closed by agent", timestamp: "Apr 21, 20:15", is_system: true },
  ],
  "6": [
    { id: "m1", sender: "customer", content: "Does the burger contain sesame?", timestamp: "Today, 07:30" },
  ],
  "7": [
    { id: "m1", sender: "business", content: "Your order is ready for pickup!", timestamp: "Today, 06:00", status: "delivered", is_template: true, template_name: "order_ready" },
  ],
  "8": [
    { id: "m1", sender: "business", content: "🎉 Special offer: 20% off your next order! Use code SAVE20. Valid until April 22.", timestamp: "Apr 20, 10:00", status: "delivered", is_template: true, template_name: "promotional_offer" },
    { id: "sys1", sender: "business", content: "Window expired — template only mode", timestamp: "Apr 21, 10:00", is_system: true },
  ],
  "9": [
    { id: "m1", sender: "customer", content: "Hi, can I book a table for 6 people tomorrow evening?", timestamp: "Yesterday, 14:00" },
    { id: "m2", sender: "business", content: "Table for 6 confirmed ✓", timestamp: "Yesterday, 14:20", status: "read" },
  ],
  "10": [
    { id: "m1", sender: "customer", content: "Hi! We're planning to visit this weekend. Is there parking nearby?", timestamp: "Today, 11:02" },
    { id: "m2", sender: "customer", content: "Also is the restaurant accessible for wheelchairs?", timestamp: "Today, 11:03" },
    { id: "m3", sender: "customer", content: "And do you have a kids menu?", timestamp: "Today, 11:04" },
  ],
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-red-500", "bg-indigo-500",
  "bg-yellow-500", "bg-cyan-500",
];

function getAvatarColor(id: string): string {
  const index = parseInt(id, 10) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function formatWindowTime(minutes: number): string {
  if (minutes <= 0) return "Expired";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function WindowDot({ status }: { status: WindowStatus }) {
  if (status === "open") return <span className="inline-block h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />;
  if (status === "expiring") return <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />;
  if (status === "expired") return <span className="inline-block h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />;
  return <span className="inline-block h-2 w-2 rounded-full bg-gray-400 flex-shrink-0" />;
}

function MessageStatusIcon({ status }: { status?: MessageStatus }) {
  if (!status) return null;
  if (status === "sent") return <Check className="h-3 w-3 text-muted-foreground" />;
  if (status === "delivered") return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
  return <CheckCheck className="h-3 w-3 text-blue-500" />;
}

function WindowProgressBar({ conversation }: { conversation: Conversation }) {
  const { window_status, window_expires_in_minutes } = conversation;
  if (window_status === "closed" || window_status === "expired") return null;

  const totalMinutes = 24 * 60;
  const remaining = window_expires_in_minutes ?? 0;
  const pct = Math.max(0, Math.min(100, (remaining / totalMinutes) * 100));

  const barColor =
    window_status === "expiring"
      ? "bg-amber-500"
      : pct > 50
      ? "bg-green-500"
      : "bg-green-400";

  return (
    <div className="h-0.5 w-full bg-muted">
      <div
        className={cn("h-full transition-all", barColor)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Template Picker ───────────────────────────────────────────────────────────

interface TemplatePickerProps {
  open: boolean;
  onClose: () => void;
  onSend: (msg: Message) => void;
}

function TemplatePicker({ open, onClose, onSend }: TemplatePickerProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [vars, setVars] = useState<string[]>([]);

  const filtered = categoryFilter === "all"
    ? MOCK_TEMPLATES
    : MOCK_TEMPLATES.filter((t) => t.category === categoryFilter);

  function selectTemplate(t: Template) {
    setSelectedTemplate(t);
    setVars(Array(t.variables).fill(""));
  }

  function handleVarChange(i: number, val: string) {
    setVars((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  }

  function buildPreview(template: Template, values: string[]): string {
    let body = template.body;
    values.forEach((v, i) => {
      body = body.replace(`{{${i + 1}}}`, v || `{{${i + 1}}}`);
    });
    return body;
  }

  function handleSend() {
    if (!selectedTemplate) return;
    const content = buildPreview(selectedTemplate, vars);
    onSend({
      id: `tpl-${Date.now()}`,
      sender: "business",
      content,
      timestamp: "Just now",
      status: "sent",
      is_template: true,
      template_name: selectedTemplate.name,
    });
    setSelectedTemplate(null);
    setVars([]);
    onClose();
  }

  const categoryBadgeColor: Record<TemplateCategory, string> = {
    Transactional: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Marketing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    Authentication: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    Utility: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <Sheet open={open}>
      <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border flex-row items-center justify-between">
          <SheetTitle>Send Template</SheetTitle>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        <div className="flex gap-2 px-4 py-2 flex-wrap">
          {(["all", "Transactional", "Marketing", "Utility", "Authentication"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat); setSelectedTemplate(null); }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {!selectedTemplate ? (
            filtered.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-border bg-card p-3 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => selectTemplate(t)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{t.name}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", categoryBadgeColor[t.category])}>
                    {t.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{t.body}</p>
                <Button size="xs" variant="outline" className="mt-2" onClick={(e) => { e.stopPropagation(); selectTemplate(t); }}>
                  Use template
                </Button>
              </div>
            ))
          ) : (
            <div className="space-y-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)} className="text-muted-foreground">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to templates
              </Button>
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm">{selectedTemplate.name}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", categoryBadgeColor[selectedTemplate.category])}>
                    {selectedTemplate.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground italic mb-3">{buildPreview(selectedTemplate, vars)}</p>
                {selectedTemplate.variables > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground">Fill variables:</p>
                    {Array.from({ length: selectedTemplate.variables }).map((_, i) => (
                      <Input
                        key={i}
                        placeholder={`Variable {{${i + 1}}}`}
                        value={vars[i] || ""}
                        onChange={(e) => handleVarChange(i, e.target.value)}
                        className="h-7 text-xs"
                      />
                    ))}
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={handleSend}>
                Send Template
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Conversation List Item ────────────────────────────────────────────────────

interface ConvItemProps {
  conv: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

function ConvItem({ conv, isSelected, onClick }: ConvItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-3 py-3 text-left hover:bg-accent transition-colors border-b border-border/50",
        isSelected && "bg-accent"
      )}
    >
      {/* Avatar */}
      <div className={cn("h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold", getAvatarColor(conv.id))}>
        {getInitials(conv.customer_name)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-sm font-medium text-foreground truncate">{conv.customer_name}</span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">{conv.last_message_at}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs text-muted-foreground truncate flex-1">{conv.last_message}</span>
          {conv.unread_count > 0 && (
            <span className="flex-shrink-0 h-4 w-4 rounded-full bg-green-500 text-white text-[10px] font-semibold flex items-center justify-center">
              {conv.unread_count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <WindowDot status={conv.window_status} />
          <span className="text-[10px] text-muted-foreground">
            {conv.window_status === "open" && conv.window_expires_in_minutes
              ? `${formatWindowTime(conv.window_expires_in_minutes)} remaining`
              : conv.window_status === "expiring" && conv.window_expires_in_minutes
              ? `Expires in ${formatWindowTime(conv.window_expires_in_minutes)}`
              : conv.window_status === "expired"
              ? "Template only"
              : conv.window_status === "closed"
              ? "Closed"
              : ""}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Chat message bubble ───────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.is_system) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{msg.content}</span>
      </div>
    );
  }

  const isBusiness = msg.sender === "business";

  if (msg.is_template) {
    return (
      <div className={cn("flex mb-2", isBusiness ? "justify-end" : "justify-start")}>
        <div className={cn("max-w-[75%] rounded-2xl p-3 text-sm", isBusiness ? "rounded-tr-sm bg-green-100 dark:bg-green-900/30" : "rounded-tl-sm bg-card border border-border")}>
          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-medium text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>Template: {msg.template_name}</span>
          </div>
          <p className="italic text-foreground/80">{msg.content}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Sent via approved template</p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
            {isBusiness && <MessageStatusIcon status={msg.status} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex mb-2", isBusiness ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-sm", isBusiness ? "rounded-tr-sm bg-green-100 dark:bg-green-900/30" : "rounded-tl-sm bg-card border border-border")}>
        <p>{msg.content}</p>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
          {isBusiness && <MessageStatusIcon status={msg.status} />}
        </div>
      </div>
    </div>
  );
}

// ─── Window status badge ───────────────────────────────────────────────────────

function WindowStatusBadge({ conv }: { conv: Conversation }) {
  if (conv.window_status === "open") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
        Window open: {formatWindowTime(conv.window_expires_in_minutes ?? 0)} remaining
      </span>
    );
  }
  if (conv.window_status === "expiring") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
        Window expires in {formatWindowTime(conv.window_expires_in_minutes ?? 0)}
      </span>
    );
  }
  if (conv.window_status === "expired") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
        Template only
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 inline-block" />
      Closed
    </span>
  );
}

// ─── Input area ────────────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  "Your order is on the way! 🚀",
  "Thank you for your message. We'll get back to you shortly.",
  "Your table is confirmed ✓",
];

interface InputAreaProps {
  conv: Conversation;
  inputText: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onOpenTemplates: () => void;
  onReopen: () => void;
  onCloseConv: () => void;
}

function InputArea({ conv, inputText, onInputChange, onSend, onOpenTemplates, onReopen, onCloseConv }: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  if (conv.window_status === "closed") {
    return (
      <div className="border-t border-border px-4 py-3 flex items-center gap-3 bg-muted/30">
        <span className="text-sm text-muted-foreground flex-1">This conversation is closed. Reopen to send messages.</span>
        <Button size="sm" variant="outline" onClick={onReopen}>Reopen</Button>
      </div>
    );
  }

  if (conv.window_status === "expired") {
    return (
      <div className="border-t border-border px-4 py-3 space-y-2">
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          <span className="text-base leading-none">⚠️</span>
          <span>24-hour window expired — you can only send pre-approved templates.</span>
        </div>
        <Button className="w-full" onClick={onOpenTemplates}>
          <FileText className="h-4 w-4 mr-2" /> Send Template
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t border-border px-3 py-2 space-y-2">
      {/* Quick replies */}
      <div className="flex gap-1.5 flex-wrap">
        {QUICK_REPLIES.map((qr) => (
          <button
            key={qr}
            onClick={() => onInputChange(qr)}
            className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {qr}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-end gap-1.5">
        <button
          onClick={() => toast.info("Media attachments coming soon")}
          className="flex-shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 max-h-20 overflow-y-auto dark:bg-input/30"
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />
        <button
          onClick={() => toast.info("Emoji picker coming soon")}
          className="flex-shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors"
        >
          <Smile className="h-4 w-4" />
        </button>
        <Button size="icon-sm" variant="outline" onClick={onOpenTemplates} title="Send template">
          <FileText className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon-sm"
          onClick={onSend}
          disabled={!inputText.trim()}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Chat panel ────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  conv: Conversation;
  messages: Message[];
  inputText: string;
  onInputChange: (v: string) => void;
  onSendMessage: () => void;
  onOpenTemplates: () => void;
  onBack: () => void;
  onCloseConv: () => void;
  onReopenConv: () => void;
  onSendTemplateMsg: (msg: Message) => void;
  showTemplatePicker: boolean;
  onCloseTemplatePicker: () => void;
}

function ChatPanel({
  conv,
  messages,
  inputText,
  onInputChange,
  onSendMessage,
  onOpenTemplates,
  onBack,
  onCloseConv,
  onReopenConv,
  onSendTemplateMsg,
  showTemplatePicker,
  onCloseTemplatePicker,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, conv.id]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Back button (mobile) */}
          <Button variant="ghost" size="icon-sm" className="md:hidden flex-shrink-0" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* Avatar */}
          <div className={cn("h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold", getAvatarColor(conv.id))}>
            {getInitials(conv.customer_name)}
          </div>

          {/* Name + phone + status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{conv.customer_name}</span>
              <span className="text-xs text-muted-foreground">{conv.customer_phone}</span>
            </div>
            <div className="mt-0.5">
              <WindowStatusBadge conv={conv} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {conv.window_status !== "closed" && (
              <Button size="sm" variant="outline" onClick={onCloseConv}>
                Mark as closed
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toast.info("Customer profile view coming soon")}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Profile</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => toast.warning("Customer opted out")}>
                    Opt-out customer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.error("Customer blocked")}>
                    Block customer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.success("Chat exported")}>
                    Export chat
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <WindowProgressBar conversation={conv} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <InputArea
        conv={conv}
        inputText={inputText}
        onInputChange={onInputChange}
        onSend={onSendMessage}
        onOpenTemplates={onOpenTemplates}
        onReopen={onReopenConv}
        onCloseConv={onCloseConv}
      />

      {/* Template picker */}
      <TemplatePicker
        open={showTemplatePicker}
        onClose={onCloseTemplatePicker}
        onSend={onSendTemplateMsg}
      />
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function WhatsAppInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Mark as read after 1s on selection
  useEffect(() => {
    if (!selectedId) return;
    const conv = conversations.find((c) => c.id === selectedId);
    if (!conv || conv.unread_count === 0) return;

    const timer = setTimeout(() => {
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, unread_count: 0 } : c))
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [selectedId]);

  const filteredConversations = conversations.filter((c) => {
    const matchSearch =
      c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_phone.includes(search);
    if (!matchSearch) return false;
    if (filterTab === "all") return true;
    if (filterTab === "open") return c.window_status === "open" || c.window_status === "expiring";
    if (filterTab === "expired") return c.window_status === "expired";
    if (filterTab === "closed") return c.window_status === "closed";
    return true;
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  const selectedConv = conversations.find((c) => c.id === selectedId) ?? null;
  const selectedMessages = selectedId ? (messages[selectedId] ?? []) : [];

  function selectConversation(id: string) {
    setSelectedId(id);
    setInputText("");
    setShowTemplatePicker(false);
    setShowMobileChat(true);
  }

  function handleSendMessage() {
    if (!selectedId || !inputText.trim()) return;
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "business",
      content: inputText.trim(),
      timestamp: "Just now",
      status: "sent",
    };
    setMessages((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), newMsg],
    }));
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId ? { ...c, last_message: inputText.trim(), last_message_at: "Just now" } : c
      )
    );
    setInputText("");
  }

  function handleSendTemplateMsg(msg: Message) {
    if (!selectedId) return;
    setMessages((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), msg],
    }));
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId ? { ...c, last_message: msg.content.slice(0, 60), last_message_at: "Just now", is_template_last: true } : c
      )
    );
    toast.success("Template sent");
  }

  function handleCloseConversation() {
    if (!selectedId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, window_status: "closed" } : c))
    );
    toast.success("Conversation closed");
  }

  function handleReopenConversation() {
    if (!selectedId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, window_status: "open", window_expires_in_minutes: 1440 } : c))
    );
    toast.success("Conversation reopened");
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Left panel ── */}
      <div
        className={cn(
          "w-80 flex-shrink-0 flex flex-col border-r border-border bg-background",
          showMobileChat ? "hidden md:flex" : "flex"
        )}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-2 border-b border-border space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-base text-foreground">WhatsApp Inbox</h1>
            {totalUnread > 0 && (
              <span className="h-5 w-5 rounded-full bg-green-500 text-white text-[10px] font-semibold flex items-center justify-center">
                {totalUnread}
              </span>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-7 text-xs"
            />
          </div>
          <Tabs value={filterTab}>
            <TabsList className="w-full h-7" variant="default">
              {(["all", "open", "expired", "closed"] as FilterTab[]).map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="flex-1 text-[11px] capitalize"
                  onClick={() => setFilterTab(tab)}
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
              No conversations found
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                isSelected={selectedId === conv.id}
                onClick={() => selectConversation(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div
        className={cn(
          "flex-1 flex flex-col bg-background min-w-0",
          !showMobileChat && "hidden md:flex"
        )}
      >
        {selectedConv ? (
          <ChatPanel
            conv={selectedConv}
            messages={selectedMessages}
            inputText={inputText}
            onInputChange={setInputText}
            onSendMessage={handleSendMessage}
            onOpenTemplates={() => setShowTemplatePicker(true)}
            onBack={() => setShowMobileChat(false)}
            onCloseConv={handleCloseConversation}
            onReopenConv={handleReopenConversation}
            onSendTemplateMsg={handleSendTemplateMsg}
            showTemplatePicker={showTemplatePicker}
            onCloseTemplatePicker={() => setShowTemplatePicker(false)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Clock className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">Select a conversation</p>
            <p className="text-xs">Choose a conversation from the list to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
