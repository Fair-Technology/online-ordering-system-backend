/**
 * Canonical database schema for the ordering platform.
 * The model is split into three conceptual layers:
 * 1. Catalog  - reusable product definitions and merchandising data.
 * 2. Associations - how catalog entities attach to shops, menus, and workflows.
 * 3. ACL       - fine‑grained access control entries for every resource.
 * Everything extends a common document contract to keep the store future-proof.
 */

/* -------------------------------------------------------------------------- */
/* Base document & shared helpers                                             */
/* -------------------------------------------------------------------------- */

export type DocumentKind =
  | 'user'
  | 'shop'
  | 'catalogProduct'
  | 'shopCatalogEntry'
  | 'category'
  | 'order'
  | 'auditLog'
  | 'aclEntry'
  | 'association';

export interface DocumentBase {
  id: string;
  kind: DocumentKind;
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
/* Users & shops                                                              */
/* -------------------------------------------------------------------------- */

export interface UserProfile {
  displayName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  locale?: string;
}

export interface User extends DocumentBase {
  kind: 'user';
  primaryEmail?: string;
  roles: UserRole[];
  profile?: UserProfile;
  lastActiveAt?: string;
}

export interface FulfillmentOptions {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryRadiusKm?: number;
  deliveryFee?: Money;
  leadTimeMinutes?: number;
}

export interface Shop extends DocumentBase {
  kind: 'shop';
  name: string;
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

export interface ShopMember extends DocumentBase {
  kind: 'association';
  shopId: string;
  userId: string;
  role: ShopMemberRole;
  permissions: string[];
  invitationStatus?: 'pending' | 'accepted' | 'revoked';
  isActive: boolean;
}

export interface ShopHoursWindow {
  opensAt: string; // "09:00"
  closesAt: string; // "17:00"
  isClosed?: boolean;
}

export interface ShopHours extends DocumentBase {
  kind: 'association';
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

/* -------------------------------------------------------------------------- */
/* Catalog layer                                                              */
/* -------------------------------------------------------------------------- */

export interface CatalogVariant {
  id: string;
  label: string;
  basePrice: Money;
  sku?: string;
  isActive: boolean;
  attributes?: Record<string, string | number | boolean>;
}

export interface CatalogVariantGroup {
  id: string;
  name: string;
  selectionMode: 'single' | 'multiple';
  variants: CatalogVariant[];
}

export interface CatalogAddonOption {
  id: string;
  label: string;
  priceDelta: Money;
  isActive: boolean;
}

export interface CatalogAddonGroup {
  id: string;
  name: string;
  required: boolean;
  maxSelectable?: number;
  options: CatalogAddonOption[];
}

export interface CatalogProduct extends DocumentBase {
  kind: 'catalogProduct';
  ownerUserId?: string;
  title: string;
  description?: string;
  media?: { url: string; alt?: string; kind?: 'image' | 'video' }[];
  tags?: string[];
  allergyInfo?: string[];
  variantGroups: CatalogVariantGroup[];
  addonGroups: CatalogAddonGroup[];
  isActive: boolean;
}

/* -------------------------------------------------------------------------- */
/* Associations & merchandising                                               */
/* -------------------------------------------------------------------------- */

export interface Category extends DocumentBase {
  kind: 'category';
  shopId: string;
  productIds?: string[]; // optional denormalized helper
  name: string;
  description?: string;
  sortOrder?: number;
  isActive: boolean;
  parentCategoryId?: string;
}

export interface ShopCatalogEntry extends DocumentBase {
  kind: 'shopCatalogEntry';
  shopId: string;
  productId: string;
  isAvailable: boolean;
  categoryIds: string[];
  priceOverride?: Money;
  sortOrder?: number;
  salesChannels?: Array<'pos' | 'online' | 'kiosk'>;
}

export interface ProductCategoryLink extends DocumentBase {
  kind: 'association';
  shopId: string;
  productId: string;
  categoryId: string;
  sortOrder?: number;
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
  shopCatalogEntryId?: string;
  productVariantId: string;
  productNameSnapshot: string;
  variantLabelSnapshot: string;
  finalUnitPrice: Money;
  quantity: number;
  addons: OrderItemAddonSnapshot[];
}

export interface Order extends DocumentBase {
  kind: 'order';
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
  kind: 'aclEntry';
  resourceType: DocumentKind | 'category' | 'shopHours';
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
  kind: 'auditLog';
  actor: PrincipalRef;
  shopId?: string;
  entityType: DocumentKind | 'shopSettings' | 'shopHours' | 'category';
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
}
