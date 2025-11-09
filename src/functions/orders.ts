import { HttpRequestLike, HttpResponseInitLike, json } from "../types/otherTypes";
type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;
const { app } = require("@azure/functions");
import { getContainer } from "../config/cosmosClient";

import { canTransition, isShopOpenNow, newId, nowIso, writeAuditLog } from "../utils/general";
import { Cart, CartItem, CartItemRequest, Order, OrderItem, OrderStatus, Product } from "../types/databaseTypes";
import { ProductInShopResponse } from "../types/apiTypes";
import {
  validateCartGet,
  validateCartPut,
  validateOrdersCreate,
  validateOrdersList,
  validateOrdersUpdateStatus,
} from "../utils/businessLogic";

const cartsContainer = getContainer("carts");
const ordersContainer = getContainer("orders");
const productsInShopContainer = getContainer("productsInShop");
const productsContainer = getContainer("products");

function getActorUserId(request: HttpRequest): string {
  return request.headers.get("x-user-id") ?? "system";
}

function buildCartId(shopId: string, userId: string): string {
  return `${shopId}:${userId}`;
}

async function readCart(cartId: string): Promise<Cart | undefined> {
  try {
    const { resource } = await cartsContainer.item(cartId, cartId).read<Cart>();
    return resource ?? undefined;
  } catch {
    return undefined;
  }
}

async function buildCartItemsFromSelection(shopId: string, selections: CartItemRequest[]): Promise<CartItem[]> {
  if (!Array.isArray(selections) || selections.length === 0) {
    return [];
  }

  for (const selection of selections) {
    if (!selection.productId || !selection.productVariantId) {
      throw new Error("Each item must include productId and productVariantId");
    }
    if (selection.quantity === undefined || typeof selection.quantity !== "number") {
      throw new Error("Each item must include quantity");
    }
  }

  const productIds = Array.from(new Set(selections.map((item) => item.productId)));
  const [{ resources: listings }, { resources: products }] = await Promise.all([
    productsInShopContainer
      .items.query<ProductInShopResponse>({
        query: "SELECT * FROM c WHERE c.shopId = @shopId AND ARRAY_CONTAINS(@ids, c.productId)",
        parameters: [
          { name: "@shopId", value: shopId },
          { name: "@ids", value: productIds },
        ],
      })
      .fetchAll(),
    productsContainer
      .items.query<Product>({
        query: "SELECT * FROM c WHERE ARRAY_CONTAINS(@ids, c.id)",
        parameters: [{ name: "@ids", value: productIds }],
      })
      .fetchAll(),
  ]);

  const listingByProductId = new Map<string, ProductInShopResponse>();
  listings.forEach((listing) => listingByProductId.set(listing.productId, listing));

  const productById = new Map(products.map((p) => [p.id, p]));

  const result: CartItem[] = [];

  for (const selection of selections) {
    if (selection.quantity <= 0) {
      throw new Error("quantity must be greater than zero");
    }

    const listing = listingByProductId.get(selection.productId);
    if (!listing) {
      throw new Error(`Product ${selection.productId} is not available in this shop`);
    }
    if (listing.isAvailable === false) {
      throw new Error(`Product ${selection.productId} is currently unavailable`);
    }
    const product = productById.get(selection.productId);
    if (!product) {
      throw new Error(`Product ${selection.productId} not found`);
    }

    const variant = product.variantSchemes
      ?.flatMap((scheme) => scheme.variants)
      .find((variantItem) => variantItem.id === selection.productVariantId);
    if (!variant || !variant.isActive) {
      throw new Error(`Variant ${selection.productVariantId} is not available`);
    }

    const addonOptionIds = Array.isArray(selection.addonOptionIds)
      ? selection.addonOptionIds.filter((id): id is string => typeof id === "string")
      : [];
    const addonSnapshots = addonOptionIds.map((optionId) => {
      for (const group of product.addonGroups ?? []) {
        const option = group.options.find((opt) => opt.id === optionId && opt.isActive);
        if (option) {
          return {
            addonOptionId: option.id,
            nameSnapshot: option.name,
            priceDeltaSnapshot: option.priceDelta,
          };
        }
      }
      throw new Error(`Addon option ${optionId} is invalid for product ${product.id}`);
    });

    const basePrice =
      typeof listing.priceOverride === "number" ? Number(listing.priceOverride) : Number(variant.basePrice);
    const addonsTotal = addonSnapshots.reduce((sum, addon) => sum + addon.priceDeltaSnapshot, 0);
    const finalUnitPrice = basePrice + addonsTotal;

    result.push({
      productId: product.id,
      productVariantId: variant.id,
      productNameSnapshot: product.name,
      variantLabelSnapshot: variant.label,
      unitBasePriceSnapshot: basePrice,
      addons: addonSnapshots,
      finalUnitPrice,
      quantity: selection.quantity,
    });
  }

  return result;
}

function convertCartItemsToOrderItems(items: CartItem[]): OrderItem[] {
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

// GET /shops/{shopId}/cart -> fetch or initialize the user's cart for that shop
app.http("cartGet", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "shops/{shopId}/cart",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { shopId, userId } = validateCartGet(request);
      const cartId = buildCartId(shopId, userId);
      let cart = await readCart(cartId);
      if (!cart) {
        cart = {
          id: cartId,
          userId,
          shopId,
          items: [],
          updatedAt: nowIso(),
        };
        await cartsContainer.items.create(cart);
      }
      return json(200, cart);
    } catch (error: any) {
      const status = error.status || 500;
      return { status, body: error.message || "Internal Server Error" };
    }
  },
});

