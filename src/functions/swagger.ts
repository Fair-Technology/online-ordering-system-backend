const { app } = require('@azure/functions');

import { HttpRequestLike, HttpResponseInitLike, json } from '../domain/otherTypes';
import { requireAuth } from '../utils/authMiddleware';

const defaultErrorResponses: Record<string, any> = {
  400: {
    description: 'Validation error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ValidationError' },
      },
    },
  },
  500: {
    description: 'Server error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiError' },
      },
    },
  },
};

const unauthorizedError: Record<string, any> = {
  401: {
    description: 'Unauthorized',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiError' },
      },
    },
  },
};

const notFoundError: Record<string, any> = {
  404: {
    description: 'Resource not found',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiError' },
      },
    },
  },
};

const schemas = {
  DocumentBase: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      tenantId: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      archivedAt: { type: 'string', format: 'date-time' },
      version: { type: 'integer' },
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
      metadata: {
        type: 'object',
        additionalProperties: true,
      },
    },
    required: ['id', 'createdAt', 'updatedAt'],
  },
  ApiError: {
    type: 'object',
    properties: {
      message: { type: 'string' },
      code: { type: 'string' },
      details: {},
    },
    required: ['message'],
  },
  ValidationError: {
    type: 'object',
    properties: {
      message: { type: 'string' },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            message: { type: 'string' },
          },
          required: ['path', 'message'],
        },
      },
    },
    required: ['message', 'errors'],
  },
  Money: {
    type: 'object',
    properties: {
      amount: { type: 'number' },
      currency: { type: 'string' },
    },
    required: ['amount', 'currency'],
  },
  MoneyInput: {
    type: 'object',
    properties: {
      amount: { type: 'number' },
      currency: { type: 'string' },
    },
    required: ['amount'],
  },
  ShopStatus: {
    type: 'string',
    enum: ['draft', 'open', 'closed', 'suspended'],
  },
  PaymentPolicy: {
    type: 'string',
    enum: ['pay_on_pickup', 'prepaid_only'],
  },
  OrderAcceptanceMode: {
    type: 'string',
    enum: ['auto', 'manual'],
  },
  ShopMemberRole: {
    type: 'string',
    enum: ['owner', 'manager', 'staff', 'viewer'],
  },
  OrderStatus: {
    type: 'string',
    enum: ['placed', 'accepted', 'rejected', 'ready_for_pickup', 'completed', 'cancelled'],
  },
  PaymentStatus: {
    type: 'string',
    enum: ['unpaid', 'authorized', 'paid', 'refunded'],
  },
  FulfillmentOptions: {
    type: 'object',
    properties: {
      pickupEnabled: { type: 'boolean' },
      deliveryEnabled: { type: 'boolean' },
      deliveryRadiusKm: { type: 'number' },
      deliveryFee: { $ref: '#/components/schemas/Money' },
      leadTimeMinutes: { type: 'number' },
    },
    required: ['pickupEnabled', 'deliveryEnabled'],
  },
  Shop: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      status: { $ref: '#/components/schemas/ShopStatus' },
      acceptingOrders: { type: 'boolean' },
      timezone: { type: 'string' },
      address: { type: 'string' },
      fulfillment: {
        type: 'object',
        properties: {
          pickupEnabled: { type: 'boolean' },
          deliveryEnabled: { type: 'boolean' },
          deliveryRadiusKm: { type: 'number' },
          deliveryFee: { type: 'number' },
        },
        required: ['pickupEnabled', 'deliveryEnabled'],
      },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'name', 'status', 'acceptingOrders', 'fulfillment', 'updatedAt'],
  },
  ShopInput: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      slug: { type: 'string' },
      ownerUserId: { type: 'string' },
      legalName: { type: 'string' },
      address: { type: 'string' },
      timezone: { type: 'string' },
      status: { $ref: '#/components/schemas/ShopStatus' },
      acceptingOrders: { type: 'boolean' },
      paymentPolicy: { $ref: '#/components/schemas/PaymentPolicy' },
      orderAcceptanceMode: { $ref: '#/components/schemas/OrderAcceptanceMode' },
      allowGuestCheckout: { type: 'boolean' },
      fulfillmentOptions: { $ref: '#/components/schemas/FulfillmentOptions' },
      defaultCurrency: { type: 'string' },
    },
    required: ['name', 'slug', 'ownerUserId'],
  },
  ShopUpdateInput: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      slug: { type: 'string' },
      legalName: { type: 'string' },
      address: { type: 'string' },
      timezone: { type: 'string' },
      status: { $ref: '#/components/schemas/ShopStatus' },
      acceptingOrders: { type: 'boolean' },
      paymentPolicy: { $ref: '#/components/schemas/PaymentPolicy' },
      orderAcceptanceMode: { $ref: '#/components/schemas/OrderAcceptanceMode' },
      allowGuestCheckout: { type: 'boolean' },
      fulfillmentOptions: { $ref: '#/components/schemas/FulfillmentOptions' },
      defaultCurrency: { type: 'string' },
    },
  },
  ShopMenuDTO: {
    type: 'object',
    properties: {
      categories: {
        type: 'array',
        items: { $ref: '#/components/schemas/ProductCategory' },
      },
      products: {
        type: 'array',
        items: { $ref: '#/components/schemas/ProductDTO' },
      },
    },
    required: ['categories', 'products'],
  },
  ShopWithMenuResponse: {
    type: 'object',
    properties: {
      shop: { $ref: '#/components/schemas/Shop' },
      menu: { $ref: '#/components/schemas/ShopMenuDTO' },
    },
    required: ['shop', 'menu'],
  },
  ManagedShopView: {
    type: 'object',
    properties: {
      shopId: { type: 'string' },
      name: { type: 'string' },
      status: { $ref: '#/components/schemas/ShopStatus' },
      acceptingOrders: { type: 'boolean' },
      role: { $ref: '#/components/schemas/ShopMemberRole' },
    },
    required: ['shopId', 'name', 'status', 'acceptingOrders', 'role'],
  },
  ProductDTOCategory: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
    },
    required: ['id', 'name'],
  },
  ProductDTOVariantOption: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      label: { type: 'string' },
      priceDelta: { type: 'number' },
      isAvailable: { type: 'boolean' },
    },
    required: ['id', 'label', 'priceDelta', 'isAvailable'],
  },
  ProductDTOVariant: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      label: { type: 'string' },
      options: {
        type: 'array',
        items: { $ref: '#/components/schemas/ProductDTOVariantOption' },
      },
    },
    required: ['id', 'label', 'options'],
  },
  ProductDTOAddonOption: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      label: { type: 'string' },
      priceDelta: { type: 'number' },
      isAvailable: { type: 'boolean' },
    },
    required: ['id', 'label', 'priceDelta', 'isAvailable'],
  },
  ProductDTOAddon: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      label: { type: 'string' },
      options: {
        type: 'array',
        items: { $ref: '#/components/schemas/ProductDTOAddonOption' },
      },
    },
    required: ['id', 'label', 'options'],
  },
  ProductDTO: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      label: { type: 'string' },
      description: { type: 'string' },
      isAvailable: { type: 'boolean' },
      price: { type: 'number' },
      categories: {
        type: 'array',
        items: { $ref: '#/components/schemas/ProductDTOCategory' },
      },
      variantTypes: {
        type: 'array',
        items: { $ref: '#/components/schemas/ProductDTOVariant' },
      },
      addons: {
        type: 'array',
        items: { $ref: '#/components/schemas/ProductDTOAddon' },
      },
    },
    required: ['id', 'label', 'isAvailable', 'price', 'categories', 'variantTypes', 'addons'],
  },
  ProductVariantPayload: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      label: { type: 'string' },
      priceDelta: { $ref: '#/components/schemas/MoneyInput' },
      isAvailable: { type: 'boolean' },
    },
    required: ['label', 'priceDelta'],
  },
  ProductVariantGroupPayload: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      label: { type: 'string' },
      options: {
        type: 'array',
        items: { $ref: '#/components/schemas/ProductVariantPayload' },
      },
    },
    required: ['label', 'options'],
  },
  ProductAddonOptionPayload: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      label: { type: 'string' },
      priceDelta: { $ref: '#/components/schemas/MoneyInput' },
      isAvailable: { type: 'boolean' },
    },
    required: ['label', 'priceDelta'],
  },
  ProductAddonGroupPayload: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      label: { type: 'string' },
      required: { type: 'boolean' },
      maxSelectable: { type: 'number' },
      options: {
        type: 'array',
        items: { $ref: '#/components/schemas/ProductAddonOptionPayload' },
      },
    },
    required: ['label', 'options'],
  },
  ProductCreateInput: {
    type: 'object',
    properties: {
      shopId: { type: 'string' },
      ownerUserId: { type: 'string' },
      label: { type: 'string' },
      price: { type: 'number' },
      description: { type: 'string' },
      categories: {
        type: 'array',
        items: { type: 'string' },
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
      media: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            alt: { type: 'string' },
            kind: { type: 'string', enum: ['image', 'video'] },
          },
          required: ['url'],
        },
      },
      allergyInfo: {
        type: 'array',
        items: { type: 'string' },
      },
      variantGroups: {
        type: 'array',
        items: { $ref: '#/components/schemas/ProductVariantGroupPayload' },
      },
      addonGroups: {
        type: 'array',
        items: { $ref: '#/components/schemas/ProductAddonGroupPayload' },
      },
      isAvailable: { type: 'boolean' },
    },
    required: ['shopId', 'label', 'price', 'variantGroups', 'addonGroups'],
  },
  ProductUpdateInput: {
    type: 'object',
    properties: {
      shopId: { type: 'string' },
      ownerUserId: { type: 'string' },
      label: { type: 'string' },
      price: { type: 'number' },
      description: { type: 'string' },
      categories: {
        type: 'array',
        items: { type: 'string' },
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
      media: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            alt: { type: 'string' },
            kind: { type: 'string', enum: ['image', 'video'] },
          },
          required: ['url'],
        },
      },
      allergyInfo: {
        type: 'array',
        items: { type: 'string' },
      },
      variantGroups: {
        type: 'array',
        items: { $ref: '#/components/schemas/ProductVariantGroupPayload' },
      },
      addonGroups: {
        type: 'array',
        items: { $ref: '#/components/schemas/ProductAddonGroupPayload' },
      },
      isAvailable: { type: 'boolean' },
    },
  },
  ProductCategory: {
    allOf: [
      { $ref: '#/components/schemas/DocumentBase' },
      {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          position: { type: 'number' },
          isActive: { type: 'boolean' },
          parentCategoryId: { type: 'string' },
        },
        required: ['name', 'isActive'],
      },
    ],
  },
  CategoryInput: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      parentCategoryId: { type: 'string' },
      position: { type: 'number' },
      isActive: { type: 'boolean' },
    },
    required: ['name'],
  },
  ShopMember: {
    allOf: [
      { $ref: '#/components/schemas/DocumentBase' },
      {
        type: 'object',
        properties: {
          shopId: { type: 'string' },
          userId: { type: 'string' },
          role: { $ref: '#/components/schemas/ShopMemberRole' },
          invitationStatus: {
            type: 'string',
            enum: ['pending', 'accepted', 'revoked'],
          },
          invitedByUserId: { type: 'string' },
          isActive: { type: 'boolean' },
        },
        required: ['shopId', 'userId', 'role', 'isActive'],
      },
    ],
  },
  ShopMemberInviteInput: {
    type: 'object',
    properties: {
      userId: { type: 'string' },
      role: { $ref: '#/components/schemas/ShopMemberRole' },
      invitedByUserId: { type: 'string' },
    },
    required: ['userId', 'role'],
  },
  ShopMemberUpdateInput: {
    type: 'object',
    properties: {
      role: { $ref: '#/components/schemas/ShopMemberRole' },
      isActive: { type: 'boolean' },
    },
  },
  ShopMemberGeneralCreateInput: {
    type: 'object',
    properties: {
      shopId: { type: 'string' },
      userId: { type: 'string' },
      role: { $ref: '#/components/schemas/ShopMemberRole' },
      invitationStatus: {
        type: 'string',
        enum: ['pending', 'accepted', 'revoked'],
      },
      invitedByUserId: { type: 'string' },
      isActive: { type: 'boolean' },
    },
    required: ['shopId', 'userId'],
  },
  ShopMemberGeneralUpdateInput: {
    type: 'object',
    properties: {
      shopId: { type: 'string' },
      userId: { type: 'string' },
      role: { $ref: '#/components/schemas/ShopMemberRole' },
      invitationStatus: {
        type: 'string',
        enum: ['pending', 'accepted', 'revoked'],
      },
      invitedByUserId: { type: 'string' },
      isActive: { type: 'boolean' },
    },
  },
  ShopHoursWindow: {
    type: 'object',
    properties: {
      opensAt: { type: 'string' },
      closesAt: { type: 'string' },
      isClosed: { type: 'boolean' },
    },
    required: ['opensAt', 'closesAt'],
  },
  ShopHours: {
    allOf: [
      { $ref: '#/components/schemas/DocumentBase' },
      {
        type: 'object',
        properties: {
          shopId: { type: 'string' },
          timezone: { type: 'string' },
          weekly: {
            type: 'object',
            additionalProperties: {
              type: 'array',
              items: { $ref: '#/components/schemas/ShopHoursWindow' },
            },
          },
        },
        required: ['shopId', 'timezone', 'weekly'],
      },
    ],
  },
  ShopHoursPayload: {
    type: 'object',
    properties: {
      shopId: { type: 'string' },
      timezone: { type: 'string' },
      weekly: {
        type: 'object',
        additionalProperties: {
          type: 'array',
          items: { $ref: '#/components/schemas/ShopHoursWindow' },
        },
      },
    },
    required: ['shopId', 'timezone'],
  },
  OrderItemAddonSnapshot: {
    type: 'object',
    properties: {
      addonOptionId: { type: 'string' },
      nameSnapshot: { type: 'string' },
      priceDeltaSnapshot: { $ref: '#/components/schemas/Money' },
    },
    required: ['addonOptionId', 'nameSnapshot', 'priceDeltaSnapshot'],
  },
  OrderItem: {
    type: 'object',
    properties: {
      productId: { type: 'string' },
      productVariantId: { type: 'string' },
      productNameSnapshot: { type: 'string' },
      variantLabelSnapshot: { type: 'string' },
      finalUnitPrice: { $ref: '#/components/schemas/Money' },
      quantity: { type: 'number' },
      addons: {
        type: 'array',
        items: { $ref: '#/components/schemas/OrderItemAddonSnapshot' },
      },
    },
    required: ['productId', 'productVariantId', 'productNameSnapshot', 'variantLabelSnapshot', 'finalUnitPrice', 'quantity', 'addons'],
  },
  OrderItemInput: {
    type: 'object',
    properties: {
      productId: { type: 'string' },
      productVariantId: { type: 'string' },
      quantity: { type: 'number' },
      addonOptionIds: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['productId', 'productVariantId', 'quantity'],
  },
  Order: {
    allOf: [
      { $ref: '#/components/schemas/DocumentBase' },
      {
        type: 'object',
        properties: {
          shopId: { type: 'string' },
          userId: { type: 'string' },
          status: { $ref: '#/components/schemas/OrderStatus' },
          paymentStatus: { $ref: '#/components/schemas/PaymentStatus' },
          totalAmount: { $ref: '#/components/schemas/Money' },
          submittedAt: { type: 'string', format: 'date-time' },
          customerName: { type: 'string' },
          customerPhone: { type: 'string' },
          customerNotes: { type: 'string' },
          fulfillmentSlot: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['pickup', 'delivery'] },
              scheduledFor: { type: 'string', format: 'date-time' },
            },
          },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrderItem' },
          },
        },
        required: ['shopId', 'userId', 'status', 'paymentStatus', 'totalAmount', 'submittedAt', 'customerName', 'items'],
      },
    ],
  },
  CreateOrderInput: {
    type: 'object',
    properties: {
      userId: { type: 'string' },
      customerName: { type: 'string' },
      customerPhone: { type: 'string' },
      customerNotes: { type: 'string' },
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/OrderItemInput' },
      },
      fulfillmentType: { type: 'string', enum: ['pickup', 'delivery'] },
      scheduledFor: { type: 'string', format: 'date-time' },
    },
    required: ['userId', 'customerName', 'items'],
  },
  UpdateOrderStatusInput: {
    type: 'object',
    properties: {
      nextStatus: { $ref: '#/components/schemas/OrderStatus' },
    },
    required: ['nextStatus'],
  },
  PrincipalRef: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['user', 'role', 'service', 'apiKey'] },
      id: { type: 'string' },
      scope: { type: 'string' },
    },
    required: ['type', 'id'],
  },
  AuditLog: {
    allOf: [
      { $ref: '#/components/schemas/DocumentBase' },
      {
        type: 'object',
        properties: {
          actor: { $ref: '#/components/schemas/PrincipalRef' },
          shopId: { type: 'string' },
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          action: { type: 'string' },
          before: {},
          after: {},
        },
        required: ['actor', 'entityType', 'entityId', 'action'],
      },
    ],
  },
  AuditLogCreateInput: {
    type: 'object',
    properties: {
      actor: { $ref: '#/components/schemas/PrincipalRef' },
      actorUserId: { type: 'string' },
      shopId: { type: 'string' },
      entityType: { type: 'string' },
      entityId: { type: 'string' },
      action: { type: 'string' },
      before: {},
      after: {},
    },
    required: ['entityType', 'entityId', 'action'],
  },
  User: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
  UserCreateInput: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
};

