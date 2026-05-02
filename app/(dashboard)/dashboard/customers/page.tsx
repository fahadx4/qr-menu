"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search,
  Star,
  CheckCircle2,
  Minus,
  MoreHorizontal,
  Users,
  MessageCircle,
  TrendingUp,
  Crown,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShoppingBag,
  DollarSign,
} from "lucide-react";

import type { Customer } from "@/types";
import { cn, formatPrice, timeAgo } from "@/lib/utils";
import { useT } from "@/lib/i18n";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
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
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

/* ─────────────────────────────────────────────
   Mock data
   ───────────────────────────────────────────── */

const mockCustomers: Customer[] = [
  {
    id: "cu1",
    tenant_id: "t1",
    phone: "+1 555 0101",
    name: "Ahmed Khan",
    email: "ahmed@email.com",
    order_count: 24,
    total_spent: 104800,
    last_order_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    whatsapp_opt_in: true,
    segment: "vip",
    notes: "Allergic to nuts. Prefers window seat.",
    saved_addresses: [{ label: "Home", address: "123 Main St, NY" }],
  },
  {
    id: "cu2",
    tenant_id: "t1",
    phone: "+1 555 0202",
    name: "Sara Lee",
    order_count: 7,
    total_spent: 28400,
    last_order_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    whatsapp_opt_in: true,
    segment: "regular",
    notes: "",
    saved_addresses: [],
  },
  {
    id: "cu3",
    tenant_id: "t1",
    phone: "+1 555 0303",
    name: "Maria Garcia",
    email: "maria@email.com",
    order_count: 2,
    total_spent: 8700,
    last_order_at: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    whatsapp_opt_in: false,
    segment: "new",
    notes: "",
    saved_addresses: [],
  },
  {
    id: "cu4",
    tenant_id: "t1",
    phone: "+1 555 0404",
    name: "John Smith",
    order_count: 15,
    total_spent: 67200,
    last_order_at: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    whatsapp_opt_in: true,
    segment: "regular",
    notes: "",
    saved_addresses: [{ label: "Office", address: "456 5th Ave, NY" }],
  },
  {
    id: "cu5",
    tenant_id: "t1",
    phone: "+1 555 0505",
    name: "Emily Wang",
    email: "emily@email.com",
    order_count: 1,
    total_spent: 1890,
    last_order_at: new Date(Date.now() - 95 * 24 * 3600000).toISOString(),
    whatsapp_opt_in: false,
    segment: "lapsed",
    notes: "",
    saved_addresses: [],
  },
  {
    id: "cu6",
    tenant_id: "t1",
    phone: "+1 555 0606",
    name: "Carlos Rodriguez",
    order_count: 42,
    total_spent: 198500,
    last_order_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    whatsapp_opt_in: true,
    segment: "vip",
    notes: "VIP — always give complimentary dessert.",
    saved_addresses: [{ label: "Home", address: "789 Park Ave, NY" }],
  },
  {
    id: "cu7",
    tenant_id: "t1",
    phone: "+1 555 0707",
    name: "Lisa Chen",
    order_count: 3,
    total_spent: 12400,
    last_order_at: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    whatsapp_opt_in: true,
    segment: "new",
    notes: "",
    saved_addresses: [],
  },
  {
    id: "cu8",
    tenant_id: "t1",
    phone: "+1 555 0808",
    order_count: 0,
    total_spent: 0,
    whatsapp_opt_in: false,
    segment: "new",
    notes: "",
    saved_addresses: [],
  },
];

/* ─────────────────────────────────────────────
   Mock order history per customer
   ───────────────────────────────────────────── */

interface MockOrder {
  id: string;
  number: string;
  date: string;
  summary: string;
  total: number;
  status: "completed" | "cancelled" | "pending";
}

