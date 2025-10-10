import { getContainer } from "../config/cosmosClient";
import { randomUUID } from "crypto";
// Azure Functions app is not available as ES6 export, use require
const { app } = require("@azure/functions");

const container = getContainer("orders");

// CREATE - Create a new order
app.http("createOrder", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "orders",
  handler: async (request: any, context: any) => {
    try {
      const newOrder: any = await request.json();

      // Basic validation
      if (!newOrder.userId || !newOrder.shopId || !newOrder.items || !Array.isArray(newOrder.items) || newOrder.items.length === 0) {
        return {
          status: 400,
          body: JSON.stringify({
            message: "Missing required fields: userId, shopId, items (must be non-empty array)",
          }),
        };
      }

      // Validate items structure
      for (const item of newOrder.items) {
        if (!item.itemId || !item.quantity || !item.price) {
          return {
            status: 400,
            body: JSON.stringify({
              message: "Each item must have itemId, quantity, and price",
            }),
          };
        }
      }

      // Assign a unique id if not provided
      if (!newOrder.id) {
        newOrder.id = randomUUID();
      }

      // Calculate total amount
      const totalAmount = newOrder.items.reduce((sum: number, item: any) => {
        return sum + (item.price * item.quantity);
      }, 0);

      newOrder.totalAmount = totalAmount;
      newOrder.status = newOrder.status || "pending";
      newOrder.createdAt = new Date().toISOString();
      newOrder.updatedAt = new Date().toISOString();

      const { resource } = await container.items.create(newOrder);

      return {
        status: 201,
        body: JSON.stringify({ message: "Order created", order: resource }),
      };
    } catch (error: any) {
      context.log.error("Error creating order:", error);
      return {
        status: 500,
        body: JSON.stringify({
          message: "Failed to create order",
          error: error.message,
        }),
      };
    }
  },
});

// READ - Get all orders with filtering
app.http("getOrders", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "orders",
  handler: async (request: any, context: any) => {
    try {
      const userId = request.query.get("userId");
      const shopId = request.query.get("shopId");
      const status = request.query.get("status");

      // Dynamic query building
      let query = "SELECT * FROM c";
      const parameters: any[] = [];
      const conditions: string[] = [];

      if (userId) {
        conditions.push("c.userId = @userId");
        parameters.push({ name: "@userId", value: userId });
      }

      if (shopId) {
        conditions.push("c.shopId = @shopId");
        parameters.push({ name: "@shopId", value: shopId });
      }

      if (status) {
        conditions.push("c.status = @status");
        parameters.push({ name: "@status", value: status });
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY c.createdAt DESC";

      const querySpec = { query, parameters };
      const { resources: orders } = await container.items.query(querySpec).fetchAll();

      return {
        status: 200,
        body: JSON.stringify(orders),
      };
    } catch (error: any) {
      context.log.error("Error fetching orders:", error);
      return {
        status: 500,
        body: JSON.stringify({
          message: "Failed to fetch orders",
          error: error.message,
        }),
      };
    }
  },
});

// READ - Get order by ID
app.http("getOrderById", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "orders/{id}",
  handler: async (request: any, context: any) => {
    const { id } = request.params;
    try {
      const { resource: order } = await container.item(id, id).read();
      if (!order) {
        return {
          status: 404,
          body: JSON.stringify({ message: "Order not found" })
        };
      }
      return {
        status: 200,
        body: JSON.stringify(order)
      };
    } catch (error: any) {
      context.log.error("Error fetching order by id:", error);
      return {
        status: 500,
        body: JSON.stringify({
          message: "Failed to fetch order",
          error: error.message,
        }),
      };
    }
  },
});

// UPDATE - Update order by ID
app.http("updateOrder", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "orders/{id}",
  handler: async (request: any, context: any) => {
    const { id } = request.params;
    try {
      const updates: any = await request.json();

      // Read the existing order
      const { resource: existingOrder } = await container.item(id, id).read();
      if (!existingOrder) {
        return {
          status: 404,
          body: JSON.stringify({ message: "Order not found" })
        };
      }

      // Recalculate total if items are updated
      if (updates.items && Array.isArray(updates.items)) {
        const totalAmount = updates.items.reduce((sum: number, item: any) => {
          return sum + (item.price * item.quantity);
        }, 0);
        updates.totalAmount = totalAmount;
      }

      // Merge updates (prevent changing id, userId, shopId, and createdAt)
      const updatedOrder = {
        ...existingOrder,
        ...updates,
        id,
        userId: existingOrder.userId, // Don't allow userId changes
        shopId: existingOrder.shopId, // Don't allow shopId changes
        createdAt: existingOrder.createdAt,
        updatedAt: new Date().toISOString()
      };

      const { resource } = await container.items.upsert(updatedOrder);
      return {
        status: 200,
        body: JSON.stringify({
          message: `Order ${id} updated`,
          order: resource
        }),
      };
    } catch (error: any) {
      context.log.error("Error updating order:", error);
      return {
        status: 500,
        body: JSON.stringify({
          message: "Failed to update order",
          error: error.message,
        }),
      };
    }
  },
});

// DELETE - Delete order by ID
app.http("deleteOrder", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "orders/{id}",
  handler: async (request: any, context: any) => {
    const { id } = request.params;
    try {
      await container.item(id, id).delete();
      return {
        status: 204,
        body: null,
      };
    } catch (error: any) {
      context.log.error("Error deleting order:", error);
      return {
        status: 500,
        body: JSON.stringify({
          message: "Failed to delete order",
          error: error.message,
        }),
      };
    }
  },
});
