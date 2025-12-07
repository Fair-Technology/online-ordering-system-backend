const { app } = require('@azure/functions');

import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../domain/otherTypes';
import { mapCategoryToDTO } from '../domain/category.dto';
import {
  CategoryInput,
  createCategoryService,
  deleteCategoryService,
  getCategoryByIdService,
  listCategoriesService,
  updateCategoryService,
} from '../services/categoryService';

type HttpRequest = HttpRequestLike;
type HttpResponse = HttpResponseInitLike;

function parseCategoryBody(body: any): CategoryInput {
  return {
    name: typeof body?.name === 'string' ? body.name.trim() : '',
    description:
      typeof body?.description === 'string' ? body.description : undefined,
    parentCategoryId:
      typeof body?.parentCategoryId === 'string'
        ? body.parentCategoryId
        : undefined,
    position:
      typeof body?.position === 'number' ? body.position : undefined,
    isActive:
      typeof body?.isActive === 'boolean' ? body.isActive : undefined,
  };
}

async function readBody<T>(request: HttpRequest): Promise<T | null> {
  return request
    .json()
    .then((body) => body as T)
    .catch(() => null);
}

app.http('categoriesCrudList', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'categories',
  handler: async (): Promise<HttpResponse> => {
    try {
      const categories = await listCategoriesService();
      return json(
        200,
        categories.map((category) => mapCategoryToDTO(category)),
      );
    } catch (error: any) {
      return {
        status: error.status || 500,
        body: error.message || 'Internal Server Error',
      };
    }
  },
});

app.http('categoriesCrudGetById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'categories/{categoryId}',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    try {
      const categoryId = request.params?.categoryId?.trim();
      if (!categoryId) {
        return json(400, { message: 'categoryId is required' });
      }
      const category = await getCategoryByIdService(categoryId);
      return json(200, mapCategoryToDTO(category));
    } catch (error: any) {
      return {
        status: error.status || 500,
        body: error.message || 'Internal Server Error',
      };
    }
  },
});

app.http('categoriesCrudCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'categories',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    try {
      const body = await readBody(request);
      const category = await createCategoryService(parseCategoryBody(body));
      return json(201, mapCategoryToDTO(category));
    } catch (error: any) {
      return {
        status: error.status || 500,
        body: error.message || 'Internal Server Error',
      };
    }
  },
});

app.http('categoriesCrudUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'categories/{categoryId}',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    try {
      const categoryId = request.params?.categoryId?.trim();
      if (!categoryId) {
        return json(400, { message: 'categoryId is required' });
      }
      const body = await readBody(request);
      const category = await updateCategoryService(
        categoryId,
        parseCategoryBody(body),
      );
      return json(200, mapCategoryToDTO(category));
    } catch (error: any) {
      return {
        status: error.status || 500,
        body: error.message || 'Internal Server Error',
      };
    }
  },
});

app.http('categoriesCrudDelete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'categories/{categoryId}',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    try {
      const categoryId = request.params?.categoryId?.trim();
      if (!categoryId) {
        return json(400, { message: 'categoryId is required' });
      }
      await deleteCategoryService(categoryId);
      return { status: 204 };
    } catch (error: any) {
      return {
        status: error.status || 500,
        body: error.message || 'Internal Server Error',
      };
    }
  },
});
