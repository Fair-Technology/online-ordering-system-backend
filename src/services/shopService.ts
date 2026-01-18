import { Shop, ShopMember, ShopStatus } from '../domain/shop.entity';
import {
  createShopRepository,
  deleteShopRepository,
  getShopByIdRepository,
  getShopBySlug,
  listShopsRepository,
  updateShopRepository,
} from '../repositories/shopRepository';
import {
  createShopMemberRepository,
  listMembersByUserRepository,
  listMembersByShopRepository,
} from '../repositories/shopMemberRepository';
import { newId, nowIso } from '../utils/general';
import { createAuditLogRepository } from '../repositories/auditLogRepository';
import { getListingsForShop } from '../repositories/shopProductRepository';
import { getProductsByIds } from '../repositories/productRepository';
import { getCategoriesByNames } from '../repositories/categoryRepository';
import { buildShopMenuDTO, ShopMenuDTO } from '../domain/menu.dto';
import {
  CreateShopRequest,
  ManagedShopView,
  UpdateShopRequest,
} from '../domain/shop.dto';

export type ShopInput = CreateShopRequest;

export interface ShopFilters {
  status?: ShopStatus;
  acceptingOrders?: boolean;
}

export async function listShopsService(): Promise<Shop[]> {
  const shops = await listShopsRepository();
  return shops;
}

export async function createShopService(input: ShopInput): Promise<Shop> {
  if (!input.name?.trim()) {
    throw Object.assign(new Error('name is required'), { status: 400 });
  }
  if (!input.slug?.trim()) {
    throw Object.assign(new Error('slug is required'), { status: 400 });
  }
  if (!input.ownerUserId?.trim()) {
    throw Object.assign(new Error('ownerUserId is required'), { status: 400 });
  }

  const timestamp = nowIso();
  const shopId = newId();
  const fulfillment = {
    pickupEnabled: input.fulfillmentOptions?.pickupEnabled ?? true,
    deliveryEnabled: input.fulfillmentOptions?.deliveryEnabled ?? false,
    deliveryRadiusKm: input.fulfillmentOptions?.deliveryRadiusKm,
    deliveryFee: input.fulfillmentOptions?.deliveryFee,
    leadTimeMinutes: input.fulfillmentOptions?.leadTimeMinutes,
  };

  const shop: Shop = {
    id: shopId,
    name: input.name.trim(),
    slug: input.slug.trim(),
    ownerUserId: input.ownerUserId.trim(),
    legalName: input.legalName,
    address: input.address,
    timezone: input.timezone,
    status: input.status ?? 'draft',
    acceptingOrders: input.acceptingOrders ?? true,
    paymentPolicy: input.paymentPolicy ?? 'pay_on_pickup',
    orderAcceptanceMode: input.orderAcceptanceMode ?? 'manual',
    allowGuestCheckout: input.allowGuestCheckout ?? true,
    fulfillmentOptions: fulfillment,
    defaultCurrency: input.defaultCurrency ?? 'USD',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const created = await createShopRepository(shop);

  const ownerMember: ShopMember = {
    id: newId(),
    shopId,
    userId: input.ownerUserId.trim(),
    role: 'owner',
    invitationStatus: 'accepted',
    invitedByUserId: input.ownerUserId,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await createShopMemberRepository(ownerMember);

  await createAuditLogRepository({
    id: newId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    actor: { type: 'user', id: input.ownerUserId },
    shopId,
    entityType: 'shop',
    entityId: shopId,
    action: 'CREATE',
    before: undefined,
    after: created,
  });

  return created;
}

export async function getShopByIdService(shopId: string): Promise<Shop> {
  const shop = await getShopByIdRepository(shopId);
  if (!shop) {
    throw Object.assign(new Error('Shop not found'), { status: 404 });
  }
  return shop;
}

export async function updateShopService(
  shopId: string,
  input: UpdateShopRequest,
): Promise<Shop> {
  const existing = await getShopByIdService(shopId);
  const updated: Shop = {
    ...existing,
    name: input.name?.trim() ?? existing.name,
    slug: input.slug?.trim() ?? existing.slug,
    legalName: input.legalName ?? existing.legalName,
    address: input.address ?? existing.address,
    timezone: input.timezone ?? existing.timezone,
    status: input.status ?? existing.status,
    acceptingOrders: input.acceptingOrders ?? existing.acceptingOrders,
    paymentPolicy: input.paymentPolicy ?? existing.paymentPolicy,
    orderAcceptanceMode:
      input.orderAcceptanceMode ?? existing.orderAcceptanceMode,
    allowGuestCheckout:
      input.allowGuestCheckout ?? existing.allowGuestCheckout,
    fulfillmentOptions: {
      ...existing.fulfillmentOptions,
      ...(input.fulfillmentOptions ?? {}),
    },
    defaultCurrency: input.defaultCurrency ?? existing.defaultCurrency,
    updatedAt: nowIso(),
  };
  return updateShopRepository(updated);
}

export async function deleteShopService(shopId: string): Promise<void> {
  await deleteShopRepository(shopId);
}

export async function getShopWithMenuBySlug(
  slug: string,
): Promise<{ shop: Shop; menu: ShopMenuDTO }> {
  const shop = await getShopBySlug(slug);
  if (!shop) {
    throw Object.assign(new Error('Shop not found'), { status: 404 });
  }

  const listings = await getListingsForShop(shop.id);
  if (listings.length === 0) {
    return { shop, menu: { categories: [], products: [] } };
  }

  const productIds = [...new Set(listings.map((listing) => listing.productId))];
  const products = await getProductsByIds(productIds);
  const categoryNames = [
    ...new Set(products.flatMap((product) => product.categories ?? [])),
  ];
  const categories = await getCategoriesByNames(categoryNames);
  const listingsMap = new Map(
    listings.map((listing) => [listing.productId, listing]),
  );
  const menu = buildShopMenuDTO(products, categories, listingsMap);
  return { shop, menu };
}

export async function getShopMenuByIdService(
  shopId: string,
): Promise<{ shop: Shop; menu: ShopMenuDTO }> {
  const shop = await getShopByIdService(shopId);
  const listings = await getListingsForShop(shopId);
  if (listings.length === 0) {
    return { shop, menu: { categories: [], products: [] } };
  }
  const productIds = [...new Set(listings.map((listing) => listing.productId))];
  const products = await getProductsByIds(productIds);
  const categoryNames = [
    ...new Set(products.flatMap((product) => product.categories ?? [])),
  ];
  const categories = await getCategoriesByNames(categoryNames);
  const listingsMap = new Map(
    listings.map((listing) => [listing.productId, listing]),
  );
  const menu = buildShopMenuDTO(products, categories, listingsMap);
  return { shop, menu };
}

export async function listShopMembersService(
  shopId: string,
): Promise<ShopMember[]> {
  return listMembersByShopRepository(shopId);
}

export async function listManagedShopsService(
  userId: string,
): Promise<ManagedShopView[]> {
  const memberships = await listMembersByUserRepository(userId);
  if (memberships.length === 0) {
    return [];
  }
  const shopIds = [...new Set(memberships.map((member) => member.shopId))];
  const shops = await Promise.all(shopIds.map(getShopByIdService));
  const shopMap = new Map(shops.map((shop) => [shop.id, shop]));
  return memberships
    .map((membership) => {
      const shop = shopMap.get(membership.shopId);
      if (!shop) return null;
      return {
        shopId: shop.id,
        name: shop.name,
        status: shop.status,
        acceptingOrders: shop.acceptingOrders,
        role: membership.role,
      };
    })
    .filter((view): view is ManagedShopView => Boolean(view));
}