const mockOrderHistory: Record<string, MockOrder[]> = {
  cu1: [
    {
      id: "o1",
      number: "#1042",
      date: new Date(Date.now() - 2 * 3600000).toISOString(),
      summary: "Classic Smash Burger, Crispy Fries, Coke",
      total: 3200,
      status: "completed",
    },
    {
      id: "o2",
      number: "#1031",
      date: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
      summary: "Double Smash Burger, Milkshake",
      total: 2800,
      status: "completed",
    },
    {
      id: "o3",
      number: "#1019",
      date: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
      summary: "Classic Smash Burger ×2, Fries ×2",
      total: 5200,
      status: "completed",
    },
  ],
  cu6: [
    {
      id: "o4",
      number: "#1044",
      date: new Date(Date.now() - 1 * 3600000).toISOString(),
      summary: "VIP Platter, Dessert Combo, Fresh Juice ×2",
      total: 8900,
      status: "completed",
    },
    {
      id: "o5",
      number: "#1038",
      date: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
      summary: "Classic Smash Burger, Loaded Fries, Milkshake",
      total: 4100,
      status: "completed",
    },
    {
      id: "o6",
      number: "#1027",
      date: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
      summary: "Family Feast ×1",
      total: 12000,
      status: "completed",
    },
    {
      id: "o7",
      number: "#1015",
      date: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
      summary: "Classic Smash Burger ×3, Fries ×3, Coke ×3",
      total: 9600,
      status: "cancelled",
    },
  ],
};

function getOrderHistory(customerId: string): MockOrder[] {
  return (
    mockOrderHistory[customerId] ?? [
      {
        id: "ox1",
        number: "#1001",
        date: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
        summary: "Classic Smash Burger, Fries",
        total: 2400,
        status: "completed",
      },
    ]
  );
}

/* ─────────────────────────────────────────────
   Segment helpers
   ───────────────────────────────────────────── */

type Segment = Customer["segment"];

function segmentLabel(segment: Segment, t: ReturnType<typeof useT>): string {
  const map: Record<Segment, string> = {
    new: t.new,
    regular: t.cus_segmentRegular,
    vip: "VIP",
    lapsed: t.cus_segmentLapsed,
  };
  return map[segment];
}

function segmentAvatarClass(segment: Segment): string {
  return cn({
    "bg-amber-100 text-amber-700": segment === "vip",
    "bg-green-100 text-green-700": segment === "regular",
    "bg-blue-100 text-blue-700": segment === "new",
    "bg-zinc-100 text-zinc-600": segment === "lapsed",
  });
}

function SegmentBadge({ segment, t }: { segment: Segment; t: ReturnType<typeof useT> }) {
  if (segment === "vip") return <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1"><Star className="size-3 fill-amber-500 text-amber-500" />VIP</Badge>;
  if (segment === "regular") return <Badge className="bg-green-100 text-green-800 border-green-200">{t.cus_segmentRegular}</Badge>;
  if (segment === "new") return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{t.new}</Badge>;
  return <Badge className="bg-zinc-100 text-zinc-600 border-zinc-200">{t.cus_segmentLapsed}</Badge>;
}

function OrderStatusBadge({ status, t }: { status: MockOrder["status"]; t: ReturnType<typeof useT> }) {
  if (status === "completed") return <Badge className="bg-green-100 text-green-800 border-green-200">{t.completed}</Badge>;
  if (status === "cancelled") return <Badge className="bg-red-100 text-red-800 border-red-200">{t.cancelled}</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{t.ord_statusPending}</Badge>;
}

/* ─────────────────────────────────────────────
   Initials helper
   ───────────────────────────────────────────── */

function getInitials(name?: string, phone?: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return phone ? phone.slice(-2) : "??";
}

/* ─────────────────────────────────────────────
   Customer Detail Sheet
   ───────────────────────────────────────────── */

