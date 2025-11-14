const { app } = require('@azure/functions');

import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../types/otherTypes';
import {
  CatalogProduct,
  Category,
  Shop,
  ShopCatalogEntry,
  ShopHours,
  ShopMember,
} from '../types/databaseTypes';
import { getContainer } from '../config/cosmosClient';
import {
  validateShopCreate,
  validateShopGetById,
  validateShopMembersCreate,
  validateShopMembersList,
  validateShopMembersUpdate,
  validateShopUpdate,
  validateShopHoursGet,
  validateShopHoursUpsert,
  validateUsersManagedShops,
  validateShopsMenuRequest,
} from '../utils/businessLogic';
import { getActorUserId, newId, nowIso, writeAuditLog } from '../utils/general';

type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;

const catalogProductsContainer = getContainer('products');
const shopCatalogEntriesContainer = getContainer('productsInShop');
const categoriesContainer = getContainer('categories');
const shopsContainer = getContainer('shops');
const shopMembersContainer = getContainer('shopMembers');
const shopHoursContainer = getContainer('shopHours');

const DEFAULT_PERMISSIONS = [
  'manage_catalog',
  'manage_orders',
  'manage_settings',
];

function parseBoolean(value: string | null | undefined): boolean | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return undefined;
}

/* -------------------------------------------------------------------------- */
/* Shops                                                                      */
/* -------------------------------------------------------------------------- */

app.http('shopsListAll', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const statusFilter = request.query.get('status')?.trim();
      const acceptingOrders = parseBoolean(
        request.query.get('acceptingOrders'),
      );
      const filters: string[] = [];
      const parameters: any[] = [];
      if (statusFilter) {
        filters.push('c.status = @status');
        parameters.push({ name: '@status', value: statusFilter });
      }
      if (acceptingOrders !== undefined) {
        filters.push('c.acceptingOrders = @acceptingOrders');
        parameters.push({
          name: '@acceptingOrders',
          value: acceptingOrders,
        });
      }
      let query = 'SELECT * FROM c';
      if (filters.length > 0) {
        query += ` WHERE ${filters.join(' AND ')}`;
      }
      query += ' ORDER BY c.updatedAt DESC';
      const { resources } = await shopsContainer.items
        .query<Shop>({ query, parameters })
        .fetchAll();
      return json(200, resources);
    } catch (error: any) {
      return {
        status: error.status || 500,
        body: error.message || 'Internal Server Error',
      };
    }
  },
});

app.http('shopsCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const payload = await validateShopCreate(request);
      const timestamp = nowIso();
      const shopId = newId();
      const shop: Shop = {
        id: shopId,
        kind: 'shop',
        name: payload.name,
        legalName: payload.legalName,
        address: payload.address,
        timezone: payload.timezone,
        status: payload.status ?? 'draft',
        acceptingOrders: payload.acceptingOrders ?? true,
        paymentPolicy: payload.paymentPolicy ?? 'pay_on_pickup',
        orderAcceptanceMode: payload.orderAcceptanceMode ?? 'manual',
        allowGuestCheckout: payload.allowGuestCheckout ?? true,
        fulfillmentOptions: payload.fulfillmentOptions ?? {
          pickupEnabled: true,
          deliveryEnabled: false,
        },
        defaultCurrency: payload.defaultCurrency ?? 'USD',
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const ownerMembership: ShopMember = {
        id: newId(),
        kind: 'association',
        shopId,
        userId: payload.ownerUserId.trim(),
        role: 'owner',
        permissions: DEFAULT_PERMISSIONS,
        invitationStatus: 'accepted',
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const { resource } = await shopsContainer.items.create(shop);
      await shopMembersContainer.items.create(ownerMembership);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        shopId,
        entityType: 'shop',
        entityId: shopId,
        action: 'CREATE',
        after: shop,
      });
      return json(201, resource);
    } catch (error: any) {
      return {
        status: error.status || 500,
        body: error.message || 'Failed to create shop',
      };
    }
  },
});

app.http('shopsGetById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shop = await validateShopGetById(request);
      return json(200, shop);
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

app.http('shopsUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { shop, updates } = await validateShopUpdate(request);
      const timestamp = nowIso();
      const updated: Shop = {
        ...shop,
        ...updates,
        fulfillmentOptions: {
          ...shop.fulfillmentOptions,
          ...(updates.fulfillmentOptions ?? {}),
        },
        updatedAt: timestamp,
      };
      await shopsContainer.items.upsert(updated);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        shopId: shop.id,
        entityType: 'shop',
        entityId: shop.id,
        action: 'UPDATE',
        before: shop,
        after: updated,
      });
      return json(200, updated);
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

app.http('shopsDelete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shop = await validateShopGetById(request);
      await shopsContainer.item(shop.id, shop.id).delete();
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        shopId: shop.id,
        entityType: 'shop',
        entityId: shop.id,
        action: 'DELETE',
        before: shop,
      });
      return { status: 204 };
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

/* -------------------------------------------------------------------------- */
/* Shop members                                                               */
/* -------------------------------------------------------------------------- */

