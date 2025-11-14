const { app } = require('@azure/functions');

import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../types/otherTypes';
import { Category } from '../types/databaseTypes';
import { getContainer } from '../config/cosmosClient';
import { newId, nowIso } from '../utils/general';

type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;

const categoriesContainer = getContainer('categories');

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

// GET /categories -> list categories (optionally filter by shopId)
app.http('categoriesCrudList', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'categories',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.query.get('shopId')?.trim();
      let query = 'SELECT * FROM c';
      const parameters: any[] = [];
      if (shopId) {
        query += ' WHERE c.shopId = @shopId';
        parameters.push({ name: '@shopId', value: shopId });
      }
      query += ' ORDER BY c.sortOrder ASC';

      const { resources } = await categoriesContainer.items
        .query<Category>({ query, parameters })
        .fetchAll();
      return json(200, resources);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// GET /categories/{categoryId} -> fetch details for a category
app.http('categoriesCrudGetById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'categories/{categoryId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const categoryId = request.params?.categoryId?.trim();
      if (!categoryId) {
        return missingField('categoryId');
      }

      const { resource } = await categoriesContainer
        .item(categoryId, categoryId)
        .read<Category>();
      if (!resource) {
        return json(404, { message: 'Category not found' });
      }
      return json(200, resource);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// POST /categories -> create a category record
app.http('categoriesCrudCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'categories',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const body = await readBody<Partial<Category>>(request);
      if (!body.shopId) {
        return missingField('shopId');
      }
      if (!body.name) {
        return missingField('name');
      }

      const timestamp = nowIso();
      const category: Category = {
        id: newId(),
        shopId: body.shopId.trim(),
        name: body.name,
        description: body.description,
        sortOrder: body.sortOrder,
        isActive: body.isActive ?? true,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await categoriesContainer.items.create(category);
      return json(201, category);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// PATCH /categories/{categoryId} -> update a category
app.http('categoriesCrudUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'categories/{categoryId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const categoryId = request.params?.categoryId?.trim();
      if (!categoryId) {
        return missingField('categoryId');
      }

      const { resource } = await categoriesContainer
        .item(categoryId, categoryId)
        .read<Category>();
      if (!resource) {
        return json(404, { message: 'Category not found' });
      }

      const updates = await readBody<Partial<Category>>(request);
      const updated: Category = {
        ...resource,
        ...updates,
        updatedAt: nowIso(),
      };

      await categoriesContainer.items.upsert(updated);
      return json(200, updated);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// DELETE /categories/{categoryId} -> delete a category
app.http('categoriesCrudDelete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'categories/{categoryId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const categoryId = request.params?.categoryId?.trim();
      if (!categoryId) {
        return missingField('categoryId');
      }

      const { resource } = await categoriesContainer
        .item(categoryId, categoryId)
        .read<Category>();
      if (!resource) {
        return json(404, { message: 'Category not found' });
      }

      await categoriesContainer.item(categoryId, categoryId).delete();
      return { status: 204 };
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});
