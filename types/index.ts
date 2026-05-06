/* ─────────────────────────────────────────────
   Core domain types
   ───────────────────────────────────────────── */

export type Plan = "free" | "starter" | "pro" | "business";
export type ItemType = "standard" | "weighted" | "combo" | "variable";
export type WeightUnit = "g" | "100g" | "kg" | "oz" | "lb" | "ml" | "L" | "portion";

export interface ComboComponent {
  id: string;
  label: string;
  item_id?: string;
  category_id?: string;
  quantity: number;
  is_required: boolean;
}

export interface ItemVariant {
  id: string;
  name: string;
  price: number;
  cost?: number;
  sku?: string;
  is_available: boolean;
  weight_value?: number;
}

export type TaxCategory = "standard" | "reduced" | "zero" | "alcohol" | "tobacco" | "exempt";
export type KitchenStation = "grill" | "fryer" | "cold" | "bar" | "pizza" | "bakery" | "expo" | "default";
export type PlanStatus = "active" | "trial" | "past_due" | "suspended" | "cancelled";
export type UserRole = "owner" | "manager" | "kitchen" | "waiter" | "cashier" | "read_only";
export type OrderStatus = "pending" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";
export type OrderType = "dine_in" | "takeaway" | "delivery" | "drive_thru";
export type PaymentMethod = "cash" | "card_venue" | "card_online" | "bank_transfer" | "jazzcash" | "easypaisa" | "bizum";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";
export type Channel = "web" | "whatsapp" | "staff";
export type RestaurantType = "quick_service" | "dine_in" | "cafe" | "drive_thru" | "cloud_kitchen" | "food_truck" | "chain";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
  plan: Plan;
  plan_status: PlanStatus;
  trial_ends_at?: string;
  restaurant_type: RestaurantType;
  currency: string;
  country: string;
  default_language: string;
  timezone: string;
  onboarding_completed_at?: string;
  created_at: string;
}

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  name_ar?: string;
  address: string;
  address_ar?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface TenantSettings {
  tenant_id: string;
  // Ordering
  ordering_dine_in: boolean;
  ordering_takeaway: boolean;
  ordering_delivery: boolean;
  ordering_drive_thru: boolean;
  // Customer info
  customer_require_name: boolean;
  customer_require_phone: boolean;
  customer_require_email: boolean;
  customer_require_table: boolean;
  customer_require_car: boolean;
  customer_require_address: boolean;
  customer_require_guest_count: boolean;
  customer_allow_notes: boolean;
  // Payment
  payment_cash: boolean;
  payment_card_venue: boolean;
  payment_card_online: boolean;
  payment_bank_transfer: boolean;
  payment_jazzcash: boolean;
  payment_easypaisa: boolean;
  payment_bizum: boolean;
  payment_tips: boolean;
  payment_tax_rate: number;
  payment_tax_inclusive: boolean;
  payment_service_charge: number;
  payment_minimum_order: number;
  // Menu display
  menu_show_prices: boolean;
  menu_show_calories: boolean;
  menu_show_prep_time: boolean;
  menu_show_allergens: boolean;
  menu_ar_viewer: boolean;
  menu_3d_viewer: boolean;
  menu_popular_badges: boolean;
  menu_new_badges: boolean;
  // Customer experience
  customer_call_waiter: boolean;
  customer_request_bill: boolean;
  customer_reorder: boolean;
  customer_review_prompt: boolean;
  // Notifications
  notif_whatsapp_customer: boolean;
  notif_whatsapp_owner: boolean;
  notif_sound: boolean;
  // Branding
  brand_primary_color?: string;
  brand_font?: string;
}

export interface Menu {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  available_from?: string;
  available_to?: string;
  available_days?: number[];
  branch_ids?: string[];
  sort_order: number;
  translations?: Record<string, { name: string; description?: string }>;
}

export interface Category {
  id: string;
  menu_id: string;
  tenant_id: string;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  translations?: Record<string, { name: string; description?: string }>;
}

