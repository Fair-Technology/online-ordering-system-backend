export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Online Ordering System API',
    version: '1.0.0',
    description:
      'REST API for managing shops and products in an online ordering system',
  },
  servers: [
    {
      url: '/api',
      description: 'API base',
    },
  ],
  paths: {
    '/shops': {
      get: {
        summary: 'Get all shops',
        tags: ['Shops'],
        responses: {
          '200': {
            description: 'List of all shops retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GetAllShopsResponse' },
              },
            },
          },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        summary: 'Create a new shop',
        tags: ['Shops'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateShopRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Shop created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ShopResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/shops/slug/{slug}': {
      get: {
        summary: 'Get shop by slug',
        tags: ['Shops'],
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Shop slug (public identifier)',
          },
        ],
        responses: {
          '200': {
            description: 'Shop retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ShopResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/shops/{shopId}': {
      get: {
        summary: 'Get shop by ID',
        tags: ['Shops'],
        parameters: [
          {
            name: 'shopId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Shop ID',
          },
        ],
        responses: {
          '200': {
            description: 'Shop retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ShopResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      patch: {
        summary: 'Update shop',
        tags: ['Shops'],
        parameters: [
          {
            name: 'shopId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Shop ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateShopRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Shop updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ShopResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        summary: 'Delete shop (soft delete)',
        tags: ['Shops'],
        parameters: [
          {
            name: 'shopId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Shop ID',
          },
        ],
        responses: {
          '200': {
            description: 'Shop deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DeleteResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/shops/{shopId}/categories': {
      get: {
        summary: 'Get categories by shop',
        tags: ['Categories'],
        parameters: [
          {
            name: 'shopId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Shop ID',
          },
        ],
        responses: {
          '200': {
            description: 'Categories retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CategoriesResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        summary: 'Create a new category',
        tags: ['Categories'],
        parameters: [
          {
            name: 'shopId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Shop ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCategoryRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Category created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CategoryResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/shops/{shopId}/categories/{categoryId}': {
      get: {
        summary: 'Get category by ID',
        tags: ['Categories'],
        parameters: [
          {
            name: 'shopId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Shop ID',
          },
          {
            name: 'categoryId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Category ID',
          },
        ],
        responses: {
          '200': {
            description: 'Category retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CategoryResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      patch: {
        summary: 'Update category',
        tags: ['Categories'],
        parameters: [
          {
            name: 'shopId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Shop ID',
          },
          {
            name: 'categoryId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Category ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateCategoryRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Category updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CategoryResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        summary: 'Delete category (soft delete)',
        tags: ['Categories'],
        parameters: [
          {
            name: 'shopId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Shop ID',
          },
          {
            name: 'categoryId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Category ID',
          },
        ],
        responses: {
          '200': {
            description: 'Category deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CategoryResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/products': {
      get: {
        summary: 'Get products by shop',
        tags: ['Products'],
        parameters: [
          {
            name: 'shopId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Shop ID to filter products',
          },
        ],
        responses: {
          '200': {
            description: 'Products retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductsResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        summary: 'Create a new product',
        tags: ['Products'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProductRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Product created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/products/{productId}': {
      get: {
        summary: 'Get product by ID',
        tags: ['Products'],
        parameters: [
          {
            name: 'productId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Product ID',
          },
          {
            name: 'shopId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Shop ID (required for partition key)',
          },
        ],
        responses: {
          '200': {
            description: 'Product retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      patch: {
        summary: 'Update product',
        tags: ['Products'],
        parameters: [
          {
            name: 'productId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Product ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProductRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Product updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        summary: 'Delete product (soft delete)',
        tags: ['Products'],
        parameters: [
          {
            name: 'productId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Product ID',
          },
          {
            name: 'shopId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Shop ID (required for partition key)',
          },
        ],
        responses: {
          '200': {
            description: 'Product deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DeleteResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/shops/{shopId}/products/{productId}/images/upload-url': {
      post: {
        summary: 'Generate upload URL for product image',
        description:
          'Generates a short-lived SAS URL for uploading product images directly to Azure Blob Storage',
        tags: ['Product Images'],
        parameters: [
          {
            name: 'shopId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Shop ID',
          },
          {
            name: 'productId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Product ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/GenerateImageUploadUrlRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Upload URL generated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GenerateImageUploadUrlResponse',
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    '/shops/{shopId}/products/{productId}/images': {
      post: {
        summary: 'Add product image metadata',
        description:
          'Confirms image upload and saves metadata to the product after successful blob storage upload',
        tags: ['Product Images'],
        parameters: [
          {
            name: 'shopId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Shop ID',
          },
          {
            name: 'productId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Product ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddProductImageRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Product image added successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductImageResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    '/orders': {
      post: {
        summary: 'Create an order and initiate payment',
        tags: ['Orders'],
        description:
          'Server recalculates the total from product prices, selected variants, and addons stored in the database. The client-submitted amount is never trusted. Returns a Stripe clientSecret for the frontend to call stripe.confirmPayment().',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CheckoutRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Order created and PaymentIntent initiated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CheckoutResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/webhooks/stripe': {
      post: {
        summary: 'Stripe webhook receiver',
        tags: ['Orders'],
        description:
          'Receives Stripe events (payment_intent.succeeded, payment_intent.payment_failed) and updates the order status. Signature is verified using STRIPE_WEBHOOK_SECRET.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Event received',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    received: { type: 'boolean', example: true },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
  },
  components: {
    schemas: {
      ShopBranding: {
        type: 'object',
        nullable: true,
        required: ['colors'],
        properties: {
          logoUrl: {
            type: 'string',
            nullable: true,
            description: 'Logo URL (must start with https://)',
            example: 'https://cdn.example.com/logo.png',
          },
          heroImageUrl: {
            type: 'string',
            nullable: true,
            description: 'Hero image URL (must start with https://)',
            example: 'https://cdn.example.com/hero.jpg',
          },
          colors: {
            type: 'object',
            required: ['primary', 'secondary', 'tertiary', 'background'],
            properties: {
              primary: {
                type: 'string',
                pattern: '^#[0-9A-Fa-f]{6}$',
                description: 'Primary brand color (hex)',
                example: '#1D4ED8',
              },
              secondary: {
                type: 'string',
                pattern: '^#[0-9A-Fa-f]{6}$',
                description: 'Secondary brand color (hex)',
                example: '#9333EA',
              },
              tertiary: {
                type: 'string',
                pattern: '^#[0-9A-Fa-f]{6}$',
                description: 'Tertiary brand color (hex)',
                example: '#F59E0B',
              },
              background: {
                type: 'string',
                pattern: '^#[0-9A-Fa-f]{6}$',
                description: 'Background color (hex)',
                example: '#F9FAFB',
              },
            },
          },
        },
      },
      GetAllShopsResponse: {
        type: 'object',
        properties: {
          shops: {
            type: 'array',
            items: { $ref: '#/components/schemas/ShopResponse' },
            description: 'Array of shops',
          },
          total: {
            type: 'integer',
            description: 'Total number of shops',
          },
        },
        required: ['shops', 'total'],
      },
      CreateShopRequest: {
        type: 'object',
        description:
          'Create a new shop. The following fields are automatically set: isDeleted=false, isPaused=false, acceptingOrders=true, allowGuestCheckout=true. The slug is auto-generated from the shop name. At least one day must have opening hours. If a shop with the same name already exists, an error will be returned.',
        required: [
          'name',
          'currency',
          'timezone',
          'minOrderAmountCents',
          'paymentPolicy',
          'address',
          'openingHours',
        ],
        properties: {
          name: {
            type: 'string',
            description: 'Shop name (slug will be auto-generated from this)',
            example: 'Burger King Belconnen',
          },
          currency: {
            type: 'string',
            example: 'AUD',
            description: 'Shop currency (ISO code)',
          },
          timezone: {
            type: 'string',
            example: 'Australia/Sydney',
            description: 'Shop timezone',
          },
          minOrderAmountCents: {
            type: 'number',
            description: 'Minimum order amount in cents',
            example: 1500,
          },
          paymentPolicy: {
            type: 'string',
            enum: ['pay_online'],
            description: 'Payment policy',
          },
          address: {
            type: 'object',
            required: ['street', 'city', 'state', 'postcode', 'country'],
            properties: {
              street: {
                type: 'string',
                description: 'Street address',
                example: '123 Main Street',
              },
              city: {
                type: 'string',
                description: 'City',
                example: 'Belconnen',
              },
              state: {
                type: 'string',
                description: 'State or territory',
                example: 'ACT',
              },
              postcode: {
                type: 'string',
                description: 'Postal code',
                example: '2617',
              },
              country: {
                type: 'string',
                description: 'Country',
                example: 'Australia',
              },
            },
          },
          pausedMessage: {
            type: 'string',
            description: 'Message when shop is paused (optional)',
          },
          orderAcceptanceMode: {
            type: 'string',
            enum: ['auto'],
            description: 'Order acceptance mode (optional, defaults to auto)',
          },
          openingHours: {
            type: 'object',
            description:
              'Shop opening hours for each day of the week. At least one day must have opening hours.',
            example: {
              mon: [{ open: '09:00', close: '17:00' }],
              tue: [{ open: '09:00', close: '17:00' }],
              wed: [],
              thu: [{ open: '09:00', close: '17:00' }],
              fri: [{ open: '09:00', close: '22:00' }],
              sat: [{ open: '10:00', close: '16:00' }],
              sun: [{ open: '11:00', close: '15:00' }],
            },
            properties: {
              mon: {
                type: 'array',
                description: 'Monday opening hours',
                items: {
                  type: 'object',
                  properties: {
                    open: {
                      type: 'string',
                      format: 'time',
                      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
                      description: 'Opening time in 24-hour format (HH:MM)',
                      example: '09:00',
                    },
                    close: {
                      type: 'string',
                      format: 'time',
                      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
                      description: 'Closing time in 24-hour format (HH:MM)',
                      example: '17:00',
                    },
                  },
                },
              },
              tue: {
                type: 'array',
                description: 'Tuesday opening hours',
                items: {
                  type: 'object',
                  properties: {
                    open: {
                      type: 'string',
                      format: 'time',
                      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
                      description: 'Opening time in 24-hour format (HH:MM)',
                      example: '09:00',
                    },
                    close: {
                      type: 'string',
                      format: 'time',
                      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
                      description: 'Closing time in 24-hour format (HH:MM)',
                      example: '17:00',
                    },
                  },
                },
              },
              wed: {
                type: 'array',
                description: 'Wednesday opening hours',
                items: {
                  type: 'object',
                  properties: {
                    open: {
                      type: 'string',
                      format: 'time',
                      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
                      description: 'Opening time in 24-hour format (HH:MM)',
                      example: '09:00',
                    },
                    close: {
                      type: 'string',
                      format: 'time',
                      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
                      description: 'Closing time in 24-hour format (HH:MM)',
                      example: '17:00',
                    },
                  },
                },
              },
              thu: {
                type: 'array',
                description: 'Thursday opening hours',
                items: {
                  type: 'object',
                  properties: {
                    open: {
                      type: 'string',
                      format: 'time',
                      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
                      description: 'Opening time in 24-hour format (HH:MM)',
                      example: '09:00',
                    },
                    close: {
                      type: 'string',
                      format: 'time',
                      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
                      description: 'Closing time in 24-hour format (HH:MM)',
                      example: '17:00',
                    },
                  },
                },
              },
              fri: {
                type: 'array',
                description: 'Friday opening hours',
                items: {
                  type: 'object',
                  properties: {
                    open: {
                      type: 'string',
                      format: 'time',
                      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
                      description: 'Opening time in 24-hour format (HH:MM)',
                      example: '09:00',
                    },
                    close: {
                      type: 'string',
                      format: 'time',
                      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
                      description: 'Closing time in 24-hour format (HH:MM)',
                      example: '17:00',
                    },
                  },
                },
              },
              sat: {
                type: 'array',
                description: 'Saturday opening hours',
                items: {
                  type: 'object',
                  properties: {
                    open: {
                      type: 'string',
                      format: 'time',
                      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
                      description: 'Opening time in 24-hour format (HH:MM)',
                      example: '10:00',
                    },
                    close: {
                      type: 'string',
                      format: 'time',
                      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
                      description: 'Closing time in 24-hour format (HH:MM)',
                      example: '16:00',
                    },
                  },
                },
              },
              sun: {
                type: 'array',
                description: 'Sunday opening hours',
                items: {
                  type: 'object',
                  properties: {
                    open: {
                      type: 'string',
                      format: 'time',
                      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
                      description: 'Opening time in 24-hour format (HH:MM)',
                      example: '10:00',
                    },
                    close: {
                      type: 'string',
                      format: 'time',
                      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
                      description: 'Closing time in 24-hour format (HH:MM)',
                      example: '15:00',
                    },
                  },
                },
              },
            },
          },
          closures: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                start: { type: 'string', format: 'date-time' },
                end: { type: 'string', format: 'date-time' },
                reason: { type: 'string' },
              },
            },
          },
          members: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                userId: { type: 'string' },
                role: { type: 'string', enum: ['owner', 'staff'] },
                isActive: { type: 'boolean' },
              },
            },
          },
          branding: {
            nullable: true,
            description: 'Shop branding configuration (optional). Set to null to disable branding.',
            $ref: '#/components/schemas/ShopBranding',
          },
        },
      },
      UpdateShopRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Shop name' },
          acceptingOrders: {
            type: 'boolean',
            description: 'Whether shop is accepting orders',
          },
          isPaused: { type: 'boolean', description: 'Whether shop is paused' },
          pausedMessage: {
            type: 'string',
            description: 'Message when shop is paused',
          },
          paymentPolicy: {
            type: 'string',
            enum: ['pay_online'],
            description: 'Payment policy',
          },
          allowGuestCheckout: {
            type: 'boolean',
            description: 'Allow guest checkout',
          },
          currency: { type: 'string', description: 'Shop currency' },
          timezone: { type: 'string', description: 'Shop timezone' },
          minOrderAmountCents: {
            type: 'number',
            description: 'Minimum order amount in cents',
          },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              postcode: { type: 'string' },
              country: { type: 'string' },
            },
          },
          branding: {
            nullable: true,
            description: 'Shop branding configuration. Set to null to clear branding.',
            $ref: '#/components/schemas/ShopBranding',
          },
        },
      },
      ShopResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Shop ID' },
          slug: { type: 'string', description: 'Shop slug' },
          name: { type: 'string', description: 'Shop name' },
          isDeleted: {
            type: 'boolean',
            description: 'Whether shop is deleted',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
          branding: {
            nullable: true,
            description: 'Shop branding configuration, or null if not configured.',
            $ref: '#/components/schemas/ShopBranding',
          },
        },
      },
      CreateCategoryRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', description: 'Category name' },
          sortOrder: { type: 'number', description: 'Sort order for display' },
        },
      },
      UpdateCategoryRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Category name' },
          sortOrder: { type: 'number', description: 'Sort order for display' },
        },
      },
      CategoryResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Category ID' },
          shopId: { type: 'string', description: 'Shop ID' },
          name: { type: 'string', description: 'Category name' },
          sortOrder: { type: 'number', description: 'Sort order for display' },
          isDeleted: {
            type: 'boolean',
            description: 'Whether category is deleted',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      CategoriesResponse: {
        type: 'array',
        items: { $ref: '#/components/schemas/CategoryResponse' },
      },
      CreateProductRequest: {
        type: 'object',
        required: ['shopId', 'name', 'description', 'price'],
        properties: {
          shopId: {
            type: 'string',
            description: 'Shop ID that owns this product',
          },
          name: { type: 'string', description: 'Product name' },
          description: { type: 'string', description: 'Product description' },
          price: { type: 'number', description: 'Product price in cents' },
          sortOrder: { type: 'number', description: 'Sort order for display' },
          categoryIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Category IDs',
          },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                url: { type: 'string' },
                isPrimary: { type: 'boolean' },
              },
            },
          },
          allergyInfo: {
            type: 'array',
            items: { type: 'string' },
            description: 'Allergy information',
          },
          isAvailable: {
            type: 'boolean',
            description: 'Whether product is available',
          },
        },
      },
      UpdateProductRequest: {
        type: 'object',
        properties: {
          shopId: {
            type: 'string',
            description: 'Shop ID (required for partition key)',
          },
          name: { type: 'string', description: 'Product name' },
          description: { type: 'string', description: 'Product description' },
          price: { type: 'number', description: 'Product price in cents' },
          sortOrder: { type: 'number', description: 'Sort order for display' },
          categoryIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Category IDs',
          },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                url: { type: 'string' },
                isPrimary: { type: 'boolean' },
              },
            },
          },
          allergyInfo: {
            type: 'array',
            items: { type: 'string' },
            description: 'Allergy information',
          },
          isAvailable: {
            type: 'boolean',
            description: 'Whether product is available',
          },
        },
      },
      ProductResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Product ID' },
          shopId: { type: 'string', description: 'Shop ID' },
          name: { type: 'string', description: 'Product name' },
          description: { type: 'string', description: 'Product description' },
          sortOrder: { type: 'number', description: 'Sort order for display' },
          price: { type: 'number', description: 'Product price in cents' },
          categories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Category ID' },
                name: { type: 'string', description: 'Category name' },
                sortOrder: {
                  type: 'number',
                  description: 'Category sort order',
                },
              },
            },
            description: 'Product categories with full details',
          },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Image ID' },
                url: { type: 'string', description: 'Image URL' },
                isPrimary: {
                  type: 'boolean',
                  description: 'Whether this is the primary image',
                },
              },
            },
            description: 'Product images',
          },
          allergyInfo: {
            type: 'array',
            items: { type: 'string' },
            description: 'Allergy information',
          },
          variantGroups: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Variant group ID' },
                name: { type: 'string', description: 'Variant group name' },
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', description: 'Option ID' },
                      name: { type: 'string', description: 'Option name' },
                      priceDelta: {
                        type: 'number',
                        description: 'Price difference in cents',
                      },
                      isAvailable: {
                        type: 'boolean',
                        description: 'Whether option is available',
                      },
                    },
                  },
                },
              },
            },
            description: 'Product variant groups (optional)',
          },
          addonGroups: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Addon group ID' },
                name: { type: 'string', description: 'Addon group name' },
                minSelectable: {
                  type: 'number',
                  description: 'Minimum selectable options',
                },
                maxSelectable: {
                  type: 'number',
                  description: 'Maximum selectable options',
                },
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', description: 'Option ID' },
                      name: { type: 'string', description: 'Option name' },
                      priceDelta: {
                        type: 'number',
                        description: 'Price difference in cents',
                      },
                      isAvailable: {
                        type: 'boolean',
                        description: 'Whether option is available',
                      },
                    },
                  },
                },
              },
            },
            description: 'Product addon groups (optional)',
          },
          isAvailable: {
            type: 'boolean',
            description: 'Whether product is available',
          },
          isDeleted: {
            type: 'boolean',
            description: 'Whether product is deleted',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      ProductsResponse: {
        type: 'array',
        items: { $ref: '#/components/schemas/ProductResponse' },
      },
      DeleteResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether deletion was successful',
          },
        },
      },
      GenerateImageUploadUrlRequest: {
        type: 'object',
        required: ['contentType'],
        properties: {
          contentType: {
            type: 'string',
            enum: ['image/jpeg', 'image/png', 'image/webp'],
            description: 'MIME type of the image to upload',
            example: 'image/jpeg',
          },
          fileName: {
            type: 'string',
            description: 'Optional filename for the image',
            example: 'product-image.jpg',
          },
          maxSizeBytes: {
            type: 'integer',
            description: 'Optional maximum file size in bytes',
            example: 5242880,
          },
        },
      },
      GenerateImageUploadUrlResponse: {
        type: 'object',
        properties: {
          imageId: {
            type: 'string',
            description: 'Unique identifier for the image',
            example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          },
          uploadUrl: {
            type: 'string',
            description:
              'Pre-signed URL for uploading the image to Azure Blob Storage',
            example:
              'https://yourstorageaccount.blob.core.windows.net/product-media/shops/shop-123/products/product-456/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg?sv=2020-04-08&st=2024-01-01T12%3A00%3A00Z&se=2024-01-01T12%3A10%3A00Z&sr=b&sp=cw&sig=...',
          },
          blobUrl: {
            type: 'string',
            description: 'Permanent URL of the blob (without SAS token)',
            example:
              'https://yourstorageaccount.blob.core.windows.net/product-media/shops/shop-123/products/product-456/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg',
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            description: 'Expiration time of the upload URL',
            example: '2024-01-01T12:10:00.000Z',
          },
        },
        required: ['imageId', 'uploadUrl', 'blobUrl', 'expiresAt'],
      },
      AddProductImageRequest: {
        type: 'object',
        required: ['imageId', 'url'],
        properties: {
          imageId: {
            type: 'string',
            description: 'Image ID returned from the upload URL generation',
            example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          },
          url: {
            type: 'string',
            description: 'Blob URL of the uploaded image',
            example:
              'https://yourstorageaccount.blob.core.windows.net/product-media/shops/shop-123/products/product-456/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg',
          },
          alt: {
            type: 'string',
            description: 'Alternative text for the image',
            example: 'Delicious pizza with pepperoni and cheese',
          },
          sortOrder: {
            type: 'integer',
            description: 'Sort order for displaying images',
            example: 1,
          },
        },
      },
      ProductImageResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Image ID',
            example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          },
          url: {
            type: 'string',
            description: 'Image URL',
            example:
              'https://yourstorageaccount.blob.core.windows.net/product-media/shops/shop-123/products/product-456/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg',
          },
          alt: {
            type: 'string',
            description: 'Alternative text for the image',
            example: 'Delicious pizza with pepperoni and cheese',
          },
          sortOrder: {
            type: 'integer',
            description: 'Sort order for displaying images',
            example: 1,
          },
          isPrimary: {
            type: 'boolean',
            description: 'Whether this is the primary product image',
            example: false,
          },
        },
        required: ['id', 'url', 'sortOrder', 'isPrimary'],
      },
      CheckoutItem: {
        type: 'object',
        required: ['productId', 'quantity'],
        properties: {
          productId: {
            type: 'string',
            description: 'Product ID',
            example: 'abc123',
          },
          quantity: {
            type: 'integer',
            minimum: 1,
            description: 'Quantity to order',
            example: 2,
          },
          selectedVariantOptionId: {
            type: 'string',
            description: 'ID of the selected variant option (e.g. size)',
            example: 'opt-uuid-large',
          },
          selectedAddonOptionIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of selected addon options',
            example: ['addon-cheese', 'addon-bacon'],
          },
        },
      },
      CheckoutRequest: {
        type: 'object',
        required: ['shopId', 'items'],
        properties: {
          shopId: {
            type: 'string',
            description: 'ID of the shop to order from',
            example: 'shop-uuid',
          },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/CheckoutItem' },
            description: 'Items to order',
          },
          customerEmail: {
            type: 'string',
            format: 'email',
            description: 'Customer email (optional)',
            example: 'customer@example.com',
          },
          customerName: {
            type: 'string',
            description: 'Customer name (optional)',
            example: 'Jane Smith',
          },
        },
      },
      CheckoutResponse: {
        type: 'object',
        required: ['orderId', 'clientSecret', 'subtotalCents', 'currency'],
        properties: {
          orderId: {
            type: 'string',
            description: 'Created order ID',
            example: 'order-uuid',
          },
          clientSecret: {
            type: 'string',
            description: 'Stripe PaymentIntent client secret. Pass this to stripe.confirmPayment() on the frontend.',
            example: 'pi_3xxx_secret_yyy',
          },
          subtotalCents: {
            type: 'integer',
            description: 'Server-computed order total in cents',
            example: 3600,
          },
          currency: {
            type: 'string',
            description: 'ISO currency code from the shop',
            example: 'AUD',
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
              },
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
              },
            },
          },
        },
      },
      Forbidden: {
        description:
          'Forbidden - Authentication required or insufficient permissions',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
              },
            },
          },
        },
      },
      InternalError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
              },
            },
          },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer token authentication',
      },
    },
  },
};
