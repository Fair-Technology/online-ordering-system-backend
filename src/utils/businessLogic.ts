import { randomUUID } from 'crypto';
import { getContainer } from '../config/cosmosClient';
import { HttpRequestLike } from '../types/otherTypes';
import {
  CatalogAddonGroupPayload,
  CatalogVariantGroupPayload,
  CreateCatalogProductRequest,
  CreateCategoryRequest,
  CreateOrderRequest,
  CreateShopCatalogEntryRequest,
  CreateShopRequest,
  MoneyInput,
  OrderItemPayload,
  ShopHoursPayload,
  ShopMemberInvitePayload,
  ShopMemberUpdatePayload,
  ShopSettingsPayload,
  UpdateCatalogProductRequest,
  UpdateCategoryRequest,
  UpdateOrderStatusRequest,
  UpdateShopRequest,
  UserCreatePayload,
} from '../types/payloadTypes';
import {
  CatalogAddonGroup,
  CatalogAddonOption,
  CatalogProduct,
  CatalogVariant,
  CatalogVariantGroup,
  Category,
  FulfillmentOptions,
  Money,
  Order,
  Shop,
  ShopCatalogEntry,
  ShopHours,
  ShopMember,
} from '../types/databaseTypes';

const usersContainer = getContainer('users');
const shopsContainer = getContainer('shops');
const shopMembersContainer = getContainer('shopMembers');
const catalogProductsContainer = getContainer('products');
const shopCatalogEntriesContainer = getContainer('productsInShop');
const categoriesContainer = getContainer('categories');

export class ValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type CatalogProductDraft = Omit<
  CatalogProduct,
  'id' | 'kind' | 'createdAt' | 'updatedAt'
>;

type ShopDraft = Omit<Shop, 'id' | 'kind' | 'createdAt' | 'updatedAt'> & {
  ownerUserId: string;
};

async function readJson<T>(req: HttpRequestLike): Promise<T | null> {
  return (await req.json().catch(() => null)) as T | null;
}

function ensureString(
  value: unknown,
  message: string,
  required = true,
): string | undefined {
  if (value === undefined || value === null) {
    if (required) {
      throw new ValidationError(message);
    }
    return undefined;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(message);
  }
  return value.trim();
}

function requireRouteParam(
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

function toMoney(
  input: MoneyInput | undefined,
  fallbackCurrency = 'USD',
  message = 'amount must be provided',
): Money | undefined {
  if (input === undefined) {
    return undefined;
  }
  if (
    typeof input !== 'object' ||
    typeof input.amount !== 'number' ||
    Number.isNaN(input.amount)
  ) {
    throw new ValidationError(message);
  }
  return {
    amount: Number(input.amount),
    currency: input.currency ?? fallbackCurrency,
  };
}

async function getShopOrThrow(shopId: string): Promise<Shop> {
  const { resource } = await shopsContainer.item(shopId, shopId).read<Shop>();
  if (!resource) {
    throw new ValidationError('Shop not found', 404);
  }
  return resource;
}

export async function validateUserCreate(
  req: HttpRequestLike,
): Promise<UserCreatePayload> {
  const payload = await readJson<UserCreatePayload>(req);
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Invalid body');
  }
  const id = ensureString(payload.id, 'id is required');
  if (!id) throw new ValidationError('id is required');

  const existing = await usersContainer
    .item(id, id)
    .read()
    .catch((error: any) => {
      const status = error?.statusCode ?? error?.code ?? error?.status;
      if (status === 404) {
        return { resource: undefined };
      }
      throw error;
    });
  if (existing.resource) {
    throw new ValidationError('User already exists');
  }
  return {
    id,
    primaryEmail: payload.primaryEmail?.trim(),
    roles: Array.isArray(payload.roles) ? payload.roles : undefined,
  };
}

export async function validateUsersGetById(req: HttpRequestLike) {
  const userId = requireRouteParam(req, 'userId');
  void userId;
  return true;
}