export type Allergen =
  | "gluten" | "crustaceans" | "eggs" | "fish" | "peanuts"
  | "soy" | "dairy" | "nuts" | "celery" | "mustard"
  | "sesame" | "sulfites" | "lupin" | "molluscs";

export type DietaryTag =
  | "vegetarian" | "vegan" | "halal" | "kosher"
  | "gluten_free" | "dairy_free" | "nut_free" | "low_carb";

export type ItemTag =
  | "spicy" | "new" | "popular" | "vegan" | "halal"
  | "bestseller" | "chefs_pick";

export interface Item {
  id: string;
  category_id: string;
  tenant_id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  prep_time?: number;
  calories?: number;
  image_urls: string[];
  model_3d_url?: string;
  model_usdz_url?: string;
  is_available: boolean;
  stock_quantity?: number;
  stock_tracked: boolean;
  available_from?: string;
  available_to?: string;
  available_days?: number[];
  tags: ItemTag[];
  allergens: Allergen[];
  dietary: DietaryTag[];
  sort_order: number;
  translations?: Record<string, { name: string; description?: string }>;
  // Enterprise fields
  item_type?: ItemType;
  weight_unit?: WeightUnit;
  price_per_unit?: number;
  min_weight?: number;
  combo_price?: number;
  combo_components?: ComboComponent[];
  modifier_groups?: ModifierGroup[];
  variants?: ItemVariant[];
  tax_category?: TaxCategory;
  kitchen_station?: KitchenStation;
  age_restricted?: boolean;
  discount_eligible?: boolean;
  loyalty_points_override?: number;
  sku?: string;
}

export interface ModifierGroup {
  id: string;
  item_id: string;
  name: string;
  name_ar?: string;
  is_required: boolean;
  min_selections: number;
  max_selections?: number;
  sort_order: number;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  group_id: string;
  name: string;
  name_ar?: string;
  price_delta: number;
  is_default: boolean;
  is_available: boolean;
  sort_order: number;
}

export interface RestaurantTable {
  id: string;
  tenant_id: string;
  branch_id: string;
  number: string;
  capacity?: number;
  qr_code_id: string;
  status: "free" | "occupied" | "ready" | "bill_requested" | "aging" | "reserved" | "dirty" | "blocked";
  section?: "indoor" | "outdoor" | "vip" | "bar";
  waiter_id?: string;
}

export type RiderStatus = "online" | "offline" | "on_delivery";
export type VehicleType = "motorcycle" | "bicycle" | "car";

export interface Rider {
  id: string;
  tenant_id: string;
  name: string;
  name_ar?: string;
  phone: string;
  vehicle: VehicleType;
  photo_url?: string;
  status: RiderStatus;
  is_available: boolean;
  current_order_id?: string;
  total_deliveries: number;
  avg_delivery_time?: number;
  rating?: number;
  earnings_today: number;
  earnings_week: number;
  cash_collected: number;
  created_at: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  branch_id: string;
  order_number: string;
  status: OrderStatus;
  order_type: OrderType;
  channel: Channel;
  table_id?: string;
  table_number?: string;
  car_number?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  service_charge: number;
  tip: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes?: string;
  created_at: string;
  accepted_at?: string;
  preparing_at?: string;
  ready_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancel_reason?: string;
}

export interface OrderItem {
  item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  modifiers: { name: string; price_delta: number }[];
  notes?: string;
  line_total: number;
}

export interface CartItem {
  id: string;
  item_id: string;
  name: string;
  image_url?: string;
  quantity: number;
  unit_price: number;
  selected_modifiers: { group_name: string; option_id: string; option_name: string; price_delta: number }[];
  notes: string;
  line_total: number;
}

export interface StaffMember {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  name_ar?: string;
  email: string;
  role: UserRole;
  pin?: string;
  branch_scope?: string[];
  status: "active" | "pending" | "removed";
  last_login?: string;
  invited_at: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  phone: string;
  name?: string;
  email?: string;
  order_count: number;
  total_spent: number;
  last_order_at?: string;
  whatsapp_opt_in: boolean;
  segment: "new" | "regular" | "vip" | "lapsed";
  notes?: string;
  saved_addresses: { label: string; address: string }[];
}