function CustomerSheet({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const [note, setNote] = useState(customer?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const currentNote = customer?.notes ?? "";

  function handleSaveNote() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success(t.cus_saveNote);
    }, 600);
  }

  if (!customer) return null;

  const orders = getOrderHistory(customer.id);
  const aov =
    customer.order_count > 0
      ? customer.total_spent / customer.order_count
      : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0 gap-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-start gap-4">
            {/* Large avatar */}
            <Avatar
              className={cn(
                "size-12 shrink-0 text-base font-semibold",
                segmentAvatarClass(customer.segment)
              )}
            >
              <AvatarFallback
                className={cn(
                  "text-base font-semibold",
                  segmentAvatarClass(customer.segment)
                )}
              >
                {getInitials(customer.name, customer.phone)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className="text-base font-semibold">
                  {customer.name ?? "Unknown"}
                </SheetTitle>
                <SegmentBadge segment={customer.segment} t={t} />
              </div>
              <SheetDescription className="mt-1 space-y-0.5">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="size-3.5" />
                  {customer.phone}
                </div>
                {customer.email && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="size-3.5" />
                    {customer.email}
                  </div>
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="flex-1">
          <TabsList
            variant="line"
            className="w-full rounded-none border-b px-6 h-10"
          >
            <TabsTrigger value="overview">{t.cus_tabOverview}</TabsTrigger>
            <TabsTrigger value="orders">{t.cus_tabOrders}</TabsTrigger>
            <TabsTrigger value="notes">{t.cus_tabNotes}</TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview" className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{t.navOrders}</p>
                <p className="text-xl font-semibold">{customer.order_count}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{t.cus_colTotalSpent}</p>
                <p className="text-lg font-semibold">{formatPrice(customer.total_spent)}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{t.cus_statAov}</p>
                <p className="text-lg font-semibold">{formatPrice(aov)}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{t.cus_statMemberSince}</p>
                <p className="text-sm font-medium">2024</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-3">{t.cus_usualOrder}</h4>
              <ul className="space-y-2">
                {[
                  { name: "Classic Smash Burger", count: 18 },
                  { name: "Crispy Fries", count: 16 },
                  { name: "Classic Milkshake", count: 8 },
                ].map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="size-4 text-muted-foreground" />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-muted-foreground">×{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>

            {customer.saved_addresses.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-3">{t.cus_savedAddresses}</h4>
                  <div className="flex flex-wrap gap-2">
                    {customer.saved_addresses.map((addr) => (
                      <div
                        key={addr.label}
                        className="flex items-start gap-1.5 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                      >
                        <MapPin className="size-3.5 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="font-medium">{addr.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {addr.address}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Order History ── */}
          <TabsContent value="orders" className="p-6 space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border p-3 space-y-2 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{order.number}</span>
                  <OrderStatusBadge status={order.status} t={t} />
                </div>
                <p className="text-sm text-muted-foreground">{order.summary}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    {timeAgo(order.date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {formatPrice(order.total)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => toast.info(`${t.reorder} ${order.number}`)}
                    >
                      {t.reorder}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* ── Notes ── */}
          <TabsContent value="notes" className="p-6 space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">{t.cus_internalNote}</h4>
              <p className="text-xs text-muted-foreground">{t.cus_noteNotVisible}</p>
            </div>
            <Textarea
              defaultValue={currentNote}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.cus_addNotePlaceholder}
              className="min-h-32"
            />
            <Button onClick={handleSaveNote} disabled={saving} className="w-full">
              {saving ? t.stf_saving : t.cus_saveNote}
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

/* ─────────────────────────────────────────────
   Main page
   ───────────────────────────────────────────── */

export default function CustomersPage() {
  const t = useT();
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<string>("total_spent_desc");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  /* ── Stats ── */
  const totalCustomers = mockCustomers.length;
  const vipCustomers = mockCustomers.filter((c) => c.segment === "vip").length;
  const whatsappOptIn = mockCustomers.filter((c) => c.whatsapp_opt_in).length;
  const totalSpent = mockCustomers.reduce((s, c) => s + c.total_spent, 0);
  const totalOrders = mockCustomers.reduce((s, c) => s + c.order_count, 0);
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  /* ── Filtered + sorted list ── */
  const filtered = useMemo(() => {
    let list = [...mockCustomers];

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
      );
    }

    // segment
    if (segmentFilter !== "all") {
      list = list.filter((c) => c.segment === segmentFilter);
    }

    // sort
    switch (sortKey) {
      case "total_spent_desc":
        list.sort((a, b) => b.total_spent - a.total_spent);
        break;
      case "order_count_desc":
        list.sort((a, b) => b.order_count - a.order_count);
        break;
      case "last_order_desc":
        list.sort((a, b) => {
          const aTime = a.last_order_at
            ? new Date(a.last_order_at).getTime()
            : 0;
          const bTime = b.last_order_at
            ? new Date(b.last_order_at).getTime()
            : 0;
          return bTime - aTime;
        });
        break;
      case "name_asc":
        list.sort((a, b) =>
          (a.name ?? "").localeCompare(b.name ?? "")
        );
        break;
    }

    return list;
  }, [search, segmentFilter, sortKey]);

  function openCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    setSheetOpen(true);
  }

  function clearFilters() {
    setSearch("");
    setSegmentFilter("all");
    setSortKey("total_spent_desc");
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t.cus_pageTitle}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t.cus_searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-56"
            />
          </div>

          <Select value={segmentFilter} onValueChange={(v) => setSegmentFilter(v as string)}>
            <SelectTrigger className="w-32"><SelectValue placeholder={t.dashFilter} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.all}</SelectItem>
              <SelectItem value="new">{t.new}</SelectItem>
              <SelectItem value="regular">{t.cus_segmentRegular}</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="lapsed">{t.cus_segmentLapsed}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortKey} onValueChange={(v) => setSortKey(v as string)}>
            <SelectTrigger className="w-44"><SelectValue placeholder={t.dashFilter} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="total_spent_desc">{t.cus_sortTotalSpend}</SelectItem>
              <SelectItem value="order_count_desc">{t.cus_sortOrderCount}</SelectItem>
              <SelectItem value="last_order_desc">{t.cus_sortLastOrder}</SelectItem>
              <SelectItem value="name_asc">{t.cus_sortNameAZ}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card size="sm">
          <CardHeader className="pb-1"><div className="flex items-center justify-between"><CardTitle className="text-sm text-muted-foreground font-normal">{t.cus_statTotalCustomers}</CardTitle><Users className="size-4 text-muted-foreground" /></div></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{totalCustomers}</p></CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="pb-1"><div className="flex items-center justify-between"><CardTitle className="text-sm text-muted-foreground font-normal">{t.cus_statVipCustomers}</CardTitle><Crown className="size-4 text-amber-500" /></div></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{vipCustomers}</p><p className="text-xs text-muted-foreground mt-0.5">{t.cus_statMinOrders}</p></CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="pb-1"><div className="flex items-center justify-between"><CardTitle className="text-sm text-muted-foreground font-normal">{t.cus_statWhatsappIn}</CardTitle><MessageCircle className="size-4 text-green-500" /></div></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{whatsappOptIn}</p></CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="pb-1"><div className="flex items-center justify-between"><CardTitle className="text-sm text-muted-foreground font-normal">{t.kpiAvgOrderValue}</CardTitle><TrendingUp className="size-4 text-muted-foreground" /></div></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{formatPrice(avgOrderValue)}</p></CardContent>
        </Card>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t.dashCustomer}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t.ana_customerSegments}</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t.navOrders}</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t.cus_colTotalSpent}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">{t.cus_colLastOrder}</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t.cus_colWhatsapp}</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t.dashActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Users className="size-10 opacity-30" />
                      <p className="text-sm font-medium">{t.cus_noMatch}</p>
                      <Button variant="outline" size="sm" onClick={clearFilters}>{t.clearFilters}</Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <CustomerRow key={customer.id} customer={customer} onClick={() => openCustomer(customer)} t={t} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail sheet ── */}
      <CustomerSheet
        customer={selectedCustomer}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Customer table row
   ───────────────────────────────────────────── */

