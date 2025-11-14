import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../types/otherTypes';
const { app } = require('@azure/functions');
import { getContainer } from '../config/cosmosClient';
import {
  CatalogProduct,
  Category,
  Shop,
  ShopCatalogEntry,
} from '../types/databaseTypes';
import {
  validateCategoriesList,
  validateCategoryCreate,
  validateCategoryUpdate,
  validateProductCreate,
  validateProductInShopCreate,
  validateProductInShopUpdate,
  validateProductUpdate,
} from '../utils/businessLogic';
import { getActorUserId, newId, nowIso, writeAuditLog } from '../utils/general';

type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;

const catalogProductsContainer = getContainer('products');
const shopCatalogEntriesContainer = getContainer('productsInShop');
const categoriesContainer = getContainer('categories');
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
/* Catalog products                                                           */
/* -------------------------------------------------------------------------- */

app.http('productsListAll', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'products',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const ownerUserId = request.query.get('ownerUserId')?.trim();
      let query = 'SELECT * FROM c WHERE c.kind = @kind';
      const parameters: any[] = [{ name: '@kind', value: 'catalogProduct' }];
      if (ownerUserId) {
        query += ' AND c.ownerUserId = @ownerUserId';
        parameters.push({ name: '@ownerUserId', value: ownerUserId });
      }
      query += ' ORDER BY c.updatedAt DESC';

      const { resources } = await catalogProductsContainer.items
        .query<CatalogProduct>({ query, parameters })
        .fetchAll();
      return json(200, resources);
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
      const product: CatalogProduct = {
        id: newId(),
        kind: 'catalogProduct',
        ownerUserId: payload.ownerUserId,
        title: payload.title,
        description: payload.description,
        media: payload.media ?? [],
        tags: payload.tags ?? [],
        allergyInfo: payload.allergyInfo ?? [],
        variantGroups: payload.variantGroups,
        addonGroups: payload.addonGroups,
        isActive: payload.isActive ?? true,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await catalogProductsContainer.items.create(product);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'catalogProduct',
        entityId: product.id,
        action: 'CREATE',
        after: product,
      });
      return json(201, product);
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
      const { resource } = await catalogProductsContainer
        .item(productId, productId)
        .read<CatalogProduct>();
      if (!resource) {
        return json(404, { message: 'Product not found' });
      }
      return json(200, resource);
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
      const updated: CatalogProduct = {
        ...product,
        ...updates,
        variantGroups: updates.variantGroups ?? product.variantGroups,
        addonGroups: updates.addonGroups ?? product.addonGroups,
        updatedAt: timestamp,
      };
      await catalogProductsContainer.items.upsert(updated);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'catalogProduct',
        entityId: product.id,
        action: 'UPDATE',
        before: product,
        after: updated,
      });
      return json(200, updated);
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
      const { resource } = await catalogProductsContainer
        .item(productId, productId)
        .read<CatalogProduct>();
      if (!resource) {
        return json(404, { message: 'Product not found' });
      }
      await catalogProductsContainer.item(productId, productId).delete();
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'catalogProduct',
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

/* -------------------------------------------------------------------------- */
/* Shop catalog entries                                                       */
/* -------------------------------------------------------------------------- */

app.http('productsInShopCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/products',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { shopId, productId, data } = await validateProductInShopCreate(
        request,
      );
      const shop = await readShop(shopId);
      if (!shop) {
        return json(404, { message: 'Shop not found' });
      }
      const { resource: product } = await catalogProductsContainer
        .item(productId, productId)
        .read<CatalogProduct>();
      if (!product) {
        return json(404, { message: 'Product not found' });
      }
      const timestamp = nowIso();
      const entry: ShopCatalogEntry = {
        id: newId(),
        kind: 'shopCatalogEntry',
        shopId,
        productId,
        isAvailable: data.isAvailable,
        categoryIds: data.categoryIds ?? [],
        priceOverride: data.priceOverride,
        sortOrder: data.sortOrder,
        salesChannels: data.salesChannels ?? ['online'],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await shopCatalogEntriesContainer.items.create(entry);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        shopId,
        entityType: 'shopCatalogEntry',
        entityId: entry.id,
        action: 'CREATE',
        after: entry,
      });
      return json(201, entry);
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

app.http('productsInShopUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/products/{productInShopId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { entry, updates } = await validateProductInShopUpdate(request);
      const timestamp = nowIso();
      const updated: ShopCatalogEntry = {
        ...entry,
        ...updates,
        categoryIds: updates.categoryIds ?? entry.categoryIds,
        updatedAt: timestamp,
      };
      await shopCatalogEntriesContainer.items.upsert(updated);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        shopId: entry.shopId,
        entityType: 'shopCatalogEntry',
        entityId: entry.id,
        action: 'UPDATE',
        before: entry,
        after: updated,
      });
      return json(200, updated);
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

app.http('categoriesList', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/categories',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { shopId } = await validateCategoriesList(request);
      const querySpec = {
        query:
          'SELECT * FROM c WHERE c.shopId = @shopId AND c.kind = @kind ORDER BY c.sortOrder ASC',
        parameters: [
          { name: '@shopId', value: shopId },
          { name: '@kind', value: 'category' },
        ],
      };
      const { resources } = await categoriesContainer.items
        .query<Category>(querySpec)
        .fetchAll();
      return json(200, resources);
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

app.http('categoriesCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/categories',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { shopId, data } = await validateCategoryCreate(request);
      const shop = await readShop(shopId);
      if (!shop) {
        return json(404, { message: 'Shop not found' });
      }
      const timestamp = nowIso();
      const category: Category = {
        id: newId(),
        kind: 'category',
        shopId,
        name: data.name,
        description: data.description,
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
        parentCategoryId: data.parentCategoryId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await categoriesContainer.items.create(category);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        shopId,
        entityType: 'category',
        entityId: category.id,
        action: 'CREATE',
        after: category,
      });
      return json(201, category);
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

app.http('categoriesUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/categories/{categoryId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { category, updates } = await validateCategoryUpdate(request);
      const timestamp = nowIso();
      const updated: Category = {
        ...category,
        ...updates,
        updatedAt: timestamp,
      };
      await categoriesContainer.items.upsert(updated);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        shopId: category.shopId,
        entityType: 'category',
        entityId: category.id,
        action: 'UPDATE',
        before: category,
        after: updated,
      });
      return json(200, updated);
    } catch (error: any) {
      return { status: error.status || 500, body: error.message };
    }
  },
});

