const { app } = require('@azure/functions');

import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../types/otherTypes';
import { ProductInShopResponse } from '../types/apiTypes';
import { newId, nowIso, writeAuditLog } from '../utils/general';
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
import {
  Category,
  Product,
  Shop,
  ShopHours,
  ShopMember,
} from '../types/databaseTypes';
import { getContainer } from '../config/cosmosClient';
type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;

const productsContainer = getContainer('products');
const productsInShopContainer = getContainer('productsInShop');
const categoriesContainer = getContainer('categories');
const shopsContainer = getContainer('shops');
const shopMembersContainer = getContainer('shopMembers');
const shopHoursContainer = getContainer('shopHours');

const DEFAULT_PERMISSIONS = ['manage_products', 'manage_orders'];

function getActorUserId(request: HttpRequestLike): string {
  return request.headers.get('x-user-id') ?? 'system';
}

// POST /shops -> create a new shop plus its owner membership and audit log
app.http('shopsCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops',
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    try {
      const body = await validateShopCreate(request);
      const { name, address, ownerUserId } = body;

      const timestamp = nowIso();
      const shop: Shop = {
        id: newId(),
        ownerUserId,
        name,
        address,
        isActive: body.isActive ?? true,
        status: body.status ?? 'open',
        acceptingOrders: body.acceptingOrders ?? true,
        paymentPolicy: body.paymentPolicy ?? 'pay_on_pickup',
        orderAcceptanceMode: body.orderAcceptanceMode ?? 'manual',
        allowGuestCheckout: body.allowGuestCheckout ?? true,
        fulfillmentOptions: {
          pickupEnabled: body.fulfillmentOptions?.pickupEnabled ?? true,
          deliveryEnabled: body.fulfillmentOptions?.deliveryEnabled ?? false,
          deliveryRadiusKm: body.fulfillmentOptions?.deliveryRadiusKm,
          deliveryFee: body.fulfillmentOptions?.deliveryFee,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const member: ShopMember = {
        id: newId(),
        shopId: shop.id,
        userId: ownerUserId.trim(),
        role: 'owner',
        permissions: DEFAULT_PERMISSIONS,
        isActive: true,
        addedAt: timestamp,
      };

      const { resource } = await shopsContainer.items.create(shop);
      await shopMembersContainer.items.create(member);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'shop',
        entityId: shop.id,
        shopId: shop.id,
        action: 'CREATE',
        after: shop,
      });

      return json(201, resource);
    } catch (error: any) {
      return json(500, {
        message: 'Failed to create shop',
        error: error?.message ?? String(error),
      });
    }
  },
});

// GET /shops/{shopId} -> fetch a single shop by id
app.http('shopsGetById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}',
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    try {
      const shop = await validateShopGetById(request);
      return json(200, shop);
    } catch (err: any) {
      const status = err.status || 500;
      return { status, body: err.message || 'Internal Server Error' };
    }
  },
});

// PATCH /shops/{shopId} -> update shop operational settings with auditing
app.http('shopsUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}',
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    try {
      const { shop, updates } = await validateShopUpdate(request);
      const updatedShop: Shop = {
        ...shop,
        ...updates,
        updatedAt: nowIso(),
      };

      await shopsContainer.items.upsert(updatedShop);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'shopSettings',
        entityId: updatedShop.id,
        shopId: updatedShop.id,
        action: 'UPDATE',
        before: shop,
        after: updatedShop,
      });

      return json(200, updatedShop);
    } catch (err: any) {
      const status = err.status || 500;
      return { status, body: err.message || 'Internal Server Error' };
    }
  },
});

// GET /shops/{shopId}/members -> list all members attached to the shop
app.http('shopMembersList', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/members',
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    try {
      const { shopId } = await validateShopMembersList(request);
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.shopId = @shopId',
        parameters: [{ name: '@shopId', value: shopId }],
      };
      const { resources } = await shopMembersContainer.items
        .query<ShopMember>(querySpec)
        .fetchAll();
      return json(200, resources);
    } catch (err: any) {
      const status = err.status || 500;
      return { status, body: err.message || 'Internal Server Error' };
    }
  },
});

// POST /shops/{shopId}/members -> add a new staff/admin member
app.http('shopMembersCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/members',
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    try {
      const { shopId, member } = await validateShopMembersCreate(request);
      const record: ShopMember = {
        id: newId(),
        shopId,
        ...member,
        addedAt: nowIso(),
      };

      await shopMembersContainer.items.create(record);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'membership',
        entityId: record.id,
        shopId,
        action: 'CREATE',
        after: record,
      });

      return json(201, record);
    } catch (err: any) {
      const status = err.status || 500;
      return { status, body: err.message || 'Internal Server Error' };
    }
  },
});

