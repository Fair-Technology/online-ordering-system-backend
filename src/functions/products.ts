import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../types/otherTypes';
type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;
const { app } = require('@azure/functions');
import { getContainer } from '../config/cosmosClient';
import { ProductInShopResponse } from '../types/apiTypes';
import { newId, nowIso, writeAuditLog } from '../utils/general';
import { Category, Product } from '../types/databaseTypes';
import {
  validateCategoriesList,
  validateCategoryCreate,
  validateCategoryUpdate,
  validateProductCreate,
  validateProductInShopCreate,
  validateProductInShopUpdate,
  validateProductUpdate,
} from '../utils/businessLogic';

const productsContainer = getContainer('products');
const productsInShopContainer = getContainer('productsInShop');
const categoriesContainer = getContainer('categories');

function getActorUserId(request: HttpRequest): string {
  return request.headers.get('x-user-id') ?? 'system';
}

// POST /products -> create a global catalog product definition
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
        ownerUserId: payload.ownerUserId,
        name: payload.name,
        description: payload.description,
        isAvailable: payload.isActive,
        createdAt: timestamp,
        updatedAt: timestamp,
        variantSchemes: payload.variantSchemes,
        addonGroups: payload.addonGroups,
      };

      await productsContainer.items.create(product);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'product',
        entityId: product.id,
        action: 'CREATE',
        after: product,
      });

      return json(201, product);
    } catch (error: any) {
      const status = error.status || 500;
      return { status, body: error.message || 'Internal Server Error' };
    }
  },
});

// PATCH /products/{productId} -> update global product fields
app.http('productsUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'products/{productId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { product, updates, productId } = await validateProductUpdate(
        request,
      );

      const updated: Product = {
        ...product,
        ...updates,
        updatedAt: nowIso(),
      };

      await productsContainer.items.upsert(updated);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'product',
        entityId: productId,
        action: 'UPDATE',
        before: product,
        after: updated,
      });

      return json(200, updated);
    } catch (error: any) {
      const status = error.status || 500;
      return { status, body: error.message || 'Internal Server Error' };
    }
  },
});

// POST /shops/{shopId}/products -> create a shop-specific product listing
app.http('productsInShopCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/products',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { shop, product, data } = await validateProductInShopCreate(
        request,
      );

      const timestamp = nowIso();
      const record: ProductInShopResponse = {
        id: newId(),
        productId: product.id,
        shopId: shop.id,
        priceOverride: data.priceOverride,
        isAvailable: data.isAvailable,
        categoryIds: data.categoryIds,
        sortOrder: data.sortOrder,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await productsInShopContainer.items.create(record);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'productInShop',
        entityId: record.id,
        shopId: shop.id,
        action: 'CREATE',
        after: record,
      });

      return json(201, record);
    } catch (error: any) {
      const status = error.status || 500;
      return { status, body: error.message || 'Internal Server Error' };
    }
  },
});

// PATCH /shops/{shopId}/products/{productInShopId} -> edit listing metadata
app.http('productsInShopUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/products/{productInShopId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { listing, updates } = await validateProductInShopUpdate(request);

      const updated: ProductInShopResponse = {
        ...listing,
        ...updates,
        updatedAt: nowIso(),
      };

      await productsInShopContainer.items.upsert(updated);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'productInShop',
        entityId: listing.id,
        shopId: listing.shopId,
        action: 'UPDATE',
        before: listing,
        after: updated,
      });

      return json(200, updated);
    } catch (error: any) {
      const status = error.status || 500;
      return { status, body: error.message || 'Internal Server Error' };
    }
  },
});

// GET /shops/{shopId}/categories -> list categories for a shop
app.http('categoriesList', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/categories',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { shopId } = await validateCategoriesList(request);
      const querySpec = {
        query:
          'SELECT * FROM c WHERE c.shopId = @shopId ORDER BY c.sortOrder ASC',
        parameters: [{ name: '@shopId', value: shopId }],
      };
      const { resources } = await categoriesContainer.items
        .query<Category>(querySpec)
        .fetchAll();
      return json(200, resources);
    } catch (error: any) {
      const status = error.status || 500;
      return { status, body: error.message || 'Internal Server Error' };
    }
  },
});

// POST /shops/{shopId}/categories -> create a new category
app.http('categoriesCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/categories',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { shopId, data } = await validateCategoryCreate(request);

      const timestamp = nowIso();
      const category: Category = {
        id: newId(),
        shopId,
        name: data.name,
        description: data.description,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await categoriesContainer.items.create(category);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'category',
        entityId: category.id,
        shopId,
        action: 'CREATE',
        after: category,
      });

      return json(201, category);
    } catch (error: any) {
      const status = error.status || 500;
      return { status, body: error.message || 'Internal Server Error' };
    }
  },
});

// PATCH /shops/{shopId}/categories/{categoryId} -> update category fields
app.http('categoriesUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/categories/{categoryId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { category, updates } = await validateCategoryUpdate(request);

      const updated: Category = {
        ...category,
        ...updates,
        updatedAt: nowIso(),
      };

      await categoriesContainer.items.upsert(updated);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'category',
        entityId: category.id,
        shopId: category.shopId,
        action: 'UPDATE',
        before: category,
        after: updated,
      });

      return json(200, updated);
    } catch (error: any) {
      const status = error.status || 500;
      return { status, body: error.message || 'Internal Server Error' };
    }
  },
});
