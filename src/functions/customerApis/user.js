const { getContainer } = require("../shared/cosmosClient");
const { app } = require("@azure/functions");

const container = getContainer("users");

// POST - Create a new user
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

      // ✅ Check if user already exists
      const query = {
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: newUser.email }],
      };

      const { resources } = await container.items.query(query).fetchAll();

      if (resources.length > 0) {
        return {
          status: 200,
          body: JSON.stringify({
            message: "User already exists",
            user: resources[0],
          }),
        };
      }

      // Assign a unique id if not provided
      if (!newUser.id) {
        newUser.id = require("crypto").randomUUID();
      }

      newUser.createdAt = new Date().toISOString();

      const { resource } = await container.items.create(newUser);

      return {
        status: 201,
        body: JSON.stringify({ message: "User created", user: resource }),
      };
    } catch (error) {
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
