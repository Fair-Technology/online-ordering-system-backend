const { getContainer } = require("../shared/cosmosClient");
const { app } = require("@azure/functions");

const container = getContainer("items");

//POST - Create a new item
app.http("createItem", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "items",
  handler: async (request, context) => {
    try {
      const newItem = await request.json();

      //basic validation
      if (!newItem.shopId || !newItem.name || !newItem.price) {
        return {
          status: 400,
          body: JSON.stringify({
            message: "Missing required fields: shopId, name, price",
          }),
        };
      }

      //assign a unique id if not provided
      if (!newItem.id) {
        newItem.id = require("crypto").randomUUID();
      }

      newItem.createdAt = new Date().toISOString();

      const { resource } = await container.items.create(newItem);

      return {
        status: 201,
        body: JSON.stringify({ message: "Item created", item: resource }),
      };
    } catch (error) {
      context.log.error("Error creating item:", error);
      return {
        status: 500,
        body: JSON.stringify({
          message: "Failed to create item",
          error: error.message,
        }),
      };
    }
  },
});

/**
 * GET all items
 * Example: GET /api/items?shopId=s_10
 */
app.http("getItems", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "items",
  handler: async (request, context) => {
    try {
      const shopId = request.query.get("shopId");
      const isAvailable = request.query.get("isAvailable");

      if (!shopId) {
        return {
          status: 400,
          body: JSON.stringify({
            message: "Missing required query param: shopId",
          }),
        };
      }

      // dynamic query
      let query = "SELECT * FROM c WHERE 1=1";
      const parameters = [];

      if (shopId) {
        query += " AND c.shopId = @shopId";
        parameters.push({ name: "@shopId", value: shopId });
      }

      if (isAvailable) {
        query += " AND c.isAvailable = @isAvailable";
        parameters.push({
          name: "@isAvailable",
          value: isAvailable === "true",
        });
      }

      const querySpec = { query, parameters };
      const { resources: items } = await container.items
        .query(querySpec)
        .fetchAll();

      return {
        status: 200,
        body: JSON.stringify(items),
      };
    } catch (error) {
      context.log.error("Error fetching items:", error);
      return {
        status: 500,
        body: JSON.stringify({
          message: "Failed to fetch items",
          error: error.message,
        }),
      };
    }
  },
});