// PATCH /shops/{shopId}/members/{memberId} -> modify member role/status/permissions
app.http('shopMembersUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/members/{memberId}',
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    try {
      const { member, updates } = await validateShopMembersUpdate(request);
      const updatedMember: ShopMember = { ...member, ...updates };

      await shopMembersContainer.items.upsert(updatedMember);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'membership',
        entityId: updatedMember.id,
        shopId: updatedMember.shopId,
        action: 'UPDATE',
        before: member,
        after: updatedMember,
      });
      return json(200, updatedMember);
    } catch (err: any) {
      const status = err.status || 500;
      return { status, body: err.message || 'Internal Server Error' };
    }
  },
});

// GET /shops/{shopId}/hours -> read the configured operating hours for a shop
app.http('shopHoursGet', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/hours',
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    try {
      const { shopId } = await validateShopHoursGet(request);
      try {
        const { resource } = await shopHoursContainer
          .item(shopId, shopId)
          .read<ShopHours>();
        if (!resource) {
          return json(200, {});
        }
        return json(200, resource);
      } catch {
        return json(200, {});
      }
    } catch (err: any) {
      const status = err.status || 500;
      return { status, body: err.message || 'Internal Server Error' };
    }
  },
});

// PUT /shops/{shopId}/hours -> replace/create the operating hours document
app.http('shopHoursUpsert', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/hours',
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    try {
      const { shopId, payload } = await validateShopHoursUpsert(request);
      const timestamp = nowIso();
      let existing: ShopHours | undefined;
      try {
        const { resource } = await shopHoursContainer
          .item(shopId, shopId)
          .read<ShopHours>();
        existing = resource ?? undefined;
      } catch {
        existing = undefined;
      }

      const record: ShopHours = {
        id: shopId,
        shopId,
        timezone: payload.timezone,
        weekly: payload.weekly,
        updatedAt: timestamp,
      };

      await shopHoursContainer.items.upsert(record);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'shopHours',
        entityId: shopId,
        shopId,
        action: existing ? 'UPDATE' : 'CREATE',
        before: existing,
        after: record,
      });

      return json(existing ? 200 : 201, record);
    } catch (err: any) {
      const status = err.status || 500;
      return { status, body: err.message || 'Internal Server Error' };
    }
  },
});

// GET /users/{userId}/shops -> list shops the user can manage
app.http('usersGetShops', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users/{userId}/shops',
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    try {
      const { userId } = await validateUsersManagedShops(request);
      const membershipQuery = {
        query: 'SELECT * FROM c WHERE c.userId = @userId AND c.isActive = true',
        parameters: [{ name: '@userId', value: userId }],
      };
      const { resources: memberships } = await shopMembersContainer.items
        .query<ShopMember>(membershipQuery)
        .fetchAll();

      if (memberships.length === 0) {
        return json(200, []);
      }

      const shopIds = Array.from(
        new Set(memberships.map((member) => member.shopId)),
      );
      const shopQuery = {
        query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(@ids, c.id)',
        parameters: [{ name: '@ids', value: shopIds }],
      };
      const { resources: shops } = await shopsContainer.items
        .query<Shop>(shopQuery)
        .fetchAll();
      const shopById = new Map(shops.map((shop) => [shop.id, shop]));

      const views = memberships
        .map((membership) => {
          const shop = shopById.get(membership.shopId);
          if (!shop) {
            return undefined;
          }
          return {
            shopId: shop.id,
            name: shop.name,
            address: shop.address,
            status: shop.status,
            acceptingOrders: shop.acceptingOrders,
            pickupEnabled: shop.fulfillmentOptions?.pickupEnabled === true,
            role: membership.role,
            isActiveMember: membership.isActive,
            updatedAt: shop.updatedAt,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

      return json(200, views);
    } catch (err: any) {
      const status = err.status || 500;
      return { status, body: err.message || 'Internal Server Error' };
    }
  },
});

// GET /shops/{shopId}/menu -> fetch the full customer-facing menu payload
app.http('shopsMenu', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/menu',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { shopId, shop } = await validateShopsMenuRequest(request);
      const [{ resources: categories }, { resources: listings }] =
        await Promise.all([
          categoriesContainer.items
            .query<Category>({
              query:
                'SELECT * FROM c WHERE c.shopId = @shopId AND c.isActive = true ORDER BY c.sortOrder ASC',
              parameters: [{ name: '@shopId', value: shopId }],
            })
            .fetchAll(),
          productsInShopContainer.items
            .query<ProductInShopResponse>({
              query:
                'SELECT * FROM c WHERE c.shopId = @shopId AND c.isAvailable = true',
              parameters: [{ name: '@shopId', value: shopId }],
            })
            .fetchAll(),
        ]);

      const productIds = Array.from(
        new Set(listings.map((item) => item.productId)),
      );
      let products: Product[] = [];
      if (productIds.length > 0) {
        const { resources } = await productsContainer.items
          .query<Product>({
            query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(@ids, c.id)',
            parameters: [{ name: '@ids', value: productIds }],
          })
          .fetchAll();
        products = resources;
      }

      return json(200, {
        shop,
        categories,
        productsInShop: listings,
        products,
      });
    } catch (err: any) {
      const status = err.status || 500;
      return { status, body: err.message || 'Internal Server Error' };
    }
  },
});
