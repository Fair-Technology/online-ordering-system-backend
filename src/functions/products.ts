import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../types/otherTypes';
const { app } = require('@azure/functions');
import { getContainer } from '../config/cosmosClient';
import { Product, Shop, ShopProductMap } from '../types/databaseTypes';
import {
  validateProductCreate,
  validateProductUpdate,
} from '../utils/businessLogic';
import {
  fetchByProperty,
  getActorUserId,
  newId,
  nowIso,
  writeAuditLog,
} from '../utils/general';
import { hydrateProducts } from '../utils/products';
import { ProductResponse } from '../types/responseTypes';
import { mapProductToDTO } from '../mappers/mapProductToDTO';

type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;

const productsContainer = getContainer('products');
const shopsContainer = getContainer('shops');
const shopProductsContainer = getContainer('shopProducts');

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

app.http('allProductsOfParticularShop', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'products',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.query.get('shopId')?.trim();

      if (!shopId) {
        return json(400, { message: 'shopId query parameter is required' });
      }

      const shopProductMappings = await fetchByProperty<ShopProductMap>(
        shopProductsContainer,
        'shopId',
        shopId,
      );

      if (shopProductMappings.length === 0) {
        return json(200, []);
      }

      const listingsMap = new Map(
        shopProductMappings.map((mapping) => [mapping.productId, mapping]),
      );
      const productIds = [...listingsMap.keys()];

      const products = await fetchByProperty<Product>(
        productsContainer,
        'id',
        productIds,
      );

      const hydrated = await hydrateProducts(products, listingsMap);

      const responseToSend = hydrated.map((product) =>
        mapProductToDTO(product),
      );

      return json(200, responseToSend);
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
      const { product: productPayload, shopId } = await validateProductCreate(
        request,
      );
      const timestamp = nowIso();
      const product: Product = {
        id: newId(),
        ...productPayload,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await productsContainer.items.create(product);
      const link: ShopProductMap = {
        id: newId(),
        shopId,
        productId: product.id,
        isAvailable: productPayload.isAvailable ?? true,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await shopProductsContainer.items.create(link);
      const [enriched] = await hydrateProducts(
        [product],
        new Map([[product.id, link]]),
      );
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
      const { resources: mappings } = await shopProductsContainer.items
        .query<ShopProductMap>({
          query: 'SELECT * FROM c WHERE c.productId = @productId',
          parameters: [{ name: '@productId', value: productId }],
        })
        .fetchAll();
      await Promise.all(
        mappings.map((mapping) =>
          shopProductsContainer
            .item(mapping.id, mapping.id)
            .delete()
            .catch(() => undefined),
        ),
      );
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
