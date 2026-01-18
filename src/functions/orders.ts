import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../domain/otherTypes';
const { app } = require('@azure/functions');
import { getContainer } from '../infrastructure/cosmosClient';
import { Money } from '../domain/baseTypes';
import {
  Order,
  OrderItem,
  OrderItemAddonSnapshot,
  OrderStatus,
} from '../domain/order.entity';
import { Shop } from '../domain/shop.entity';
import { Product, ShopProductMap } from '../domain/product.entity';
import { OrderItemPayload } from '../domain/order.dto';
import {
  canTransition,
  validateOrdersCreate,
  validateOrdersList,
  validateOrdersUpdateStatus,
} from '../services/orderValidation';
import { isShopOpenNow } from '../services/shopHoursService';
import { writeAuditLog } from '../services/auditLogService';
import { getActorUserId, newId, nowIso } from '../utils/general';
import { requireAuth } from '../utils/authMiddleware';

type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;

const ordersContainer = getContainer('orders');
const productsContainer = getContainer('products');
const shopsContainer = getContainer('shops');
const shopProductsContainer = getContainer('shopProducts');

interface ValidatedOrderItem {
  productId: string;
  productVariantId: string;
  productNameSnapshot: string;
  variantLabelSnapshot: string;
  addons: OrderItemAddonSnapshot[];
  finalUnitPrice: Money;
  quantity: number;
}

function ensureCurrencyMatch(
  money: Money,
  currency: string,
  context: string,
): void {
  if (money.currency !== currency) {
    throw new Error(`${context} currency mismatch`);
  }
}

function sumAddonPrice(
  addons: OrderItemAddonSnapshot[],
  currency: string,
): number {
  return addons.reduce((sum, addon) => {
    ensureCurrencyMatch(addon.priceDeltaSnapshot, currency, 'Addon price');
    return sum + addon.priceDeltaSnapshot.amount;
  }, 0);
}

async function readShop(shopId: string): Promise<Shop | undefined> {
  try {
    const { resource } = await shopsContainer.item(shopId, shopId).read<Shop>();
    return resource ?? undefined;
  } catch {
    return undefined;
  }
}

async function buildOrderItemsFromPayload(
  shopId: string,
  selections: OrderItemPayload[],
): Promise<ValidatedOrderItem[]> {
  if (!Array.isArray(selections) || selections.length === 0) {
    return [];
  }

  for (const selection of selections) {
    if (!selection.productId || !selection.productVariantId) {
      throw new Error('productId and productVariantId are required');
    }
    if (
      selection.quantity === undefined ||
      typeof selection.quantity !== 'number' ||
      selection.quantity <= 0
    ) {
      throw new Error('quantity must be greater than zero');
    }
  }

  const productIds = [...new Set(selections.map((item) => item.productId))];

  const [{ resources: mappings }, { resources: products }] = await Promise.all([
    shopProductsContainer.items
      .query<ShopProductMap>({
        query:
          'SELECT * FROM c WHERE c.shopId = @shopId AND ARRAY_CONTAINS(@ids, c.productId)',
        parameters: [
          { name: '@shopId', value: shopId },
          { name: '@ids', value: productIds },
        ],
      })
      .fetchAll(),
    productsContainer.items
      .query<Product>({
        query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(@ids, c.id)',
        parameters: [{ name: '@ids', value: productIds }],
      })
      .fetchAll(),
  ]);

  const mappingByProduct = new Map(
    mappings.map((mapping) => [mapping.productId, mapping]),
  );
  const productById = new Map(products.map((product) => [product.id, product]));

  const result: ValidatedOrderItem[] = [];

  for (const selection of selections) {
    const mapping = mappingByProduct.get(selection.productId);
    if (!mapping || mapping.isAvailable === false) {
      throw new Error(
        `Product ${selection.productId} is not currently available in this shop`,
      );
    }
    const product = productById.get(selection.productId);
    if (!product) {
      throw new Error(`Product ${selection.productId} not found`);
    }
    if (!product.isAvailable) {
      throw new Error(`Product ${selection.productId} is not available`);
    }

    const variant = product.variantGroups
      .flatMap((group) => group.options)
      .find((item) => item.id === selection.productVariantId);
    if (!variant || !variant.isAvailable) {
      throw new Error(`Variant ${selection.productVariantId} is not available`);
    }

    const addonOptionIds = Array.isArray(selection.addonOptionIds)
      ? selection.addonOptionIds.filter((id): id is string => typeof id === 'string')
      : [];

    const addonSnapshots: OrderItemAddonSnapshot[] = addonOptionIds.map(
      (optionId) => {
        for (const group of product.addonGroups ?? []) {
          const option = group.options.find(
            (opt) => opt.id === optionId && opt.isAvailable,
          );
          if (option) {
            return {
              addonOptionId: option.id,
              nameSnapshot: option.label,
              priceDeltaSnapshot: option.priceDelta,
            };
          }
        }
        throw new Error(`Addon option ${optionId} is not valid for product ${product.id}`);
      },
    );

    const variantDelta = variant.priceDelta;
    const basePrice =
      mapping.priceOverride ??
      ({
        amount: product.price,
        currency: variantDelta.currency,
      } as Money);
    const addonsAmount = sumAddonPrice(addonSnapshots, basePrice.currency);
    const finalUnitPrice: Money = {
      amount: basePrice.amount + variantDelta.amount + addonsAmount,
      currency: basePrice.currency,
    };

    result.push({
      productId: product.id,
      productVariantId: variant.id,
      productNameSnapshot: product.label,
      variantLabelSnapshot: variant.label,
      addons: addonSnapshots,
      finalUnitPrice,
      quantity: selection.quantity,
    });
  }

  return result;
}

