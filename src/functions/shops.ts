const { app } = require('@azure/functions');

import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../types/otherTypes';
import {
  Product,
  ProductCategory,
  Shop,
  ShopHours,
  ShopMember,
  ShopProductMap,
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
import { hydrateProducts } from '../utils/products';
import { mapShopToDTO } from '../mappers/mapShopToDTO';

type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;

const productsContainer = getContainer('products');
const categoriesContainer = getContainer('categories');
const shopProductsContainer = getContainer('shopProducts');
const shopsContainer = getContainer('shops');
const shopMembersContainer = getContainer('shopMembers');
const shopHoursContainer = getContainer('shopHours');

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
        name: payload.name,
        slug: payload.slug,
        ownerUserId: payload.ownerUserId,
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
        shopId,
        userId: payload.ownerUserId.trim(),
        role: 'owner',
        invitationStatus: 'accepted',
        invitedByUserId: payload.ownerUserId,
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

app.http('shopsGetBySlug', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/slug/{slug}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const slug = request.params?.slug?.trim();
      if (!slug) {
        return json(400, { message: 'slug is required' });
      }

      const { resources } = await shopsContainer.items
        .query<Shop>({
          query: 'SELECT * FROM c WHERE c.slug = @slug',
          parameters: [{ name: '@slug', value: slug }],
        })
        .fetchAll();

      const shop = resources[0];
      if (!shop) {
        return json(404, { message: 'Shoppp not found' });
      }

      const menu = mapShopToDTO(shop);

      return json(200, { shop, menu });
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
          'SELECT * FROM c WHERE c.shopId = @shopId ORDER BY c.createdAt DESC',
        parameters: [{ name: '@shopId', value: shopId }],
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
        shopId,
        userId: payload.userId,
        role: payload.role,
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
        query: 'SELECT * FROM c WHERE c.userId = @userId AND c.isActive = true',
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
      const { resources: listings } = await shopProductsContainer.items
        .query<ShopProductMap>({
          query:
            'SELECT * FROM c WHERE c.shopId = @shopId AND c.isAvailable = true',
          parameters: [{ name: '@shopId', value: shopId }],
        })
        .fetchAll();

      const listingsMap = new Map(
        listings.map((entry) => [entry.productId, entry]),
      );
      const productIds = [...new Set(listings.map((entry) => entry.productId))];
      if (productIds.length === 0) {
        return json(200, { shop, categories: [], products: [] });
      }

      const { resources: products } = await productsContainer.items
        .query<Product>({
          query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(@ids, c.id)',
          parameters: [{ name: '@ids', value: productIds }],
        })
        .fetchAll();

      const categoryNames = [
        ...new Set(products.flatMap((product) => product.categories ?? [])),
      ];
      let categories: ProductCategory[] = [];
      if (categoryNames.length > 0) {
        const { resources } = await categoriesContainer.items
          .query<ProductCategory>({
            query:
              'SELECT * FROM c WHERE ARRAY_CONTAINS(@names, c.name) AND c.isActive = true ORDER BY c.position ASC',
            parameters: [{ name: '@names', value: categoryNames }],
          })
          .fetchAll();
        categories = resources;
      }

      const enrichedProducts = await hydrateProducts(products, listingsMap);

      return json(200, {
        shop,
        categories,
        products: enrichedProducts,
      });
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});
