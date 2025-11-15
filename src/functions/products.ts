import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../types/otherTypes';
const { app } = require('@azure/functions');
import { getContainer } from '../config/cosmosClient';
import { Product, Shop } from '../types/databaseTypes';
import {
  validateProductCreate,
  validateProductUpdate,
} from '../utils/businessLogic';
import { getActorUserId, newId, nowIso, writeAuditLog } from '../utils/general';
import { hydrateProducts } from '../utils/products';
import { ProductResponse } from '../types/responseTypes';

type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;

const productsContainer = getContainer('products');
const shopsContainer = getContainer('shops');

async function readShop(shopId: string): Promise<Shop | undefined> {
  try {
    const { resource } = await shopsContainer.item(shopId, shopId).read<Shop>();
    return resource ?? undefined;
  } catch {
    return undefined;
  }
}

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

app.http('productsListAll', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'products',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const ownerUserId = request.query.get('ownerUserId')?.trim();
      const shopId = request.query.get('shopId')?.trim();
      const filters: string[] = [];
      const parameters: any[] = [];
      if (ownerUserId) {
        filters.push('c.ownerUserId = @ownerUserId');
        parameters.push({ name: '@ownerUserId', value: ownerUserId });
      }
      if (shopId) {
        filters.push('c.shopId = @shopId');
        parameters.push({ name: '@shopId', value: shopId });
      }
      let query = 'SELECT * FROM c';
      if (filters.length > 0) {
        query += ` WHERE ${filters.join(' AND ')}`;
      }
      query += ' ORDER BY c.updatedAt DESC';

      const { resources } = await productsContainer.items
        .query<Product>({ query, parameters })
        .fetchAll();
      const enriched = await hydrateProducts(resources);
      return json(200, enriched);
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

app.http('productsCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'products',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const payload = await validateProductCreate(request);
      const timestamp = nowIso();
      const product: Product = {
        id: newId(),
        shopId: payload.shopId,
        ownerUserId: payload.ownerUserId,
        title: payload.title,
        description: payload.description,
        categories: payload.categories ?? [],
        media: payload.media ?? [],
        tags: payload.tags ?? [],
        allergyInfo: payload.allergyInfo ?? [],
        variantGroups: payload.variantGroups,
        addonGroups: payload.addonGroups,
        isActive: payload.isActive ?? true,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await productsContainer.items.create(product);
      const [enriched] = await hydrateProducts([product]);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'product',
        entityId: product.id,
        action: 'CREATE',
        after: product,
      });
      return json(201, enriched);
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

app.http('productsGetByIdGeneral', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'products/{productId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const productId = request.params?.productId?.trim();
      if (!productId) {
        return json(400, { message: 'productId is required' });
      }
      const { resource } = await productsContainer
        .item(productId, productId)
        .read<Product>();
      if (!resource) {
        return json(404, { message: 'Product not found' });
      }
      const [enriched] = await hydrateProducts([resource]);
      return json(200, enriched);
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

app.http('productsUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'products/{productId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { product, updates } = await validateProductUpdate(request);
      const timestamp = nowIso();
      const updated: Product = {
        ...product,
        ...updates,
        categories: updates.categories ?? product.categories,
        variantGroups: updates.variantGroups ?? product.variantGroups,
        addonGroups: updates.addonGroups ?? product.addonGroups,
        updatedAt: timestamp,
      };
      await productsContainer.items.upsert(updated);
      const [enriched] = await hydrateProducts([updated]);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'product',
        entityId: product.id,
        action: 'UPDATE',
        before: product,
        after: updated,
      });
      return json(200, enriched);
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

app.http('productsDelete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'products/{productId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const productId = request.params?.productId?.trim();
      if (!productId) {
        return json(400, { message: 'productId is required' });
      }
      const { resource } = await productsContainer
        .item(productId, productId)
        .read<Product>();
      if (!resource) {
        return json(404, { message: 'Product not found' });
      }
      await productsContainer.item(productId, productId).delete();
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'product',
        entityId: productId,
        action: 'DELETE',
        before: resource,
      });
      return { status: 204 };
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

/* Shop-specific product endpoints removed in single-shop model */
