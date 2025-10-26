// Shared enums and helpers
export const SHOP_STATUSES = ["open", "closed"] as const;
export type ShopStatus = (typeof SHOP_STATUSES)[number];

export const PAYMENT_POLICIES = ["pay_on_pickup", "prepaid_only"] as const;
export type PaymentPolicy = (typeof PAYMENT_POLICIES)[number];

export const ORDER_ACCEPTANCE_MODES = ["auto", "manual"] as const;
export type OrderAcceptanceMode = (typeof ORDER_ACCEPTANCE_MODES)[number];

export const SHOP_MEMBER_ROLES = ["owner", "admin", "staff"] as const;
export type ShopMemberRole = (typeof SHOP_MEMBER_ROLES)[number];

export const USER_ROLES = ["customer", "shopAdmin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ORDER_STATUSES = ["placed", "accepted", "rejected", "ready_for_pickup", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// Shared structures
export interface FulfillmentOptions {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryRadiusKm?: number;
  deliveryFee?: number;
}

export interface ShopSummary {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  status: ShopStatus;
  acceptingOrders: boolean;
  paymentPolicy: PaymentPolicy;
  orderAcceptanceMode: OrderAcceptanceMode;
  allowGuestCheckout: boolean;
  fulfillmentOptions: FulfillmentOptions;
  createdAt: string;
  updatedAt: string;
}

export interface ShopSettingsUpdateRequest {
  status?: ShopStatus;
  acceptingOrders?: boolean;
  paymentPolicy?: PaymentPolicy;
  orderAcceptanceMode?: OrderAcceptanceMode;
  allowGuestCheckout?: boolean;
  fulfillmentOptions?: Partial<FulfillmentOptions>;
  isActive?: boolean;
}

// Shops
export interface CreateShopRequest {
  name: string;
  address: string;
  ownerUserId: string;
}

export type CreateShopResponse = ShopSummary;
export type GetShopResponse = ShopSummary;
export type UpdateShopResponse = ShopSummary;

// Shop Members
export interface ShopMemberResponse {
  id: string;
  shopId: string;
  userId: string;
  role: ShopMemberRole;
  permissions: string[];
  isActive: boolean;
  addedAt: string;
}

export interface CreateShopMemberRequest {
  userId: string;
  role: Extract<ShopMemberRole, "admin" | "staff">;
  permissions?: string[];
  isActive?: boolean;
}

export interface UpdateShopMemberRequest {
  role?: ShopMemberRole;
  permissions?: string[];
  isActive?: boolean;
}

export type ListShopMembersResponse = ShopMemberResponse[];

// Shop Hours
export interface ShopHoursWindow {
  open: string;
  close: string;
}

export interface ShopHoursPayload {
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
  updatedAt?: string;
}

export type GetShopHoursResponse = ShopHoursPayload | Record<string, never>;
export type UpsertShopHoursRequest = ShopHoursPayload;
export type UpsertShopHoursResponse = ShopHoursPayload;

// Categories
export interface CategoryResponse {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  sortOrder?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type ListCategoriesResponse = CategoryResponse[];

// Products
export interface ProductVariant {
  id: string;
  label: string;
  basePrice: number;
  sku?: string;
  isActive: boolean;
}

export interface VariantScheme {
  id: string;
  name: string;
  variants: ProductVariant[];
}

export interface AddonOption {
  id: string;
  name: string;
  priceDelta: number;
  isActive: boolean;
}

export interface AddonGroup {
  id: string;
  name: string;
  required: boolean;
  maxSelectable?: number;
  options: AddonOption[];
}

export interface ProductResponse {
  id: string;
  ownerUserId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variantSchemes: VariantScheme[];
  addonGroups: AddonGroup[];
}

export interface CreateProductRequest {
  ownerUserId: string;
  name: string;
  description?: string;
  variantSchemes?: VariantScheme[];
  addonGroups?: AddonGroup[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  variantSchemes?: VariantScheme[];
  addonGroups?: AddonGroup[];
  isActive?: boolean;
}

export interface ProductInShopResponse {
  id: string;
  productId: string;
  shopId: string;
  priceOverride?: number;
  isAvailable: boolean;
  categoryIds: string[];
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInShopRequest {
  productId: string;
  priceOverride?: number;
  isAvailable?: boolean;
  categoryIds?: string[];
  sortOrder?: number;
}

export interface UpdateProductInShopRequest {
  priceOverride?: number;
  isAvailable?: boolean;
  categoryIds?: string[];
  sortOrder?: number;
}

// Menu
export interface ShopMenuResponse {
  shop: ShopSummary;
  categories: CategoryResponse[];
  productsInShop: ProductInShopResponse[];
  products: ProductResponse[];
}

// Cart
export interface CartItemAddonSnapshot {
  addonOptionId: string;
  nameSnapshot: string;
  priceDeltaSnapshot: number;
}

export interface CartItemSnapshot {
  productId: string;
  productVariantId: string;
  productNameSnapshot: string;
  variantLabelSnapshot: string;
  unitBasePriceSnapshot: number;
  addons: CartItemAddonSnapshot[];
  finalUnitPrice: number;
  quantity: number;
}

export interface CartItemRequest {
  productId: string;
  productVariantId: string;
  quantity: number;
  addonOptionIds?: string[];
}

export interface CartResponse {
  id: string;
  userId: string;
  shopId: string;
  items: CartItemSnapshot[];
  updatedAt: string;
}

export interface UpdateCartRequest {
  userId: string;
  items: CartItemRequest[];
}

// Orders
export interface OrderItemSnapshot {
  productId: string;
  productVariantId: string;
  productNameSnapshot: string;
  variantLabelSnapshot: string;
  finalUnitPrice: number;
  quantity: number;
  addons: CartItemAddonSnapshot[];
}

export interface OrderResponse {
  id: string;
  shopId: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  submittedAt: string;
  updatedAt: string;
  customerName: string;
  customerPhone?: string;
  customerNotes?: string;
  items: OrderItemSnapshot[];
}

export interface CreateOrderRequest {
  userId: string;
  customerName: string;
  customerPhone?: string;
  customerNotes?: string;
  cartId?: string;
  items?: CartItemRequest[];
}

export interface ListOrdersQuery {
  status?: string;
}

export type CreateOrderResponse = OrderResponse;
export type ListOrdersResponse = OrderResponse[];

export interface UpdateOrderStatusRequest {
  nextStatus: OrderStatus;
}

export type UpdateOrderStatusResponse = OrderResponse;

// User Shops (frontend-facing user entry point)
export interface UserShopView {
  shopId: string;
  name: string;
  address: string;
  status: ShopStatus;
  acceptingOrders: boolean;
  pickupEnabled: boolean;
  role: ShopMemberRole;
  isActiveMember: boolean;
  updatedAt: string;
}

export type UserShopsResponse = UserShopView[];

