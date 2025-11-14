import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../types/otherTypes';
type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;
const { app } = require('@azure/functions');
import { getContainer } from '../config/cosmosClient';
import { ProductInShopResponse } from '../types/apiTypes-old';
import { getActorUserId, newId, nowIso, writeAuditLog } from '../utils/general';
import { Category, Product, Shop } from '../types/databaseTypes';
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
const shopsContainer = getContainer('shops');

async function readShop(shopId: string): Promise<Shop | undefined> {
  try {
    const { resource } = await shopsContainer.item(shopId, shopId).read<Shop>();
    return resource ?? undefined;
  } catch {
    return undefined;
  }
}

// GET /products -> list products with optional owner filter
app.http('productsListAll', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'products',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const ownerUserId = request.query.get('ownerUserId')?.trim();
      let query = 'SELECT * FROM c';
      const parameters: any[] = [];
      if (ownerUserId) {
        query += ' WHERE c.ownerUserId = @ownerUserId';
        parameters.push({ name: '@ownerUserId', value: ownerUserId });
      }
      query += ' ORDER BY c.updatedAt DESC';

      const { resources } = await productsContainer.items
        .query<Product>({ query, parameters })
        .fetchAll();
      return json(200, resources);
    } catch (error: any) {
      const status = error.status || 500;
      return { status, body: error.message || 'Internal Server Error' };
    }
  },
});

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

// GET /products/{productId} -> fetch product details
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
      return json(200, resource);
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
      const { productId, updates } = await validateProductUpdate(request);
      const { resource } = await productsContainer
        .item(productId, productId)
        .read<Product>();
      if (!resource) {
        return json(404, { message: 'Product not found' });
      }

      const updated: Product = {
        ...resource,
        ...updates,
        updatedAt: nowIso(),
      };

      await productsContainer.items.upsert(updated);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'product',
        entityId: productId,
        action: 'UPDATE',
        before: resource,
        after: updated,
      });

      return json(200, updated);
    } catch (error: any) {
      const status = error.status || 500;
      return { status, body: error.message || 'Internal Server Error' };
    }
  },
});

// DELETE /products/{productId} -> delete a product
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
      const { shopId, productId, data } = await validateProductInShopCreate(
        request,
      );
      const shop = await readShop(shopId);
      if (!shop) {
        return json(404, { message: 'Shop not found' });
      }
      const { resource: product } = await productsContainer
        .item(productId, productId)
        .read<Product>();
      if (!product) {
        return json(404, { message: 'Product not found' });
      }

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
      const { shopId, productInShopId, updates } =
        await validateProductInShopUpdate(request);
      const { resource } = await productsInShopContainer
        .item(productInShopId, productInShopId)
        .read<ProductInShopResponse>();
      if (!resource || resource.shopId !== shopId) {
        return json(404, { message: 'Product listing not found' });
      }

      const updated: ProductInShopResponse = {
        ...resource,
        ...updates,
        updatedAt: nowIso(),
      };

      await productsInShopContainer.items.upsert(updated);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'productInShop',
        entityId: resource.id,
        shopId: resource.shopId,
        action: 'UPDATE',
        before: resource,
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
      const shop = await readShop(shopId);
      if (!shop) {
        return json(404, { message: 'Shop not found' });
      }

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
      const { shopId, categoryId, updates } = await validateCategoryUpdate(
        request,
      );
      const { resource } = await categoriesContainer
        .item(categoryId, categoryId)
        .read<Category>();
      if (!resource || resource.shopId !== shopId) {
        return json(404, { message: 'Category not found' });
      }

      const updated: Category = {
        ...resource,
        ...updates,
        updatedAt: nowIso(),
      };

      await categoriesContainer.items.upsert(updated);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: 'category',
        entityId: resource.id,
        shopId: resource.shopId,
        action: 'UPDATE',
        before: resource,
        after: updated,
      });

      return json(200, updated);
    } catch (error: any) {
      const status = error.status || 500;
      return { status, body: error.message || 'Internal Server Error' };
    }
  },
});
