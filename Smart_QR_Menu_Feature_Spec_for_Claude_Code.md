# Smart QR Menu SaaS — Feature Specification for Claude Code

> **Purpose of this document:** This explains every feature to be built, in plain language, so Claude Code (or any developer) understands exactly what each feature does, how it behaves, and what rules it must follow. No code, no infrastructure, no deployment — just features.
>
> **Companion document:** Smart_QR_Menu_SaaS_Proposal.pdf (client-approved scope)
>
> **Tech stack (chosen separately, locked):** Next.js 15, TypeScript, Tailwind + shadcn/ui, PostgreSQL via Supabase, Drizzle ORM, tRPC, Stripe, Meta WhatsApp Cloud API direct, model-viewer for AR, OpenAI for translations.

---

## How to Read This Document

Every feature below is described using the same structure so you can implement them systematically:

- **What it is** — one-sentence summary
- **Why it exists** — the user problem it solves
- **Who can use it** — which roles and plans
- **How it behaves** — step-by-step user experience
- **Rules** — validations, constraints, edge cases
- **Configuration** — which toggles control it
- **Data it touches** — which tables and key fields

---

## Table of Contents

**Foundation**
- 1. The Configuration Philosophy (read first)
- 2. Multi-Tenancy Rules
- 3. Subscription Plans
- 4. User Roles

**Core Features**
- 5. Restaurant Signup & Onboarding Wizard
- 6. Tenant Settings & Feature Toggles
- 7. Branch Management
- 8. Staff Management
- 9. Menu Management
- 10. Item Modifiers & Variants
- 11. QR Code System
- 12. Table Management

**Ordering — Web Channel**
- 13. Public Customer Menu
- 14. Shopping Cart
- 15. Checkout Flow
- 16. Order Placement

**Ordering — WhatsApp Channel**
- 17. WhatsApp Account Connection (Embedded Signup)
- 18. WhatsApp Ordering Bot
- 19. WhatsApp Notifications (Outbound)
- 20. WhatsApp Billing Models

**Kitchen & Operations**
- 21. Live Order Dashboard
- 22. Order Status Pipeline
- 23. Kitchen Display System (KDS)

**Differentiators**
- 24. AR / 3D Menu Viewer
- 25. Allergen & Dietary Filters
- 26. Guest Memory
- 27. AI Menu Translator
- 28. In-Session Customer Actions

**Payments & Billing**
- 29. Customer Payment Methods
- 30. Subscription Billing (Stripe)
- 31. Plan Limits Enforcement

**Analytics**
- 32. Analytics Dashboard

---

# FOUNDATION

## 1. The Configuration Philosophy (Read First)

**This is the most important concept in the entire product. Read it before building anything else.**

### What it is

Every feature that changes the customer experience is a toggle — not a hardcoded behavior. The same codebase serves a roadside dhaba and a fine-dining restaurant. The difference is their settings.

### The Three Layers

When deciding whether a feature is active for a specific customer interaction, check three layers in this order:

**Layer 1 — Plan Level:** Did the restaurant's subscription plan include this feature?
- If their plan doesn't include it, the feature is off. No further checks.
- Example: AR viewer is only included in Pro and Business plans.

**Layer 2 — Tenant Level:** Has the restaurant owner turned this feature on?
- Even if their plan allows it, they may have chosen to keep it off.
- Example: A Pro-plan owner could enable AR but decides not to — so customers never see the AR button.

**Layer 3 — Branch Level (optional):** Has a specific branch overridden the tenant setting?
- For multi-location restaurants, Branch A might enable delivery while Branch B doesn't.
- If no branch-level override exists, fall back to the tenant-level setting.

### The Rule

A feature is **active** only when: `plan allows it AND tenant enabled it AND branch hasn't disabled it`.

### Where Settings Live

- Plan features: in `subscription_plans` table, seeded, not tenant-editable
- Tenant settings: in `tenant_settings` table, owner/manager can edit
- Branch overrides: in `branch_settings` table, owner/manager can edit

### Why This Matters

Every piece of customer-facing UI should check the feature state before rendering. Never hardcode "show table number field" — always check `customer_info.require_table`. This is the discipline that makes the product flexible.

---

## 2. Multi-Tenancy Rules

### What it is

Every restaurant is a "tenant." Tenants never see each other's data — not through the UI, not through the API, not through the database.

### Core Rules

- Every tenant-scoped table has a `tenant_id` column that is mandatory and foreign-keyed to `tenants`.
- Every database query on these tables must filter by `tenant_id`. No exceptions.
- The app never accepts `tenant_id` from user input for write operations. The tenant is always derived from the authenticated user's session.
- Row-Level Security (RLS) is enabled at the PostgreSQL level as a defense-in-depth measure. Even if app code has a bug, the database blocks cross-tenant reads.
- For the public customer menu (unauthenticated), the tenant is resolved from the URL slug, and only active (non-suspended, non-deleted) tenants are accessible.

### When Tenant Isolation Can Be Bypassed

Only two scenarios:
1. **Service role (webhooks, admin tasks):** Stripe webhooks, WhatsApp webhooks, and scheduled jobs run with service-role credentials that bypass RLS. Use sparingly.
2. **Super admin (us, the platform operator):** A separate admin panel for platform support, not exposed to tenants.

### What to Watch For

- Never pass `tenantId` in a URL path or request body for authenticated flows.
- Never use service-role credentials in a normal request handler.
- When joining across tables, ensure every joined table is also tenant-scoped.

---

## 3. Subscription Plans

### What it is

Four plans — Free, Starter, Pro, Business — that determine which features a tenant can use and how much they pay.

### Plan Tiers

| Plan | Target customer | Monthly price (USD) |
|---|---|---|
| Free | Trial / tiny operation | $0 |
| Starter | Small single-location venue | $15 |
| Pro | Differentiated restaurant | $40 |
| Business | Chain or enterprise | $120 |

### What Each Plan Unlocks

Full feature gating is documented in the client proposal Section 10. Key differences:

- **Free:** Basic QR menu, 30 items max, 50 orders/month, branded watermark on customer menu
- **Starter:** 150 items, 500 orders/month, per-table QR, KDS, basic WhatsApp notifications
- **Pro:** Unlimited items/orders, AR viewer, AI translator, custom domain, guest memory, bulk WhatsApp campaigns
- **Business:** Multi-location, unlimited staff, managed WhatsApp billing, API access, custom roles, SLA

### Trial Policy

- Every new tenant starts on a 14-day Pro trial (no credit card required)
- On trial expiry, tenant moves to Free plan automatically
- During trial, banner in dashboard shows days remaining
- Email/WhatsApp reminders at 7, 3, and 1 day before trial ends

### Plan Changes

- Upgrade: instant, pro-rated by Stripe
- Downgrade: takes effect at end of current billing period
- Cancellation: takes effect at end of period; 30-day data retention after cancellation, then hard delete

---

## 4. User Roles

### What it is

Within a single tenant, different staff members have different levels of access. Roles are assigned when a user is invited.

### The Six Roles

1. **Owner** — full access, including billing. Only one owner per tenant (the signup user). Can transfer ownership.
2. **Manager** — full operational access (menu, orders, reports, staff invites) but cannot access billing or delete the tenant.
3. **Kitchen** — KDS access only. Can view orders and update status (preparing, ready). Cannot see prices, revenue, or menus (except to toggle availability).
4. **Waiter** — can view tables, take orders on behalf of customers, update order status. Cannot see revenue or edit menus.
5. **Cashier** — can process payments, close orders, see today's sales total only.
6. **Read-only** — view-only access to reports and financial data. For accountants and bookkeepers.

### Permission Matrix

A detailed permission matrix lives in the client proposal Section 11.2. The rule of thumb:

- **Owner** — everything
- **Manager** — everything except billing and tenant deletion
- **Kitchen/Waiter/Cashier** — operational only, no financial visibility beyond their narrow scope
- **Read-only** — financial visibility but no write actions

### Multi-Branch Scoping

A staff member's role can be scoped to specific branches. If `branch_scope` is null on their membership, they see all branches. If it's a list of branch IDs, they only see those.

### Rules

- A user can belong to multiple tenants (rare but supported — agencies, restaurant groups with shared staff)
- Role changes take effect on next login (user must re-authenticate)
- Removing a staff member revokes access immediately
- Owner cannot remove themselves; they must transfer ownership first

### UI Rule

If a user cannot perform an action due to their role, hide the button entirely rather than disabling it. Disabled buttons confuse users. Only exception: temporary state-based disabling (e.g., "Complete order" when order is already completed).

---

# CORE FEATURES

## 5. Restaurant Signup & Onboarding Wizard

### What it is

A 5-step wizard that runs after signup to gather basic information about the restaurant and pre-configure sensible defaults.

### Why it exists

Most competitors force new restaurants to configure dozens of settings manually, causing 60%+ abandonment before first menu item. The wizard reduces time-to-first-menu-item to under 15 minutes.

### Who can use it

New tenants during signup. Skippable by Owner at any step except Step 1.

### How it behaves

**Step 1 — Restaurant Type**
- Radio select: Quick Service, Dine-in, Cafe, Drive-thru, Cloud Kitchen, Food Truck, Chain
- Required; determines smart defaults for later steps

**Step 2 — How Do Customers Order?**
- Multi-select: At counter, At table, Online via web, Via WhatsApp
- Pre-checked based on Step 1 answer
- Controls `channel.web_menu` and `channel.whatsapp_ordering` toggles

**Step 3 — Fulfillment Methods**
- Multi-select: Dine-in, Takeaway, Delivery, Drive-thru
- Pre-checked based on Step 1 answer
- Controls `ordering.*` toggles

**Step 4 — Payment Methods**
- Multi-select with region-specific options
- Pakistan: Cash, Card at venue, Online card, JazzCash, Easypaisa, Bank transfer
- Spain/EU: Cash, Card at venue, Online card, Bizum
- Controls `payment.*` toggles

**Step 5 — Primary Customer Communication**
- Single-select: WhatsApp, SMS, Email, None
- Controls `notif.*` toggles

**After Step 5:**
- Create a default menu called "Main Menu"
- Create 3 starter categories: "Starters", "Mains", "Desserts"
- Redirect to `/dashboard/menu` with a prompt "Add your first menu item"

### Smart Defaults by Restaurant Type

| Type | Dine-in | Takeaway | Delivery | Drive-thru | Require table | Require car |
|---|---|---|---|---|---|---|
| Quick Service | on | on | off | off | off | off |
| Dine-in | on | off | off | off | on | off |
| Cafe | on | on | off | off | off | off |
| Drive-thru | off | on | off | on | off | on |
| Cloud Kitchen | off | off | on | off | off | off |
| Food Truck | off | on | off | off | off | off |
| Chain | on | on | on | off | on | off |

