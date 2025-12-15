const { app } = require('@azure/functions');

import { HttpResponseInitLike, json } from '../domain/otherTypes';

const openApiDocument = {
  openapi: '3.0.1',
  info: {
    title: 'Online Ordering System API',
    version: '1.0.0',
    description:
      'OpenAPI definition for the Azure Functions backing the Online Ordering System.',
  },
  servers: [{ url: '/api' }],
  security: [{ BearerAuth: [] }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Money: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
          currency: { type: 'string' },
        },
      },
      Shop: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          status: { type: 'string' },
          acceptingOrders: { type: 'boolean' },
          timezone: { type: 'string' },
          address: { type: 'string' },
        },
      },
      ProductDTO: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          description: { type: 'string' },
          isAvailable: { type: 'boolean' },
          price: { type: 'number' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          shopId: { type: 'string' },
          userId: { type: 'string' },
          status: { type: 'string' },
          customerName: { type: 'string' },
          totalAmount: { $ref: '#/components/schemas/Money' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/shops': {
      get: {
        summary: 'List shops',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Array of shops',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Shop' } },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create shop',
        security: [{ BearerAuth: [] }],
        responses: {
          201: {
            description: 'Created shop',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Shop' },
              },
            },
          },
        },
      },
    },
    '/shops/{shopId}': {
      get: {
        summary: 'Get shop by id',
        parameters: [{ name: 'shopId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Shop',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Shop' } } },
          },
          404: { description: 'Not found' },
        },
      },
      patch: {
        summary: 'Update shop',
        parameters: [{ name: 'shopId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Updated shop',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Shop' } } },
          },
        },
      },
      delete: {
        summary: 'Delete shop',
        parameters: [{ name: 'shopId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 204: { description: 'Deleted' } },
      },
    },
    '/shops/{shopId}/menu': {
      get: {
        summary: 'Get shop menu',
        parameters: [{ name: 'shopId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Menu',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    shop: { $ref: '#/components/schemas/Shop' },
                    menu: {
                      type: 'object',
                      properties: {
                        categories: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Category' },
                        },
                        products: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/ProductDTO' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/shops/slug/{slug}': {
      get: {
        summary: 'Get shop by slug',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Shop with menu' },
          404: { description: 'Not found' },
        },
      },
    },
    '/products': {
      get: {
        summary: 'List products for a shop',
        parameters: [
          { name: 'shopId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Products',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/ProductDTO' } },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create product',
        responses: {
          201: {
            description: 'Created product',
          },
        },
      },
    },
    '/products/{productId}': {
      get: {
        summary: 'Get product by id',
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Product',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductDTO' } } },
          },
          404: { description: 'Not found' },
        },
      },
      patch: { summary: 'Update product', responses: { 200: { description: 'Updated product' } } },
      delete: { summary: 'Delete product', responses: { 204: { description: 'Deleted' } } },
    },
    '/categories': {
      get: {
        summary: 'List categories',
        responses: {
          200: {
            description: 'Categories',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
              },
            },
          },
        },
      },
      post: { summary: 'Create category', responses: { 201: { description: 'Created' } } },
    },
    '/orders': {
      get: {
        summary: 'List all orders',
        responses: {
          200: {
            description: 'Orders',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
              },
            },
          },
        },
      },
    },
    '/orders/{orderId}': {
      get: {
        summary: 'Get order by id',
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Order',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } },
          },
          404: { description: 'Not found' },
        },
      },
    },
    '/shops/{shopId}/orders': {
      get: {
        summary: 'List orders for shop',
        parameters: [{ name: 'shopId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Orders',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
              },
            },
          },
        },
      },
      post: { summary: 'Create order', responses: { 201: { description: 'Created order' } } },
    },
    '/users': {
      get: {
        summary: 'List users',
        responses: {
          200: {
            description: 'Users',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/User' } },
              },
            },
          },
        },
      },
      post: { summary: 'Create user', responses: { 201: { description: 'Created user' } } },
    },
    '/users/{userId}': {
      get: {
        summary: 'Get user by id',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'User',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          404: { description: 'Not found' },
        },
      },
      delete: { summary: 'Delete user', responses: { 204: { description: 'Deleted' } } },
    },
  },
};

app.http('swaggerJson', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'swagger.json',
  handler: async (): Promise<HttpResponseInitLike> => {
    return json(200, openApiDocument);
  },
});

app.http('swaggerUi', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'swagger',
  handler: async (): Promise<HttpResponseInitLike> => {
    const specUrl = `${process.env.SWAGGER_SPEC_URL || '/api/swagger.json'}`;
    const body = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Swagger UI</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        SwaggerUIBundle({
          url: '${specUrl}',
          dom_id: '#swagger-ui',
        });
      };
    </script>
  </body>
</html>`;
    return {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
      body,
    };
  },
});
