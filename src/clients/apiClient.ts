type Money = {
  amount: number;
  currency: string;
};

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

type UserRole = 'customer' | 'shopAdmin' | 'platformAdmin';

interface FulfillmentOptions {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryRadiusKm?: number;
  deliveryFee?: Money;
  leadTimeMinutes?: number;
}

interface Shop {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

type ShopResponse = Shop;

interface ShopSettingsPayload {
  name?: string;
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

interface CreateShopRequest extends ShopSettingsPayload {
  ownerUserId: string;
}

type UpdateShopRequest = ShopSettingsPayload;

interface ShopMember {
  id: string;
  kind: 'association';
  shopId: string;
  userId: string;
  role: ShopMemberRole;
  permissions: string[];
  invitationStatus?: 'pending' | 'accepted' | 'revoked';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type ShopMemberResponse = ShopMember;

interface ShopMemberInvitePayload {
  userId: string;
  role: ShopMemberRole;
  permissions?: string[];
}

interface ShopMemberUpdatePayload {
  role?: ShopMemberRole;
  permissions?: string[];
  isActive?: boolean;
}

interface ShopHoursWindow {
  opensAt: string;
  closesAt: string;
  isClosed?: boolean;
}

interface ShopHours {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

type ShopHoursResponse = ShopHours;

interface ShopHoursPayload {
  timezone: string;
  weekly: ShopHours['weekly'];
}

interface Category {
  id: string;
  kind: 'category';
  shopId: string;
  name: string;
  description?: string;
  sortOrder?: number;
  isActive: boolean;
  parentCategoryId?: string;
  createdAt: string;
  updatedAt: string;
}

type CategoryResponse = Category;

interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentCategoryId?: string;
  sortOrder?: number;
  isActive?: boolean;
}

type UpdateCategoryRequest = CreateCategoryRequest;

interface CatalogVariant {
  id: string;
  label: string;
  basePrice: Money;
  sku?: string;
  isActive: boolean;
  attributes?: Record<string, string | number | boolean>;
}

interface CatalogVariantGroup {
  id: string;
  name: string;
  selectionMode: 'single' | 'multiple';
  variants: CatalogVariant[];
}

interface CatalogAddonOption {
  id: string;
  label: string;
  priceDelta: Money;
  isActive: boolean;
}

interface CatalogAddonGroup {
  id: string;
  name: string;
  required: boolean;
  maxSelectable?: number;
  options: CatalogAddonOption[];
}

interface CatalogProduct {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

type CatalogProductResponse = CatalogProduct;

interface MoneyInput {
  amount: number;
  currency?: string;
}

interface CatalogVariantPayload
  extends Omit<CatalogVariant, 'basePrice' | 'isActive'> {
  basePrice: MoneyInput;
  isActive?: boolean;
}

interface CatalogVariantGroupPayload
  extends Omit<CatalogVariantGroup, 'variants'> {
  variants: CatalogVariantPayload[];
}

interface CatalogAddonOptionPayload
  extends Omit<CatalogAddonOption, 'priceDelta'> {
  priceDelta: MoneyInput;
}

interface CatalogAddonGroupPayload
  extends Omit<CatalogAddonGroup, 'options'> {
  options: CatalogAddonOptionPayload[];
}

interface CreateCatalogProductRequest
  extends Omit<
    CatalogProduct,
    'id' | 'kind' | 'createdAt' | 'updatedAt' | 'variantGroups' | 'addonGroups'
  > {
  variantGroups: CatalogVariantGroupPayload[];
  addonGroups: CatalogAddonGroupPayload[];
}

type UpdateCatalogProductRequest = Partial<CreateCatalogProductRequest>;

interface ShopCatalogEntry {
  id: string;
  kind: 'shopCatalogEntry';
  shopId: string;
  productId: string;
  isAvailable: boolean;
  categoryIds: string[];
  priceOverride?: Money;
  sortOrder?: number;
  salesChannels?: Array<'pos' | 'online' | 'kiosk'>;
  createdAt: string;
  updatedAt: string;
}

type ShopCatalogEntryResponse = ShopCatalogEntry;

interface CreateShopCatalogEntryRequest
  extends Omit<
    ShopCatalogEntry,
    'id' | 'kind' | 'createdAt' | 'updatedAt' | 'shopId'
  > {}

interface OrderItemAddonSnapshot {
  addonOptionId: string;
  nameSnapshot: string;
  priceDeltaSnapshot: Money;
}

interface OrderItem {
  productId: string;
  shopCatalogEntryId?: string;
  productVariantId: string;
  productNameSnapshot: string;
  variantLabelSnapshot: string;
  finalUnitPrice: Money;
  quantity: number;
  addons: OrderItemAddonSnapshot[];
}

type OrderItemPayload = Pick<
  OrderItem,
  'productId' | 'productVariantId' | 'quantity'
> & {
  shopCatalogEntryId: string;
  addonOptionIds?: string[];
};

interface Order {
  id: string;
  kind: 'order';
  shopId: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: 'unpaid' | 'authorized' | 'paid' | 'refunded';
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

type OrderResponse = Order;

interface CreateOrderRequest {
  userId: string;
  customerName: string;
  customerPhone?: string;
  customerNotes?: string;
  items: OrderItemPayload[];
  fulfillmentType?: 'pickup' | 'delivery';
  scheduledFor?: string;
}

interface UpdateOrderStatusRequest {
  nextStatus: OrderStatus;
}

interface CategoryListResponse extends Array<CategoryResponse> {}

interface ShopMenuResponse {
  shop: ShopResponse;
  categories: CategoryResponse[];
  catalogEntries: ShopCatalogEntryResponse[];
  catalogProducts: CatalogProductResponse[];
}

interface User {
  id: string;
  kind: 'user';
  primaryEmail?: string;
  roles: UserRole[];
  profile?: {
    displayName?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    locale?: string;
  };
  createdAt: string;
  updatedAt: string;
}

type UserResponse = User;

type UserCreatePayload = {
  id: string;
  primaryEmail?: string;
  roles?: UserRole[];
};

interface ManagedShopView {
  shopId: string;
  name: string;
  status: ShopStatus;
  acceptingOrders: boolean;
  role: string;
  permissions: string[];
}

type RequestOptions = Omit<RequestInit, 'method' | 'body'>;

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
    private readonly baseUrl = 'http://localhost:7071/api',
    private readonly defaultOptions: RequestOptions = {},
  ) {}