export async function validateShopCreate(
  req: HttpRequestLike,
): Promise<ShopDraft> {
  const payload = await readJson<CreateShopRequest>(req);
  if (!payload) {
    throw new ValidationError('Invalid body');
  }
  const ownerUserId = ensureString(
    payload.ownerUserId,
    'ownerUserId is required',
  );
  const name = ensureString(payload.name, 'name is required');
  const currency = ensureString(
    payload.defaultCurrency ?? 'USD',
    'defaultCurrency is required',
  );

  const rawFulfillment = payload.fulfillmentOptions ?? {};
  const fulfillmentOptions: FulfillmentOptions = {
    pickupEnabled: rawFulfillment.pickupEnabled ?? true,
    deliveryEnabled: rawFulfillment.deliveryEnabled ?? false,
    deliveryRadiusKm: rawFulfillment.deliveryRadiusKm,
    deliveryFee: rawFulfillment.deliveryFee,
    leadTimeMinutes: rawFulfillment.leadTimeMinutes,
  };

  return {
    ownerUserId: ownerUserId!,
    name: name!,
    legalName: payload.legalName,
    address: payload.address,
    timezone: payload.timezone,
    status: payload.status ?? 'draft',
    acceptingOrders: payload.acceptingOrders ?? true,
    paymentPolicy: payload.paymentPolicy ?? 'pay_on_pickup',
    orderAcceptanceMode: payload.orderAcceptanceMode ?? 'manual',
    allowGuestCheckout: payload.allowGuestCheckout ?? true,
    fulfillmentOptions,
    defaultCurrency: currency!,
  };
}

export async function validateShopGetById(req: HttpRequestLike) {
  const shopId = requireRouteParam(req, 'shopId');
  return getShopOrThrow(shopId);
}

export async function validateShopUpdate(
  req: HttpRequestLike,
): Promise<{ shop: Shop; updates: UpdateShopRequest }> {
  const shop = await validateShopGetById(req);
  const payload = (await readJson<UpdateShopRequest>(req)) ?? {};
  return { shop, updates: payload };
}

export async function validateShopMembersList(req: HttpRequestLike) {
  const shopId = requireRouteParam(req, 'shopId');
  await getShopOrThrow(shopId);
  return { shopId };
}

export async function validateShopMembersCreate(
  req: HttpRequestLike,
): Promise<{ shopId: string; payload: ShopMemberInvitePayload }> {
  const shopId = requireRouteParam(req, 'shopId');
  await getShopOrThrow(shopId);
  const payload = await readJson<ShopMemberInvitePayload>(req);
  if (!payload) {
    throw new ValidationError('Invalid body');
  }
  const userId = ensureString(payload.userId, 'userId is required');
  if (!userId) throw new ValidationError('userId is required');
  if (!payload.role) {
    throw new ValidationError('role is required');
  }
  return {
    shopId,
    payload: {
      userId,
      role: payload.role,
      permissions:
        Array.isArray(payload.permissions) && payload.permissions.length > 0
          ? payload.permissions
          : ['manage_catalog', 'manage_orders'],
    },
  };
}

export async function validateShopMembersUpdate(
  req: HttpRequestLike,
): Promise<{ member: ShopMember; updates: ShopMemberUpdatePayload }> {
  const shopId = requireRouteParam(req, 'shopId');
  const memberId = requireRouteParam(req, 'memberId');
  await getShopOrThrow(shopId);
  const { resource } = await shopMembersContainer
    .item(memberId, memberId)
    .read<ShopMember>();
  if (!resource || resource.shopId !== shopId) {
    throw new ValidationError('Member not found', 404);
  }
  const payload = (await readJson<ShopMemberUpdatePayload>(req)) ?? {};
  return { member: resource, updates: payload };
}

export async function validateShopHoursGet(req: HttpRequestLike) {
  const shopId = requireRouteParam(req, 'shopId');
  await getShopOrThrow(shopId);
  return { shopId };
}

export async function validateShopHoursUpsert(
  req: HttpRequestLike,
): Promise<{ shopId: string; payload: ShopHoursPayload }> {
  const shopId = requireRouteParam(req, 'shopId');
  await getShopOrThrow(shopId);
  const payload = await readJson<ShopHoursPayload>(req);
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.timezone !== 'string'
  ) {
    throw new ValidationError('timezone is required');
  }
  if (!payload.weekly || typeof payload.weekly !== 'object') {
    throw new ValidationError('weekly schedule is required');
  }
  return { shopId, payload };
}

export async function validateUsersManagedShops(req: HttpRequestLike) {
  const userId = requireRouteParam(req, 'userId');
  return { userId };
}

export async function validateShopsMenuRequest(req: HttpRequestLike) {
  const shop = await validateShopGetById(req);
  return { shopId: shop.id, shop };
}

function sanitizeVariantGroup(
  group: CatalogVariantGroupPayload,
  currency: string,
): CatalogVariantGroup {
  if (!group || typeof group !== 'object') {
    throw new ValidationError('variant group is invalid');
  }
  if (!group.name) {
    throw new ValidationError('variant group name is required');
  }
  if (!Array.isArray(group.variants) || group.variants.length === 0) {
    throw new ValidationError('variant group must contain variants');
  }
  const variants: CatalogVariant[] = group.variants.map((variant) => {
    if (!variant.label) {
      throw new ValidationError('variant label is required');
    }
    const price = toMoney(
      variant.basePrice,
      currency,
      'variant price must be provided',
    );
    if (!price) {
      throw new ValidationError('variant price must be provided');
    }
    return {
      id: variant.id ?? randomUUID(),
      label: variant.label,
      basePrice: price,
      sku: variant.sku,
      isActive: variant.isActive ?? true,
      attributes: variant.attributes ?? {},
    };
  });
  return {
    id: group.id ?? randomUUID(),
    name: group.name,
    selectionMode: group.selectionMode ?? 'single',
    variants,
  };
}

