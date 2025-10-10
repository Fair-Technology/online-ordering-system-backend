"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cosmosClient_1 = require("../config/cosmosClient");
const crypto_1 = require("crypto");
// Azure Functions app is not available as ES6 export, use require
const { app } = require("@azure/functions");
const container = (0, cosmosClient_1.getContainer)("users");
// CREATE - Create a new user
app.http("createUser", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "users",
    handler: async (request, context) => {
        try {
            const newUser = await request.json();
            // Basic validation
            if (!newUser.email || !newUser.name) {
                return {
                    status: 400,
                    body: JSON.stringify({
                        message: "Missing required fields: email, name",
                    }),
                };
            }
            // Check if user already exists
            const query = {
                query: "SELECT * FROM c WHERE c.email = @email",
                parameters: [{ name: "@email", value: newUser.email }],
            };
            const { resources } = await container.items.query(query).fetchAll();
            if (resources.length > 0) {
                return {
                    status: 409,
                    body: JSON.stringify({
                        message: "User already exists",
                        user: resources[0],
                    }),
                };
            }
            // Assign a unique id if not provided
            if (!newUser.id) {
                newUser.id = (0, crypto_1.randomUUID)();
            }
            newUser.createdAt = new Date().toISOString();
            newUser.updatedAt = new Date().toISOString();
            const { resource } = await container.items.create(newUser);
            return {
                status: 201,
                body: JSON.stringify({ message: "User created", user: resource }),
            };
        }
        catch (error) {
            context.log.error("Error creating user:", error);
            return {
                status: 500,
                body: JSON.stringify({
                    message: "Failed to create user",
                    error: error.message,
                }),
            };
        }
    },
});
// READ - Get all users
app.http("getUsers", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "users",
    handler: async (request, context) => {
        try {
            const querySpec = {
                query: "SELECT * FROM c ORDER BY c.createdAt DESC",
            };
            const { resources: users } = await container.items.query(querySpec).fetchAll();
            return {
                status: 200,
                body: JSON.stringify(users),
            };
        }
        catch (error) {
            context.log.error("Error fetching users:", error);
            return {
                status: 500,
                body: JSON.stringify({
                    message: "Failed to fetch users",
                    error: error.message,
                }),
            };
        }
    },
});
// READ - Get user by ID
app.http("getUserById", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "users/{id}",
    handler: async (request, context) => {
        const { id } = request.params;
        try {
            const { resource: user } = await container.item(id, id).read();
            if (!user) {
                return {
                    status: 404,
                    body: JSON.stringify({ message: "User not found" })
                };
            }
            return {
                status: 200,
                body: JSON.stringify(user)
            };
        }
        catch (error) {
            context.log.error("Error fetching user by id:", error);
            return {
                status: 500,
                body: JSON.stringify({
                    message: "Failed to fetch user",
                    error: error.message,
                }),
            };
        }
    },
});
// UPDATE - Update user by ID
app.http("updateUser", {
    methods: ["PUT"],
    authLevel: "anonymous",
    route: "users/{id}",
    handler: async (request, context) => {
        const { id } = request.params;
        try {
            const updates = await request.json();
            // Read the existing user
            const { resource: existingUser } = await container.item(id, id).read();
            if (!existingUser) {
                return {
                    status: 404,
                    body: JSON.stringify({ message: "User not found" })
                };
            }
            // Merge updates (prevent changing id, email, and createdAt)
            const updatedUser = {
                ...existingUser,
                ...updates,
                id,
                email: existingUser.email, // Don't allow email changes
                createdAt: existingUser.createdAt,
                updatedAt: new Date().toISOString()
            };
            const { resource } = await container.items.upsert(updatedUser);
            return {
                status: 200,
                body: JSON.stringify({
                    message: `User ${id} updated`,
                    user: resource
                }),
            };
        }
        catch (error) {
            context.log.error("Error updating user:", error);
            return {
                status: 500,
                body: JSON.stringify({
                    message: "Failed to update user",
                    error: error.message,
                }),
            };
        }
    },
});
// DELETE - Delete user by ID
app.http("deleteUser", {
    methods: ["DELETE"],
    authLevel: "anonymous",
    route: "users/{id}",
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
            context.log.error("Error deleting user:", error);
            return {
                status: 500,
                body: JSON.stringify({
                    message: "Failed to delete user",
                    error: error.message,
                }),
            };
        }
    },
});
