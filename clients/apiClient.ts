const BASE_URL = process.env.API_BASE_URL || 'http://localhost:7071/api';

async function request<T>(
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

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

export interface Money {
  amount: number;
  currency: string;
}

export interface FulfillmentOptions {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryRadiusKm?: number;
  deliveryFee?: Money;
  leadTimeMinutes?: number;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  status: ShopStatus;
  acceptingOrders: boolean;
  timezone?: string;
  address?: string;
  fulfillment: {
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
    deliveryRadiusKm?: number;
    deliveryFee?: number;
  };
  updatedAt: string;
}

export interface ShopInput {
  name: string;
  slug: string;
  ownerUserId: string;
  legalName?: string;
  address?: string;
  timezone?: string;
  status?: ShopStatus;
  acceptingOrders?: boolean;
  paymentPolicy?: PaymentPolicy;
  orderAcceptanceMode?: OrderAcceptanceMode;
  allowGuestCheckout?: boolean;
  fulfillmentOptions?: Partial<FulfillmentOptions>;
  defaultCurrency?: string;
}

export interface PrincipalRef {
  type: 'user' | 'role' | 'service' | 'apiKey';
  id: string;
  scope?: string;
}

export interface AuditLog {
  id: string;
  actor: PrincipalRef;
  shopId?: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface ShopMember {
  id: string;
  shopId: string;
  userId: string;
  role: ShopMemberRole;
  invitationStatus?: 'pending' | 'accepted' | 'revoked';
  invitedByUserId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShopMemberInvitePayload {
  userId: string;
  role: ShopMemberRole;
  invitedByUserId?: string;
}

export interface ShopMemberUpdatePayload {
  role?: ShopMemberRole;
  isActive?: boolean;
}

export interface ShopHoursWindow {
  opensAt: string;
  closesAt: string;
  isClosed?: boolean;
}

export interface ShopHours {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  description?: string;
  position?: number;
  isActive: boolean;
  parentCategoryId?: string;
}

export interface CategoryInput {
  name: string;
  description?: string;
  parentCategoryId?: string;
  position?: number;
  isActive?: boolean;
}

export interface ProductDTOCategory {
  id: string;
  name: string;
}

export interface ProductDTOVariantOption {
  id: string;
  label: string;
  priceDelta: number;
  isAvailable: boolean;
}

export interface ProductDTOVariant {
  id: string;
  label: string;
  options: ProductDTOVariantOption[];
}

export interface ProductDTOAddonOption {
  id: string;
  label: string;
  priceDelta: number;
  isAvailable: boolean;
}

export interface ProductDTOAddon {
  id: string;
  label: string;
  options: ProductDTOAddonOption[];
}

export interface ProductDTO {
  id: string;
  label: string;
  description?: string;
  isAvailable: boolean;
  price: number;
  categories: ProductDTOCategory[];
  variantTypes: ProductDTOVariant[];
  addons: ProductDTOAddon[];
}

export interface ShopMenuDTO {
  categories: ProductDTOCategory[];
  products: ProductDTO[];
}

export interface ShopWithMenuResponse {
  shop: Shop;
  menu: ShopMenuDTO;
}

export interface UserDTO {
  id: string;
}

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

export interface Order {
  id: string;
  shopId: string;
  userId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemInput {
  productId: string;
  productVariantId: string;
  quantity: number;
  addonOptionIds?: string[];
}

export interface CreateOrderInput {
  userId: string;
  customerName: string;
  customerPhone?: string;
  customerNotes?: string;
  items: OrderItemInput[];
  fulfillmentType?: 'pickup' | 'delivery';
  scheduledFor?: string;
}

export interface UpdateOrderStatusInput {
  nextStatus: OrderStatus;
}

export interface ManagedShopView {
  shopId: string;
  name: string;
  status: ShopStatus;
  acceptingOrders: boolean;
  role: ShopMemberRole;
}

export interface ShopHoursPayload {
  timezone: string;
  weekly: ShopHours['weekly'];
}

// Shops ---------------------------------------------------------------------
export const listShops = (token: string): Promise<Shop[]> =>
  request(token, '/shops');

export const createShop = (
  token: string,
  payload: ShopInput,
): Promise<Shop> => request(token, '/shops', { method: 'POST', body: JSON.stringify(payload) });

export const getShop = (token: string, shopId: string): Promise<Shop> =>
  request(token, `/shops/${shopId}`);

export const updateShop = (
  token: string,
  shopId: string,
  payload: Partial<ShopInput>,
): Promise<Shop> =>
  request(token, `/shops/${shopId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const deleteShop = (token: string, shopId: string): Promise<void> =>
  request(token, `/shops/${shopId}`, { method: 'DELETE' });

export const listShopMembers = (
  token: string,
  shopId: string,
): Promise<ShopMember[]> => request(token, `/shops/${shopId}/members`);

export const createShopMember = (
  token: string,
  shopId: string,
  payload: ShopMemberInvitePayload,
): Promise<ShopMember> =>
  request(token, `/shops/${shopId}/members`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateShopMember = (
  token: string,
  shopId: string,
  memberId: string,
  payload: ShopMemberUpdatePayload,
): Promise<ShopMember> =>
  request(token, `/shops/${shopId}/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const listManagedShops = (
  token: string,
  userId: string,
): Promise<ManagedShopView[]> => request(token, `/users/${userId}/shops`);

export const getShopMenu = (
  token: string,
  shopId: string,
): Promise<ShopWithMenuResponse> =>
  request(token, `/shops/${shopId}/menu`);

export const getShopBySlug = (
  token: string,
  slug: string,
): Promise<ShopWithMenuResponse> => request(token, `/shops/slug/${slug}`);

// ShopMembers (general) -----------------------------------------------------
export const listAllShopMembers = (
  token: string,
  params?: { shopId?: string },
): Promise<ShopMember[]> =>
  request(token, `/shopMembers${params?.shopId ? `?shopId=${params.shopId}` : ''}`);

export const getShopMember = (
  token: string,
  memberId: string,
): Promise<ShopMember> => request(token, `/shopMembers/${memberId}`);

export const createShopMemberGeneral = (
  token: string,
  payload: ShopMember,
): Promise<ShopMember> =>
  request(token, `/shopMembers`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateShopMemberGeneral = (
  token: string,
  memberId: string,
  payload: Partial<ShopMember>,
): Promise<ShopMember> =>
  request(token, `/shopMembers/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const deleteShopMember = (
  token: string,
  memberId: string,
): Promise<void> => request(token, `/shopMembers/${memberId}`, { method: 'DELETE' });

// Additional sections continue...
