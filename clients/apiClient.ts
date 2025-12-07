import axios from 'axios';

export const DEFAULT_BASE_URL = 'http://localhost:7071/api';

const api = axios.create({
  baseURL: process.env.API_BASE_URL ?? DEFAULT_BASE_URL,
});

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

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

export interface MoneyInput {
  amount: number;
  currency?: string;
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

export interface MediaAsset {
  url: string;
  alt?: string;
  kind?: 'image' | 'video';
}

export interface ProductVariantOption {
  id: string;
  label: string;
  priceDelta: Money;
  isAvailable: boolean;
}

export interface ProductVariantGroup {
  id: string;
  label: string;
  options: ProductVariantOption[];
}

export interface ProductAddonOption {
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

export interface Product {
  id: string;
  ownerUserId?: string;
  label: string;
  price: number;
  description?: string;
  categories: string[];
  tags?: string[];
  media?: MediaAsset[];
  allergyInfo?: string[];
  variantGroups: ProductVariantGroup[];
  addonGroups: ProductAddonGroup[];
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  position?: number;
  isActive: boolean;
  parentCategoryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductResponse extends Product {
  shopId?: string;
  categoryDetails: ProductCategory[];
}

export interface ProductDTO {
  id: string;
  label: string;
  description?: string;
  price: number;
  categoryDetails: ProductCategory[];
  tags?: string[];
  media?: MediaAsset[];
  allergyInfo?: string[];
  variantGroups: ProductVariantGroup[];
  addonGroups: ProductAddonGroup[];
  productAvailable: boolean;
  shopContext?: {
    shopId: string;
    isAvailable: boolean;
    priceOverride?: Money;
    sortOrder?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ShopMenuResponse {
  shop: Shop;
  categories: ProductCategory[];
  products: ProductResponse[];
}

export interface ShopMenuDTO {
  categories: ProductCategory[];
  products: ProductDTO[];
}

export interface ShopWithMenuResponse {
  shop: Shop;
  menu: ShopMenuDTO;
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

export interface User {
  id: string;
}

export interface ManagedShopView {
  shopId: string;
  name: string;
  status: ShopStatus;
  acceptingOrders: boolean;
  role: ShopMemberRole;
}

export interface ShopSettingsPayload {
  name?: string;
  slug?: string;
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

export interface CreateShopRequest extends ShopSettingsPayload {
  ownerUserId: string;
}

export type UpdateShopRequest = ShopSettingsPayload;

export interface ShopMemberInvitePayload {
  userId: string;
  role: ShopMemberRole;
  invitedByUserId?: string;
}

export interface ShopMemberUpdatePayload {
  role?: ShopMemberRole;
  isActive?: boolean;
}

export interface ShopHoursPayload {
  timezone: string;
  weekly: ShopHours['weekly'];
}

export interface ProductVariantPayload
  extends Omit<ProductVariantOption, 'id' | 'priceDelta' | 'isAvailable'> {
  id?: string;
  priceDelta: MoneyInput;
  isAvailable?: boolean;
}

export interface ProductVariantGroupPayload
  extends Omit<ProductVariantGroup, 'id' | 'options'> {
  id?: string;
  options: ProductVariantPayload[];
}

export interface ProductAddonOptionPayload
  extends Omit<ProductAddonOption, 'id' | 'priceDelta' | 'isAvailable'> {
  id?: string;
  priceDelta: MoneyInput;
  isAvailable?: boolean;
}

export interface ProductAddonGroupPayload
  extends Omit<ProductAddonGroup, 'id' | 'options'> {
  id?: string;
  options: ProductAddonOptionPayload[];
}

export interface CreateProductRequest
  extends Omit<
    Product,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'variantGroups'
    | 'addonGroups'
    | 'categories'
    | 'isAvailable'
  > {
  variantGroups: ProductVariantGroupPayload[];
  addonGroups: ProductAddonGroupPayload[];
  categories?: string[];
  isAvailable?: boolean;
  shopId: string;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentCategoryId?: string;
  position?: number;
  isActive?: boolean;
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

export interface OrderItemPayload {
  productId: string;
  productVariantId: string;
  quantity: number;
  addonOptionIds?: string[];
}

export interface CreateOrderRequest {
  userId: string;
  customerName: string;
  customerPhone?: string;
  customerNotes?: string;
  items: OrderItemPayload[];
  fulfillmentType?: 'pickup' | 'delivery';
  scheduledFor?: string;
}

export interface UpdateOrderStatusRequest {
  nextStatus: OrderStatus;
}

export interface UserCreatePayload {
  id: string;
}

export interface ListShopsParams {
  status?: ShopStatus;
  acceptingOrders?: boolean;
}

export interface ListProductsParams {
  shopId?: string;
  ownerUserId?: string;
}

export interface ListShopOrdersParams {
  status?: string;
}

export interface ListOrdersParams {
  shopId?: string;
  userId?: string;
}

const withAuth = (token: string) => ({ headers: authHeaders(token) });

/* Shops */
export async function listShops(
  token: string,
  params?: ListShopsParams,
): Promise<Shop[]> {
  const res = await api.get<Shop[]>('/shops', {
    ...withAuth(token),
    params,
  });
  return res.data;
}

export async function createShop(
  token: string,
  body: CreateShopRequest,
): Promise<Shop> {
  const res = await api.post<Shop>('/shops', body, withAuth(token));
  return res.data;
}

export async function getShop(
  token: string,
  shopId: string,
): Promise<Shop> {
  const res = await api.get<Shop>(`/shops/${shopId}`, withAuth(token));
  return res.data;
}

export async function getShopBySlug(
  token: string,
  slug: string,
): Promise<ShopWithMenuResponse> {
  const res = await api.get<ShopWithMenuResponse>(
    `/shops/slug/${slug}`,
    withAuth(token),
  );
  return res.data;
}

export async function updateShop(
  token: string,
  shopId: string,
  body: UpdateShopRequest,
): Promise<Shop> {
  const res = await api.patch<Shop>(`/shops/${shopId}`, body, withAuth(token));
  return res.data;
}

export async function deleteShop(token: string, shopId: string): Promise<void> {
  await api.delete(`/shops/${shopId}`, withAuth(token));
}

export async function getShopMenu(
  token: string,
  shopId: string,
): Promise<ShopMenuResponse> {
  const res = await api.get<ShopMenuResponse>(
    `/shops/${shopId}/menu`,
    withAuth(token),
  );
  return res.data;
}

/* Shop members */
export async function listShopMembers(
  token: string,
  shopId: string,
): Promise<ShopMember[]> {
  const res = await api.get<ShopMember[]>(
    `/shops/${shopId}/members`,
    withAuth(token),
  );
  return res.data;
}

export async function createShopMember(
  token: string,
  shopId: string,
  body: ShopMemberInvitePayload,
): Promise<ShopMember> {
  const res = await api.post<ShopMember>(
    `/shops/${shopId}/members`,
    body,
    withAuth(token),
  );
  return res.data;
}

export async function updateShopMember(
  token: string,
  shopId: string,
  memberId: string,
  body: ShopMemberUpdatePayload,
): Promise<ShopMember> {
  const res = await api.patch<ShopMember>(
    `/shops/${shopId}/members/${memberId}`,
    body,
    withAuth(token),
  );
  return res.data;
}

/* Shop hours */
export async function getShopHours(
  token: string,
  shopId: string,
): Promise<ShopHours> {
  const res = await api.get<ShopHours>(
    `/shops/${shopId}/hours`,
    withAuth(token),
  );
  return res.data;
}

export async function upsertShopHours(
  token: string,
  shopId: string,
  body: ShopHoursPayload,
): Promise<ShopHours> {
  const res = await api.put<ShopHours>(
    `/shops/${shopId}/hours`,
    body,
    withAuth(token),
  );
  return res.data;
}

/* Categories */
export async function listCategories(
  token: string,
): Promise<ProductCategory[]> {
  const res = await api.get<ProductCategory[]>(`/categories`, withAuth(token));
  return res.data;
}

export async function getCategory(
  token: string,
  categoryId: string,
): Promise<ProductCategory> {
  const res = await api.get<ProductCategory>(
    `/categories/${categoryId}`,
    withAuth(token),
  );
  return res.data;
}

export async function createCategory(
  token: string,
  body: CreateCategoryRequest,
): Promise<ProductCategory> {
  const res = await api.post<ProductCategory>(
    `/categories`,
    body,
    withAuth(token),
  );
  return res.data;
}

export async function updateCategory(
  token: string,
  categoryId: string,
  body: UpdateCategoryRequest,
): Promise<ProductCategory> {
  const res = await api.patch<ProductCategory>(
    `/categories/${categoryId}`,
    body,
    withAuth(token),
  );
  return res.data;
}

export async function deleteCategory(
  token: string,
  categoryId: string,
): Promise<void> {
  await api.delete(`/categories/${categoryId}`, withAuth(token));
}

/* Products */
export async function listProducts(
  token: string,
  params: ListProductsParams,
): Promise<ProductResponse[]> {
  const res = await api.get<ProductResponse[]>(`/products`, {
    ...withAuth(token),
    params,
  });
  return res.data;
}

export async function createProduct(
  token: string,
  body: CreateProductRequest,
): Promise<ProductResponse> {
  const res = await api.post<ProductResponse>(
    `/products`,
    body,
    withAuth(token),
  );
  return res.data;
}

export async function getProduct(
  token: string,
  productId: string,
): Promise<ProductResponse> {
  const res = await api.get<ProductResponse>(
    `/products/${productId}`,
    withAuth(token),
  );
  return res.data;
}

export async function updateProduct(
  token: string,
  productId: string,
  body: UpdateProductRequest,
): Promise<ProductResponse> {
  const res = await api.patch<ProductResponse>(
    `/products/${productId}`,
    body,
    withAuth(token),
  );
  return res.data;
}

export async function deleteProduct(
  token: string,
  productId: string,
): Promise<void> {
  await api.delete(`/products/${productId}`, withAuth(token));
}

/* Orders */
export async function listShopOrders(
  token: string,
  shopId: string,
  params?: ListShopOrdersParams,
): Promise<Order[]> {
  const res = await api.get<Order[]>(`/shops/${shopId}/orders`, {
    ...withAuth(token),
    params,
  });
  return res.data;
}

export async function createOrder(
  token: string,
  shopId: string,
  body: CreateOrderRequest,
): Promise<Order> {
  const res = await api.post<Order>(
    `/shops/${shopId}/orders`,
    body,
    withAuth(token),
  );
  return res.data;
}

export async function updateOrderStatus(
  token: string,
  shopId: string,
  orderId: string,
  body: UpdateOrderStatusRequest,
): Promise<Order> {
  const res = await api.patch<Order>(
    `/shops/${shopId}/orders/${orderId}/status`,
    body,
    withAuth(token),
  );
  return res.data;
}

export async function listOrders(
  token: string,
  params?: ListOrdersParams,
): Promise<Order[]> {
  const res = await api.get<Order[]>(`/orders`, {
    ...withAuth(token),
    params,
  });
  return res.data;
}

export async function getOrder(token: string, orderId: string): Promise<Order> {
  const res = await api.get<Order>(`/orders/${orderId}`, withAuth(token));
  return res.data;
}

export async function updateOrder(
  token: string,
  orderId: string,
  body: Partial<Order>,
): Promise<Order> {
  const res = await api.patch<Order>(
    `/orders/${orderId}`,
    body,
    withAuth(token),
  );
  return res.data;
}

export async function deleteOrder(
  token: string,
  orderId: string,
): Promise<void> {
  await api.delete(`/orders/${orderId}`, withAuth(token));
}

/* Users */
export async function listUsers(token: string): Promise<User[]> {
  const res = await api.get<User[]>(`/users`, withAuth(token));
  return res.data;
}

export async function createUser(
  token: string,
  body: UserCreatePayload,
): Promise<User> {
  const res = await api.post<User>(`/users`, body, withAuth(token));
  return res.data;
}

export async function getUser(token: string, userId: string): Promise<User> {
  const res = await api.get<User>(`/users/${userId}`, withAuth(token));
  return res.data;
}

export async function updateUser(
  token: string,
  userId: string,
  body: Partial<User>,
): Promise<User> {
  const res = await api.patch<User>(`/users/${userId}`, body, withAuth(token));
  return res.data;
}

export async function deleteUser(token: string, userId: string): Promise<void> {
  await api.delete(`/users/${userId}`, withAuth(token));
}

export async function listManagedShops(
  token: string,
  userId: string,
): Promise<ManagedShopView[]> {
  const res = await api.get<ManagedShopView[]>(
    `/users/${userId}/shops`,
    withAuth(token),
  );
  return res.data;
}