function sanitizeAddonGroup(
  group: CatalogAddonGroupPayload,
  currency: string,
): CatalogAddonGroup {
  if (!group.name) {
    throw new ValidationError('addon group name is required');
  }
  if (!Array.isArray(group.options)) {
    throw new ValidationError('addon group options are required');
  }
  const options: CatalogAddonOption[] = group.options.map((option) => {
    if (!option.label) {
      throw new ValidationError('addon option label is required');
    }
    const money = toMoney(
      option.priceDelta,
      currency,
      'addon option priceDelta is required',
    );
    if (!money) {
      throw new ValidationError('addon price is required');
    }
    return {
      id: option.id ?? randomUUID(),
      label: option.label,
      priceDelta: money,
      isActive: option.isActive ?? true,
    };
  });
  return {
    id: group.id ?? randomUUID(),
    name: group.name,
    required: group.required ?? false,
    maxSelectable: group.maxSelectable,
    options,
  };
}

export async function validateProductCreate(
  req: HttpRequestLike,
): Promise<CatalogProductDraft> {
  const payload = await readJson<CreateCatalogProductRequest>(req);
  if (!payload) {
    throw new ValidationError('Invalid body');
  }
  const title = ensureString(payload.title, 'title is required');
  if (!title) {
    throw new ValidationError('title is required');
  }
  const currency = payload.variantGroups?.[0]?.variants?.[0]?.basePrice?.currency ?? 'USD';
  const variantGroups = (payload.variantGroups ?? []).map((group) =>
    sanitizeVariantGroup(group, currency),
  );
  if (variantGroups.length === 0) {
    throw new ValidationError('At least one variant group is required');
  }
  const addonGroups = (payload.addonGroups ?? []).map((group) =>
    sanitizeAddonGroup(group, currency),
  );
  return {
    ownerUserId: payload.ownerUserId,
    title,
    description: payload.description,
    media: payload.media ?? [],
    tags: payload.tags ?? [],
    allergyInfo: payload.allergyInfo ?? [],
    variantGroups,
    addonGroups,
    isActive: payload.isActive ?? true,
  };
}

export async function validateProductUpdate(req: HttpRequestLike) {
  const productId = requireRouteParam(req, 'productId');
  const payload = (await readJson<UpdateCatalogProductRequest>(req)) ?? {};
  const { resource } = await catalogProductsContainer
    .item(productId, productId)
    .read<CatalogProduct>();
  if (!resource) {
    throw new ValidationError('Product not found', 404);
  }
  let variantGroups: CatalogVariantGroup[] | undefined;
  if (payload.variantGroups) {
    const currency =
      payload.variantGroups[0]?.variants[0]?.basePrice?.currency ??
      resource.variantGroups[0]?.variants[0]?.basePrice.currency ??
      'USD';
    variantGroups = payload.variantGroups.map((group) =>
      sanitizeVariantGroup(group, currency),
    );
  }
  let addonGroups: CatalogAddonGroup[] | undefined;
  if (payload.addonGroups) {
    const currency =
      variantGroups?.[0]?.variants[0]?.basePrice.currency ??
      resource.variantGroups[0]?.variants[0]?.basePrice.currency ??
      'USD';
    addonGroups = payload.addonGroups.map((group) =>
      sanitizeAddonGroup(group, currency),
    );
  }
  return {
    product: resource,
    updates: {
      ...payload,
      variantGroups,
      addonGroups,
    },
  };
}

export async function validateProductInShopCreate(req: HttpRequestLike) {
  const shopId = requireRouteParam(req, 'shopId');
  await getShopOrThrow(shopId);
  const payload = await readJson<CreateShopCatalogEntryRequest>(req);
  if (!payload) {
    throw new ValidationError('Invalid body');
  }
  const productId = ensureString(
    payload.productId,
    'productId is required',
  );
  if (!productId) {
    throw new ValidationError('productId is required');
  }
  const priceOverride = toMoney(payload.priceOverride);
  return {
    shopId,
    productId,
    data: {
      isAvailable: payload.isAvailable ?? true,
      categoryIds: Array.isArray(payload.categoryIds)
        ? payload.categoryIds
        : [],
      priceOverride,
      sortOrder: payload.sortOrder,
      salesChannels: payload.salesChannels ?? ['online'],
    },
  };
}

