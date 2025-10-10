import { getContainer } from "../config/cosmosClient";
import { randomUUID } from "crypto";
// Azure Functions app is not available as ES6 export, use require
const { app } = require("@azure/functions");

const container = getContainer("shops");


// CREATE shop
app.http("createShop", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "shops",
  handler: async (request: any, context: any) => {
    try {
      const newShop: any = await request.json();

      // Basic validation
      if (!newShop.name || !newShop.address) {
        return {
          status: 400,
          body: JSON.stringify({
            message: "Missing required fields: name, address",
          }),
        };
      }

      // Assign a unique id if not provided
      if (!newShop.id) {
        newShop.id = randomUUID();
      }

      newShop.createdAt = new Date().toISOString();
      newShop.updatedAt = new Date().toISOString();
      newShop.isActive = newShop.isActive !== undefined ? newShop.isActive : true;

      const { resource } = await container.items.create(newShop);

      return {
        status: 201,
        body: JSON.stringify({ message: "Shop created", shop: resource }),
      };
    } catch (error: any) {
      context.log.error("Error creating shop:", error);
      return {
        status: 500,
        body: JSON.stringify({ message: "Failed to create shop", error: error.message }),
      };
    }
  },
});

// READ all shops
app.http("getShops", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "shops",
  handler: async (request: any, context: any) => {
    try {
      const isActive = request.query.get("isActive");

      let query = "SELECT * FROM c ORDER BY c.createdAt DESC";
      const parameters: any[] = [];

      if (isActive !== null) {
        query = "SELECT * FROM c WHERE c.isActive = @isActive ORDER BY c.createdAt DESC";
        parameters.push({
          name: "@isActive",
          value: isActive === "true",
        });
      }

      const querySpec = { query, parameters };
      const { resources: shops } = await container.items.query(querySpec).fetchAll();
      return {
        status: 200,
        body: JSON.stringify(shops),
      };
    } catch (error: any) {
      context.log.error("Error fetching shops:", error);
      return {
        status: 500,
        body: JSON.stringify({ message: "Failed to fetch shops", error: error.message }),
      };
    }
  },
});

// READ single shop
app.http("getShopById", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "shops/{id}",
  handler: async (request: any, context: any) => {
    const { id } = request.params;
    try {
      const { resource: shop } = await container.item(id, id).read();
      if (!shop) {
        return { status: 404, body: JSON.stringify({ message: "Shop not found" }) };
      }
      return { status: 200, body: JSON.stringify(shop) };
    } catch (error: any) {
      context.log.error("Error fetching shop by id:", error);
      return {
        status: 500,
        body: JSON.stringify({ message: "Failed to fetch shop", error: error.message }),
      };
    }
  },
});

// UPDATE shop
app.http("updateShop", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "shops/{id}",
  handler: async (request: any, context: any) => {
    const { id } = request.params;
    try {
      const updates: any = await request.json();

      // Read the existing shop
      const { resource: existingShop } = await container.item(id, id).read();
      if (!existingShop) {
        return { status: 404, body: JSON.stringify({ message: "Shop not found" }) };
      }

      // Merge updates (prevent changing id and createdAt)
      const updatedShop = {
        ...existingShop,
        ...updates,
        id,
        createdAt: existingShop.createdAt,
        updatedAt: new Date().toISOString()
      };

      const { resource } = await container.items.upsert(updatedShop);
      return {
        status: 200,
        body: JSON.stringify({ message: `Shop ${id} updated`, shop: resource }),
      };
    } catch (error: any) {
      context.log.error("Error updating shop:", error);
      return {
        status: 500,
        body: JSON.stringify({ message: "Failed to update shop", error: error.message }),
      };
    }
  },
});

// DELETE shop
app.http("deleteShop", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "shops/{id}",
  handler: async (request: any, context: any) => {
    const { id } = request.params;
    try {
      await container.item(id, id).delete();
      return {
        status: 204,
        body: null,
      };
    } catch (error: any) {
      context.log.error("Error deleting shop:", error);
      return {
        status: 500,
        body: JSON.stringify({ message: "Failed to delete shop", error: error.message }),
      };
    }
  },
});