function convertValidatedItemsToOrderItems(
  items: ValidatedOrderItem[],
): OrderItem[] {
  return items.map((item) => ({
    productId: item.productId,
    productVariantId: item.productVariantId,
    productNameSnapshot: item.productNameSnapshot,
    variantLabelSnapshot: item.variantLabelSnapshot,
    finalUnitPrice: item.finalUnitPrice,
    quantity: item.quantity,
    addons: item.addons,
  }));
}

function sumOrderTotal(items: OrderItem[]): Money {
  if (items.length === 0) {
    return { amount: 0, currency: 'USD' };
  }
  const currency = items[0].finalUnitPrice.currency;
  const amount = items.reduce((sum, item) => {
    ensureCurrencyMatch(item.finalUnitPrice, currency, 'Order item price');
    return sum + item.finalUnitPrice.amount * item.quantity;
  }, 0);
  return { amount, currency };
}

/* -------------------------------------------------------------------------- */
/* Create order                                                               */
/* -------------------------------------------------------------------------- */

app.http('ordersCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/orders',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    return requireAuth(request, async () => {
      try {
        const {
          shopId,
          userId,
          customerName,
          customerPhone,
          customerNotes,
          items,
          fulfillmentType,
          scheduledFor,
        } = await validateOrdersCreate(request);
        const shop = await readShop(shopId);
        if (!shop) {
          return json(404, { message: 'Shop not found' });
        }

        if (shop.status !== 'open' || shop.acceptingOrders === false) {
          return json(400, { message: 'Shop is not accepting orders right now' });
        }
        if (userId === 'guest' && shop.allowGuestCheckout === false) {
          return json(400, { message: 'Guest checkout is disabled for this shop' });
        }
        if (!(await isShopOpenNow(shopId))) {
          return json(400, { message: 'Shop is currently closed' });
        }

        const validatedItems = await buildOrderItemsFromPayload(shopId, items);
        if (validatedItems.length === 0) {
          return json(400, { message: 'Order must contain at least one item' });
        }

        const orderItems = convertValidatedItemsToOrderItems(validatedItems);
        const totalAmount = sumOrderTotal(orderItems);
        const timestamp = nowIso();
        const status: OrderStatus =
          shop.orderAcceptanceMode === 'auto' ? 'accepted' : 'placed';

        const order: Order = {
          id: newId(),
          shopId,
          userId,
          status,
          paymentStatus: 'unpaid',
          totalAmount,
          submittedAt: timestamp,
          customerName,
          customerPhone,
          customerNotes,
          items: orderItems,
          fulfillmentSlot: {
            type: fulfillmentType ?? 'pickup',
            scheduledFor,
          },
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        await ordersContainer.items.create(order);
        await writeAuditLog({
          actorUserId: getActorUserId(request),
          shopId,
          entityType: 'order',
          entityId: order.id,
          action: 'CREATE',
          after: order,
        });

        return json(201, order);
      } catch (error: any) {
        return { status: error.status || 500, body: error.message };
      }
    });
  },
});

/* -------------------------------------------------------------------------- */
/* Shop order listing                                                         */
/* -------------------------------------------------------------------------- */

app.http('ordersList', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/orders',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    return requireAuth(request, async () => {
      try {
        const { shopId, statuses } = validateOrdersList(request);
        let query = 'SELECT * FROM c WHERE c.shopId = @shopId';
        const parameters: any[] = [{ name: '@shopId', value: shopId }];

        if (statuses.length === 1) {
          query += ' AND c.status = @status';
          parameters.push({ name: '@status', value: statuses[0] });
        } else if (statuses.length > 1) {
          query += ' AND ARRAY_CONTAINS(@statuses, c.status)';
          parameters.push({ name: '@statuses', value: statuses });
        }
        query += ' ORDER BY c.submittedAt DESC';

        const { resources } = await ordersContainer.items
          .query<Order>({ query, parameters })
          .fetchAll();
        return json(200, resources);
      } catch (error: any) {
        return { status: error.status || 500, body: error.message };
      }
    });
  },
});

