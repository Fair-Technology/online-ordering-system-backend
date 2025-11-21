const DEFAULT_BASE_URL = 'http://localhost:7071/api';

type RequestOptions = Omit<RequestInit, 'method' | 'body'>;

type ShopStatus = 'draft' | 'open' | 'closed' | 'suspended';
type PaymentPolicy = 'pay_on_pickup' | 'prepaid_only';
type OrderAcceptanceMode = 'auto' | 'manual';
type ShopMemberRole = 'owner' | 'manager' | 'staff' | 'viewer';
type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'rejected'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled';
type PaymentStatus = 'unpaid' | 'authorized' | 'paid' | 'refunded';

type MediaAsset = {
  url: string;
  alt?: string;
  kind?: 'image' | 'video';
};

type Money = {
  amount: number;
  currency: string;
};

type MoneyInput = {
  amount: number;
  currency?: string;
};

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

export interface FulfillmentOptions {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryRadiusKm?: number;
  deliveryFee?: Money;
  leadTimeMinutes?: number;
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

export type ProductResponse = Product & {
  shopId?: string;
  categoryDetails: ProductCategory[];
};

export interface ShopMenuResponse {
  shop: Shop;
  categories: ProductCategory[];
  products: ProductResponse[];
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
    'id' | 'createdAt' | 'updatedAt' | 'variantGroups' | 'addonGroups' | 'categories' | 'isAvailable'
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

function joinPath(base: string, path: string): string {
  if (base.endsWith('/')) {
    base = base.slice(0, -1);
  }
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  return `${base}${path}`;
}

export class ApiClient {
  constructor(
    private readonly baseUrl = DEFAULT_BASE_URL,
    private readonly defaultOptions: RequestOptions = {},
  ) {}

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    init?: RequestOptions,
  ): Promise<T> {
    const url = joinPath(this.baseUrl, path);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.defaultOptions.headers as Record<string, string>),
      ...(init?.headers as Record<string, string>),
    };

    const response = await fetch(url, {
      ...this.defaultOptions,
      ...init,
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || response.statusText);
    }

