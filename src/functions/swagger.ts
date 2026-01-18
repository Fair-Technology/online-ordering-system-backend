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
      FulfillmentOptions: {
        type: 'object',
        properties: {
          pickupEnabled: { type: 'boolean' },
          deliveryEnabled: { type: 'boolean' },
          deliveryRadiusKm: { type: 'number' },
          deliveryFee: { type: 'number' },
        },
      },
      Shop: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          status: { type: 'string' },
          acceptingOrders: { type: 'boolean' },
          timezone: { type: 'string' },
          address: { type: 'string' },
          fulfillment: { $ref: '#/components/schemas/FulfillmentOptions' },
          updatedAt: { type: 'string' },
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
      ShopMember: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          shopId: { type: 'string' },
          userId: { type: 'string' },
          role: { type: 'string' },
          invitationStatus: { type: 'string' },
          invitedByUserId: { type: 'string' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
      },
      ShopHoursWindow: {
        type: 'object',
        properties: {
          opensAt: { type: 'string' },
          closesAt: { type: 'string' },
          isClosed: { type: 'boolean' },
        },
      },
      ShopHours: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          shopId: { type: 'string' },
          timezone: { type: 'string' },
          weekly: {
            type: 'object',
            properties: {
              monday: {
                type: 'array',
                items: { $ref: '#/components/schemas/ShopHoursWindow' },
              },
              tuesday: {
                type: 'array',
                items: { $ref: '#/components/schemas/ShopHoursWindow' },
              },
              wednesday: {
                type: 'array',
                items: { $ref: '#/components/schemas/ShopHoursWindow' },
              },
              thursday: {
                type: 'array',
                items: { $ref: '#/components/schemas/ShopHoursWindow' },
              },
              friday: {
                type: 'array',
                items: { $ref: '#/components/schemas/ShopHoursWindow' },
              },
              saturday: {
                type: 'array',
                items: { $ref: '#/components/schemas/ShopHoursWindow' },
              },
              sunday: {
                type: 'array',
                items: { $ref: '#/components/schemas/ShopHoursWindow' },
              },
            },
          },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
      },
      PrincipalRef: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          id: { type: 'string' },
          scope: { type: 'string' },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          actor: { $ref: '#/components/schemas/PrincipalRef' },
          shopId: { type: 'string' },
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          action: { type: 'string' },
          before: { type: 'object' },
          after: { type: 'object' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
      },
      ManagedShopView: {
        type: 'object',
        properties: {
          shopId: { type: 'string' },
          name: { type: 'string' },
          status: { type: 'string' },
          acceptingOrders: { type: 'boolean' },
          role: { type: 'string' },
        },
      },
      ShopMenu: {
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
        security: [],
        parameters: [{ name: 'shopId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Menu',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ShopMenu' },
              },
            },
          },
        },
      },
    },
    '/shops/slug/{slug}': {
      get: {
        summary: 'Get shop by slug',
        security: [],
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Shop',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Shop' } } },
          },
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
      patch: {
        summary: 'Update user',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          500: { description: 'Not implemented' },
        },
      },
      delete: { summary: 'Delete user', responses: { 204: { description: 'Deleted' } } },
    },
    '/users/{userId}/shops': {
      get: {
        summary: 'List shops managed by user',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Managed shops',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/ManagedShopView' } },
              },
            },
          },
        },
      },
    },
    '/shops/{shopId}/members': {
      get: {
        summary: 'List shop members',
        parameters: [{ name: 'shopId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Members',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/ShopMember' } },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create shop member',
        parameters: [{ name: 'shopId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          201: {
            description: 'Created member',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ShopMember' } } },
          },
        },
      },
    },
    '/shops/{shopId}/members/{memberId}': {
      patch: {
        summary: 'Update shop member',
        parameters: [
          { name: 'shopId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'memberId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Updated member',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ShopMember' } } },
          },
        },
      },
    },
    '/shopMembers': {
      get: {
        summary: 'List shop members',
        responses: {
          200: {
            description: 'Members',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/ShopMember' } },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create shop member',
        responses: {
          201: {
            description: 'Created member',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ShopMember' } } },
          },
        },
      },
    },
    '/shopMembers/{memberId}': {
      get: {
        summary: 'Get shop member by id',
        parameters: [{ name: 'memberId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Member',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ShopMember' } } },
          },
          404: { description: 'Not found' },
        },
      },
      patch: {
        summary: 'Update shop member',
        parameters: [{ name: 'memberId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Updated member',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ShopMember' } } },
          },
        },
      },
      delete: { summary: 'Delete shop member', responses: { 204: { description: 'Deleted' } } },
    },
    '/shopHours': {
      get: {
        summary: 'List shop hours',
        parameters: [{ name: 'shopId', in: 'query', required: false, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Shop hours records',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/ShopHours' } },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create shop hours',
        responses: {
          201: {
            description: 'Created shop hours',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ShopHours' } } },
          },
        },
      },
    },
    '/shopHours/{recordId}': {
      get: {
        summary: 'Get shop hours by id',
        parameters: [{ name: 'recordId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Shop hours',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ShopHours' } } },
          },
          404: { description: 'Not found' },
        },
      },
      patch: {
        summary: 'Update shop hours',
        parameters: [{ name: 'recordId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Updated shop hours',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ShopHours' } } },
          },
        },
      },
      delete: { summary: 'Delete shop hours', responses: { 204: { description: 'Deleted' } } },
    },
    '/auditLogs': {
      get: {
        summary: 'List audit logs',
        parameters: [
          { name: 'shopId', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'entityType', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'entityId', in: 'query', required: false, schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Audit logs',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create audit log',
        responses: {
          201: {
            description: 'Created audit log',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuditLog' } } },
          },
        },
      },
    },
    '/auditLogs/{logId}': {
      get: {
        summary: 'Get audit log by id',
        parameters: [{ name: 'logId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Audit log',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuditLog' } } },
          },
          404: { description: 'Not found' },
        },
      },
      patch: {
        summary: 'Update audit log',
        parameters: [{ name: 'logId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Updated audit log',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuditLog' } } },
          },
        },
      },
      delete: { summary: 'Delete audit log', responses: { 204: { description: 'Deleted' } } },
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
