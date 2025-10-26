export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: "customer" | "shopAdmin";
  createdAt: string;
}

export interface Shop {
  id: string;
  ownerUserId: string;
  name: string;
  address: string;
  isActive: boolean; // visible to customers
  status: "open" | "closed"; // public label
  acceptingOrders: boolean; // pause switch for new orders
  paymentPolicy: "pay_on_pickup" | "prepaid_only";
  orderAcceptanceMode: "auto" | "manual";
  allowGuestCheckout: boolean;
  fulfillmentOptions: {
    pickupEnabled: boolean;
    deliveryEnabled: boolean; // false for v1
    deliveryRadiusKm?: number;
    deliveryFee?: number;
  };
  createdAt: string;
  updatedAt: string;
}

// multiple admins/staff per shop
export interface ShopMember {
  id: string;
  shopId: string;
  userId: string;
  role: "owner" | "admin" | "staff";
  permissions: string[]; // e.g. ["manage_products","manage_orders"]
  isActive: boolean;
  addedAt: string;
}

export interface ShopHoursWindow {
  open: string;  // "09:00"
  close: string; // "17:00"
}

export interface ShopHours {
  id: string;
  shopId: string;
  timezone: string; // e.g. "Australia/Sydney"
  weekly: {
    monday?: ShopHoursWindow[];
    tuesday?: ShopHoursWindow[];
    wednesday?: ShopHoursWindow[];
    thursday?: ShopHoursWindow[];
    friday?: ShopHoursWindow[];
    saturday?: ShopHoursWindow[];
    sunday?: ShopHoursWindow[];
  };
  updatedAt: string;
}

export interface Category {
  id: string;
  shopId: string;
  name: string; // "Breakfast", "Lunch", "Kids", "Drinks"
  description?: string;
  sortOrder?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  label: string; // "Small", "Large", "Medium / Blue"
  basePrice: number;
  sku?: string;
  isActive: boolean;
}

export interface VariantScheme {
  id: string;
  name: string; // "Size", "Size / Color"
  variants: ProductVariant[];
}

export interface AddonOption {
  id: string;
  name: string; // "Extra cheese"
  priceDelta: number; // +1.50
  isActive: boolean;
}

export interface AddonGroup {
  id: string;
  name: string; // "Toppings"
  required: boolean;
  maxSelectable?: number;
  options: AddonOption[];
}

export interface Product {
  id: string;
  ownerUserId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variantSchemes: VariantScheme[];  // e.g. pizza size, shirt size/color
  addonGroups: AddonGroup[];        // e.g. toppings, extras
}

export interface ProductInShop {
  id: string;
  productId: string;        // links to Product
  shopId: string;
  priceOverride?: number;   // shop-specific base price override
  isAvailable: boolean;     // can be ordered right now
  categoryIds: string[];    // ["kids","lunch"] - product can live in multiple menu sections
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItemAddonSnapshot {
  addonOptionId: string;
  nameSnapshot: string;
  priceDeltaSnapshot: number;
}

export interface CartItem {
  productId: string;
  productVariantId: string;
  productNameSnapshot: string;
  variantLabelSnapshot: string;
  unitBasePriceSnapshot: number;
  addons: CartItemAddonSnapshot[];
  finalUnitPrice: number; // base + addons at time added
  quantity: number;
}

export interface Cart {
  id: string;
  userId: string; // can be "guest"
  shopId: string;
  items: CartItem[];
  updatedAt: string;
}

export interface CartItemRequest {
  productId: string;
  productVariantId: string;
  quantity: number;
  addonOptionIds?: string[];
}

export type OrderStatus =
  | "placed"
  | "accepted"
  | "rejected"
  | "ready_for_pickup"
  | "completed"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid";

export interface OrderItem {
  productId: string;
  productVariantId: string;
  productNameSnapshot: string;
  variantLabelSnapshot: string;
  finalUnitPrice: number;
  quantity: number;
  addons: CartItemAddonSnapshot[];
}

export interface Order {
  id: string;
  shopId: string;
  userId: string; // can be "guest"
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  submittedAt: string;
  updatedAt: string;

  customerName: string;
  customerPhone?: string;
  customerNotes?: string; // e.g. "no onions", "I'll pick up in 15 mins"

  items: OrderItem[];
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  shopId?: string;
  entityType:
    | "shop"
    | "shopSettings"
    | "shopHours"
    | "product"
    | "productInShop"
    | "order"
    | "category"
    | "membership";
  entityId: string;
  action: string; // "CREATE","UPDATE_STATUS","CHANGE_PRICE",etc.
  before?: any;
  after?: any;
  timestamp: string;
}
