/**
 * Canonical database schema for the ordering platform.
 * The model is split into three conceptual layers:
 * 1. Product layer  - reusable product definitions and merchandising data.
 * 2. Associations - how product entities attach to shops, menus, and workflows.
 * 3. ACL       - fine‑grained access control entries for every resource.
 * Everything extends a common document contract to keep the store future-proof.
 */

/* -------------------------------------------------------------------------- */
/* Base document & shared helpers                                             */
/* -------------------------------------------------------------------------- */

export interface DocumentBase {
  id: string;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  version?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export type Money = {
  amount: number;
  currency: string;
};

export type UserRole = 'customer' | 'shopAdmin' | 'platformAdmin';
export type ShopStatus = 'draft' | 'open' | 'closed' | 'suspended';
export type PaymentPolicy = 'pay_on_pickup' | 'prepaid_only';
export type OrderAcceptanceMode = 'auto' | 'manual';
export type ShopMemberRole = 'owner' | 'manager' | 'staff' | 'viewer';
export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'rejected'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled';
export type PaymentStatus = 'unpaid' | 'authorized' | 'paid' | 'refunded';

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

export interface User {
  id: string;
}

/* -------------------------------------------------------------------------- */
/* Shops                                                                      */
/* -------------------------------------------------------------------------- */
export interface Shop extends DocumentBase {
  name: string;
  slug: string;
  ownerUserId: string;
  legalName?: string;
  address?: string;
  timezone?: string;
  status: ShopStatus;
  acceptingOrders: boolean;
  paymentPolicy: PaymentPolicy;
  orderAcceptanceMode: OrderAcceptanceMode;
  allowGuestCheckout: boolean;
  fulfillmentOptions: FulfillmentOptions;
  defaultCurrency: string;
}

export interface FulfillmentOptions {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryRadiusKm?: number;
  deliveryFee?: Money;
  leadTimeMinutes?: number;
}

export interface ShopMember extends DocumentBase {
  shopId: string;
  userId: string;
  role: ShopMemberRole;
  invitationStatus?: 'pending' | 'accepted' | 'revoked';
  invitedByUserId?: string;
  isActive: boolean;
}

export interface ShopHours extends DocumentBase {
  shopId: string;
  timezone: string;
  weekly: {
    monday?: ShopHoursWindow[];
    tuesday?: ShopHoursWindow[];
    wednesday?: ShopHoursWindow[];
    thursday?: ShopHoursWindow[];
    friday?: ShopHoursWindow[];
    saturday?: ShopHoursWindow[];
    sunday?: ShopHoursWindow[];
  };
}

export interface ShopHoursWindow {
  opensAt: string; // "09:00"
  closesAt: string; // "17:00"
  isClosed?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

export interface Product extends DocumentBase {
  price: number;
  label: string;
  description?: string;
  ownerUserId?: string;
  categories: string[];
  tags?: string[];
  media?: { url: string; alt?: string; kind?: 'image' | 'video' }[];
  allergyInfo?: string[];
  variantGroups: ProductVariantGroup[];
  addonGroups: ProductAddonGroup[];
  isAvailable: boolean;
}

export interface ProductVariantGroup {
  id: string;
  label: string;
  options: ProductVariantOption[];
}
export interface ProductVariantOption {
  id: string;
  label: string;
  priceDelta: Money;
  isAvailable: boolean;
}

export interface ProductAddonGroup {
  id: string;
  label: string;
  required: boolean;
  maxSelectable?: number;
  options: ProductAddonOption[];
}

export interface ProductAddonOption {
  id: string;
  label: string;
  priceDelta: Money;
  isAvailable: boolean;
}

export interface ShopProductMap extends DocumentBase {
  shopId: string;
  productId: string;
  isAvailable: boolean;
  priceOverride?: Money;
  sortOrder?: number;
}

/* -------------------------------------------------------------------------- */
/* Associations                                           */
/* -------------------------------------------------------------------------- */

export interface ProductCategory extends DocumentBase {
  name: string;
  description?: string;
  position?: number;
  isActive: boolean;
  parentCategoryId?: string;
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

export interface OrderItemAddonSnapshot {
  addonOptionId: string;
  nameSnapshot: string;
  priceDeltaSnapshot: Money;
}

export interface OrderItem {
  productId: string;
  productVariantId: string;
  productNameSnapshot: string;
  variantLabelSnapshot: string;
  finalUnitPrice: Money;
  quantity: number;
  addons: OrderItemAddonSnapshot[];
}

export interface Order extends DocumentBase {
  shopId: string;
  userId: string; // can be "guest"
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: Money;
  submittedAt: string;
  customerName: string;
  customerPhone?: string;
  customerNotes?: string;
  fulfillmentSlot?: {
    type: 'pickup' | 'delivery';
    scheduledFor?: string;
  };
  items: OrderItem[];
}

/* -------------------------------------------------------------------------- */
/* Access control                                                             */
/* -------------------------------------------------------------------------- */

export type PrincipalType = 'user' | 'role' | 'service' | 'apiKey';

export interface PrincipalRef {
  type: PrincipalType;
  id: string;
  scope?: string; // e.g. shopId for role principals
}

export interface AccessControlEntry extends DocumentBase {
  resourceType: string;
  resourceId: string;
  principal: PrincipalRef;
  permissions: string[];
  effect: 'allow' | 'deny';
  expiresAt?: string;
}

/* -------------------------------------------------------------------------- */
/* Observability                                                              */
/* -------------------------------------------------------------------------- */

export interface AuditLog extends DocumentBase {
  actor: PrincipalRef;
  shopId?: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
}
