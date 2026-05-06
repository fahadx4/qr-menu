# Missing Features — Complete POS System

## 1. LANGUAGE & BILINGUAL INPUT (EN + AR)

- [ ] Menu item form has **single name/description fields** — needs separate EN + AR input for every text field
- [ ] Category names — no Arabic input field
- [ ] Modifier group names & option names — no Arabic input
- [ ] Promotion/discount names — no Arabic input
- [ ] Branch names & addresses — no Arabic input
- [ ] Staff names — no Arabic input
- [ ] Receipt printout in Arabic (RTL thermal print support)
- [ ] KDS screen language toggle (kitchen staff may prefer Arabic)
- [ ] Customer-facing order confirmation SMS/WhatsApp in Arabic
- [ ] Date/time formatting in Arabic locale (Hijri calendar option)

---

## 2. WAITER MODULE (Missing Entirely)

- [ ] Waiter mobile view / dedicated waiter app screen
- [ ] Waiter can take order at table (table-side ordering UI)
- [ ] Waiter can split bill between customers
- [ ] Waiter can merge tables
- [ ] Waiter can transfer order to another table
- [ ] Waiter call button (customer calls waiter from QR)
- [ ] Waiter gets notified when order is ready (push/sound)
- [ ] Waiter tips tracking per session
- [ ] Waiter performance report (orders served, avg time, tips)
- [ ] Waiter assigns themselves to a table/section
- [ ] Waiter can void/modify items before sending to kitchen
- [ ] Waiter can hold an order (not yet sent to kitchen)

---

## 3. RIDER / DELIVERY MODULE (Missing Entirely)

- [ ] Rider profile management (name, phone, vehicle, photo, EN+AR name)
- [ ] Rider assignment to delivery orders
- [ ] Rider availability toggle (online/offline)
- [ ] Rider live GPS location tracking
- [ ] Rider mobile view (accept/reject delivery, navigation link)
- [ ] Rider order queue (current + upcoming deliveries)
- [ ] Rider proof of delivery (photo upload or signature)
- [ ] Rider earnings report (per day/week, cash collected)
- [ ] Rider performance metrics (avg delivery time, rating)
- [ ] Auto-assign rider based on proximity
- [ ] Customer sees rider name + ETA on order tracking page
- [ ] Rider app notification on new delivery assignment
- [ ] Cash on delivery reconciliation per rider

---

## 4. CASHIER / POS TERMINAL (Incomplete)

- [ ] Dedicated cashier POS screen (full-screen, fast item lookup)
- [ ] Walk-in order creation by cashier (no QR needed)
- [ ] Barcode/SKU scanning for items
- [ ] Cash drawer open command (via printer)
- [ ] Change calculator (tendered amount → change due)
- [ ] Split payment (e.g. half cash, half card)
- [ ] Hold & recall orders (park an order, process another)
- [ ] Cashier end-of-shift report (total cash, card, voids, refunds)
- [ ] Daily cash reconciliation / Z-report / X-report
- [ ] Refund / partial refund flow with reason
- [ ] Discount override by cashier (with manager PIN)
- [ ] Price override with manager approval
- [ ] Cashier PIN login (quick switch between staff)

---

## 5. KITCHEN DISPLAY SYSTEM — KDS (Partially Done)

- [ ] KDS shows item name in Arabic (currently English only)
- [ ] KDS bump bar (mark item done per line, not just whole order)
- [ ] KDS timer color coding (green → yellow → red by prep time)
- [ ] KDS routing to multiple stations simultaneously
- [ ] KDS recall — bring back accidentally bumped order
- [ ] KDS priority override (rush order)
- [ ] KDS order history view (last 50 bumped orders)
- [ ] KDS sound alert for new orders
- [ ] KDS works offline (if internet drops, orders still show)

---

## 6. TABLE MANAGEMENT (Incomplete)

- [ ] Table status: available / occupied / reserved / dirty / blocked
- [ ] Floor plan drag-and-drop (actual visual layout editor)
- [ ] Table merge / split
- [ ] Table section/zone assignment (indoor, outdoor, VIP)
- [ ] Table handoff between waiters
- [ ] Table occupancy timer (how long guests have been seated)
- [ ] Table minimum spend enforcement
- [ ] Waitlist management (walk-in queue when tables full)

---

## 7. ORDER MANAGEMENT (Incomplete)

- [ ] Manual order creation from dashboard (for phone orders)
- [ ] Order edit after placement (add/remove items with kitchen sync)
- [ ] Partial fulfilment (some items unavailable — partial dispatch)
- [ ] Order notes visible on receipt and KDS
- [ ] Scheduled orders (order now, deliver at 7pm)
- [ ] Recurring/subscription orders
- [ ] Order source tagging (QR, phone, walk-in, aggregator)
- [ ] Aggregator order import (Talabat, Careem, Uber Eats)
- [ ] Multi-language order confirmation email/SMS (EN + AR)

---

## 8. INVENTORY MANAGEMENT (Incomplete)

- [ ] Ingredient-level stock tracking (not just item-level)
- [ ] Recipe builder (item → ingredients + quantities)
- [ ] Auto-deduct stock when order placed
- [ ] Low-stock alerts (threshold configurable)
- [ ] Purchase orders to suppliers
- [ ] Supplier management (name, contact, EN+AR)
- [ ] Stock adjustment with reason (waste, theft, received)
- [ ] Inventory valuation report (FIFO/average cost)
- [ ] Expiry date tracking
- [ ] Stock count / physical inventory audit

