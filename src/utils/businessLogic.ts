import { getContainer } from '../config/cosmosClient';
import { HttpRequestLike } from '../types/otherTypes';
import { UserCreatePayload } from '../types/payloadTypes';
import {
  CartItemRequest,
  CreateCategoryRequest,
  CreateOrderRequest,
  CreateProductInShopRequest,
  CreateProductRequest,
  CreateShopRequest,
  ProductInShopResponse,
  ShopSettingsUpdateRequest,
  UpdateCategoryRequest,
  UpdateOrderStatusRequest,
  UpdateProductInShopRequest,
  UpdateProductRequest,
} from '../types/apiTypes';
import {
  Category,
  Order,
  Product,
  Shop,
  ShopMember,
} from '../types/databaseTypes';

const usersContainer = getContainer('users');
const shopsContainer = getContainer('shops');
const shopMembersContainer = getContainer('shopMembers');
const productsContainer = getContainer('products');
const productsInShopContainer = getContainer('productsInShop');
const categoriesContainer = getContainer('categories');
const ordersContainer = getContainer('orders');

const DEFAULT_PERMISSIONS = ['manage_products', 'manage_orders'];

export class ValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function validateUserCreate(req: HttpRequestLike) {
  const body: UserCreatePayload = await req.json().catch(() => null);
  if (!body) {
    throw new ValidationError('Body is missing', 400);
  }
  if (!body.id) {
    throw new ValidationError('Id is missing', 400);
  }
  const itemRef = usersContainer.item(body.id);
  const existing = await itemRef.read();
  console.log(existing);
  if (existing) {
    throw new ValidationError('User already existttt', 400);
  }

  return body;
}

// Validate request for GET /users/{userId} and return the user resource if found.
export async function validateUsersGetById(req: HttpRequestLike) {
  const userId = req.params?.userId ?? null;
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new ValidationError('userId is required', 400);
  }

  // validation only: return true and let the caller perform the DB read
  return true;
}