  /* ------------------------------------------------------------------------ */
  /* Core request helpers                                                     */
  /* ------------------------------------------------------------------------ */

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
    const queryString = search.toString();
    return queryString ? `?${queryString}` : '';
  }

  /* ------------------------------------------------------------------------ */
  /* Shops                                                                    */
  /* ------------------------------------------------------------------------ */

  listShops(params?: { status?: ShopStatus; acceptingOrders?: boolean }) {
    return this.request<ShopResponse[]>(
      'GET',
      `/shops${this.buildQuery({
        status: params?.status,
        acceptingOrders: params?.acceptingOrders,
      })}`,
    );
  }

  createShop(body: CreateShopRequest) {
    return this.request<ShopResponse>('POST', '/shops', body);
  }

  getShop(shopId: string) {
    return this.request<ShopResponse>('GET', `/shops/${shopId}`);
  }

  updateShop(shopId: string, body: UpdateShopRequest) {
    return this.request<ShopResponse>('PATCH', `/shops/${shopId}`, body);
  }

  deleteShop(shopId: string) {
    return this.request<void>('DELETE', `/shops/${shopId}`);
  }

  getShopMenu(shopId: string) {
    return this.request<ShopMenuResponse>('GET', `/shops/${shopId}/menu`);
  }

  /* ------------------------------------------------------------------------ */
  /* Shop members                                                             */
  /* ------------------------------------------------------------------------ */

  listShopMembers(shopId: string) {
    return this.request<ShopMemberResponse[]>(
      'GET',
      `/shops/${shopId}/members`,
    );
  }

  createShopMember(shopId: string, body: ShopMemberInvitePayload) {
    return this.request<ShopMemberResponse>(
      'POST',
      `/shops/${shopId}/members`,
      body,
    );
  }

