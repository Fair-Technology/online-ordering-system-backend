import { getContainer } from "../config/cosmosClient";
// Azure Functions app is not available as ES6 export, use require
const { app } = require("@azure/functions");

const container = getContainer("users");

// CREATE - Create a new user
app.http("createUser", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "users",
  handler: async (request: any, context: any) => {
    try {
      const payload = await request.json();
      const oid = payload?.id;
      if (!oid || typeof oid !== "string") {
        return {
          status: 400,
          body: JSON.stringify({ message: "Missing required 'id' field" }),
        };
      }

      // Check if a user already exists with this id
      try {
        const { resource: existingById } = await container.item(oid, oid).read();
        if (existingById) {
          return {
            status: 409,
            body: JSON.stringify({ message: "User already exists with this oid", user: existingById }),
          };
        }
      } catch (e) {
        // If read throws because item not found, ignore — container.item().read() throws on 404 in some SDK versions
      }

      // Build the user object from token claims only. Ignore request body for persisted fields per request.
      const userToCreate: any = {
        id: oid,
      };

      const { resource } = await container.items.create(userToCreate);

      return {
        status: 201,
        body: JSON.stringify({ message: "User created", user: resource }),
      };
    } catch (error: any) {
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
  handler: async (request: any, context: any) => {
    try {
      const querySpec = {
        query: "SELECT * FROM c ORDER BY c.createdAt DESC",
      };
      const { resources: users } = await container.items.query(querySpec).fetchAll();

      return {
        status: 200,
        body: JSON.stringify(users),
      };
    } catch (error: any) {
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
  handler: async (request: any, context: any) => {
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
    } catch (error: any) {
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
// READ - Get user by email
app.http("getUserByEmail", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "users/by-email",
  handler: async (request: any, context: any) => {
    const email = request.query.get("email");
    if (!email) {
      return {
        status: 400,
        body: JSON.stringify({ message: "Missing email query parameter" })
      };
    }
    try {
      const query = {
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: email }],
      };
      const { resources } = await container.items.query(query).fetchAll();
      if (resources.length === 0) {
        return {
          status: 404,
          body: JSON.stringify({ message: "User not found" })
        };
      }
      return {
        status: 200,
        body: JSON.stringify(resources[0])
      };
    } catch (error: any) {
      context.log.error("Error fetching user by email:", error);
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
  handler: async (request: any, context: any) => {
    const { id } = request.params;
    try {
      const updates: any = await request.json();

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
    } catch (error: any) {
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
  handler: async (request: any, context: any) => {
    const { id } = request.params;
    try {
      await container.item(id, id).delete();
      return {
        status: 204,
        body: null,
      };
    } catch (error: any) {
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
