const { app } = require('@azure/functions');

import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../types/otherTypes';
import { ShopCatalogEntry } from '../types/databaseTypes';
import { getContainer } from '../config/cosmosClient';
import { newId, nowIso } from '../utils/general';

type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;

const productsInShopContainer = getContainer('productsInShop');

async function readBody<T>(request: HttpRequest): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error('Invalid JSON body');
  }
}

function missingField(field: string): HttpResponseInit {
  return json(400, { message: `${field} is required` });
}

// GET /productsInShop -> list product listings with optional filters
app.http('productsInShopListAll', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'productsInShop',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.query.get('shopId')?.trim();
      const productId = request.query.get('productId')?.trim();
      const filters: string[] = [];
      const parameters: any[] = [{ name: '@kind', value: 'shopCatalogEntry' }];

      if (shopId) {
        filters.push('c.shopId = @shopId');
        parameters.push({ name: '@shopId', value: shopId });
      }
      if (productId) {
        filters.push('c.productId = @productId');
        parameters.push({ name: '@productId', value: productId });
      }

      let query = 'SELECT * FROM c WHERE c.kind = @kind';
      if (filters.length > 0) {
        query += ` AND ${filters.join(' AND ')}`;
      }
      query += ' ORDER BY c.updatedAt DESC';

      const { resources } = await productsInShopContainer.items
        .query<ShopCatalogEntry>({ query, parameters })
        .fetchAll();
      return json(200, resources);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// GET /productsInShop/{listingId} -> fetch a single listing
app.http('productsInShopGetById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'productsInShop/{listingId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const listingId = request.params?.listingId?.trim();
      if (!listingId) {
        return missingField('listingId');
      }
      const { resource } = await productsInShopContainer
        .item(listingId, listingId)
        .read<ShopCatalogEntry>();
      if (!resource) {
        return json(404, { message: 'Product listing not found' });
      }
      return json(200, resource);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// POST /productsInShop -> create a listing
app.http('productsInShopCreateGeneral', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'productsInShop',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const body = await readBody<Partial<ShopCatalogEntry>>(request);
      if (!body.shopId) {
        return missingField('shopId');
      }
      if (!body.productId) {
        return missingField('productId');
      }

      const timestamp = nowIso();
      const record: ShopCatalogEntry = {
        id: newId(),
        kind: 'shopCatalogEntry',
        shopId: body.shopId.trim(),
        productId: body.productId.trim(),
        priceOverride: body.priceOverride,
        isAvailable: body.isAvailable ?? true,
        categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds : [],
        sortOrder: body.sortOrder,
        salesChannels: body.salesChannels ?? ['online'],
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await productsInShopContainer.items.create(record);
      return json(201, record);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// PATCH /productsInShop/{listingId} -> update listing metadata
app.http('productsInShopUpdateGeneral', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'productsInShop/{listingId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const listingId = request.params?.listingId?.trim();
      if (!listingId) {
        return missingField('listingId');
      }

      const { resource } = await productsInShopContainer
        .item(listingId, listingId)
        .read<ShopCatalogEntry>();
      if (!resource) {
        return json(404, { message: 'Product listing not found' });
      }

      const updates = await readBody<Partial<ShopCatalogEntry>>(request);
      if (
        updates.categoryIds !== undefined &&
        !Array.isArray(updates.categoryIds)
      ) {
        return json(400, { message: 'categoryIds must be an array' });
      }

      const updated: ShopCatalogEntry = {
        ...resource,
        ...updates,
        categoryIds:
          updates.categoryIds !== undefined
            ? updates.categoryIds
            : resource.categoryIds,
        updatedAt: nowIso(),
      };

      await productsInShopContainer.items.upsert(updated);
      return json(200, updated);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// DELETE /productsInShop/{listingId} -> remove a listing
app.http('productsInShopDeleteGeneral', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'productsInShop/{listingId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const listingId = request.params?.listingId?.trim();
      if (!listingId) {
        return missingField('listingId');
      }

      const { resource } = await productsInShopContainer
        .item(listingId, listingId)
        .read<ShopCatalogEntry>();
      if (!resource) {
        return json(404, { message: 'Product listing not found' });
      }

      await productsInShopContainer.item(listingId, listingId).delete();
      return { status: 204 };
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});