export async function validateProductInShopUpdate(req: HttpRequestLike) {
  const shopId = requireRouteParam(req, 'shopId');
  const entryId = requireRouteParam(req, 'productInShopId');
  await getShopOrThrow(shopId);
  const { resource } = await shopCatalogEntriesContainer
    .item(entryId, entryId)
    .read<ShopCatalogEntry>();
  if (!resource || resource.shopId !== shopId) {
    throw new ValidationError('Catalog entry not found', 404);
  }
  const payload =
    (await readJson<Partial<CreateShopCatalogEntryRequest>>(req)) ?? {};
  const updates: Partial<ShopCatalogEntry> = {};
  if (payload.isAvailable !== undefined) {
    updates.isAvailable = payload.isAvailable;
  }
  if (payload.categoryIds !== undefined) {
    updates.categoryIds = Array.isArray(payload.categoryIds)
      ? payload.categoryIds
      : resource.categoryIds;
  }
  if (payload.priceOverride !== undefined) {
    updates.priceOverride =
      toMoney(
        payload.priceOverride,
        resource.priceOverride?.currency ?? 'USD',
      ) ?? undefined;
  }
  if (payload.sortOrder !== undefined) {
    updates.sortOrder = payload.sortOrder;
  }
  if (payload.salesChannels !== undefined) {
    updates.salesChannels = payload.salesChannels;
  }
  return {
    shopId,
    entry: resource,
    updates,
  };
}

export async function validateCategoriesList(req: HttpRequestLike) {
  const shopId = requireRouteParam(req, 'shopId');
  await getShopOrThrow(shopId);
  return { shopId };
}

export async function validateCategoryCreate(req: HttpRequestLike) {
  const shopId = requireRouteParam(req, 'shopId');
  await getShopOrThrow(shopId);
  const payload = await readJson<CreateCategoryRequest>(req);
  if (!payload) {
    throw new ValidationError('Invalid body');
  }
  const name = ensureString(payload.name, 'name is required');
  return {
    shopId,
    data: {
      name: name!,
      description: payload.description,
      parentCategoryId: payload.parentCategoryId,
      sortOrder: payload.sortOrder,
      isActive: payload.isActive ?? true,
    },
  };
}

export async function validateCategoryUpdate(req: HttpRequestLike) {
  const shopId = requireRouteParam(req, 'shopId');
  const categoryId = requireRouteParam(req, 'categoryId');
  await getShopOrThrow(shopId);
  const { resource } = await categoriesContainer
    .item(categoryId, categoryId)
    .read<Category>();
  if (!resource) {
    throw new ValidationError('Category not found', 404);
  }
  const payload = (await readJson<UpdateCategoryRequest>(req)) ?? {};
  return { shopId, category: resource, updates: payload };
}

export function validateOrdersList(req: HttpRequestLike) {
  const shopId = requireRouteParam(req, 'shopId');
  const statusesParam = req.query?.get('status');
  const statuses = statusesParam
    ? statusesParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  return { shopId, statuses };
}

export async function validateOrdersCreate(req: HttpRequestLike) {
  const shopId = requireRouteParam(req, 'shopId');
  await getShopOrThrow(shopId);
  const payload = await readJson<CreateOrderRequest>(req);
  if (!payload) {
    throw new ValidationError('Invalid body');
  }
  const userId = ensureString(payload.userId, 'userId is required');
  const customerName = ensureString(
    payload.customerName,
    'customerName is required',
  );
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new ValidationError('items must be provided');
  }
  return {
    shopId,
    userId: userId!,
    customerName: customerName!,
    customerPhone: payload.customerPhone?.trim(),
    customerNotes: payload.customerNotes?.trim(),
    items: payload.items as OrderItemPayload[],
    fulfillmentType: payload.fulfillmentType ?? 'pickup',
    scheduledFor: payload.scheduledFor,
  };
}

export async function validateOrdersUpdateStatus(req: HttpRequestLike) {
  const shopId = requireRouteParam(req, 'shopId');
  const orderId = requireRouteParam(req, 'orderId');
  const payload = await readJson<UpdateOrderStatusRequest>(req);
  if (!payload || typeof payload.nextStatus !== 'string') {
    throw new ValidationError('nextStatus is required');
  }
  const { resource } = await getContainer('orders')
    .item(orderId, orderId)
    .read<Order>();
  if (!resource || resource.shopId !== shopId) {
    throw new ValidationError('Order not found', 404);
  }
  return { order: resource, nextStatus: payload.nextStatus };
}