function getRouteParam(
  req: HttpRequestLike,
  name: string,
  friendlyName = name,
): string {
  const value = req.params?.[name];
  if (!value || typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${friendlyName} is required`, 400);
  }
  return value.trim();
}

function getQueryParam(
  req: HttpRequestLike,
  name: string,
  friendlyName = name,
): string {
  const value = req.query?.get(name) ?? '';
  const trimmed = value.trim();
  if (!trimmed) {
    throw new ValidationError(`${friendlyName} is required`, 400);
  }
  return trimmed;
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0);
}

async function getShopOrThrow(shopId: string): Promise<Shop> {
  const { resource } = await shopsContainer.item(shopId, shopId).read<Shop>();
  if (!resource) {
    throw new ValidationError('Shop not found', 404);
  }
  return resource;
}

function resolvePermissions(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return DEFAULT_PERMISSIONS;
  }
  const sanitized = input.filter(
    (perm) => typeof perm === 'string' && perm.length > 0,
  );
  return sanitized.length > 0 ? sanitized : DEFAULT_PERMISSIONS;
}

function isValidFulfillmentOptions(
  value: any,
): value is CreateShopRequest['fulfillmentOptions'] {
  if (!value || typeof value !== 'object') {
    return false;
  }
  if (
    typeof value.pickupEnabled !== 'boolean' ||
    typeof value.deliveryEnabled !== 'boolean'
  ) {
    return false;
  }
  if (
    value.deliveryRadiusKm !== undefined &&
    typeof value.deliveryRadiusKm !== 'number'
  ) {
    return false;
  }
  if (
    value.deliveryFee !== undefined &&
    typeof value.deliveryFee !== 'number'
  ) {
    return false;
  }
  return true;
}

function isValidPartialFulfillmentOptions(
  value: any,
): value is Partial<CreateShopRequest['fulfillmentOptions']> {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const { pickupEnabled, deliveryEnabled, deliveryRadiusKm, deliveryFee } =
    value;
  if (pickupEnabled !== undefined && typeof pickupEnabled !== 'boolean') {
    return false;
  }
  if (deliveryEnabled !== undefined && typeof deliveryEnabled !== 'boolean') {
    return false;
  }
  if (deliveryRadiusKm !== undefined && typeof deliveryRadiusKm !== 'number') {
    return false;
  }
  if (deliveryFee !== undefined && typeof deliveryFee !== 'number') {
    return false;
  }
  return true;
}

export async function validateShopCreate(
  req: HttpRequestLike,
): Promise<
  Partial<CreateShopRequest> & {
    name: string;
    address: string;
    ownerUserId: string;
  }
> {
  const payload = (await req
    .json()
    .catch(() => null)) as Partial<CreateShopRequest> | null;
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Invalid request body');
  }
  if (!isValidFulfillmentOptions(payload.fulfillmentOptions ?? {})) {
    payload.fulfillmentOptions = {
      pickupEnabled: payload.fulfillmentOptions?.pickupEnabled ?? true,
      deliveryEnabled: payload.fulfillmentOptions?.deliveryEnabled ?? false,
      deliveryRadiusKm: payload.fulfillmentOptions?.deliveryRadiusKm,
      deliveryFee: payload.fulfillmentOptions?.deliveryFee,
    };
  }
  const { name, address, ownerUserId } = payload;
  if (!name || typeof name !== 'string') {
    throw new ValidationError('name is required');
  }
  if (!address || typeof address !== 'string') {
    throw new ValidationError('address is required');
  }
  if (!ownerUserId || typeof ownerUserId !== 'string') {
    throw new ValidationError('ownerUserId is required');
  }

  return {
    ...payload,
    name: name.trim(),
    address: address.trim(),
    ownerUserId: ownerUserId.trim(),
  };
}

export async function validateShopGetById(req: HttpRequestLike) {
  const shopId = getRouteParam(req, 'shopId');
  return getShopOrThrow(shopId);
}

export async function validateShopUpdate(req: HttpRequestLike) {
  const shop = await validateShopGetById(req);
  const payload = ((await req.json().catch(() => null)) ??
    {}) as ShopSettingsUpdateRequest;
  const updates: Partial<Shop> = {};

  if (payload.status !== undefined) {
    if (
      typeof payload.status !== 'string' ||
      !['open', 'closed'].includes(payload.status)
    ) {
      throw new ValidationError("status must be 'open' or 'closed'");
    }
    updates.status = payload.status;
  }
  if (payload.acceptingOrders !== undefined) {
    if (typeof payload.acceptingOrders !== 'boolean') {
      throw new ValidationError('acceptingOrders must be a boolean');
    }
    updates.acceptingOrders = payload.acceptingOrders;
  }
  if (payload.paymentPolicy !== undefined) {
    if (
      typeof payload.paymentPolicy !== 'string' ||
      !['pay_on_pickup', 'prepaid_only'].includes(payload.paymentPolicy)
    ) {
      throw new ValidationError(
        'paymentPolicy must be pay_on_pickup or prepaid_only',
      );
    }
    updates.paymentPolicy = payload.paymentPolicy;
  }
  if (payload.orderAcceptanceMode !== undefined) {
    if (
      typeof payload.orderAcceptanceMode !== 'string' ||
      !['manual', 'auto'].includes(payload.orderAcceptanceMode)
    ) {
      throw new ValidationError('orderAcceptanceMode must be manual or auto');
    }
    updates.orderAcceptanceMode = payload.orderAcceptanceMode;
  }
  if (payload.allowGuestCheckout !== undefined) {
    if (typeof payload.allowGuestCheckout !== 'boolean') {
      throw new ValidationError('allowGuestCheckout must be a boolean');
    }
    updates.allowGuestCheckout = payload.allowGuestCheckout;
  }
  if (payload.fulfillmentOptions !== undefined) {
    if (!isValidPartialFulfillmentOptions(payload.fulfillmentOptions)) {
      throw new ValidationError('fulfillmentOptions must be an object');
    }
    updates.fulfillmentOptions = {
      ...shop.fulfillmentOptions,
      ...payload.fulfillmentOptions,
    };
  }
  if (payload.isActive !== undefined) {
    if (typeof payload.isActive !== 'boolean') {
      throw new ValidationError('isActive must be a boolean');
    }
    updates.isActive = payload.isActive;
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError('No updatable fields provided');
  }

  return { shop, updates };
}

export async function validateShopMembersList(req: HttpRequestLike) {
  const shop = await getShopOrThrow(getRouteParam(req, 'shopId'));
  return { shopId: shop.id };
}

export async function validateShopMembersCreate(req: HttpRequestLike) {
  const shop = await getShopOrThrow(getRouteParam(req, 'shopId'));
  const body = (await req.json().catch(() => null)) ?? {};
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Body is required');
  }
  if (!body.userId || typeof body.userId !== 'string') {
    throw new ValidationError('userId is required');
  }
  if (!body.role || typeof body.role !== 'string') {
    throw new ValidationError('role is required');
  }
  if (!['admin', 'staff'].includes(body.role)) {
    throw new ValidationError("role must be 'admin' or 'staff'");
  }
  if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
    throw new ValidationError('isActive must be a boolean');
  }

  return {
    shopId: shop.id,
    member: {
      userId: body.userId.trim(),
      role: body.role,
      permissions: resolvePermissions(body.permissions),
      isActive: body.isActive ?? true,
    },
  };
}

export async function validateShopMembersUpdate(req: HttpRequestLike) {
  const shopId = getRouteParam(req, 'shopId');
  const memberId = getRouteParam(req, 'memberId');
  const { resource } = await shopMembersContainer
    .item(memberId, memberId)
    .read<ShopMember>();
  if (!resource || resource.shopId !== shopId) {
    throw new ValidationError('Member not found', 404);
  }

  const body = (await req.json().catch(() => null)) ?? {};
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Body is required');
  }

  const updates: Partial<ShopMember> = {};
  if (body.role !== undefined) {
    if (typeof body.role !== 'string') {
      throw new ValidationError('role must be owner, admin, or staff');
    }
    if (!['owner', 'admin', 'staff'].includes(body.role)) {
      throw new ValidationError('role must be owner, admin, or staff');
    }
    updates.role = body.role;
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') {
      throw new ValidationError('isActive must be a boolean');
    }
    updates.isActive = body.isActive;
  }
  if (body.permissions !== undefined) {
    updates.permissions = resolvePermissions(body.permissions);
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError('No updatable fields provided');
  }

  return { member: resource, updates };
}

export async function validateShopHoursGet(req: HttpRequestLike) {
  const shopId = getRouteParam(req, 'shopId');
  await getShopOrThrow(shopId);
  return { shopId };
}

export async function validateShopHoursUpsert(req: HttpRequestLike) {
  const shopId = getRouteParam(req, 'shopId');
  await getShopOrThrow(shopId);
  const payload = (await req.json().catch(() => null)) ?? {};
  if (!payload.timezone || typeof payload.timezone !== 'string') {
    throw new ValidationError('timezone is required');
  }
  if (
    !payload.weekly ||
    typeof payload.weekly !== 'object' ||
    Array.isArray(payload.weekly)
  ) {
    throw new ValidationError('weekly schedule is required');
  }
  return { shopId, payload: { timezone: payload.timezone.trim(), weekly: payload.weekly } };
}

export async function validateUsersManagedShops(
  req: HttpRequestLike,
): Promise<{ userId: string }> {
  const userId = getRouteParam(req, 'userId');
  return { userId };
}

export async function validateShopsMenuRequest(req: HttpRequestLike) {
  const shopId = getRouteParam(req, 'shopId');
  const shop = await getShopOrThrow(shopId);
  return { shopId, shop };
}

export async function validateProductCreate(req: HttpRequestLike) {
  const payload = (await req
    .json()
    .catch(() => null)) as Partial<CreateProductRequest> | null;
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Invalid request body');
  }

  if (!payload.ownerUserId || typeof payload.ownerUserId !== 'string') {
    throw new ValidationError('ownerUserId is required');
  }
  if (!payload.name || typeof payload.name !== 'string') {
    throw new ValidationError('name is required');
  }
  if (typeof payload.isActive !== 'boolean') {
    throw new ValidationError('isActive must be a boolean');
  }
  if (!Array.isArray(payload.variantSchemes)) {
    throw new ValidationError('variantSchemes must be an array');
  }
  if (!Array.isArray(payload.addonGroups)) {
    throw new ValidationError('addonGroups must be an array');
  }

  return {
    ownerUserId: payload.ownerUserId.trim(),
    name: payload.name.trim(),
    description:
      typeof payload.description === 'string' ? payload.description : undefined,
    isActive: payload.isActive,
    variantSchemes: payload.variantSchemes,
    addonGroups: payload.addonGroups,
  };
}

export async function validateProductUpdate(req: HttpRequestLike) {
  const productId = getRouteParam(req, 'productId');
  const { resource } = await productsContainer
    .item(productId, productId)
    .read<Product>();
  if (!resource) {
    throw new ValidationError('Product not found', 404);
  }

  const payload = ((await req.json().catch(() => null)) ??
    {}) as UpdateProductRequest;
  const updates: Partial<Product> = {};

  if (payload.name !== undefined) {
    if (typeof payload.name !== 'string') {
      throw new ValidationError('name must be a string');
    }
    updates.name = payload.name.trim();
  }
  if (payload.description !== undefined) {
    if (typeof payload.description !== 'string') {
      throw new ValidationError('description must be a string');
    }
    updates.description = payload.description;
  }
  if (payload.variantSchemes !== undefined) {
    if (!Array.isArray(payload.variantSchemes)) {
      throw new ValidationError('variantSchemes must be an array');
    }
    updates.variantSchemes = payload.variantSchemes;
  }
  if (payload.addonGroups !== undefined) {
    if (!Array.isArray(payload.addonGroups)) {
      throw new ValidationError('addonGroups must be an array');
    }
    updates.addonGroups = payload.addonGroups;
  }
  if (payload.isActive !== undefined) {
    if (typeof payload.isActive !== 'boolean') {
      throw new ValidationError('isActive must be a boolean');
    }
    updates.isAvailable = payload.isActive;
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError('No updatable fields provided');
  }

  return { product: resource, updates, productId };
}

export async function validateProductInShopCreate(req: HttpRequestLike) {
  const shop = await getShopOrThrow(getRouteParam(req, 'shopId'));
  const payload = (await req
    .json()
    .catch(() => null)) as Partial<CreateProductInShopRequest> | null;
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Invalid request body');
  }
  if (!payload.productId || typeof payload.productId !== 'string') {
    throw new ValidationError('productId is required');
  }
  const productId = payload.productId.trim();
  const { resource: product } = await productsContainer
    .item(productId, productId)
    .read<Product>();
  if (!product) {
    throw new ValidationError('Product not found', 404);
  }
  if (
    payload.isAvailable === undefined ||
    typeof payload.isAvailable !== 'boolean'
  ) {
    throw new ValidationError('isAvailable must be provided');
  }
  if (!Array.isArray(payload.categoryIds)) {
    throw new ValidationError('categoryIds must be an array');
  }

  return {
    shop,
    product,
    data: {
      productId: product.id,
      priceOverride:
        payload.priceOverride !== undefined
          ? Number(payload.priceOverride)
          : undefined,
      isAvailable: payload.isAvailable,
      categoryIds: sanitizeStringArray(payload.categoryIds),
      sortOrder:
        payload.sortOrder !== undefined ? Number(payload.sortOrder) : undefined,
    },
  };
}

export async function validateProductInShopUpdate(req: HttpRequestLike) {
  const shopId = getRouteParam(req, 'shopId');
  const listingId = getRouteParam(req, 'productInShopId');
  const { resource } = await productsInShopContainer
    .item(listingId, listingId)
    .read<ProductInShopResponse>();
  if (!resource || resource.shopId !== shopId) {
    throw new ValidationError('Product listing not found', 404);
  }

  const payload = ((await req.json().catch(() => null)) ??
    {}) as UpdateProductInShopRequest;
  const updates: Partial<ProductInShopResponse> = {};

  if (payload.isAvailable !== undefined) {
    if (typeof payload.isAvailable !== 'boolean') {
      throw new ValidationError('isAvailable must be a boolean');
    }
    updates.isAvailable = payload.isAvailable;
  }
  if (payload.priceOverride !== undefined) {
    updates.priceOverride = Number(payload.priceOverride);
  }
  if (payload.categoryIds !== undefined) {
    if (!Array.isArray(payload.categoryIds)) {
      throw new ValidationError('categoryIds must be an array');
    }
    updates.categoryIds = sanitizeStringArray(payload.categoryIds);
  }
  if (payload.sortOrder !== undefined) {
    updates.sortOrder = Number(payload.sortOrder);
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError('No updatable fields provided');
  }

  return { listing: resource, updates };
}

export async function validateCategoriesList(req: HttpRequestLike) {
  const shop = await getShopOrThrow(getRouteParam(req, 'shopId'));
  return { shopId: shop.id };
}

export async function validateCategoryCreate(req: HttpRequestLike) {
  const shop = await getShopOrThrow(getRouteParam(req, 'shopId'));
  const payload = (await req
    .json()
    .catch(() => null)) as Partial<CreateCategoryRequest> | null;
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Invalid request body');
  }
  if (!payload.name || typeof payload.name !== 'string') {
    throw new ValidationError('name is required');
  }

  return {
    shopId: shop.id,
    data: {
      name: payload.name.trim(),
      description:
        payload.description && typeof payload.description === 'string'
          ? payload.description
          : undefined,
      sortOrder:
        payload.sortOrder !== undefined ? Number(payload.sortOrder) : undefined,
      isActive: payload.isActive ?? true,
    },
  };
}

export async function validateCategoryUpdate(req: HttpRequestLike) {
  const shopId = getRouteParam(req, 'shopId');
  const categoryId = getRouteParam(req, 'categoryId');
  const { resource } = await categoriesContainer
    .item(categoryId, categoryId)
    .read<Category>();
  if (!resource || resource.shopId !== shopId) {
    throw new ValidationError('Category not found', 404);
  }

  const payload = (await req.json().catch(() => null)) ?? {};
  const updates: Partial<Category> = {};

  if (payload.name !== undefined) {
    if (typeof payload.name !== 'string') {
      throw new ValidationError('name must be a string');
    }
    updates.name = payload.name.trim();
  }
  if (payload.description !== undefined) {
    if (typeof payload.description !== 'string') {
      throw new ValidationError('description must be a string');
    }
    updates.description = payload.description;
  }
  if (payload.sortOrder !== undefined) {
    updates.sortOrder = Number(payload.sortOrder);
  }
  if (payload.isActive !== undefined) {
    updates.isActive = Boolean(payload.isActive);
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError('No updatable fields provided');
  }

  return { category: resource, updates };
}

export function validateCartGet(req: HttpRequestLike) {
  const shopId = getRouteParam(req, 'shopId');
  const userId = getQueryParam(req, 'userId', 'userId query parameter');
  return { shopId, userId };
}

export async function validateCartPut(req: HttpRequestLike) {
  const shopId = getRouteParam(req, 'shopId');
  const payload = (await req
    .json()
    .catch(() => null)) as Partial<{
    userId: string;
    items: CartItemRequest[];
  }> | null;
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Invalid request body');
  }
  if (!payload.userId || typeof payload.userId !== 'string') {
    throw new ValidationError('userId is required');
  }
  const userId = payload.userId.trim();
  if (!userId) {
    throw new ValidationError('userId is required');
  }
  if (!Array.isArray(payload.items)) {
    throw new ValidationError('items must be an array');
  }

  return { shopId, userId, items: payload.items as CartItemRequest[] };
}

export async function validateOrdersCreate(req: HttpRequestLike) {
  const shop = await getShopOrThrow(getRouteParam(req, 'shopId'));
  const payload = (await req
    .json()
    .catch(() => null)) as Partial<CreateOrderRequest> | null;
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Invalid request body');
  }

  const userId =
    typeof payload.userId === 'string' ? payload.userId.trim() : '';
  const customerName =
    typeof payload.customerName === 'string'
      ? payload.customerName.trim()
      : '';

  if (!userId || !customerName) {
    throw new ValidationError('userId and customerName are required');
  }

  const cartId =
    typeof payload.cartId === 'string' && payload.cartId.trim().length > 0
      ? payload.cartId.trim()
      : undefined;
  const items = Array.isArray(payload.items)
    ? (payload.items as CartItemRequest[])
    : undefined;

  if (!cartId && !items) {
    throw new ValidationError('Provide either cartId or items');
  }

  const customerPhone =
    typeof payload.customerPhone === 'string' ? payload.customerPhone : undefined;
  const customerNotes =
    typeof payload.customerNotes === 'string' ? payload.customerNotes : undefined;

  return {
    shop,
    shopId: shop.id,
    userId,
    customerName,
    customerPhone,
    customerNotes,
    cartId,
    items,
  };
}

export function validateOrdersList(req: HttpRequestLike) {
  const shopId = getRouteParam(req, 'shopId');
  const statusFilter = req.query?.get('status') ?? '';
  const statuses = statusFilter
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return { shopId, statuses };
}

export async function validateOrdersUpdateStatus(req: HttpRequestLike) {
  const shopId = getRouteParam(req, 'shopId');
  const orderId = getRouteParam(req, 'orderId');
  const payload = (await req
    .json()
    .catch(() => null)) as UpdateOrderStatusRequest | null;
  if (
    !payload ||
    typeof payload !== 'object' ||
    !payload.nextStatus ||
    typeof payload.nextStatus !== 'string'
  ) {
    throw new ValidationError('nextStatus is required');
  }

  const { resource } = await ordersContainer
    .item(orderId, orderId)
    .read<Order>();
  if (!resource || resource.shopId !== shopId) {
    throw new ValidationError('Order not found', 404);
  }

  return { shopId, order: resource, nextStatus: payload.nextStatus };
}