app.http('shopMembersList', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/members',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { shopId } = await validateShopMembersList(request);
      const querySpec = {
        query:
          'SELECT * FROM c WHERE c.shopId = @shopId AND c.kind = @kind ORDER BY c.createdAt DESC',
        parameters: [
          { name: '@shopId', value: shopId },
          { name: '@kind', value: 'association' },
        ],
      };
      const { resources } = await shopMembersContainer.items
        .query<ShopMember>(querySpec)
        .fetchAll();
      return json(200, resources);
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

app.http('shopMembersCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/members',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { shopId, payload } = await validateShopMembersCreate(request);
      const timestamp = nowIso();
      const member: ShopMember = {
        id: newId(),
        kind: 'association',
        shopId,
        userId: payload.userId,
        role: payload.role,
        permissions: payload.permissions ?? DEFAULT_PERMISSIONS,
        invitationStatus: 'accepted',
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await shopMembersContainer.items.create(member);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        shopId,
        entityType: 'association',
        entityId: member.id,
        action: 'CREATE',
        after: member,
      });
      return json(201, member);
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

app.http('shopMembersUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/members/{memberId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { member, updates } = await validateShopMembersUpdate(request);
      const timestamp = nowIso();
      const updated: ShopMember = {
        ...member,
        ...updates,
        permissions:
          updates.permissions && updates.permissions.length > 0
            ? updates.permissions
            : member.permissions,
        updatedAt: timestamp,
      };
      await shopMembersContainer.items.upsert(updated);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        shopId: member.shopId,
        entityType: 'association',
        entityId: updated.id,
        action: 'UPDATE',
        before: member,
        after: updated,
      });
      return json(200, updated);
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

/* -------------------------------------------------------------------------- */
/* Shop hours                                                                 */
/* -------------------------------------------------------------------------- */

app.http('shopHoursGet', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/hours',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { shopId } = await validateShopHoursGet(request);
      const { resource } = await shopHoursContainer
        .item(shopId, shopId)
        .read<ShopHours>();
      return json(200, resource ?? {});
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

app.http('shopHoursUpsert', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/hours',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { shopId, payload } = await validateShopHoursUpsert(request);
      const timestamp = nowIso();
      const { resource } = await shopHoursContainer
        .item(shopId, shopId)
        .read<ShopHours>()
        .catch(() => ({ resource: undefined }));
      const hours: ShopHours = {
        id: shopId,
        kind: 'association',
        shopId,
        timezone: payload.timezone,
        weekly: payload.weekly,
        createdAt: resource?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
      await shopHoursContainer.items.upsert(hours);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        shopId,
        entityType: 'shopHours',
        entityId: shopId,
        action: resource ? 'UPDATE' : 'CREATE',
        before: resource,
        after: hours,
      });
      return json(resource ? 200 : 201, hours);
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

/* -------------------------------------------------------------------------- */
/* User-managed shops view                                                    */
/* -------------------------------------------------------------------------- */

app.http('usersGetShops', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users/{userId}/shops',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { userId } = await validateUsersManagedShops(request);
      const membershipQuery = {
        query:
          'SELECT * FROM c WHERE c.userId = @userId AND c.isActive = true',
        parameters: [{ name: '@userId', value: userId }],
      };
      const { resources: memberships } = await shopMembersContainer.items
        .query<ShopMember>(membershipQuery)
        .fetchAll();
      if (memberships.length === 0) {
        return json(200, []);
      }
      const shopIds = [...new Set(memberships.map((m) => m.shopId))];
      const shopQuery = {
        query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(@ids, c.id)',
        parameters: [{ name: '@ids', value: shopIds }],
      };
      const { resources: shops } = await shopsContainer.items
        .query<Shop>(shopQuery)
        .fetchAll();
      const shopById = new Map(shops.map((s) => [s.id, s]));
      const views = memberships
        .map((membership) => {
          const shop = shopById.get(membership.shopId);
          if (!shop) return undefined;
          return {
            shopId: shop.id,
            name: shop.name,
            status: shop.status,
            acceptingOrders: shop.acceptingOrders,
            role: membership.role,
            permissions: membership.permissions,
          };
        })
        .filter(Boolean);
      return json(200, views);
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

/* -------------------------------------------------------------------------- */
/* Menu                                                                       */
/* -------------------------------------------------------------------------- */

app.http('shopsMenu', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/menu',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { shopId, shop } = await validateShopsMenuRequest(request);
      const [{ resources: categories }, { resources: entries }] =
        await Promise.all([
          categoriesContainer.items
            .query<Category>({
              query:
                'SELECT * FROM c WHERE c.shopId = @shopId AND c.isActive = true ORDER BY c.sortOrder ASC',
              parameters: [{ name: '@shopId', value: shopId }],
            })
            .fetchAll(),
          shopCatalogEntriesContainer.items
            .query<ShopCatalogEntry>({
              query:
                'SELECT * FROM c WHERE c.shopId = @shopId AND c.isAvailable = true',
              parameters: [{ name: '@shopId', value: shopId }],
            })
            .fetchAll(),
        ]);
      const productIds = [
        ...new Set(entries.map((entry) => entry.productId)),
      ];
      const products: CatalogProduct[] =
        productIds.length === 0
          ? []
          : (
              await catalogProductsContainer.items
                .query<CatalogProduct>({
                  query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(@ids, c.id)',
                  parameters: [{ name: '@ids', value: productIds }],
                })
                .fetchAll()
            ).resources;

      return json(200, {
        shop,
        categories,
        catalogEntries: entries,
        catalogProducts: products,
      });
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