// PUT /shops/{shopId}/cart -> replace the cart with validated items
app.http("cartPut", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "shops/{shopId}/cart",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { shopId, userId, items: requestedItems } = await validateCartPut(request);
      const cartId = buildCartId(shopId, userId);
      const existing = await readCart(cartId);
      if (existing && existing.shopId !== shopId) {
        return json(400, { message: "Cart belongs to a different shop" });
      }

      try {
        const items = await buildCartItemsFromSelection(shopId, requestedItems);
        const cart: Cart = {
          id: cartId,
          userId,
          shopId,
          items,
          updatedAt: nowIso(),
        };
        await cartsContainer.items.upsert(cart);
        return json(200, cart);
      } catch (error: any) {
        return json(400, { message: error?.message ?? "Failed to update cart" });
      }
    } catch (error: any) {
      const status = error.status || 500;
      return { status, body: error.message || "Internal Server Error" };
    }
  },
});

// POST /shops/{shopId}/orders -> place an order after validating shop/business rules
app.http("ordersCreate", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "shops/{shopId}/orders",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const {
        shop,
        shopId,
        userId,
        customerName,
        customerPhone,
        customerNotes,
        cartId,
        items,
      } = await validateOrdersCreate(request);

      const shopIsActive = shop.isActive ?? true;
      const shopAcceptingOrders = shop.acceptingOrders ?? true;
      const pickupEnabled = shop.fulfillmentOptions?.pickupEnabled ?? true;
      if (!shopIsActive || !shopAcceptingOrders || !pickupEnabled) {
        return json(400, { message: "Shop is not accepting orders right now" });
      }
      if (userId === "guest" && shop.allowGuestCheckout === false) {
        return json(400, { message: "Guest checkout is disabled for this shop" });
      }
      if (shop.paymentPolicy === "prepaid_only") {
        return json(400, { message: "This shop currently requires prepaid orders" });
      }
      if (!(await isShopOpenNow(shopId))) {
        return json(400, { message: "Shop is currently closed" });
      }

      let cartItems: CartItem[] = [];
      if (cartId) {
        const cart = await readCart(cartId);
        if (!cart || cart.shopId !== shopId) {
          return json(400, { message: "Cart not found for this shop" });
        }
        if (cart.userId !== userId) {
          return json(400, { message: "Cart does not belong to this user" });
        }
        cartItems = cart.items;
      } else if (items) {
        try {
          cartItems = await buildCartItemsFromSelection(shopId, items);
        } catch (error: any) {
          return json(400, { message: error?.message ?? "Invalid order items" });
        }
      }

      if (cartItems.length === 0) {
        return json(400, { message: "Order must contain at least one item" });
      }

      const orderItems = convertCartItemsToOrderItems(cartItems);
      const totalAmount = orderItems.reduce((sum, item) => sum + item.finalUnitPrice * item.quantity, 0);
      const timestamp = nowIso();
      const status: OrderStatus = shop.orderAcceptanceMode === "auto" ? "accepted" : "placed";

      const order: Order = {
        id: newId(),
        shopId,
        userId,
        status,
        paymentStatus: "unpaid",
        totalAmount,
        submittedAt: timestamp,
        updatedAt: timestamp,
        customerName,
        customerPhone,
        customerNotes,
        items: orderItems,
      };

      await ordersContainer.items.create(order);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: "order",
        entityId: order.id,
        shopId,
        action: "CREATE",
        after: order,
      });

      return json(201, order);
    } catch (error: any) {
      const status = error.status || 500;
      return { status, body: error.message || "Internal Server Error" };
    }
  },
});

// GET /shops/{shopId}/orders -> list orders for the shop (with optional status filter)
app.http("ordersList", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "shops/{shopId}/orders",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { shopId, statuses } = validateOrdersList(request);

      let query = "SELECT * FROM c WHERE c.shopId = @shopId";
      const parameters: any[] = [{ name: "@shopId", value: shopId }];

      if (statuses.length === 1) {
        query += " AND c.status = @status";
        parameters.push({ name: "@status", value: statuses[0] });
      } else if (statuses.length > 1) {
        query += " AND ARRAY_CONTAINS(@statuses, c.status)";
        parameters.push({ name: "@statuses", value: statuses });
      }

      query += " ORDER BY c.submittedAt DESC";

      const { resources } = await ordersContainer.items.query<Order>({ query, parameters }).fetchAll();
      return json(200, resources);
    } catch (error: any) {
      const status = error.status || 500;
      return { status, body: error.message || "Internal Server Error" };
    }
  },
});

// PATCH /shops/{shopId}/orders/{orderId}/status -> advance an order through workflow
app.http("ordersUpdateStatus", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "shops/{shopId}/orders/{orderId}/status",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const { shopId, order, nextStatus } = await validateOrdersUpdateStatus(request);

      if (!canTransition(order.status, nextStatus)) {
        return json(400, { message: `Cannot change status from ${order.status} to ${nextStatus}` });
      }

      const updated: Order = {
        ...order,
        status: nextStatus,
        updatedAt: nowIso(),
      };
      await ordersContainer.items.upsert(updated);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: "order",
        entityId: order.id,
        shopId,
        action: "UPDATE_STATUS",
        before: { status: order.status },
        after: { status: updated.status },
      });
      return json(200, updated);
    } catch (error: any) {
      const status = error.status || 500;
      return { status, body: error.message || "Internal Server Error" };
    }
  },
});
