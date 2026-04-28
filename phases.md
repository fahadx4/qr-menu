Phase Status & What We'll Build                                                                                                                              
                                                                                                                                                               
  Phase 0 — Project Setup ✅ DONE                                                                                                                            
                                                                                                                                                               
  Foundation is complete: Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui (Base UI variant), mock data layer, route groups, global theme, feature-flag       
  context, Zustand cart store.                                                                                                                                 
                                                                                                                                                               
  ---                                                                                                                                                        
  Phase 1 — Auth Pages ✅ DONE

  Three pages, all working:
  - /login — email/password form, Google OAuth placeholder, "remember me", demo credentials hint
  - /signup — restaurant name + country + password with strength meter, 14-day trial CTA                                                                       
  - /forgot-password — email form → animated success state with "try again" fallback    
                                                                                                                                                               
  ---                                                                                                                                                          
  Phase 2 — Onboarding Wizard (NEXT UP)                                                                                                                        
                                                                                                                                                               
  5-step wizard that runs after signup before the dashboard:                                                                                                 
  - Step 1: Restaurant type (Quick Service, Dine-in, Cafe, etc.) — radio grid                                                                                  
  - Step 2: How customers order (QR dine-in, takeaway, delivery, etc.) — smart pre-selects based on Step 1                                                     
  - Step 3: Fulfillment methods — same smart-default logic                                                                                                     
  - Step 4: Payment methods grouped by region (Pakistan / Spain-EU / Global)                                                                                   
  - Step 5: Primary customer communication (WhatsApp, SMS, Email, None)                                                                                        
  - Progress bar, Back/Skip/Next, localStorage persistence, success screen → /dashboard/menu                                                                   
                                                                                                                                                               
  ---                                                                                                                                                          
  Phase 3 — Dashboard Layout & Navigation                                                                                                                      
                                                                                                                                                               
  The shell every admin page lives inside:                                                                                                                   
  - Sidebar with role-aware links (Owner sees all, Kitchen sees KDS only, etc.)                                                                                
  - Header: branch selector dropdown, notifications bell, user avatar menu                                                                                     
  - Trial banner ("X days left on Pro trial")                                                                                                                  
  - Mobile drawer sidebar                                                                                                                                      
  - Dev role-switcher ("Viewing as: Kitchen")                                                                                                                  
                                                                                                                                                               
  ---                                                                                                                                                          
  Phase 4 — Tenant Settings & Feature Toggles                                                                                                                
                                                                                                                                                               
  The big settings page with 9 tab sections:                                                                                                                 
  - Per-toggle: label, description, lock icon for plan-restricted features, upgrade CTA                                                                        
  - Ordering, Customer Info, Payment (placeholders), Menu Display, Customer Experience, Notifications, Branding, Operating Hours, Tax & Currency               
  - Upgrade modal (plan comparison table)                                                                                                                      
                                                                                                                                                               
  ---                                                                                                                                                          
  Phase 5–6 — Branch & Staff Management                                                                                                                        
                                                                                                                                                               
  - Branch list, add/edit form, default branch, map placeholder                                                                                              
  - Staff table, invite modal, role change, pending invites, plan limit UI                                                                                     
                                                                                                                                                               
  ---                                                                                                                                                          
  Phase 7–8 — Menu Management                                                                                                                                  
                                                                                                                                                             
  The most complex admin section:
  - Menus → Categories (drag-to-reorder) → Items                                                                                                               
  - Full item edit form: images, 3D model upload slot, availability pickers, tags, allergens, dietary flags, stock, translations                               
  - Modifier groups with drag-to-reorder options                                                                                                               
  - Bulk actions toolbar, plan usage bar                                                                                                                       
                                                                                                                                                               
  ---                                                                                                                                                          
  Phase 9–10 — QR Code System & Table Management                                                                                                               
                                                                                                                                                               
  - QR page: Master / Tables / Campaign tabs with qrcode.react
  - Table grid + floor plan view (Pro+), status colors, print QR                                                                                               
                                                                                                                                                               
  ---                                                                                                                                                          
  Phase 11–13 — Public Customer Menu                                                                                                                           
                                                                                                                                                               
  The customer-facing side:
  - /r/[slug] landing page (cover image, open/closed status, language switcher)                                                                                
  - /r/[slug]/menu — category tabs, item grid, sticky cart bar, dietary filter drawer                                                                          
  - /r/[slug]/item/[id] — image carousel, modifier selection, price delta, "Add to Cart"
  - AR/3D viewer modal (@google/model-viewer)                                                                                                                  
  - Cart with Zustand: same modifiers = qty increment, different = new line                                                                                    
                                                                                                                                                               
  ---                                                                                                                                                          
  Phase 14–15 — Checkout & Order Tracking                                                                                                                      
                                                                                                                                                               
  - Multi-step checkout: order type → customer info (dynamic fields) → payment (all mock) → review & submit                                                  
  - Guest memory: phone lookup → "Welcome back" + saved addresses + "Order your usual?"                                                                        
  - Order tracking page with auto-advancing status stepper (timer-driven mock)                                                                                 
                                                                                                                                                               
  ---                                                                                                                                                          
  Phase 16–18 — Staff Views (Orders + KDS)                                                                                                                     
                                                                                                                                                               
  - Live order dashboard: card grid, aging colors, filter bar, detail drawer, cancel modal
  - KDS full-screen Kanban: 3 columns, large touch targets, bump animation, dark mode                                                                          
                                                                                                                                                               
  ---                                                                                                                                                          
  Phase 19–22 — Filters, Guest Memory & In-Session Actions                                                                                                     
                                                                                                                                                               
  - Allergen/dietary filter drawer with URL state persistence
  - Customer dashboard (order history, AOV, segment badges)                                                                                                    
  - "Call Waiter" / "Request Bill" buttons, review/feedback flow                                                                                             
                                                                                                                                                               
  ---                                                                                                                                                        
  Phase 23–24 — WhatsApp UI & Analytics                                                                                                                        
                                                                                                                                                               
  - WhatsApp setup flow: prerequisites → connect → template status
  - Analytics dashboard: date picker, KPI cards, 7 chart sections (Recharts), export button                                                                    
                                                                                                                                                               
  ---                                                                                                                                                          
  Phase 25 — Billing & Plan Limits                                                                                                                             
                                                                                                                                                               
  - Billing page: plan card, comparison table, mock Stripe placeholder, invoice list
  - Usage bars throughout dashboard, 80% warning banner, upgrade modal                 