/* -------------------------------------------------------------------------- */
/* Status transitions                                                         */
/* -------------------------------------------------------------------------- */

app.http('ordersUpdateStatus', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/orders/{orderId}/status',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    return requireAuth(request, async () => {
      try {
        const { order, nextStatus } = await validateOrdersUpdateStatus(request);
        if (!canTransition(order.status, nextStatus)) {
          return json(400, {
            message: `Cannot change status from ${order.status} to ${nextStatus}`,
          });
        }
        const updated: Order = {
          ...order,
          status: nextStatus,
          updatedAt: nowIso(),
        };
        await ordersContainer.items.upsert(updated);
        await writeAuditLog({
          actorUserId: getActorUserId(request),
          shopId: order.shopId,
          entityType: 'order',
          entityId: order.id,
          action: 'UPDATE_STATUS',
          before: { status: order.status },
          after: { status: updated.status },
        });
        return json(200, updated);
      } catch (error: any) {
        return { status: error.status || 500, body: error.message };
      }
    });
  },
});

/* -------------------------------------------------------------------------- */
/* Administrative endpoints                                                   */
/* -------------------------------------------------------------------------- */

app.http('ordersListAll', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'orders',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    return requireAuth(request, async () => {
      try {
        const shopId = request.query.get('shopId')?.trim();
        const userId = request.query.get('userId')?.trim();
        const filters: string[] = [];
        const parameters: any[] = [];
        if (shopId) {
          filters.push('c.shopId = @shopId');
          parameters.push({ name: '@shopId', value: shopId });
        }
        if (userId) {
          filters.push('c.userId = @userId');
          parameters.push({ name: '@userId', value: userId });
        }
        let query = 'SELECT * FROM c';
        if (filters.length > 0) {
          query += ` WHERE ${filters.join(' AND ')}`;
        }
        query += ' ORDER BY c.submittedAt DESC';

        const { resources } = await ordersContainer.items
          .query<Order>({ query, parameters })
          .fetchAll();
        return json(200, resources);
      } catch (error: any) {
        return { status: error.status || 500, body: error.message };
      }
    });
  },
});

app.http('ordersGetByIdGeneral', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'orders/{orderId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    return requireAuth(request, async () => {
      try {
        const orderId = request.params?.orderId?.trim();
        if (!orderId) {
          return json(400, { message: 'orderId is required' });
        }
        const { resource } = await ordersContainer
          .item(orderId, orderId)
          .read<Order>();
        if (!resource) {
          return json(404, { message: 'Order not found' });
        }
        return json(200, resource);
      } catch (error: any) {
        return { status: error.status || 500, body: error.message };
      }
    });
  },
});

app.http('ordersUpdateGeneral', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'orders/{orderId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    return requireAuth(request, async () => {
      try {
        const orderId = request.params?.orderId?.trim();
        if (!orderId) {
          return json(400, { message: 'orderId is required' });
        }
        const { resource } = await ordersContainer
          .item(orderId, orderId)
          .read<Order>();
        if (!resource) {
          return json(404, { message: 'Order not found' });
        }
        const updates =
          (await request.json().catch(() => null)) ?? {};
        const updated: Order = {
          ...resource,
          ...updates,
          id: resource.id,
          submittedAt: resource.submittedAt,
          updatedAt: nowIso(),
        };
        await ordersContainer.items.upsert(updated);
        await writeAuditLog({
          actorUserId: getActorUserId(request),
          shopId: resource.shopId,
          entityType: 'order',
          entityId: resource.id,
          action: 'UPDATE',
          before: resource,
          after: updated,
        });
        return json(200, updated);
      } catch (error: any) {
        return { status: error.status || 500, body: error.message };
      }
    });
  },
});

app.http('ordersDelete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'orders/{orderId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    return requireAuth(request, async () => {
      try {
        const orderId = request.params?.orderId?.trim();
        if (!orderId) {
          return json(400, { message: 'orderId is required' });
        }
        const { resource } = await ordersContainer
          .item(orderId, orderId)
          .read<Order>();
        if (!resource) {
          return json(404, { message: 'Order not found' });
        }
        await ordersContainer.item(orderId, orderId).delete();
        await writeAuditLog({
          actorUserId: getActorUserId(request),
          shopId: resource.shopId,
          entityType: 'order',
          entityId: resource.id,
          action: 'DELETE',
          before: resource,
        });
        return { status: 204 };
      } catch (error: any) {
        return { status: error.status || 500, body: error.message };
      }
    });
  },
});