### Rules

- Wizard state must persist across page refresh (save partial to DB after each step)
- Progress bar visible on every step (1 of 5, 2 of 5, etc.)
- "Back" button always available
- "Skip for now" available on steps 2-5 (defaults used if skipped)
- Minimal UI chrome — no sidebar, no distractions
- Mobile-first responsive

### Data it touches

- Writes to `tenants` (restaurant_type, onboarding_completed_at)
- Writes to `tenant_settings` (all toggles from wizard)
- Creates default `menu`, `categories`
- Creates default `branches` entry if not already created

---

## 6. Tenant Settings & Feature Toggles

### What it is

A settings page in the dashboard where the owner/manager can turn features on or off. This is the interface for the configuration philosophy described in Section 1.

### Who can use it

- Owner: all settings
- Manager: operational and branding settings, not payment settings
- Other roles: cannot access

### How it behaves

The settings page is organized into categories (tabs or sections):

1. **Ordering** — which order types are accepted
2. **Customer Information** — what data to collect at checkout
3. **Payment** — which payment methods to offer
4. **Menu Display** — what to show on customer menu
5. **Customer Experience** — call waiter, request bill, reviews, loyalty
6. **Notifications** — WhatsApp, SMS, email, sounds
7. **Branding** — logo, colors, fonts, theme
8. **Operating Hours** — per-day open/close times
9. **Tax & Currency** — rate, inclusive/exclusive, service charge

Each toggle shows:
- The toggle itself (on/off switch, or text/number input where needed)
- A short description of what it does
- A lock icon with "Upgrade to unlock" if the current plan doesn't include it
- A link to the billing page when the upgrade is needed

### Rules

- Changes save immediately (no "Save" button — use optimistic UI with toast confirmation)
- If saving fails, revert and show error
- Every change writes to `audit_log` so there's a record of who changed what and when
- Features locked by plan cannot be toggled on — clicking the lock opens the upgrade modal
- Some features are not configurable (always on) — these are core to the product; they don't appear in this page

### Full list of toggleable features

The complete list is in Section 9.7 of the client proposal. Broadly, about 60 toggles across the 9 categories above.

### Data it touches

- Reads from `tenant_settings`, `branch_settings`, `subscription_plans`
- Writes to `tenant_settings` (always) and `branch_settings` (if branch override selected)
- Writes to `audit_log`

---

## 7. Branch Management

### What it is

A tenant can have multiple physical locations (branches). Each branch has its own address, phone, operating hours, and optional setting overrides.

### Who can use it

- Owner: create/edit/delete branches
- Manager: create/edit branches (cannot delete)
- Plan restrictions: Free/Starter = 1 branch; Pro = up to 3; Business = unlimited

### How it behaves

