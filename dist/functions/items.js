"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cosmosClient_1 = require("../config/cosmosClient");
const crypto_1 = require("crypto");
// Azure Functions app is not available as ES6 export, use require
const { app } = require("@azure/functions");
const container = (0, cosmosClient_1.getContainer)("items");
// CREATE - Create a new item
app.http("createItem", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "items",
    handler: async (request, context) => {
        try {
            const newItem = await request.json();
            // Basic validation
            if (!newItem.shopId || !newItem.name || !newItem.price) {
                return {
                    status: 400,
                    body: JSON.stringify({
                        message: "Missing required fields: shopId, name, price",
                    }),
                };
            }
            // Assign a unique id if not provided
            if (!newItem.id) {
                newItem.id = (0, crypto_1.randomUUID)();
            }
            newItem.createdAt = new Date().toISOString();
            newItem.updatedAt = new Date().toISOString();
            newItem.isAvailable = newItem.isAvailable !== undefined ? newItem.isAvailable : true;
            const { resource } = await container.items.create(newItem);
            return {
                status: 201,
                body: JSON.stringify({ message: "Item created", item: resource }),
            };
        }
        catch (error) {
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
// READ - Get all items
app.http("getItems", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "items",
    handler: async (request, context) => {
        try {
            const shopId = request.query.get("shopId");
            const isAvailable = request.query.get("isAvailable");
            // Dynamic query
            let query = "SELECT * FROM c ORDER BY c.createdAt DESC";
            const parameters = [];
            if (shopId) {
                query = "SELECT * FROM c WHERE c.shopId = @shopId ORDER BY c.createdAt DESC";
                parameters.push({ name: "@shopId", value: shopId });
            }
            if (isAvailable !== null) {
                if (shopId) {
                    query = "SELECT * FROM c WHERE c.shopId = @shopId AND c.isAvailable = @isAvailable ORDER BY c.createdAt DESC";
                }
                else {
                    query = "SELECT * FROM c WHERE c.isAvailable = @isAvailable ORDER BY c.createdAt DESC";
                }
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
        }
        catch (error) {
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
// READ - Get item by ID
app.http("getItemById", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "items/{id}",
    handler: async (request, context) => {
        const { id } = request.params;
        try {
            const { resource: item } = await container.item(id, id).read();
            if (!item) {
                return {
                    status: 404,
                    body: JSON.stringify({ message: "Item not found" })
                };
            }
            return {
                status: 200,
                body: JSON.stringify(item)
            };
        }
        catch (error) {
            context.log.error("Error fetching item by id:", error);
            return {
                status: 500,
                body: JSON.stringify({
                    message: "Failed to fetch item",
                    error: error.message,
                }),
            };
        }
    },
});
// UPDATE - Update item by ID
app.http("updateItem", {
    methods: ["PUT"],
    authLevel: "anonymous",
    route: "items/{id}",
    handler: async (request, context) => {
        const { id } = request.params;
        try {
            const updates = await request.json();
            // Read the existing item
            const { resource: existingItem } = await container.item(id, id).read();
            if (!existingItem) {
                return {
                    status: 404,
                    body: JSON.stringify({ message: "Item not found" })
                };
            }
            // Merge updates (prevent changing id, shopId, and createdAt)
            const updatedItem = {
                ...existingItem,
                ...updates,
                id,
                shopId: existingItem.shopId, // Don't allow shopId changes
                createdAt: existingItem.createdAt,
                updatedAt: new Date().toISOString()
            };
            const { resource } = await container.items.upsert(updatedItem);
            return {
                status: 200,
                body: JSON.stringify({
                    message: `Item ${id} updated`,
                    item: resource
                }),
            };
        }
        catch (error) {
            context.log.error("Error updating item:", error);
            return {
                status: 500,
                body: JSON.stringify({
                    message: "Failed to update item",
                    error: error.message,
                }),
            };
        }
    },
});
// DELETE - Delete item by ID
app.http("deleteItem", {
    methods: ["DELETE"],
    authLevel: "anonymous",
    route: "items/{id}",
    handler: async (request, context) => {
        const { id } = request.params;
        try {
            await container.item(id, id).delete();
            return {
                status: 204,
                body: null,
            };
        }
        catch (error) {
            context.log.error("Error deleting item:", error);
            return {
                status: 500,
                body: JSON.stringify({
                    message: "Failed to delete item",
                    error: error.message,
                }),
            };
        }
    },
});
