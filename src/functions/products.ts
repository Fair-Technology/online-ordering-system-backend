const { app } = require('@azure/functions');

import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../domain/otherTypes';
import {
  CreateProductRequest,
  UpdateProductRequest,
} from '../domain/product.dto';
import {
  createProductService,
  deleteProductService,
  getProductByIdService,
  listProductsForShopService,
  updateProductService,
} from '../services/productService';
import { mapProductToDTO } from '../domain/menu.dto';
import { requireAuth } from '../utils/authMiddleware';

type HttpRequest = HttpRequestLike;
type HttpResponse = HttpResponseInitLike;

function parseBody<T>(request: HttpRequest): Promise<T | null> {
  return request
    .json()
    .then((body) => body as T)
    .catch(() => null);
}

app.http('productsListByShop', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'products',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    return requireAuth(request, async () => {
      try {
        const shopId = request.query.get('shopId')?.trim();
        if (!shopId) {
          return json(400, { message: 'shopId query parameter is required' });
        }
        const products = await listProductsForShopService(shopId);
        return json(200, products);
      } catch (error: any) {
        return {
          status: error.status || 500,
          body: error.message || 'Internal Server Error',
        };
      }
    });
  },
});

app.http('productsCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'products',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    return requireAuth(request, async () => {
      try {
        const body = await parseBody<CreateProductRequest>(request);
        if (!body?.shopId?.trim()) {
          return json(400, { message: 'shopId is required' });
        }
        const product = await createProductService(body.shopId.trim(), body);
        return json(201, mapProductToDTO(product));
      } catch (error: any) {
        return {
          status: error.status || 500,
          body: error.message || 'Internal Server Error',
        };
      }
    });
  },
});

app.http('productsGetByIdGeneral', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'products/{productId}',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    return requireAuth(request, async () => {
      try {
        const productId = request.params?.productId?.trim();
        if (!productId) {
          return json(400, { message: 'productId is required' });
        }
        const product = await getProductByIdService(productId);
        return json(200, mapProductToDTO(product));
      } catch (error: any) {
        return {
          status: error.status || 500,
          body: error.message || 'Internal Server Error',
        };
      }
    });
  },
});

app.http('productsUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'products/{productId}',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    return requireAuth(request, async () => {
      try {
        const productId = request.params?.productId?.trim();
        if (!productId) {
          return json(400, { message: 'productId is required' });
        }
        const body = await parseBody<UpdateProductRequest>(request);
        const product = await updateProductService(productId, body ?? {});
        return json(200, mapProductToDTO(product));
      } catch (error: any) {
        return {
          status: error.status || 500,
          body: error.message || 'Internal Server Error',
        };
      }
    });
  },
});

app.http('productsDelete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'products/{productId}',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    return requireAuth(request, async () => {
      try {
        const productId = request.params?.productId?.trim();
        if (!productId) {
          return json(400, { message: 'productId is required' });
        }
        await deleteProductService(productId);
        return { status: 204 };
      } catch (error: any) {
        return {
          status: error.status || 500,
          body: error.message || 'Internal Server Error',
        };
      }
    });
  },
});