Branches page lists all branches with a map preview. Owner can:
- Add a new branch (name, address, lat/lng, phone, operating hours)
- Set one branch as "default" (the branch the master QR routes to)
- Mark branches active/inactive (inactive branches don't appear to customers but keep their data)
- Override tenant settings on a per-branch basis

### Branch Selector in Dashboard

If a tenant has multiple branches, the dashboard header shows a branch selector. Selecting a branch filters:
- The order board (only orders for this branch)
- Analytics (only this branch's data)
- Settings (shows branch-level overrides)

If user has `branch_scope` limited to specific branches, they only see those in the selector.

### Rules

- Every tenant must have at least one branch (the default, created during onboarding)
- Cannot delete the default branch unless another is set as default first
- Cannot delete a branch with active orders; must wait for completion or cancel them
- Branch deletion is soft (sets `deleted_at`); hard delete after 30 days

### Data it touches

- `branches` table
- `branch_settings` for overrides

---

## 8. Staff Management

### What it is

A page where the owner or manager invites other users to the tenant, assigns them a role, and optionally scopes them to specific branches.

### Who can use it

- Owner: invite, remove, change role for anyone
- Manager: invite new staff (cannot invite owners or managers, cannot change existing roles)
- Other roles: cannot access

### How it behaves

**Invite flow:**
1. Owner clicks "Invite staff"
2. Enters email, selects role, optionally selects branch scope
3. System sends email with a magic link
4. Invitee clicks link, creates password (if new user) or logs in (if existing user)
5. Membership is created in `tenant_memberships`

**Staff list:**
- Table with name, email, role, branch scope, status, last login
- Actions per row: change role (owner only), remove, resend invite (if pending)

### Rules

- Email must not already be a member of this tenant
- If email exists elsewhere in the system, they can accept the invite and gain a second tenant membership
- Invite expires after 7 days; owner can resend
- Role changes take effect on next login
- Cannot remove the owner; owner must first transfer ownership
- Removing a staff member revokes their active session immediately

### Data it touches

- `users` (create if new)
- `tenant_memberships` (the actual role assignment)
- Supabase Auth (sends invite email)

---

## 9. Menu Management

### What it is

The screens where the restaurant owner builds and maintains their menu: menus, categories, items, and all associated data.

### Who can use it

- Owner/Manager: full CRUD on everything
- Kitchen: can toggle item availability only (for when they run out)
- Other roles: read-only

### Structure

The menu has three levels:
1. **Menus** — top-level groupings (Breakfast, Lunch, Dinner, Kids Menu)
2. **Categories** — sections within a menu (Starters, Mains, Desserts)
3. **Items** — individual dishes

### Menus

Each menu has:
- Name, description
- Active toggle (paused menus don't appear to customers)
- Availability window (e.g., Breakfast only 6 AM – 11 AM)
- Day-of-week availability (e.g., Weekend brunch only Sat–Sun)
- Branch scope (null = all branches, or specific branch IDs)
- Sort order for dashboard display

**Rule:** At any given moment, a customer sees all menus that are active AND currently within their availability window AND available for their branch.

### Categories

Each category has:
- Name, description, optional image
- Sort order within its menu
- Active toggle
- Belongs to exactly one menu

**UI:** Drag-and-drop reordering in the dashboard. Order persists to `sort_order` field.

### Items

Each item has:
- Name, description
- Price (stored in minor currency units — paisa for PKR, cents for USD — to avoid floating-point errors)
- Cost (optional, for margin tracking, not shown to customers)
- Prep time in minutes (for queue estimation)
- Calories (optional display)
- Up to 5 images
- Optional 3D model URL (.glb) and auto-generated USDZ
- Availability toggle (master on/off)
- Stock quantity (optional; if set to 0 and tracked, item auto-disables)
- Time-of-day availability (e.g., drinks only after 4 PM)
- Day-of-week availability
- Tags (spicy, vegan, halal, new, popular, chef's pick, bestseller)
- Allergens (gluten, nuts, dairy, eggs, seafood, soy, sesame, etc.)
- Dietary flags (vegetarian, vegan, halal, kosher, gluten-free, dairy-free, nut-free)
- Translations (key-value map: language code → {name, description})
- Sort order within its category

### Bulk Actions

From the items list, owner can multi-select and:
- Toggle availability
- Move to different category
- Delete
- Apply tags in bulk

### Image Upload

- Drag-and-drop zone accepts JPG, PNG, WebP
- Client-side resize before upload (max 1200px wide, 85% JPEG quality)
- Server generates thumbnails automatically
- Stored in Supabase Storage, scoped per tenant

### Rules

- Price must be ≥ 0 (free items allowed, e.g., "Complimentary water")
- Images are optional but strongly recommended
- At least one category must exist before items can be added
- Deleting a category moves items to an "Uncategorized" bucket (do not cascade-delete items)
- Soft delete for menus, categories, items; hard delete after 30 days

### Plan Limits

| Plan | Max items |
|---|---|
| Free | 30 |
| Starter | 150 |
| Pro | Unlimited |
| Business | Unlimited |

When hitting the limit, the "Add item" button becomes disabled with an "Upgrade to add more" tooltip.

### Data it touches

- `menus`, `categories`, `items`
- `item_modifier_groups`, `item_modifiers`
- Supabase Storage for images

---

## 10. Item Modifiers & Variants

### What it is

Modifiers let customers customize an item — pick a size, add toppings, select spice level, exclude ingredients, or write special instructions.

### Why it exists

Without modifiers, a burger is just "Burger $5." With modifiers, it's "Burger — Small/Medium/Large — Extra cheese? Extra bacon? No pickles?" This is how real menus work.

### Structure

Each item can have multiple **modifier groups**. Each group contains multiple **modifier options**.

### Modifier Group

Configurable per group:
- Name (e.g., "Size", "Toppings", "Spice Level", "Remove Ingredients")
- Required or optional — if required, customer must pick at least one before adding to cart
- Min selections (default 0, or 1 if required)
- Max selections (null = unlimited, 1 = single-select like radio, 2+ = multi-select with cap)
- Sort order (display order within the item)

### Modifier Option

Configurable per option:
- Name (e.g., "Large", "Extra Cheese", "No Onion")
- Price delta — can be negative (discount), zero (free change), or positive (upcharge). Examples:
  - Large: +$2.00
  - No onion: $0.00
  - Remove fries: -$1.50 (not common but supported)
- Default (optional; pre-selected when item is opened)
- Available toggle (temporary hide without deleting)
- Sort order

### Special Instructions Field

A separate free-text field (optional, togglable per tenant) where customer can write notes like "allergy to peanuts" or "well-done please." Not a modifier — stored as `notes` on each cart line.

### Customer-Side Behavior

On item detail page:
- Required groups show an orange asterisk; cart button disabled until selections made
- Single-select groups render as radio buttons
- Multi-select groups render as checkboxes, with counter "2 of 3 selected"
- Selected modifier price deltas are added to the item's subtotal in real-time

### Rules

- A group with `min_selections = 1` and `max_selections = 1` behaves like a required radio
- A group with `min_selections = 0` and `max_selections = null` is optional multi-select
- Price deltas can be negative but total item price cannot go below zero (clamp)
- Modifier snapshots are stored with the order at order time — later price changes don't affect historical orders

### Data it touches

- `item_modifier_groups`, `item_modifiers`
- When order is placed, modifier snapshots stored in the order's `items` JSONB field

---

## 11. QR Code System

### What it is

Printable, scannable QR codes that take customers directly to the restaurant's menu. Three types, each with different tracking.

### Why it exists

This is the primary entry point for the entire product. Every QR code generates one or more orders' worth of value. Different types allow tracking and flexibility.

### The Three QR Types

**1. Master QR (tenant-level)**
- One QR for the entire restaurant
- Links to `/r/[slug]` — customer sees the landing page, picks branch if multi-location
- Use case: printed on flyers, social media posts, storefront stickers

**2. Per-Table QR (table-level)**
- One QR per table
- Links to `/r/[slug]/t/[qrCodeId]`
- When scanned, auto-selects that table number on checkout — customer doesn't have to type it
- Use case: printed on table tents in dine-in restaurants

**3. Campaign QR (marketing-level)**
- Unique QR per campaign
- Links to `/r/[slug]?c=[campaignCode]`
- Tracks which marketing channel drove the scan (Instagram ad, bus stop poster, flyer batch A, etc.)
- Use case: measuring ROI of marketing channels

### How it behaves in the dashboard

The QR Codes page has three tabs (Master, Tables, Campaigns).

**Master QR:**
- Big preview of the QR
- Download as PNG (various sizes) or PDF (print-ready with restaurant name under code)
- Color customization (on Pro+; Free is black and white with small watermark)

**Table QR:**
- List of all tables with their QR codes
- "Add Table" creates a new table with an auto-generated unique `qr_code_id`
- Bulk download all table QRs as a single PDF (one per page, labeled)
- Print template option (A4 with 12 QRs per page, tear-out style)

**Campaign QR:**
- List of campaigns with name, code, scan count, order count, revenue
- Create new campaign (name, optional expiry date)
- Download individual campaign QR

### Branded QR Design

- Pro+ plans: logo in center, custom primary color, optional rounded corners
- Free plan: plain black and white with "Powered by QRMenu" small text

### Rules

- Every QR `qr_code_id` is globally unique, 12-character alphanumeric, URL-safe
- QR payload is the full URL, not just the ID (this way, scanners that only read URLs work)
- QR error correction level: M (15%) — balances density with robustness to smudges
- Table QRs cannot be "reassigned" to another table — delete and create new
- Campaign QRs can be marked inactive when the campaign ends; existing scans still work

### Data it touches

- `tenants.slug` for master QR
- `restaurant_tables` for table QRs
- New `campaigns` table for campaign QRs (simple: id, tenant_id, name, code, created_at, expires_at, is_active)
- `page_views` records scan + campaign code for attribution

---

## 12. Table Management

### What it is

A list of tables per branch, each with a number/name, capacity, and unique QR code.

### Who can use it

Owner and Manager can create/edit/delete. Waiter can view.

### How it behaves

**Dashboard view:**
- Grid of tables for the selected branch
- Each tile shows: table number, capacity, current status (free, occupied, has active order)
- Click tile to see: current orders on this table, past orders, print QR

**Create table:**
- Table number/name (free text, e.g., "T1", "Patio-3", "Window-4")
- Capacity (number of seats, optional)
- Branch assignment

**Delete table:**
- Soft delete
- Table QRs that were printed will still link but show "Table not found" message

### Real-time Table Status (Live View)

On a separate "Floor Plan" screen (Pro+), tables are color-coded:
- **Grey** — empty, no active order
- **Blue** — order in progress
- **Yellow** — order ready, not picked up
- **Green** — bill requested
- **Red** — aging (customer at table > 90 min without activity, for turn optimization)

Updates in real-time via Supabase Realtime on the `orders` table.

### Rules

- Table numbers must be unique within a branch (but can repeat across branches)
- Table cannot be deleted while it has an active order
- Capacity is informational only (not enforced against guest count in orders)

### Data it touches

- `restaurant_tables`
- `orders.table_id` for live status

---

# ORDERING — WEB CHANNEL

## 13. Public Customer Menu

### What it is

The mobile-first web page a customer sees when they scan a QR code. This is the single most important page in the product — 99% of customers never see the dashboard.

### Performance Target

Must load in under 2 seconds on 3G. Under 1 second on 4G. No exceptions.

### Structure

**Landing page (`/r/[slug]`):**
- Cover image (tenant-configured)
- Restaurant name, logo
- Short description
- Operating hours (indicates if open or closed)
- "View Menu" button → goes to `/r/[slug]/menu`
- Language switcher (if multiple translations exist)
- Allergen filter (if enabled)

**Menu page (`/r/[slug]/menu`):**
- Category tabs (horizontal scroll on mobile)
- Items grid (2 columns on mobile, more on desktop)
- Each item card shows: image, name, short description, price, dietary icons, "Add" button
- "Popular" and "New" badges if applicable
- Sticky cart summary at bottom ("3 items — $42.50" → opens cart)

**Item detail (`/r/[slug]/item/[itemId]`):**
- Large image (swipeable carousel if multiple)
- Name, full description, price
- "View in 3D" button (if model exists and feature enabled)
- "View in AR" button (if AR feature enabled and device supports)
- Allergen list with icons
- Modifier groups (required ones enforced)
- Special instructions field (if enabled)
- Quantity selector
- "Add to Cart" button (shows line total including modifiers)

### Rules

**Menu visibility:**
- Only show items where `is_available = true`
- Only show items within current time-of-day and day-of-week availability
- Apply allergen filters (see Section 25)
- Hide "cost" field (internal only)

**Closed restaurants:**
- If restaurant is closed (operating hours), behavior depends on setting:
  - Option A: Hide menu entirely with "Closed — opens at 10 AM" message
  - Option B: Show menu but disable "Add to cart" (browse-only mode)
  - Option C: Allow scheduled orders for pickup/delivery later

**Language:**
- Auto-detect browser language
- Use tenant's `default_language` as fallback
- If translation missing, show default-language version with small note
- RTL layout for Urdu and Arabic

**Branding:**
- Primary color applied to buttons, accents
- Logo in header
- Custom fonts (from curated list)

### Configuration

Many toggles affect what's shown:
- `menu.show_prices` — hide prices (for catalog-only restaurants, rare)
- `menu.show_calories` — show calorie count per item
- `menu.show_prep_time` — "Ready in ~12 min"
- `menu.show_allergens` — show allergen icons
- `menu.ar_viewer` — show "View in AR" button
- `menu.model_3d_viewer` — show "View in 3D" button
- `menu.popular_badges` — auto-tag bestsellers
- `menu.new_badges` — auto-tag items added in last 14 days
- `customer.call_waiter` — show call waiter button
- `customer.request_bill` — show request bill button

### Analytics

Every menu page visit records a row in `page_views` with:
- Visitor ID (cookie-based UUID, lasts 365 days)
- Session ID (lasts 30 min of inactivity)
- Table ID (if scanned from table QR)
- Campaign code (if scanned from campaign QR)
- User agent, IP country (from CloudFront headers)

### Data it touches

- Reads: `tenants`, `menus`, `categories`, `items`, `item_modifier_groups`, `item_modifiers`
- Writes: `page_views`

---

## 14. Shopping Cart

### What it is

Client-side state that holds selected items before checkout. Persists across page refreshes within a session.

### Storage

- Stored in the browser's `sessionStorage` (not `localStorage`)
- Cleared when the browser tab closes — we do not want carts persisting for weeks

### Cart Contents

Each cart line has:
- Item ID (reference)
- Item name (snapshot at add time)
- Quantity
- Unit price (snapshot — so if restaurant changes prices, customer pays what they saw)
- Selected modifiers (array with names and price deltas)
- Special notes (free text)
- Line total (computed)

Cart totals (computed client-side for display, server-side for authority):
- Subtotal = sum of line totals
- Tax (applied at checkout based on tenant settings)
- Service charge
- Delivery fee (if applicable, computed at checkout)
- Tip (selected at checkout if enabled)
- Total

### Cart UI

- Cart page (`/r/[slug]/cart`) shows line items with edit/remove
- Sticky summary bar on menu page
- Quantity steppers (+ / –)
- Empty cart shows "Your cart is empty" with "Continue Browsing" button

### Rules

- Cart is scoped to the specific tenant (switching restaurants clears the cart)
- Adding the same item with different modifier selections creates separate lines
- Adding the same item with identical modifiers increments quantity (don't create duplicate lines)
- Client-side totals are informational only — checkout recomputes everything server-side
- Cart does not reserve inventory; items can go out of stock before checkout

### Data it touches

- Nothing in the database (client-side only)
- On checkout, snapshot is sent to server and stored in order

---

## 15. Checkout Flow

### What it is

The multi-step form where the customer provides required information and completes payment.

### How it behaves

**Step 1 — Order Type**
- If multiple fulfillment methods enabled, customer picks one (Dine-in, Takeaway, Delivery, Drive-thru)
- If only one is enabled, skip this step
- If scanned from a table QR, default to Dine-in with table pre-filled

**Step 2 — Customer Information**
- Dynamically built based on tenant settings and order type
- Name, phone, email fields appear only if configured
- Table number field appears only for dine-in
- Car number field appears only for drive-thru
- Delivery address appears only for delivery
- Guest count appears only if configured
- Special notes appears if configured

**Step 3 — Payment Method**
- List of enabled payment methods (dynamic, per tenant settings)
- Customer selects one
- If online payment selected, Stripe Payment Element loads
- If JazzCash/Easypaisa selected (Pakistan), redirect to gateway
- If cash/bank transfer, show instructions and submit order for confirmation

**Step 4 — Review & Submit**
- Order summary (items, totals)
- Customer info summary
- Payment method
- Terms & conditions checkbox (link to tenant's T&Cs)
- "Place Order" button

### Validation Rules

- Phone must be valid E.164 format (country-specific validation)
- Email must be valid format if provided
- Required fields are enforced with inline error messages
- Delivery address must be within delivery radius (if configured)
- Minimum order amount enforced (if configured)
- If online payment required, order is only created after successful Stripe auth

### Post-Submission

- Redirect to `/r/[slug]/order/[orderId]` — live status tracking page
- WhatsApp confirmation sent (if opted in)
- Order appears in dashboard in real-time

### Guest Memory Integration

When customer enters phone number, system looks up `customers` for this tenant. If found:
- Pre-fill name field
- Show "Welcome back, Ahmed!" greeting
- Show saved delivery addresses as quick-select
- Show "Order your usual?" button if applicable (see Section 26)

### Data it touches

- Reads: `tenants`, `tenant_settings`, `customers` (if phone provided)
- Writes: creates row in `orders`, upserts `customers`

---

## 16. Order Placement

### What it is

The final step where the order is validated, persisted, and sent to the kitchen.

### Server-Side Validation

Before creating the order, the server MUST:

1. Re-fetch every item from the database by ID
2. Verify each item still exists, is available, and belongs to this tenant
3. Verify prices haven't changed dramatically (defense against client tampering)
4. Recompute every modifier by ID
5. Recompute subtotal, tax, service charge, total server-side
6. Validate customer info against tenant settings (required fields)
7. Validate delivery address is within radius (if delivery)
8. Validate minimum order amount
9. Validate restaurant is currently open (reject if outside operating hours, unless scheduled orders enabled)

If any validation fails, return a clear error message. Never silently accept an invalid order.

### Order Number

- Human-readable, scoped per tenant per day
- Format: `#001`, `#002`, etc., resetting each day
- Optionally prefixed with branch code for multi-location: `#B1-001`

### Order Creation

The order is inserted with:
- Snapshot of all items at time of order (in JSONB) — future price changes don't affect this order
- Customer info (denormalized from `customers` for historical integrity)
- Channel (`web`, `whatsapp`, or `staff`)
- Initial status: `pending`
- `created_at` timestamp

### Side Effects (Async)

After the order is created, fire these in parallel (don't block the response):

1. Upsert `customers` row (increment order count, update last_order_at, totals)
2. Send WhatsApp confirmation to customer (if opt-in)
3. Send WhatsApp alert to owner/manager (if notifications enabled)
4. Play audible alert in dashboard (via Supabase Realtime)
5. Create Stripe PaymentIntent if online payment (though typically this is created BEFORE order for card auth)
6. Write to `audit_log`
7. If item has stock tracking, decrement stock; auto-disable if stock hits 0

### Rules

- Never create two orders with the same number for the same tenant on the same day (use DB constraint + transaction)
- Order creation and stock decrement must be atomic (transaction)
- If customer's phone maps to an existing `customers` row, link it
- If this is a guest (no phone), don't create a `customers` row

### Data it touches

- `orders` (insert)
- `customers` (upsert)
- `items.stock_quantity` (decrement if applicable)
- `audit_log` (insert)
- Triggers WhatsApp send job
- Realtime broadcast

---

# ORDERING — WHATSAPP CHANNEL

## 17. WhatsApp Account Connection (Embedded Signup)

### What it is

The flow where a restaurant owner connects their own WhatsApp Business Account to our platform. Uses Meta's Embedded Signup — a one-click authentication flow.

### Why Embedded Signup

Each restaurant needs their OWN WhatsApp Business Account (WABA) for two critical reasons:
1. **Branding:** Customers see messages from the restaurant's own number, not a generic platform number
2. **Risk isolation:** If one restaurant gets their WABA banned (e.g., for spamming), others aren't affected

### Who can use it

Owner only. Available on all plans (even Free, to help trial users experience WhatsApp).

### How it behaves

**Step 1 — Prerequisites Check**
- Before launching the signup, explain what the owner will need:
  - A Meta Business Manager account (we link or create one)
  - A phone number they want to use for WhatsApp (not currently active in the WhatsApp consumer app)
  - Business verification documents (for production use)

**Step 2 — Launch Meta's Popup**
- Click "Connect WhatsApp" button
- Meta's Embedded Signup popup opens (iframe hosted by Facebook)
- Owner logs into their Facebook account (or creates one)
- Owner selects or creates a Meta Business Manager
- Owner enters business details Meta requires
- Owner selects or adds a phone number
- Owner approves permissions our app requests

**Step 3 — Token Exchange (Backend)**
- Meta returns an authorization code to our callback
- Our server exchanges the code for an access token
- Server fetches the WABA ID and phone number ID from Meta
- Server subscribes the WABA to our webhook URL
- Server registers the phone number for messaging
- Server stores encrypted token in `whatsapp_accounts` table

**Step 4 — Template Submission**
- System auto-submits the default message templates (order_confirmed, order_ready, etc.) to Meta for approval
- Owner sees a "Connecting..." progress screen
- Once templates are submitted, show "Connected! Templates under review (24-48 hours)"

**Step 5 — Business Verification (for production)**
- For sandbox/trial use, Meta allows messages to a small list of test numbers immediately
- For production (unlimited customers), Meta requires Business Verification (submitted through Meta Business Manager — a separate flow the owner must complete)
- Dashboard shows a banner "Complete Business Verification to message all customers" with instructions

### Billing Model Selection

During connection, owner chooses:
- **Direct (default):** Restaurant adds credit card to their Meta account. Meta bills them directly per message. Simple.
- **Managed (Business plan only):** We pay Meta, restaurant tops up a wallet in our app, we charge 20% markup for convenience and support.

See Section 20 for full billing detail.

### Rules

- One WABA per tenant (MVP constraint; multi-WABA in v2)
- Token must be encrypted at rest (never stored plaintext)
- Connection status visible in dashboard: Pending / Verified / Banned / Paused
- If Meta bans the WABA, status flips to `banned` and outbound messages are blocked
- If the access token expires or is revoked, status flips to `paused` and dashboard prompts reconnection

### Data it touches

- `whatsapp_accounts` (insert on connection)
- `whatsapp_templates` (auto-submitted templates)

---

## 18. WhatsApp Ordering Bot

### What it is

A conversational ordering flow where the customer places an order entirely inside WhatsApp — no web browser needed.

### Why it exists

In Pakistan and many other markets, WhatsApp is the dominant messaging channel. Customers would rather chat than tap through a website. It's also free for the restaurant (see Section 20).

### Who can use it

Every tenant with a connected WhatsApp account and `channel.whatsapp_ordering` enabled.

### Customer Entry Points

Three ways a customer can start:
1. Scan a QR code that opens `https://wa.me/<restaurant-number>?text=hi`
2. Message the restaurant's WhatsApp number directly (saved contact)
3. Click a "Click-to-WhatsApp" link from the restaurant's website or social media

### The Conversation Flow

The bot is a state machine. At any moment, each customer conversation is in one state; messages trigger transitions.

**State: idle**
- Entry: customer has never messaged, or last conversation completed
- On any inbound message, transition to `greeting`

**State: greeting**
- Bot sends: "👋 Welcome to [Restaurant Name]! I can help you order. Tap below to see our menu."
- Bot sends an interactive list message with category options
- Transition to `browsing_menu`

**State: browsing_menu**
- Customer selects a category from the list
- Bot sends items in that category as interactive messages (with image, name, price, "View" button)
- Customer can reply with a number or tap a button
- On item selection, transition to `item_detail`

**State: item_detail**
- Bot sends item details with modifier groups as sequential prompts
- For each required modifier group, bot asks: "Choose a size" with buttons
- After all required modifiers selected, bot asks for quantity
- Customer can reply with a number or use +/- buttons
- Add item to in-progress cart, transition back to `browsing_menu`

**State: cart_review**
- Triggered when customer types "cart", "checkout", or taps "View Cart" button
- Bot sends cart summary: each line item with total
- Offers buttons: "Modify", "Remove item", "Continue ordering", "Checkout"

**State: collecting_info**
- Bot asks for customer name (if required)
- Then asks for order type (if multiple enabled)
- Then asks for table/car/address based on order type
- Each prompt uses interactive buttons where possible, text entry otherwise

**State: payment_selection**
- Bot sends payment method options as buttons
- For cash/pay-at-venue: confirmation step
- For online payment: bot sends a Stripe Checkout link (hosted URL)
- For JazzCash/Easypaisa: bot sends a deep link to the gateway

**State: confirming**
- Bot sends final summary with total
- Buttons: "Confirm & Place Order" / "Cancel"

**State: confirmed**
- Order is created in `orders` table
- Bot sends "Thanks! Your order #1234 is received. We'll message you when it's ready."
- Transition back to `idle`
- Subsequent status updates (preparing, ready) are sent automatically

### Interactive Message Types

WhatsApp supports specific formats better than free text:
- **List message** — up to 10 options with sections; ideal for categories and menus with many items
- **Button message** — up to 3 buttons; ideal for yes/no, size picks, payment methods
- **Product message** — rich image + title + description; ideal for single item detail
- **Text message** — fallback for free-form input like address, notes

### Handling Ambiguity

If the customer types something the bot doesn't recognize (e.g., "I want something spicy"), bot responds:
- "I didn't catch that. Here are your options: [buttons]"
- After 3 consecutive unrecognized messages, offer: "Would you like to speak to a human?" — if owner has enabled handoff, forward conversation to staff

### Cart State

The customer's in-progress cart is stored in `whatsapp_conversations.state_data` (JSONB). Example:
```
{
  cart: [
    { itemId, name, quantity, unitPrice, modifiers: [...] }
  ],
  customerInfo: { name, phone, address },
  currentItem: { ... }  // while building modifiers
}
```

### The 24-Hour Free Window

Every inbound message from the customer opens (or refreshes) a 24-hour "free window." While this window is open:
- All outbound messages (including the full ordering flow) are FREE
- No Meta charges

This is why WhatsApp-native ordering is cost-effective — the customer always initiates.

If the window expires and we need to message them (e.g., order ready but customer went quiet), we must use a pre-approved template (paid).

### Rules

- Bot response time: under 3 seconds after inbound message
- Never send more than 3 messages in a row without customer input (avoid spam)
- Always provide a way to "restart" or "cancel" — accepting keywords like "cancel", "stop", "menu"
- If conversation inactive for 24 hours, reset state to `idle`
- Honor customer opt-out: if customer sends "STOP" or "UNSUBSCRIBE", set `whatsapp_opt_in = false` and acknowledge
- Pakistani market: bot should handle Urdu and English interchangeably (AI-assisted language detection)

### Limitations (MVP)

- No image-based ordering ("send us a photo of the dish you want") — v2
- No voice message support (client excluded voice)
- No group ordering via WhatsApp — v2

### Data it touches

- Reads: `whatsapp_accounts`, `tenants`, `menus`, `categories`, `items`, `tenant_settings`
- Writes: `whatsapp_conversations` (state), `whatsapp_messages` (log), `orders` (on completion), `customers` (upsert)

---

## 19. WhatsApp Notifications (Outbound)

### What it is

Automated WhatsApp messages sent from the restaurant to the customer at key moments in the order lifecycle.

### Why it exists

WhatsApp has ~98% open rate versus 20% for email. For order updates, it's the best channel. Free in most cases (24-hour window) and very cheap ($0.004–$0.01 per message) otherwise.

### Who can use it

All plans can use WhatsApp notifications once they've connected their WABA. Volume differs by plan:
- Free: 100 messages/month
- Starter: 500 messages/month
- Pro: 2,000 messages/month
- Business: unlimited

When the cap is hit, messages queue (not lost) and owner is prompted to upgrade or enable managed billing.

### Notification Types

**Customer-facing (only sent if customer opted in):**

1. **Order received** — triggered on order creation
   - Template: "Hi [name]! Your order #[number] at [restaurant] has been received. Total: [currency] [amount]. We'll notify you when it's ready. 🍽️"

2. **Order accepted / preparing** — triggered when status → `accepted` or `preparing`
   - Template: "Good news! Kitchen started preparing your order #[number]. Estimated time: [minutes] minutes."

3. **Order ready — pickup** — triggered when status → `ready` for takeaway/dine-in orders
   - Template: "Your order #[number] is ready! Please come to the counter."

4. **Order ready — drive-thru** — triggered when status → `ready` for drive-thru orders
   - Template: "Your order is ready! Drive up to the window. Car: [carNumber]"

5. **Order out for delivery** — triggered when status → `out_for_delivery`
   - Template: "Your order is on the way! [Optional: Rider: [name], ETA [minutes] min]"

6. **Order completed** — triggered when status → `completed`
   - Template: "Enjoy your meal! How was your experience? [stars selector]"

7. **Review request** — sent 24 hours after completion
   - Template: "How was your meal yesterday at [restaurant]? [Google Review link]"

8. **Order cancelled** — triggered when status → `cancelled`
   - Template: "We're sorry — your order #[number] has been cancelled. Reason: [reason]"

**Owner/Manager-facing:**

1. **New order alert** — triggered on every new order
2. **High-value order** — triggered when order total exceeds a threshold (owner-configured)
3. **Daily summary** — sent at end of each day with count, revenue, top item
4. **Payment received** — for online payment orders

### Template Management

Every notification type requires a pre-approved message template on Meta's side:
- Our system automatically submits default templates in en, ur, es (and more for Business plan) when a tenant connects
- Each template takes 24-48 hours for Meta review
- Once approved, can be used for outbound messages
- If Meta rejects a template, show owner the rejection reason and let them customize and resubmit

### Free Window Intelligence

Before sending any outbound message, the system checks: is the customer's 24-hour free window currently open?

- **If open:** Send as free-form text message (free)
- **If closed:** Send as approved template (paid — utility category)

This saves significant cost. If a customer places an order via WhatsApp, every subsequent message for the next 24 hours is free.

### Customer Opt-In

- When customer first provides phone number (web checkout), opt-in defaults to true
- Checkbox "Send me order updates via WhatsApp" is pre-checked
- Customer can uncheck to opt out
- Customer can always opt out mid-stream by replying "STOP" to any message (regulatory requirement)
- Opt-out is recorded in `customers.whatsapp_opt_in = false`
- Opt-outs are scoped per tenant (opting out of one restaurant doesn't affect others)

### Rules

- Never send marketing messages in response to opt-ins that were only for order updates
- Never send a message if `whatsapp_opt_in = false`
- Never send more than one notification per status transition per order (idempotency)
- Log every outbound message to `whatsapp_messages` for audit and cost tracking
- If a send fails, retry up to 3 times with exponential backoff; after that, log and alert

### Data it touches

- `whatsapp_accounts` (to get credentials)
- `whatsapp_conversations` (to check free window)
- `whatsapp_templates` (to find approved templates)
- `whatsapp_messages` (to log every message)
- `customers` (to check opt-in)

---

## 20. WhatsApp Billing Models

### What it is

Two ways a restaurant can pay for WhatsApp messages. Chosen during connection, changeable later.

### Model 1 — Direct (Default, All Plans)

- Restaurant adds their own credit card to their Meta Business Manager
- Meta bills the restaurant directly, once per month, based on messages sent
- Our platform does not touch WhatsApp money flow
- We show usage and cost estimates in the dashboard for transparency, but we don't invoice for messages
- **Pros for restaurant:** Transparent, no markup, direct relationship with Meta
- **Pros for us:** Zero cashflow risk, zero legal complexity around reselling messaging

### Model 2 — Managed (Business Plan Only)

- We (the platform) have a billing relationship with Meta
- Restaurant tops up a wallet in our app (e.g., deposits $50)
- When they send a message, cost deducts from their wallet
- We charge 20% markup on top of Meta's rates
- Restaurant gets a simple monthly invoice from us instead of dealing with Meta
- **Pros for restaurant:** Simplicity, single bill, our support handles issues
- **Pros for us:** ~20% margin on message volume, upsell value for Business plan

### How to Switch

- Owner goes to `/dashboard/whatsapp/billing`
- Sees current model with usage and costs
- Can switch from Direct to Managed (requires Business plan)
- Cannot switch from Managed to Direct without a wallet balance of zero

### Cost Estimation

For each message sent, we calculate estimated cost based on:
- Message category (Service = free in window, Utility = ~$0.005, Marketing = ~$0.025)
- Recipient country (India is cheapest, Germany most expensive)
- Whether the 24-hour window is open

We show these estimates in:
- Dashboard widget "WhatsApp cost this month"
- Individual message logs
- Export reports for accounting

### Wallet Management (Managed Only)

- Owner sees wallet balance in dashboard
- Auto-topup can be configured (when balance drops below $10, charge card $50)
- Low balance alert at $5
- Zero balance blocks outbound messages (existing customer-initiated conversations continue, since those are free)

### Rules

- Direct-model tenants: we never charge them for WhatsApp — only for the base subscription plan
- Managed-model tenants: we invoice monthly based on wallet transactions
- Both models: WhatsApp account (WABA) itself belongs to the restaurant; if they leave our platform, their WABA and history go with them
- Currency: all wallet transactions in USD; we display equivalent in tenant currency as informational

### Data it touches

- `whatsapp_accounts.billing_model` — which model is active
- `whatsapp_accounts.wallet_balance` — managed only
- `whatsapp_messages.billed_to` — marks each message as `meta_direct` or `platform_wallet`
- Wallet transactions logged in a new `wallet_transactions` table

---

# KITCHEN & OPERATIONS

## 21. Live Order Dashboard

### What it is

The main operational screen for the restaurant. Shows all incoming and in-progress orders in real-time with one-click status updates.

### Who can use it

Owner, Manager, Kitchen, Waiter, Cashier — each with slightly different views and permissions.

### How it behaves

**Layout:**
- Top bar: branch selector (if multi-branch), search, filter
- Main area: grid of order cards, newest first
- Each card shows: order number, customer name/table/car, items summary, total, status badge, time elapsed, action buttons

**Real-time updates:**
- New orders appear instantly via Supabase Realtime — no refresh needed
- Cards flash briefly when they first appear
- Audible alert plays on new order (togglable, enabled by default)
- Status changes by other staff members are reflected immediately in all open dashboards

**Filters:**
- Status: Pending, Accepted, Preparing, Ready, Out for Delivery, Completed, Cancelled
- Order type: Dine-in, Takeaway, Delivery, Drive-thru
- Channel: Web, WhatsApp, Staff-entered
- Time: Today, Yesterday, Custom range
- Search: by order number, customer phone, customer name

**Card actions (role-dependent):**
- Kitchen/Manager: "Accept" (pending → accepted), "Start preparing" (accepted → preparing), "Mark ready" (preparing → ready)
- Waiter: "Mark delivered" (ready → completed) for dine-in
- Cashier: "Process payment" (any status → payment flow)
- Manager/Owner: "Cancel order" with reason prompt

**Detail view:**
- Click a card to open full order detail
- All item lines with modifiers and notes
- Customer info
- Payment status
- Timestamp log (when pending, when accepted, when ready, etc.)
- Status update buttons
- Refund button (owner/manager only, post-completion)
- Print receipt button (v2)

### Sorting

Default: newest first. Options:
- Newest first (default)
- Oldest first (helps prevent older orders from being forgotten)
- By pickup/delivery time (if scheduled orders enabled)

### Visual Urgency

- Cards age in color:
  - Under 5 min: normal
  - 5-10 min: subtle yellow tint
  - 10+ min: orange
  - 15+ min (for orders still `preparing`): red with alert icon

### Rules

- Staff can only see orders for their `branch_scope` (null = all)
- Cashiers only see today's orders (privacy for historical financial data)
- Kitchen only sees active orders (pending, accepted, preparing, ready) — not completed
- All status changes are logged to `audit_log` with the user ID
- Cancelled orders require a reason from a dropdown ("Customer cancelled", "Out of stock", "Restaurant closing", "Other")

### Data it touches

- `orders` (primary)
- Supabase Realtime subscription to `orders` table filtered by tenant
- `audit_log` on status changes

---

## 22. Order Status Pipeline

### What it is

The defined lifecycle of an order. Every order moves through this pipeline; transitions are validated.

### The States

```
pending → accepted → preparing → ready → [out_for_delivery] → completed
                                                                  ↓
                                                              cancelled (from any state)
```

### What Each State Means

- **Pending:** Just placed by customer. Awaiting kitchen acceptance.
- **Accepted:** Kitchen confirmed they've seen it. Committed to preparing.
- **Preparing:** Actively being cooked/assembled.
- **Ready:** Done. Awaiting customer pickup or delivery dispatch.
- **Out for delivery:** Dispatched to rider (delivery orders only).
- **Completed:** Customer has received the order. Done.
- **Cancelled:** Order terminated before completion. Requires a reason.

### Valid Transitions

| From | Valid next states |
|---|---|
| pending | accepted, cancelled |
| accepted | preparing, cancelled |
| preparing | ready, cancelled |
| ready | out_for_delivery (delivery only), completed, cancelled |
| out_for_delivery | completed, cancelled |
| completed | (terminal) |
| cancelled | (terminal) |

### Timestamps

Each state transition records a timestamp:
- `created_at` — when order placed (pending starts here)
- `accepted_at`
- `preparing_at`
- `ready_at`
- `out_for_delivery_at`
- `completed_at`
- `cancelled_at`

These are used for analytics: average time to accept, average prep time, total fulfillment time.

### Rules

- Invalid transitions rejected at API level (e.g., cannot go from completed back to pending)
- Cancellation allowed from any non-terminal state, with required reason
- Once completed or cancelled, order is "closed" — no further status changes
- Refunds are a separate concept, not a status — an order can be completed AND refunded
- Every transition fires a WhatsApp notification if enabled

### Configuration

- `notif.whatsapp_customer` — whether customer gets status updates
- Tenant can configure which specific transitions notify (some restaurants only want to notify on "ready")
- Owner can configure an "auto-accept" setting where pending → accepted happens automatically after 60 seconds (useful for small operations that don't need manual acceptance)

---

## 23. Kitchen Display System (KDS)

### What it is

A dedicated, simplified screen designed for a tablet or TV in the kitchen. Shows only what the kitchen needs. Optimized for fat-finger touch and peripheral vision.

### Why it exists

Kitchen staff shouldn't navigate the full dashboard. They need: see new orders, mark them as they go, done. Simpler tool = faster execution = fewer mistakes.

### Who can use it

Kitchen role users. Also accessible to Owner/Manager for supervision.

### How it behaves

**Layout (Kanban style):**
- 3 columns: New / Preparing / Ready
- Each column has a large header with count ("Preparing — 4")
- Cards flow left-to-right as status changes

**Order card (large, high contrast):**
- Order number in huge font (top-left)
- Channel icon (web globe, WhatsApp icon, or walk-in icon)
- Table/car/delivery badge
- Item list — grouped by station if configured (v2), otherwise flat list
- Each item line: quantity × name, modifiers in smaller text, notes highlighted in yellow
- Elapsed time (seconds since order placed / accepted)
- Big action button (color-coded): "Accept", "Start", "Ready", "Bump"

**Bump workflow:**
- Tap "Bump" when all items done
- Card animates out of "Preparing" into "Ready" column
- After 3 minutes in "Ready", card auto-fades to de-emphasize (customer picked it up or waiter delivered)

**Visual urgency (aging):**
- Green tint: under prep time estimate
- Yellow: at or slightly over prep time
- Orange: significantly over prep time
- Red + pulsing: very late (> 1.5× prep time), audible alert

**Audio:**
- Short "ding" on new order
- Longer alert on aging orders
- Togglable and volume-adjustable

### Filters (minimal)

- Branch selector (if multi-branch) — usually set once per shift
- Order type filter — useful for a delivery-focused shift vs dine-in

### Rules

- KDS only shows active orders (pending, accepted, preparing, ready) — never completed or cancelled
- Completed orders disappear from KDS after 30 seconds
- If internet connection lost, show a banner but keep displaying last-known state (read-only)
- Touch targets minimum 44×44 px (Apple HIG standard)
- High contrast text (kitchen environments are often bright or steamy)
- Dark mode optional (reduces glare)

### Item Availability

Kitchen can toggle item availability directly from KDS (if they run out of an ingredient). A button on the order card opens a quick toggle for that item. Applies to the menu in real-time.

### Multi-Station Support (v2)

In v2, items can be tagged with a "station" (grill, fryer, dessert, bar). Each station has its own KDS showing only its items. MVP uses a single unified view.

### Data it touches

- Reads: `orders` (filtered to active states), `items`
- Writes: order status changes, `items.is_available` on quick toggle
- Real-time: subscribes to `orders` changes

---

# DIFFERENTIATORS

## 24. AR / 3D Menu Viewer

### What it is

On item detail pages, customers can view a 3D model of the dish and optionally place it on their real table using their phone's camera (Augmented Reality).

### Why it exists

Almost no competitor does this. It's the single most memorable feature for customers and restaurants. Creates genuine delight and restaurant differentiation.

### Who can use it

- Feature gate: Pro and Business plans only
- Restaurants toggle via `menu.ar_viewer` and `menu.model_3d_viewer`
- Customers use it on the public menu

### How it behaves — Restaurant Side

**Upload a 3D model:**
- On item edit form, "3D Model" section
- Drag-and-drop zone accepts .glb files (industry-standard 3D format)
- Max file size 10 MB
- System validates the file is a valid .glb
- System auto-generates a .usdz file (Apple's AR format) via a background job
- Preview of the model shown in a small viewer after upload
- Owner can replace or remove the model

**Use a generic model from library:**
- "Choose from library" button opens a grid of ~200 pre-built generic food models (burger, pizza, pasta, salad, steak, sushi, etc.)
- Owner picks one, it's assigned to the item
- Library is shared across all Pro+ tenants, no storage cost to individual restaurants
- v2: "Order custom 3D scan" paid add-on for original models

### How it behaves — Customer Side

**On item detail page:**
- If item has a 3D model AND `menu.model_3d_viewer` is on, show "View in 3D" button
- Tapping opens an in-page viewer: 3D model loads, customer can rotate with finger, pinch to zoom
- Model rotates automatically by default (can be stopped)
- Clean, cinematic lighting

**AR button (if supported):**
- If customer's device supports AR (iOS with ARKit, Android with ARCore), show "View in AR" button
- Tapping launches native AR — phone camera opens
- The dish appears as a 3D object in the real environment
- Customer can walk around it, see it at actual size
- iOS: Uses Apple Quick Look with the USDZ file
- Android: Uses Google Scene Viewer with the GLB file
- No app install required — uses native OS features

### Fallback Strategy

- If device doesn't support AR → 3D viewer only, no AR button
- If device doesn't support WebGL → static high-res photo, no viewer at all
- If model file fails to load → fallback to first image, log error silently
- If bandwidth is low → start with lightweight placeholder, load full model on viewer open

### Technical Behavior

- Uses Google's open-source `model-viewer` library (battle-tested, used by Shopify, IKEA, etc.)
- Models hosted on Cloudflare R2 (cheap, fast CDN)
- Lazy-loaded: models don't download until customer clicks "View in 3D"
- Caching: models cached aggressively (rare changes)

### Rules

- Model file must be under 10 MB (enforced at upload)
- Recommended polygon count under 50,000 triangles (quality vs performance balance)
- Upload shows clear progress indicator (models can take 30+ seconds to upload on slow connections)
- If owner toggles AR feature off tenant-wide, models remain stored but button hidden from customers
- Per-item toggle: even with feature enabled, owner can hide AR button on specific items if the model isn't great

### Data it touches

- `items.model_3d_url` — uploaded .glb
- `items.model_usdz_url` — auto-generated .usdz
- Cloudflare R2 bucket for model files
- Background job queue for USDZ generation

---

## 25. Allergen & Dietary Filters

### What it is

Customer-side filters that dynamically hide menu items that don't match their dietary needs.

### Why it exists

1. Legal requirement in EU — restaurants must disclose allergens
2. Huge customer value — 30%+ of customers have some dietary restriction
3. Accessibility and inclusivity
4. Competitive advantage — most QR menu products ignore this

### Who can use it

- All plans include this feature
- All customers can use it (no login required)
- Owners tag items with allergens/dietary during menu setup

### How it behaves — Restaurant Side

**Tagging items:**
- On item edit form, two multi-select fields
- **Allergens** (things in the dish): gluten, crustaceans, eggs, fish, peanuts, soy, dairy, nuts, celery, mustard, sesame, sulfites, lupin, molluscs (EU-14 list)
- **Dietary tags** (positive attributes): vegetarian, vegan, halal, kosher, gluten-free, dairy-free, nut-free, low-carb
- Owner checks all that apply for each item

**Bulk tagging:**
- From item list, select multiple items → "Apply tags" → quick tag multiple items at once

### How it behaves — Customer Side

**Filter UI:**
- "Filter" button at top of menu (icon + count of active filters)
- Tapping opens a drawer/modal
- Two sections:
  - **Avoid these allergens** — toggles for each EU-14 allergen
  - **Show only** — toggles for dietary requirements (vegetarian, vegan, halal, etc.)
- "Apply" button updates the menu

**Filter logic:**
- **Avoid allergens:** Hide any item where `item.allergens` contains ANY selected allergen
- **Require dietary:** Show only items where `item.dietary` contains ALL selected tags
- Filters can combine (e.g., avoid nuts AND require vegan)

**Visual indicators:**
- Each item card shows small icons for key tags (V for vegan, leaf for veg, GF for gluten-free, etc.)
- Maximum 3 icons visible per card (rest in item detail)
- Tap item for full allergen breakdown

**Persistence:**
- Active filters stored in URL query params (`?avoid=nuts,dairy&require=vegan`)
- Persists across page navigation within session
- Shareable URL — a vegan customer can share their filtered menu view

### Legal Disclosure (EU Tenants)

If tenant country is in EU-27, a mandatory notice appears at the top of every menu:
> "Full allergen information is available on request. Items may contain traces of allergens not explicitly listed."

This is controlled automatically — no owner configuration needed.

### Rules

- Allergen data must match EU-14 standard list for regulatory compliance
- "May contain" traces should be flagged separately (future enhancement)
- Item detail page always shows full allergen list, regardless of icons
- If a customer has filters active, the count of hidden items is shown: "3 items hidden by your filters"
- Filters don't apply to category visibility — empty categories hidden silently

### Data it touches

- `items.allergens` (array)
- `items.dietary` (array)
- GIN index on both arrays for fast filtering

---

## 26. Guest Memory

### What it is

The system recognizes returning customers by phone number, remembers their preferences, and offers one-tap reorder.

### Why it exists

- Dramatically better customer experience ("Welcome back, Ahmed!")
- Increases repeat order rate and AOV
- No app install, no login — phone number is the identity
- Works across both web and WhatsApp channels

### Who can use it

- Feature gate: Starter, Pro, Business plans
- All roles in tenant can view customer data
- Customers experience it automatically

### Data Stored Per Customer

A `customers` record per tenant per phone number:
- Phone (E.164 format, unique per tenant)
- Name (last provided)
- Email (optional)
- Total orders count
- Total spent (lifetime)
- Last order timestamp
- Preferences (JSONB): favorite items (computed), known allergens, language, notes
- Saved addresses (JSONB array): labeled addresses the customer has used

### How it behaves — Customer Side

**At checkout (web):**
- Customer enters phone number
- System looks up the `customers` record
- If found:
  - Name auto-fills (if stored)
  - Greeting: "Welcome back, Ahmed! 👋"
  - Past order count: "This is your 8th order"
  - "Your usual?" one-tap button — pre-fills cart with their most-ordered items
  - Saved addresses appear as quick-select chips
- If not found: normal checkout flow

**Via WhatsApp:**
- When customer messages the bot, system checks phone → `customers` lookup
- If returning: bot greets by name, offers "Order your usual?" as first option
- If new: standard greeting

### "Your Usual" Logic

- Look at customer's last 20 orders
- Find items ordered in 50%+ of those orders
- If any exist, show as "Your usual"
- Click → adds those items to cart with saved quantities
- Customer can adjust before checkout

### How it behaves — Restaurant Side

**Customers page (dashboard):**
- List of all customers sorted by total spent
- Search by name, phone, email
- Click customer → full profile: order history, average order value, preferences, notes
- Owner can add internal notes ("VIP — owner's friend", "Allergic to peanuts", etc.)

**Customer insights:**
- Segmentation: New, Regular, VIP, Lapsed
- Automatic tagging based on behavior:
  - New: 1 order
  - Regular: 3+ orders, last one in past 30 days
  - VIP: top 10% by spend
  - Lapsed: no order in 90+ days

### Privacy

- Customer data is strictly scoped per tenant — Restaurant A never sees Restaurant B's customers, even if it's the same person
- Customer can request data export (name, orders, etc.) via opt-out flow
- Customer can request data deletion (right to be forgotten, GDPR) — submitted via form, actioned within 30 days
- No cross-tenant identity resolution (by design — it's more valuable to each restaurant than it is harmful to privacy)

### Rules

- Guest memory ONLY activates if customer provides phone number
- Customers who order anonymously (no phone) are tracked via visitor cookie for session analytics only, not persistent memory
- Name is updated on each order (if different, overwrite — customers sometimes go by different names)
- Totals updated atomically when order reaches `completed` status (not `pending`)
- Cancelled orders don't count toward totals
- Refunded orders decrement totals

### Data it touches

- `customers` (primary)
- `orders` (source data for totals, usual order)

---

## 27. AI Menu Translator

### What it is

Owner writes menu once in their native language; one-click AI translation produces polished versions in 20+ languages.

### Why it exists

- Writing a menu in 5 languages manually takes days
- Professional translators are expensive ($0.10/word easily)
- Most restaurants skip translation and lose customers
- AI does 90% of the work for ~$0.001 per translation

### Who can use it

- Feature gate: Pro and Business plans
- Owner and Manager can translate

### How it behaves

**Per-item translation:**
- On item edit form, "Translations" section
- Shows a language tab row (the source language + all translations done so far)
- "Add language" dropdown lists all supported languages
- Select a language → "Translate with AI" button → GPT translates name and description in ~3 seconds
- Result shown in an editable textarea
- Owner reviews, edits if needed, saves
- Translation stored in `items.translations` JSONB

**Bulk translation:**
- From item list, select items → "Translate" → pick target language(s)
- System queues all items for translation (parallel API calls, capped at 10 concurrent)
- Progress bar shows N of M complete
- Owner reviews the translated batch in a review grid before committing

**Also translates:**
- Item name and description (primary)
- Category names
- Menu names
- Tenant description on landing page
- Custom modifier group names and options

### Supported Languages

English, Urdu, Spanish, Arabic, French, German, Italian, Portuguese, Chinese (Simplified), Japanese, Korean, Hindi, Turkish, Russian, Bengali, Punjabi, Dutch, Polish, Swedish, Greek. More can be added.

### How Customer Experiences It

- Public menu auto-detects browser language on first visit
- Falls back to tenant's `default_language` if no match
- Customer can manually switch via language picker in menu header
- Choice persisted in URL param + cookie
- If translation missing for a specific item, show default-language version with subtle note "(not translated)"

### RTL Handling

Urdu, Arabic, and other RTL languages:
- Menu layout mirrors (right-to-left)
- Icons flip where directional (arrows, etc.)
- Numbers stay LTR (prices, quantities)
- Tailwind logical properties used (`text-start` instead of `text-left`)

### AI Prompt Engineering

The translation prompt is designed to:
- Preserve dish names that are culturally specific (Biryani stays Biryani, not "Spiced Rice")
- Preserve brand names and proper nouns unchanged
- Adapt descriptive language naturally (not literal word-for-word translation)
- Keep formality level consistent with source

### Rules

- Each translation costs ~$0.001 (GPT-4o-mini)
- Rate limit: 100 translations per tenant per day to prevent abuse
- Translations are cached — re-translating a translated item is blocked unless owner clicks "Retranslate"
- Owner can always manually override a translation — manual edits never overwritten by AI
- Plan limit: Pro = 500 translations/month; Business = unlimited

### Data it touches

- `items.translations` (JSONB map: `{ es: {name, description}, ur: {name, description} }`)
- `categories.translations` (same structure)
- `menus.translations`
- `tenants.description_translations`

---

## 28. In-Session Customer Actions

### What it is

Buttons on the public menu that let customers signal things to the restaurant mid-visit — without leaving their phone.

### Why it exists

Small but high-value touches that customers notice. Also reduces staff workload (no one has to flag down a waiter).

### The Actions (All Toggleable)

**Call Waiter (`customer.call_waiter`)**
- Floating button on menu (discrete icon)
- Customer taps → prompt "Waiter will come to your table shortly"
- Creates a notification in the dashboard: "Table 5 is requesting attention"
- Audio alert in dashboard, especially KDS
- Useful for: dine-in restaurants without always-visible staff

**Request Bill (`customer.request_bill`)**
- Button on cart/order page for dine-in orders
- Customer taps → notifies staff the table wants to pay
- Triggers "Ready to pay" notification in dashboard
- Moves table visually to yellow in floor plan view
- Useful for: busy restaurants where getting bill takes forever

**Reorder (`customer.reorder`)**
- Button on order tracking page AND on recognition at next visit
- "Reorder this" → pre-fills cart with same items from current order (same session) OR most recent past order (next visit)
- Customer can adjust before submitting
- Useful for: repeat customers

**Feedback / Review (`customer.review_prompt`)**
- After order marked completed, customer gets WhatsApp asking for rating
- If rating is 4-5 stars, offer Google Review deep link (owner-configured place ID)
- If rating is 1-3 stars, capture private feedback (don't push to Google)
- Store in a reviews table for dashboard display

**Split Bill (v2, `customer.split_bill`)**
- Multiple people at same table order from their own phones
- System links them by table number
- At bill time, each person pays their own portion
- Deferred to v2 — moderately complex

### How Staff Sees Signals

A "Notifications" icon in the dashboard header shows a count of pending customer signals. Clicking reveals:
- Table 5 — Call waiter (2 min ago)
- Table 8 — Request bill (5 min ago)
- Table 2 — Call waiter (just now)

Staff taps a signal to dismiss after responding.

### Rules

- Rate limit per customer: max 3 waiter calls per session (prevents spam)
- Signals auto-dismiss after 15 minutes (assumed addressed)
- Signals logged for analytics — "average response time to call waiter"
- Each action has its own toggle — restaurants can enable some and not others

### Data it touches

- New `customer_signals` table (id, tenant_id, branch_id, table_id, type, created_at, resolved_at, resolved_by)

---

# PAYMENTS & BILLING

## 29. Customer Payment Methods

### What it is

The payment options a customer sees at checkout. Dynamically built based on what the restaurant has enabled.

### Available Methods

**Globally supported:**
- **Cash** — pay at counter / cash on delivery. Order marked `pending` payment; restaurant confirms receipt.
- **Card at venue** — pay with physical card at restaurant. Same flow as cash — order marked pending, confirmed on collection.
- **Card online (Stripe)** — Stripe Payment Element embedded in checkout. Customer enters card, payment authorized, order placed.
- **Bank transfer** — restaurant displays bank details, customer transfers, enters reference. Manual verification by owner.

**Pakistan-specific:**
- **JazzCash** — redirect to JazzCash gateway, customer completes on their end
- **Easypaisa** — similar redirect flow

**Spain-specific:**
- **Bizum** — direct bank-to-bank transfer via phone number (common in Spain)

### How It Works

**At checkout:**
- System loads list of enabled payment methods for this tenant
- Renders each as a radio option
- Customer selects one
- Depending on choice:
  - **Cash / card at venue:** Proceed to confirm, order placed immediately in `pending_payment` status. Paid in person.
  - **Online card:** Stripe Payment Element loads. Customer enters card. Stripe authorizes the charge. On success, order placed with `paid` status.
  - **JazzCash / Easypaisa:** Redirect to external gateway. Customer authenticates and pays. Gateway webhook confirms payment. Order placed with `paid` status.
  - **Bank transfer:** Order placed in `pending_payment`. Customer shown bank details and reference. Owner manually marks as paid when transfer received.

### Refunds

- For Stripe-paid orders, owner can refund from order detail page (partial or full)
- Refund goes through Stripe API, funds returned to customer's card
- Order status updated to reflect refund
- For cash/card-at-venue orders, refund is a real-world action; system just records it
- Every refund logged in `audit_log`

### Payment Method Configuration

Owner can enable/disable each method via settings:
- `payment.cash`, `payment.card_venue`, `payment.card_online`, `payment.jazzcash`, `payment.easypaisa`, `payment.bank_transfer`, `payment.cod`
- `payment.required_before_order` — if true, customer must pay before order enters pipeline (no pending-payment orders)
- `payment.tips` — show 10/15/20% tip buttons + custom amount
- `payment.tax_rate`, `payment.tax_inclusive`
- `payment.service_charge` (percentage)
- `payment.minimum_order_amount` (for delivery)

### Card Data Security

- **We never store credit card numbers.** Ever.
- All card data is handled by Stripe Elements (iframe, PCI-compliant)
- We only store tokenized references (Stripe customer ID, payment intent ID)
- Stripe handles PCI compliance

### Rules

- At least one payment method must be enabled for a tenant to accept orders
- Online methods require Stripe account setup (prompted if not done)
- JazzCash/Easypaisa require credentials setup by tenant (API keys)
- Bank transfer requires tenant to provide bank details (IBAN, account name, etc.)
- Currency auto-selected from `tenants.currency`
- Tax calculation is server-side, never trusted from client

### Data it touches

- `orders.payment_method`, `orders.payment_status`, `orders.stripe_payment_intent_id`
- Tenant settings for enabled methods
- Stripe API for online payments

---

## 30. Subscription Billing (Stripe)

### What it is

The system that charges tenants for their subscription plans. Powered by Stripe.

### Who uses it

- Owner only (permission: `billing.manage`)
- Read access for Manager and Read-only roles (can view invoices)

### How it behaves

**Upgrade flow:**
1. Owner goes to `/dashboard/billing`
2. Sees current plan, usage stats, next bill date, payment method
3. Clicks "Upgrade to Pro" (or Business)
4. Stripe Checkout Session opens (hosted by Stripe)
5. Owner enters payment method (or uses saved one)
6. On success, Stripe webhook fires, tenant plan updated immediately
7. Owner redirected to billing page with confirmation

**Downgrade flow:**
1. Owner clicks "Change plan" → picks lower tier
2. Confirmation modal explains "Takes effect at end of current billing period"
3. On confirm, Stripe updates subscription to change at period end
4. Tenant continues on current plan until period ends, then downgrades

**Cancellation:**
1. Owner clicks "Cancel subscription"
2. Warning modal: "You'll lose access to [features]. Effective [end of period]."
3. On confirm, subscription marked to cancel at period end
4. After period ends, tenant drops to Free plan
5. Data retained for 30 days, then hard-deleted

**Payment method management:**
- "Manage payment methods" opens Stripe Customer Portal (hosted by Stripe)
- Customer Portal lets owner update card, download invoices, see payment history
- No custom UI needed — Stripe handles all of it

### Invoices

- Every successful charge creates an invoice in Stripe
- Invoice webhook fires → our system stores a copy in `invoices` table for fast access
- Dashboard lists invoices with download link (PDF from Stripe)
- Failed charges also stored with status, for followup

### Trial Handling

- New tenants get 14-day Pro trial, no card required
- Dashboard banner shows days remaining
- Email reminders at 7, 3, 1 days before expiry
- On trial end:
  - If no card added: auto-downgrade to Free plan
  - If card added during trial: first charge happens automatically on day 14

### Failed Payment Flow

- Stripe attempts 3 retries over 7 days
- If all fail, subscription enters `past_due` status
- Dashboard shows warning banner "Update payment method to avoid service interruption"
- If still unpaid after 14 days, tenant marked as `suspended` — menu returns 503, orders disabled
- Owner can reactivate by paying outstanding invoice

### Billing Events to Track

- Subscription created
- Subscription updated (plan change)
- Subscription cancelled
- Invoice paid
- Invoice payment failed
- Trial ending soon
- Customer deleted

### Rules

- All billing logic handled by Stripe — we don't build our own billing engine
- Webhook signature verification mandatory (prevents spoofed events)
- Idempotency: duplicate webhook events should not double-charge or double-update
- Grace period for failed payments (7+14 days) before suspension
- Pro-rated upgrades (immediate), prepaid downgrades (end of period)

### Data it touches

- `tenants.plan`, `tenants.plan_status`, `tenants.stripe_customer_id`, `tenants.stripe_subscription_id`
- `invoices` (local copy for speed)
- Stripe API

---

## 31. Plan Limits Enforcement

### What it is

Hard limits on what each plan can do, enforced at both UI and API levels.

### Why it exists

Without hard limits, nothing stops a Free plan tenant from using all features unlimited. Limits protect revenue and drive upgrades.

### Limits Per Plan

| Limit | Free | Starter | Pro | Business |
|---|---|---|---|---|
| Max menu items | 30 | 150 | Unlimited | Unlimited |
| Max orders per month | 50 | 500 | Unlimited | Unlimited |
| Max staff accounts | 1 | 3 | 10 | Unlimited |
| Max branches | 1 | 1 | 3 | Unlimited |
| Max WhatsApp messages per month | 100 | 500 | 2,000 | Unlimited |
| Max AI translations per month | 0 | 0 | 500 | Unlimited |
| Max file storage (images, models) | 100 MB | 1 GB | 10 GB | 100 GB |

### How Limits Are Checked

**At the API layer (authoritative):**
- Before every action that consumes a quota, a "pre-check" runs
- Fetches current usage from the database
- Compares to plan limit
- If exceeded, returns a clear error: "You've hit your plan limit of X. Upgrade to continue."
- Errors surface in the UI as actionable prompts with an "Upgrade" button

**At the UI layer (UX):**
- Dashboard shows usage counters: "27 / 30 items used"
- When approaching limit (80%+), warning banner appears
- "Add item" button becomes disabled at limit, with tooltip explaining

### Usage Tracking

Counted dynamically (not incremented):
- Menu items: count of non-deleted rows
- Orders this month: count of orders where `created_at >= start of current month`
- Staff: count of active memberships
- Branches: count of non-deleted branches
- WhatsApp messages: count of outbound messages this month
- AI translations: count from a separate tracking table

For items and branches (cheap to count), query on each check. For orders and messages (could be expensive), cache in a counter table updated by triggers.

### Soft Warnings

- At 80% of limit: dashboard banner, no blocking
- At 95% of limit: email to owner
- At 100%: block new actions, prominent upgrade CTA

### Upgrade Experience

When blocked, the upgrade CTA shows:
- The specific limit hit
- The plan tiers that would unlock the action
- One-click upgrade (opens Stripe Checkout)

After upgrade, the blocked action can be retried immediately (no delay).

### Rules

- Limits are checked server-side on every relevant mutation (never trust client)
- Downgrading to a plan with lower limits: existing data is NOT deleted, but additional creation is blocked
  - Example: Pro tenant with 200 items downgrades to Starter (150 limit). Their 200 items stay. They can't create new ones until under 150 (by deleting some or upgrading back).
- Orders over monthly limit: restaurant can still fulfill existing orders, but new customer submissions return an error after threshold
- Feature-specific limits (like AI translations) reset on the 1st of each month at 00:00 tenant timezone

### Data it touches

- `subscription_plans.limits` (source of truth)
- Various tables for usage counts
- Possibly a `usage_counters` cache table for fast checks

---

# ANALYTICS

## 32. Analytics Dashboard

### What it is

Charts, tables, and insights about orders, revenue, and customer behavior. The data tells the restaurant what's working.

### Who can use it

- Owner, Manager, Read-only: full access
- Cashier: today's summary only
- Kitchen, Waiter: no access

### Sections

**Overview (landing page)**
- Today so far: order count, revenue, AOV
- Comparison to yesterday, last week same day
- Live counter of orders today
- Key alert: "You're 20% ahead of last week"

**Revenue**
- Revenue over time (line chart, daily/weekly/monthly view)
- Revenue by payment method (pie)
- Revenue by order type (dine-in vs delivery vs takeaway)
- Revenue by channel (web vs WhatsApp)
- Top revenue day of week
- Year-over-year comparison (for tenants with history)

**Orders**
- Order count over time
- Order status breakdown (how many completed vs cancelled)
- Average prep time trend
- Peak hours heatmap (7 days × 24 hours grid, color intensity = order count)
- Orders per channel

**Menu Performance**
- Top 10 items by order count (bar chart)
- Top 10 items by revenue
- Slowest-moving items (candidates for promotion or removal)
- Category performance (which categories drive most sales)
- Modifier popularity (which add-ons are ordered most)

**Customers**
- New vs returning ratio
- Customer lifetime value distribution
- Top customers by total spend
- Retention cohorts (% of customers who ordered in subsequent months)
- Customer satisfaction (from review scores)

**QR & Traffic**
- Total QR scans
- Scans → orders conversion rate
- Campaign QR performance (which campaign drove most orders)
- Unique visitors over time
- Traffic by device type

**WhatsApp**
- Messages sent this month (inbound vs outbound)
- Cost estimate (or actual, for managed billing)
- Free vs paid breakdown
- Template usage (which templates sent most)
- Response time (how quickly customers reply to our messages)
- Top customers by message volume

### Date Range Controls

Every chart has a date range selector:
- Today / Yesterday
- This week / Last week
- This month / Last month
- Last 7 / 30 / 90 days
- Year to date
- Custom range

Timezone-aware — always uses tenant's configured timezone.

### Export

Every section has an "Export" button:
- PDF report (formatted for printing/emailing)
- CSV raw data (for further analysis in Excel/Sheets)
- Email report (scheduled weekly/monthly to owner)

### Performance Optimization

Some analytics queries are expensive on large datasets. Strategy:
- Materialized views refreshed daily (daily summaries pre-computed)
- Queries for "today" go directly against `orders` (small dataset)
- Queries for longer ranges use materialized views (fast)
- Refresh job runs at 2 AM in tenant timezone

### Multi-Branch Handling

If tenant has multiple branches:
- Default: show all branches combined
- Branch selector at top of analytics page filters everything
- Compare branches side-by-side view (Pro+)

### Rules

- Analytics only use `completed` orders for revenue (not pending, preparing, or cancelled)
- Cancelled order count is tracked separately
- Data refresh: live for "today", 24-hour lag for historical aggregates
- Export reports include tenant branding (logo in header)
- Export scheduled reports respect tenant's preferred email address

### Data it touches

- Primary: `orders`, `page_views`, `customers`, `whatsapp_messages`
- Materialized views: `analytics_daily_summary`, `analytics_item_performance`, `analytics_customer_cohorts`

---

# APPENDIX: FEATURE CHECKLIST SUMMARY

Quick reference of every feature and its plan availability:

| # | Feature | Free | Starter | Pro | Business |
|---|---|:-:|:-:|:-:|:-:|
| 5 | Onboarding wizard | ✓ | ✓ | ✓ | ✓ |
| 6 | Settings & toggles | ✓ | ✓ | ✓ | ✓ |
| 7 | Multi-branch | 1 | 1 | 3 | ∞ |
| 8 | Staff management | 1 user | 3 | 10 | ∞ |
| 9 | Menu management | 30 items | 150 | ∞ | ∞ |
| 10 | Modifiers | ✓ | ✓ | ✓ | ✓ |
| 11 | QR codes (master) | ✓ | ✓ | ✓ | ✓ |
| 11 | QR codes (per-table) | ✗ | ✓ | ✓ | ✓ |
| 11 | QR codes (campaigns) | ✗ | ✗ | ✓ | ✓ |
| 12 | Table management | ✗ | ✓ | ✓ | ✓ |
| 13 | Public customer menu | ✓ | ✓ | ✓ | ✓ |
| 14-16 | Web ordering | ✓ | ✓ | ✓ | ✓ |
| 17 | WhatsApp connection | ✓ | ✓ | ✓ | ✓ |
| 18 | WhatsApp ordering bot | ✓ | ✓ | ✓ | ✓ |
| 19 | WhatsApp notifications | 100/mo | 500/mo | 2k/mo | ∞ |
| 20 | WhatsApp managed billing | ✗ | ✗ | ✗ | ✓ |
| 21 | Live order dashboard | ✓ | ✓ | ✓ | ✓ |
| 22 | Order status pipeline | ✓ | ✓ | ✓ | ✓ |
| 23 | Kitchen Display System | ✗ | ✓ | ✓ | ✓ |
| 24 | AR / 3D viewer | ✗ | ✗ | ✓ | ✓ |
| 25 | Allergen filters | ✓ | ✓ | ✓ | ✓ |
| 26 | Guest memory | ✗ | ✓ | ✓ | ✓ |
| 27 | AI menu translator | ✗ | ✗ | 500/mo | ∞ |
| 28 | Call waiter / request bill | ✓ | ✓ | ✓ | ✓ |
| 29 | Customer payment methods | ✓ | ✓ | ✓ | ✓ |
| 30 | Subscription billing | ✓ | ✓ | ✓ | ✓ |
| 31 | Plan limits enforcement | ✓ | ✓ | ✓ | ✓ |
| 32 | Analytics dashboard | basic | standard | advanced | advanced + export |

---

# CLOSING NOTES FOR CLAUDE CODE

1. **Read Section 1 (Configuration Philosophy) before any feature work.** It's the foundation of every other decision.

2. **Every feature must respect tenant isolation.** If you write a database query without filtering by `tenant_id`, it's a bug. No exceptions.

3. **Every feature must check the three-layer config before rendering or executing.** Don't hardcode. Check `plan allows AND tenant enabled AND branch not overriding`.

4. **Every feature that can be toggled needs an entry in the feature registry.** Settings page auto-generates from this registry.

5. **Build in the order of the feature numbers above.** Onboarding before menu. Menu before cart. Cart before WhatsApp. Don't skip ahead.

6. **If something in this document is unclear or contradicts itself, document the ambiguity and make a decision.** Don't block — keep moving. The goal is a working product, not perfect spec adherence.

7. **Every mutation writes to `audit_log`.** No exceptions for sensitive actions (status changes, setting changes, role changes, deletions).

8. **Plan limits are checked server-side.** Client-side checks are for UX only, not security.

9. **The client's top priorities in order:** Tenant isolation → Configuration flexibility → WhatsApp integration → AR viewer → Everything else. If you're deciding between two paths, the one that better serves these priorities wins.

10. **When in doubt, default to the more restrictive option.** Less visible is better than accidentally visible. Feature off is safer than feature on.

---

**End of document.**
