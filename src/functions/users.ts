import { HttpRequestLike, HttpResponseInitLike } from "../types/http";
type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;
const { app } = require("@azure/functions");
import { getContainer } from "../config/cosmosClient";
import { User } from "../types/models";
import { newId, nowIso } from "../utils";

const usersContainer = getContainer("users");
const allowedRoles = new Set<User["role"]>(["customer", "shopAdmin"]);

function json(status: number, body: unknown): HttpResponseInit {
  return { status, jsonBody: body };
}

app.http("usersCreate", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "users",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const payload = (await request.json()) ?? {};
      if (!payload.name || typeof payload.name !== "string") {
        return json(400, { message: "name is required" });
      }
      if (!payload.role || !allowedRoles.has(payload.role)) {
        return json(400, { message: "role must be 'customer' or 'shopAdmin'" });
      }

      const user: User = {
        id: newId(),
        name: payload.name.trim(),
        role: payload.role,
        phone: payload.phone,
        email: payload.email,
        createdAt: nowIso(),
      };

      const { resource } = await usersContainer.items.create(user);
      return json(201, resource);
    } catch (error: any) {
      return json(500, { message: "Failed to create user", error: error?.message ?? String(error) });
    }
  },
});

app.http("usersList", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "users",
  handler: async (): Promise<HttpResponseInit> => {
    const querySpec = { query: "SELECT * FROM c ORDER BY c.createdAt DESC" };
    const { resources } = await usersContainer.items.query<User>(querySpec).fetchAll();
    return json(200, resources);
  },
});