    const text = await response.text();
    return text ? (JSON.parse(text) as T) : (undefined as T);
  }

  private buildQuery(params?: Record<string, string | number | boolean | undefined>): string {
    if (!params) return '';
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      search.append(key, String(value));
    });
    const query = search.toString();
    return query ? `?${query}` : '';
  }

  /* Shops ---------------------------------------------------------------- */

  listShops(params?: { status?: ShopStatus; acceptingOrders?: boolean }) {
    return this.request<Shop[]>(
      'GET',
      `/shops${this.buildQuery({
        status: params?.status,
        acceptingOrders: params?.acceptingOrders,
      })}`,
    );
  }

  createShop(body: CreateShopRequest) {
    return this.request<Shop>('POST', `/shops`, body);
  }

  getShop(shopId: string) {
    return this.request<Shop>('GET', `/shops/${shopId}`);
  }

  updateShop(shopId: string, body: UpdateShopRequest) {
    return this.request<Shop>('PATCH', `/shops/${shopId}`, body);
  }

  deleteShop(shopId: string) {
    return this.request<void>('DELETE', `/shops/${shopId}`);
  }

  getShopMenu(shopId: string) {
    return this.request<ShopMenuResponse>('GET', `/shops/${shopId}/menu`);
  }

  /* Shop members --------------------------------------------------------- */

  listShopMembers(shopId: string) {
    return this.request<ShopMember[]>(
      'GET',
      `/shops/${shopId}/members`,
    );
  }

  createShopMember(shopId: string, body: ShopMemberInvitePayload) {
    return this.request<ShopMember>(
      'POST',
      `/shops/${shopId}/members`,
      body,
    );
  }

  updateShopMember(shopId: string, memberId: string, body: ShopMemberUpdatePayload) {
    return this.request<ShopMember>(
      'PATCH',
      `/shops/${shopId}/members/${memberId}`,
      body,
    );
  }

  /* Shop hours ----------------------------------------------------------- */

  getShopHours(shopId: string) {
    return this.request<ShopHours>('GET', `/shops/${shopId}/hours`);
  }

  upsertShopHours(shopId: string, body: ShopHoursPayload) {
    return this.request<ShopHours>('PUT', `/shops/${shopId}/hours`, body);
  }

  /* Categories ----------------------------------------------------------- */

  listCategories() {
    return this.request<ProductCategory[]>('GET', `/categories`);
  }

  getCategory(categoryId: string) {
    return this.request<ProductCategory>('GET', `/categories/${categoryId}`);
  }

  createCategory(body: CreateCategoryRequest) {
    return this.request<ProductCategory>('POST', `/categories`, body);
  }

  updateCategory(categoryId: string, body: UpdateCategoryRequest) {
    return this.request<ProductCategory>(
      'PATCH',
      `/categories/${categoryId}`,
      body,
    );
  }

  deleteCategory(categoryId: string) {
    return this.request<void>('DELETE', `/categories/${categoryId}`);
  }

  /* Products ------------------------------------------------------------- */

  listProducts(params?: { shopId?: string; ownerUserId?: string }) {
    return this.request<ProductResponse[]>(
      'GET',
      `/products${this.buildQuery({
        shopId: params?.shopId,
        ownerUserId: params?.ownerUserId,
      })}`,
    );
  }

  createProduct(body: CreateProductRequest) {
    return this.request<ProductResponse>('POST', `/products`, body);
  }

  getProduct(productId: string) {
    return this.request<ProductResponse>('GET', `/products/${productId}`);
  }

  updateProduct(productId: string, body: UpdateProductRequest) {
    return this.request<ProductResponse>(
      'PATCH',
      `/products/${productId}`,
      body,
    );
  }

  deleteProduct(productId: string) {
    return this.request<void>('DELETE', `/products/${productId}`);
  }

  /* Orders --------------------------------------------------------------- */

  listShopOrders(shopId: string, params?: { status?: string }) {
    return this.request<Order[]>(
      'GET',
      `/shops/${shopId}/orders${this.buildQuery({ status: params?.status })}`,
    );
  }

  createOrder(shopId: string, body: CreateOrderRequest) {
    return this.request<Order>('POST', `/shops/${shopId}/orders`, body);
  }

  updateOrderStatus(shopId: string, orderId: string, body: UpdateOrderStatusRequest) {
    return this.request<Order>(
      'PATCH',
      `/shops/${shopId}/orders/${orderId}/status`,
      body,
    );
  }

  listOrders(params?: { shopId?: string; userId?: string }) {
    return this.request<Order[]>(
      'GET',
      `/orders${this.buildQuery({ shopId: params?.shopId, userId: params?.userId })}`,
    );
  }

  getOrder(orderId: string) {
    return this.request<Order>('GET', `/orders/${orderId}`);
  }

  updateOrder(orderId: string, body: Partial<Order>) {
    return this.request<Order>('PATCH', `/orders/${orderId}`, body);
  }

  deleteOrder(orderId: string) {
    return this.request<void>('DELETE', `/orders/${orderId}`);
  }

  /* Users ---------------------------------------------------------------- */

  listUsers() {
    return this.request<User[]>('GET', `/users`);
  }

  createUser(body: UserCreatePayload) {
    return this.request<User>('POST', `/users`, body);
  }

  getUser(userId: string) {
    return this.request<User>('GET', `/users/${userId}`);
  }

  updateUser(userId: string, body: Partial<User>) {
    return this.request<User>('PATCH', `/users/${userId}`, body);
  }

  deleteUser(userId: string) {
    return this.request<void>('DELETE', `/users/${userId}`);
  }

  listManagedShops(userId: string) {
    return this.request<ManagedShopView[]>(
      'GET',
      `/users/${userId}/shops`,
    );
  }
}