const paths: Record<string, any> = {
  '/shops': {
    // Handler: src/functions/shops.ts -> shopsListAll
    get: {
      tags: ['Shops'],
      summary: 'List all shops',
      operationId: 'shops_list',
      responses: {
        200: {
          description: 'Array of shops',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Shop' },
              },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
    // Handler: src/functions/shops.ts -> shopsCreate
    post: {
      tags: ['Shops'],
      summary: 'Create a shop',
      operationId: 'shops_create',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ShopInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'Created shop',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Shop' },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
  },
  '/shops/{shopId}': {
    parameters: [
      {
        name: 'shopId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    ],
    // Handler: src/functions/shops.ts -> shopsGetById
    get: {
      tags: ['Shops'],
      summary: 'Get shop by id',
      operationId: 'shops_get',
      responses: {
        200: {
          description: 'Shop details',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Shop' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
    // Handler: src/functions/shops.ts -> shopsUpdate
    patch: {
      tags: ['Shops'],
      summary: 'Update shop',
      operationId: 'shops_update',
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ShopUpdateInput' },
          },
        },
      },
      responses: {
        200: {
          description: 'Updated shop',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Shop' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
    // Handler: src/functions/shops.ts -> shopsDelete
    delete: {
      tags: ['Shops'],
      summary: 'Delete shop',
      operationId: 'shops_delete',
      responses: {
        204: { description: 'Deleted' },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
  },
  '/shops/{shopId}/members': {
    parameters: [
      {
        name: 'shopId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    ],
    // Handler: src/functions/shops.ts -> shopMembersList
    get: {
      tags: ['Shop Members'],
      summary: 'List shop members',
      operationId: 'shopMembers_list',
      responses: {
        200: {
          description: 'Members',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/ShopMember' },
              },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
    // Handler: src/functions/shops.ts -> shopMembersCreate
    post: {
      tags: ['Shop Members'],
      summary: 'Invite member to shop',
      operationId: 'shopMembers_create',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ShopMemberInviteInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'Created member',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ShopMember' },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
  },
  '/shops/{shopId}/members/{memberId}': {
    parameters: [
      { name: 'shopId', in: 'path', required: true, schema: { type: 'string' } },
      { name: 'memberId', in: 'path', required: true, schema: { type: 'string' } },
    ],
    // Handler: src/functions/shops.ts -> shopMembersUpdate
    patch: {
      tags: ['Shop Members'],
      summary: 'Update member role/status',
      operationId: 'shopMembers_update',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ShopMemberUpdateInput' },
          },
        },
      },
      responses: {
        200: {
          description: 'Updated member',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ShopMember' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
  },
  '/users/{userId}/shops': {
    parameters: [
      { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
    ],
    // Handler: src/functions/shops.ts -> usersGetShops
    get: {
      tags: ['Shops'],
      summary: 'List shops a user can manage',
      operationId: 'users_listManagedShops',
      responses: {
        200: {
          description: 'Managed shops',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/ManagedShopView' },
              },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
  },
  '/shops/{shopId}/menu': {
    parameters: [
      { name: 'shopId', in: 'path', required: true, schema: { type: 'string' } },
    ],
    // Handler: src/functions/shops.ts -> shopsMenu
    get: {
      tags: ['Shops'],
      summary: 'Get shop menu by id',
      operationId: 'shops_menu',
      responses: {
        200: {
          description: 'Menu',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ShopMenuDTO' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
  },
  '/shops/slug/{slug}': {
    parameters: [
      { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
    ],
    // Handler: src/functions/shops.ts -> getShopBySlug
    get: {
      tags: ['Shops'],
      summary: 'Get shop by slug',
      operationId: 'shops_getBySlug',
      responses: {
        200: {
          description: 'Shop',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Shop' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
  },
  '/shopMembers': {
    // Handler: src/functions/shopMembers.ts -> shopMembersListAll
    get: {
      tags: ['Shop Members'],
      summary: 'List members across shops',
      operationId: 'shopMembers_listAll',
      parameters: [
        {
          name: 'shopId',
          in: 'query',
          required: false,
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: {
          description: 'Members',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/ShopMember' },
              },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
    // Handler: src/functions/shopMembers.ts -> shopMembersCreateGeneral
    post: {
      tags: ['Shop Members'],
      summary: 'Create member record',
      operationId: 'shopMembers_createGeneral',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ShopMemberGeneralCreateInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'Created member',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ShopMember' },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
  },
  '/shopMembers/{memberId}': {
    parameters: [
      { name: 'memberId', in: 'path', required: true, schema: { type: 'string' } },
    ],
    // Handler: src/functions/shopMembers.ts -> shopMembersGetById
    get: {
      tags: ['Shop Members'],
      summary: 'Get member by id',
      operationId: 'shopMembers_get',
      responses: {
        200: {
          description: 'Member record',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ShopMember' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
    // Handler: src/functions/shopMembers.ts -> shopMembersUpdateGeneral
    patch: {
      tags: ['Shop Members'],
      summary: 'Update member record',
      operationId: 'shopMembers_updateGeneral',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ShopMemberGeneralUpdateInput' },
          },
        },
      },
      responses: {
        200: {
          description: 'Updated member',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ShopMember' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
    // Handler: src/functions/shopMembers.ts -> shopMembersDeleteGeneral
    delete: {
      tags: ['Shop Members'],
      summary: 'Delete member record',
      operationId: 'shopMembers_deleteGeneral',
      responses: {
        204: { description: 'Deleted' },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
  },
  '/products': {
    // Handler: src/functions/products.ts -> productsListByShop
    get: {
      tags: ['Products'],
      summary: 'List products for a shop',
      operationId: 'products_listByShop',
      parameters: [
        {
          name: 'shopId',
          in: 'query',
          required: true,
          schema: { type: 'string' },
          description: 'Shop id to scope products to',
        },
      ],
      responses: {
        200: {
          description: 'Products for the shop',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/ProductDTO' },
              },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
    // Handler: src/functions/products.ts -> productsCreate
    post: {
      tags: ['Products'],
      summary: 'Create product',
      operationId: 'products_create',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ProductCreateInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'Created product',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductDTO' },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
  },
  '/products/{productId}': {
    parameters: [
      { name: 'productId', in: 'path', required: true, schema: { type: 'string' } },
    ],
    // Handler: src/functions/products.ts -> productsGetByIdGeneral
    get: {
      tags: ['Products'],
      summary: 'Get product by id',
      operationId: 'products_get',
      responses: {
        200: {
          description: 'Product',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductDTO' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
    // Handler: src/functions/products.ts -> productsUpdate
    patch: {
      tags: ['Products'],
      summary: 'Update product',
      operationId: 'products_update',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ProductUpdateInput' },
          },
        },
      },
      responses: {
        200: {
          description: 'Updated product',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductDTO' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
    // Handler: src/functions/products.ts -> productsDelete
    delete: {
      tags: ['Products'],
      summary: 'Delete product',
      operationId: 'products_delete',
      responses: {
        204: { description: 'Deleted' },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
  },
  '/categories': {
    // Handler: src/functions/categories.ts -> categoriesCrudList
    get: {
      tags: ['Categories'],
      summary: 'List categories',
      operationId: 'categories_list',
      responses: {
        200: {
          description: 'Categories',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/ProductCategory' },
              },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
    // Handler: src/functions/categories.ts -> categoriesCrudCreate
    post: {
      tags: ['Categories'],
      summary: 'Create category',
      operationId: 'categories_create',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CategoryInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'Created category',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductCategory' },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
  },
  '/categories/{categoryId}': {
    parameters: [
      { name: 'categoryId', in: 'path', required: true, schema: { type: 'string' } },
    ],
    // Handler: src/functions/categories.ts -> categoriesCrudGetById
    get: {
      tags: ['Categories'],
      summary: 'Get category by id',
      operationId: 'categories_get',
      responses: {
        200: {
          description: 'Category',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductCategory' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
    // Handler: src/functions/categories.ts -> categoriesCrudUpdate
    patch: {
      tags: ['Categories'],
      summary: 'Update category',
      operationId: 'categories_update',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CategoryInput' },
          },
        },
      },
      responses: {
        200: {
          description: 'Updated category',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductCategory' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
    // Handler: src/functions/categories.ts -> categoriesCrudDelete
    delete: {
      tags: ['Categories'],
      summary: 'Delete category',
      operationId: 'categories_delete',
      responses: {
        204: { description: 'Deleted' },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
  },
  '/shops/{shopId}/orders': {
    parameters: [
      { name: 'shopId', in: 'path', required: true, schema: { type: 'string' } },
    ],
    // Handler: src/functions/orders.ts -> ordersCreate
    post: {
      tags: ['Orders'],
      summary: 'Place order for shop',
      operationId: 'orders_create',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateOrderInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'Created order',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Order' },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
    // Handler: src/functions/orders.ts -> ordersList
    get: {
      tags: ['Orders'],
      summary: 'List orders for shop',
      operationId: 'orders_listByShop',
      parameters: [
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Comma-separated statuses to filter by',
        },
      ],
      responses: {
        200: {
          description: 'Orders',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Order' },
              },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
  },
  '/shops/{shopId}/orders/{orderId}/status': {
    parameters: [
      { name: 'shopId', in: 'path', required: true, schema: { type: 'string' } },
      { name: 'orderId', in: 'path', required: true, schema: { type: 'string' } },
    ],
    // Handler: src/functions/orders.ts -> ordersUpdateStatus
    patch: {
      tags: ['Orders'],
      summary: 'Update order status',
      operationId: 'orders_updateStatus',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateOrderStatusInput' },
          },
        },
      },
      responses: {
        200: {
          description: 'Updated order',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Order' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
  },
  '/orders': {
    // Handler: src/functions/orders.ts -> ordersListAll
    get: {
      tags: ['Orders'],
      summary: 'List orders (admin)',
      operationId: 'orders_listAll',
      parameters: [
        { name: 'shopId', in: 'query', required: false, schema: { type: 'string' } },
        { name: 'userId', in: 'query', required: false, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Orders',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Order' },
              },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
  },
  '/orders/{orderId}': {
    parameters: [
      { name: 'orderId', in: 'path', required: true, schema: { type: 'string' } },
    ],
    // Handler: src/functions/orders.ts -> ordersGetByIdGeneral
    get: {
      tags: ['Orders'],
      summary: 'Get order',
      operationId: 'orders_get',
      responses: {
        200: {
          description: 'Order',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Order' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
    // Handler: src/functions/orders.ts -> ordersUpdateGeneral
    patch: {
      tags: ['Orders'],
      summary: 'Update order document',
      operationId: 'orders_update',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Order' },
          },
        },
      },
      responses: {
        200: {
          description: 'Updated order',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Order' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
    // Handler: src/functions/orders.ts -> ordersDelete
    delete: {
      tags: ['Orders'],
      summary: 'Delete order',
      operationId: 'orders_delete',
      responses: {
        204: { description: 'Deleted' },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
  },
  '/users': {
    // Handler: src/functions/users.ts -> usersListAll
    get: {
      tags: ['Users'],
      summary: 'List users',
      operationId: 'users_list',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Users',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
        ...defaultErrorResponses,
        ...unauthorizedError,
      },
    },
    // Handler: src/functions/users.ts -> userCreate
    post: {
      tags: ['Users'],
      summary: 'Create user',
      operationId: 'users_create',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserCreateInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'Created user',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' },
            },
          },
        },
        ...defaultErrorResponses,
        ...unauthorizedError,
      },
    },
  },
  '/users/{userId}': {
    parameters: [
      { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
    ],
    // Handler: src/functions/users.ts -> usersGetById
    get: {
      tags: ['Users'],
      summary: 'Get user',
      operationId: 'users_get',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'User',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' },
            },
          },
        },
        ...defaultErrorResponses,
        ...unauthorizedError,
        ...notFoundError,
      },
    },
    // Handler: src/functions/users.ts -> usersUpdate
    patch: {
      tags: ['Users'],
      summary: 'Update user (placeholder)',
      operationId: 'users_update',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/User' },
          },
        },
      },
      responses: {
        200: {
          description: 'Updated user',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' },
            },
          },
        },
        ...defaultErrorResponses,
        ...unauthorizedError,
      },
    },
    // Handler: src/functions/users.ts -> usersDelete
    delete: {
      tags: ['Users'],
      summary: 'Delete user',
      operationId: 'users_delete',
      security: [{ bearerAuth: [] }],
      responses: {
        204: { description: 'Deleted' },
        ...defaultErrorResponses,
        ...unauthorizedError,
        ...notFoundError,
      },
    },
  },
  '/shopHours': {
    // Handler: src/functions/shopHours.ts -> shopHoursListAll
    get: {
      tags: ['Shop Hours'],
      summary: 'List shop hours',
      operationId: 'shopHours_list',
      parameters: [
        { name: 'shopId', in: 'query', required: false, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Shop hours records',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/ShopHours' },
              },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
    // Handler: src/functions/shopHours.ts -> shopHoursCreate
    post: {
      tags: ['Shop Hours'],
      summary: 'Create shop hours',
      operationId: 'shopHours_create',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ShopHoursPayload' },
          },
        },
      },
      responses: {
        201: {
          description: 'Created record',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ShopHours' },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
  },
  '/shopHours/{recordId}': {
    parameters: [
      { name: 'recordId', in: 'path', required: true, schema: { type: 'string' } },
    ],
    // Handler: src/functions/shopHours.ts -> shopHoursGetById
    get: {
      tags: ['Shop Hours'],
      summary: 'Get shop hours by id',
      operationId: 'shopHours_get',
      responses: {
        200: {
          description: 'Record',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ShopHours' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
    // Handler: src/functions/shopHours.ts -> shopHoursUpdate
    patch: {
      tags: ['Shop Hours'],
      summary: 'Update shop hours',
      operationId: 'shopHours_update',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ShopHoursPayload' },
          },
        },
      },
      responses: {
        200: {
          description: 'Updated record',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ShopHours' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
    // Handler: src/functions/shopHours.ts -> shopHoursDelete
    delete: {
      tags: ['Shop Hours'],
      summary: 'Delete shop hours',
      operationId: 'shopHours_delete',
      responses: {
        204: { description: 'Deleted' },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
  },
  '/auditLogs': {
    // Handler: src/functions/auditLogs.ts -> auditLogsList
    get: {
      tags: ['Audit Logs'],
      summary: 'List audit logs',
      operationId: 'auditLogs_list',
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
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/AuditLog' },
              },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
    // Handler: src/functions/auditLogs.ts -> auditLogsCreate
    post: {
      tags: ['Audit Logs'],
      summary: 'Create audit log entry',
      operationId: 'auditLogs_create',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AuditLogCreateInput' },
          },
        },
      },
      responses: {
        201: {
          description: 'Created audit log',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuditLog' },
            },
          },
        },
        ...defaultErrorResponses,
      },
    },
  },
  '/auditLogs/{logId}': {
    parameters: [
      { name: 'logId', in: 'path', required: true, schema: { type: 'string' } },
    ],
    // Handler: src/functions/auditLogs.ts -> auditLogsGetById
    get: {
      tags: ['Audit Logs'],
      summary: 'Get audit log entry',
      operationId: 'auditLogs_get',
      responses: {
        200: {
          description: 'Audit log entry',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuditLog' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
    // Handler: src/functions/auditLogs.ts -> auditLogsUpdate
    patch: {
      tags: ['Audit Logs'],
      summary: 'Update audit log entry',
      operationId: 'auditLogs_update',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AuditLogCreateInput' },
          },
        },
      },
      responses: {
        200: {
          description: 'Updated entry',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuditLog' },
            },
          },
        },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
    // Handler: src/functions/auditLogs.ts -> auditLogsDelete
    delete: {
      tags: ['Audit Logs'],
      summary: 'Delete audit log entry',
      operationId: 'auditLogs_delete',
      responses: {
        204: { description: 'Deleted' },
        ...defaultErrorResponses,
        ...notFoundError,
      },
    },
  },
  '/swagger.json': {
    // Handler: src/functions/swagger.ts -> swaggerJson
    get: {
      tags: ['Docs'],
      summary: 'OpenAPI document',
      operationId: 'swagger_json',
      responses: {
        200: {
          description: 'OpenAPI JSON',
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
      },
    },
  },
  '/swagger': {
    // Handler: src/functions/swagger.ts -> swaggerUi
    get: {
      tags: ['Docs'],
      summary: 'Swagger UI',
      operationId: 'swagger_ui',
      responses: {
        200: {
          description: 'Interactive documentation',
          content: {
            'text/html': {
              schema: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

export const openApiDocument: Record<string, any> = {
  openapi: '3.0.1',
  info: {
    title: 'Online Ordering Platform API',
    version: '1.0.0',
    description:
      'Auto-generated specification derived from the Azure Functions in this repository. The schema reflects the DTOs currently returned by handlers and used by the frontend apiClient.',
  },
  servers: [
    { url: 'http://localhost:7071/api', description: 'Local development' },
  ],
  tags: [
    { name: 'Shops', description: 'Shop and menu management' },
    { name: 'Shop Members', description: 'Membership administration' },
    { name: 'Products', description: 'Product catalog' },
    { name: 'Categories', description: 'Product categories' },
    { name: 'Orders', description: 'Order lifecycle' },
    { name: 'Users', description: 'User management (secured)' },
    { name: 'Shop Hours', description: 'Opening hours configuration' },
    { name: 'Audit Logs', description: 'Audit log access' },
    { name: 'Docs', description: 'Swagger/OpenAPI endpoints' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas,
  },
  security: [],
  paths,
};

const swaggerHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Online Ordering API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        SwaggerUIBundle({
          url: window.location.origin + '/api/swagger.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
        });
      };
    </script>
  </body>
</html>`;

app.http('swaggerJson', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'swagger.json',
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    return json(200, openApiDocument);
  },
});

app.http('swaggerUi', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'swagger',
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    return {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
      body: swaggerHtml,
    };
  },
});