  updateShopMember(
    shopId: string,
    memberId: string,
    body: ShopMemberUpdatePayload,
  ) {
    return this.request<ShopMemberResponse>(
      'PATCH',
      `/shops/${shopId}/members/${memberId}`,
      body,
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Shop hours                                                               */
  /* ------------------------------------------------------------------------ */

  getShopHours(shopId: string) {
    return this.request<ShopHoursResponse>(
      'GET',
      `/shops/${shopId}/hours`,
    );
  }

  upsertShopHours(shopId: string, body: ShopHoursPayload) {
    return this.request<ShopHoursResponse>(
      'PUT',
      `/shops/${shopId}/hours`,
      body,
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Categories                                                               */
  /* ------------------------------------------------------------------------ */

  listCategories(shopId: string) {
    return this.request<CategoryResponse[]>(
      'GET',
      `/shops/${shopId}/categories`,
    );
  }

  createCategory(shopId: string, body: CreateCategoryRequest) {
    return this.request<CategoryResponse>(
      'POST',
      `/shops/${shopId}/categories`,
      body,
    );
  }

  updateCategory(
    shopId: string,
    categoryId: string,
    body: UpdateCategoryRequest,
  ) {
    return this.request<CategoryResponse>(
      'PATCH',
      `/shops/${shopId}/categories/${categoryId}`,
      body,
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Catalog products                                                         */
  /* ------------------------------------------------------------------------ */

  listCatalogProducts(params?: { ownerUserId?: string }) {
    return this.request<CatalogProductResponse[]>(
      'GET',
      `/products${this.buildQuery({ ownerUserId: params?.ownerUserId })}`,
    );
  }

  createCatalogProduct(body: CreateCatalogProductRequest) {
    return this.request<CatalogProductResponse>('POST', '/products', body);
  }

  getCatalogProduct(productId: string) {
    return this.request<CatalogProductResponse>('GET', `/products/${productId}`);
  }

  updateCatalogProduct(productId: string, body: UpdateCatalogProductRequest) {
    return this.request<CatalogProductResponse>(
      'PATCH',
      `/products/${productId}`,
      body,
    );
  }

  deleteCatalogProduct(productId: string) {
    return this.request<void>('DELETE', `/products/${productId}`);
  }

  /* ------------------------------------------------------------------------ */
  /* Shop catalog entries                                                      */
  /* ------------------------------------------------------------------------ */

  createShopCatalogEntry(shopId: string, body: CreateShopCatalogEntryRequest) {
    return this.request<ShopCatalogEntryResponse>(
      'POST',
      `/shops/${shopId}/products`,
      body,
    );
  }

  updateShopCatalogEntry(
    shopId: string,
    entryId: string,
    body: Partial<CreateShopCatalogEntryRequest>,
  ) {
    return this.request<ShopCatalogEntryResponse>(
      'PATCH',
      `/shops/${shopId}/products/${entryId}`,
      body,
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Orders                                                                   */
  /* ------------------------------------------------------------------------ */

  listShopOrders(shopId: string, params?: { status?: string }) {
    return this.request<OrderResponse[]>(
      'GET',
      `/shops/${shopId}/orders${this.buildQuery({
        status: params?.status,
      })}`,
    );
  }

  createOrder(shopId: string, body: CreateOrderRequest) {
    return this.request<OrderResponse>('POST', `/shops/${shopId}/orders`, body);
  }

  updateOrderStatus(
    shopId: string,
    orderId: string,
    body: UpdateOrderStatusRequest,
  ) {
    return this.request<OrderResponse>(
      'PATCH',
      `/shops/${shopId}/orders/${orderId}/status`,
      body,
    );
  }

  listOrders(params?: { shopId?: string; userId?: string }) {
    return this.request<OrderResponse[]>(
      'GET',
      `/orders${this.buildQuery({
        shopId: params?.shopId,
        userId: params?.userId,
      })}`,
    );
  }

  getOrder(orderId: string) {
    return this.request<OrderResponse>('GET', `/orders/${orderId}`);
  }

  updateOrder(orderId: string, body: Partial<OrderResponse>) {
    return this.request<OrderResponse>('PATCH', `/orders/${orderId}`, body);
  }

  deleteOrder(orderId: string) {
    return this.request<void>('DELETE', `/orders/${orderId}`);
  }

  /* ------------------------------------------------------------------------ */
  /* Users                                                                    */
  /* ------------------------------------------------------------------------ */

  listUsers() {
    return this.request<UserResponse[]>('GET', '/users');
  }

  createUser(body: UserCreatePayload) {
    return this.request<UserResponse>('POST', '/users', body);
  }

  getUser(userId: string) {
    return this.request<UserResponse>('GET', `/users/${userId}`);
  }

  updateUser(userId: string, body: Partial<UserResponse>) {
    return this.request<UserResponse>('PATCH', `/users/${userId}`, body);
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
interface ManagedShopView {
  shopId: string;
  name: string;
  status: ShopStatus;
  acceptingOrders: boolean;
  role: string;
  permissions: string[];
}