---

## 9. CUSTOMER MANAGEMENT (Incomplete)

- [ ] Customer name stored in EN + AR
- [ ] Customer portal (login, past orders, loyalty points)
- [ ] Customer address book (multiple saved addresses)
- [ ] Customer blacklist / block
- [ ] Guest checkout vs registered account distinction
- [ ] Customer feedback / rating per order
- [ ] Birthday rewards automation
- [ ] Customer import/export (CSV)
- [ ] Customer merge (duplicate detection)

---

## 10. PAYMENTS & BILLING (Incomplete)

- [ ] Actual payment gateway integration (Stripe, Tap, HyperPay, Moyasar)
- [ ] Payment receipt in EN + AR
- [ ] Invoice generation (PDF, bilingual)
- [ ] VAT invoice with TRN number (for Saudi/UAE compliance)
- [ ] Tip prompt on payment screen
- [ ] Installment / BNPL option (Tabby, Tamara)
- [ ] Gift card / voucher redemption
- [ ] Wallet balance (store credit for customers)
- [ ] Refund back to original payment method
- [ ] Daily revenue reconciliation report

---

## 11. REPORTING & ANALYTICS (Incomplete)

- [ ] Shift report (per cashier session)
- [ ] Item-level sales report (sold, returned, revenue)
- [ ] Category-level sales breakdown
- [ ] Hourly / daily / weekly / monthly filters
- [ ] Staff performance report
- [ ] Rider performance report
- [ ] Delivery zone report (which area orders most)
- [ ] Discount & void report (with approver name)
- [ ] Tax report (for filing — VAT, GST)
- [ ] Export reports to Excel / CSV / PDF
- [ ] Scheduled email reports (daily summary to owner)
- [ ] Comparison report (this week vs last week)

---

## 12. NOTIFICATIONS & ALERTS (Incomplete)

- [ ] Push notifications to waiter (order ready)
- [ ] Push notifications to rider (new delivery)
- [ ] SMS to customer on order status change
- [ ] WhatsApp message to customer in Arabic
- [ ] Owner alert when stock runs low
- [ ] Owner alert on large refund / void
- [ ] Sound alert on new order (browser + KDS)
- [ ] Email alert on system errors

---

## 13. AUTHENTICATION & SECURITY (Not Implemented)

- [ ] Real login system (JWT / session-based)
- [ ] Staff PIN login for quick POS access
- [ ] Manager PIN for overrides (discount, void, refund)
- [ ] Role-based route protection (server-side)
- [ ] Audit log (who did what, when)
- [ ] Two-factor authentication (2FA)
- [ ] Session timeout / auto-logout
- [ ] Password policy enforcement

---

## 14. BACKEND / API (Not Implemented)

- [ ] REST or tRPC API layer
- [ ] Database (PostgreSQL / Supabase / PlanetScale)
- [ ] Real-time order updates (WebSocket / Supabase Realtime)
- [ ] File uploads (menu images, logos) to S3/Cloudflare R2
- [ ] Background jobs (scheduled reports, reminders)
- [ ] Rate limiting & API security
- [ ] Multi-tenant data isolation

---

## 15. HARDWARE INTEGRATIONS (Missing)

- [ ] Thermal receipt printer (actual ESC/POS commands)
- [ ] Kitchen printer (separate from receipt printer)
- [ ] Label printer (for delivery bags)
- [ ] Cash drawer
- [ ] Barcode scanner (USB HID input)
- [ ] Card reader / payment terminal (via SDK)
- [ ] Customer-facing display (pole display / second screen)

---

## 16. COMPLIANCE & LOCALIZATION

- [ ] ZATCA e-invoicing (Saudi Arabia — QR on receipt, XML format)
- [ ] UAE VAT compliance (5% VAT, TRN on invoice)
- [ ] Pakistan FBR integration (POS registration)
- [ ] Arabic numerals option (١٢٣ vs 123)
- [ ] Multiple currency support
- [ ] Timezone-aware reporting
- [ ] GDPR / data privacy controls (data export, delete account)

---

## 17. FRANCHISE / MULTI-BRANCH (Incomplete)

- [ ] Branch-level menu override (item available only at branch X)
- [ ] Branch-level pricing override
- [ ] Branch-level staff isolation
- [ ] Central kitchen order routing
- [ ] Franchise royalty reporting
- [ ] Cross-branch inventory transfers

---

## PRIORITY ORDER (Build This First)

| Priority | Feature |
|----------|---------|
| 🔴 Critical | Backend + Database + Auth |
| 🔴 Critical | Bilingual input (EN+AR) on all forms |
| 🔴 Critical | Real payment gateway |
| 🟠 High | Waiter module (table-side ordering, bill) |
| 🟠 High | Rider module (assignment, tracking) |
| 🟠 High | Cashier POS terminal (walk-in orders) |
| 🟠 High | Receipt in Arabic + ZATCA/VAT compliance |
| 🟡 Medium | KDS improvements (bump bar, timers, Arabic) |
| 🟡 Medium | Inventory — ingredient level + auto-deduct |
| 🟡 Medium | Shift reports + daily reconciliation |
| 🟢 Later | Aggregator integration |
| 🟢 Later | Customer portal |
| 🟢 Later | Hardware (cash drawer, label printer) |