function CustomerRow({
  customer,
  onClick,
  t,
}: {
  customer: Customer;
  onClick: () => void;
  t: ReturnType<typeof useT>;
}) {
  return (
    <tr
      className="hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Customer */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar
            className={cn(
              "size-8 shrink-0 font-medium",
              segmentAvatarClass(customer.segment)
            )}
          >
            <AvatarFallback
              className={cn(
                "text-xs font-medium",
                segmentAvatarClass(customer.segment)
              )}
            >
              {getInitials(customer.name, customer.phone)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate">
              {customer.name ?? (
                <span className="text-muted-foreground italic">{t.cus_noName}</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{customer.phone}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <SegmentBadge segment={customer.segment} t={t} />
      </td>

      {/* Orders */}
      <td className="px-4 py-3 text-right tabular-nums">
        {customer.order_count}
      </td>

      {/* Total spent */}
      <td className="px-4 py-3 text-right tabular-nums font-medium">
        {formatPrice(customer.total_spent)}
      </td>

      {/* Last order */}
      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
        {customer.last_order_at ? (
          timeAgo(customer.last_order_at)
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </td>

      {/* WhatsApp */}
      <td className="px-4 py-3 text-center">
        {customer.whatsapp_opt_in ? (
          <CheckCircle2 className="size-4 text-green-500 mx-auto" />
        ) : (
          <Minus className="size-4 text-muted-foreground/40 mx-auto" />
        )}
      </td>

      {/* Actions */}
      <td
        className="px-4 py-3 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="mx-auto" />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t.dashActions}</DropdownMenuLabel>
              <DropdownMenuItem onClick={onClick}>{t.cus_viewProfile}</DropdownMenuItem>
              <DropdownMenuItem onClick={onClick}>{t.cus_addNote}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info(`${t.cus_sendWhatsapp}: ${customer.name ?? customer.phone}`)}>
                <MessageCircle className="size-4" />{t.cus_sendWhatsapp}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={() => toast.info(`${t.cus_blockCustomer}: ${customer.name ?? customer.phone}`)}>
                {t.cus_blockCustomer}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
