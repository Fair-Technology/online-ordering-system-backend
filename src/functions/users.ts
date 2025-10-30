import { HttpRequestLike, HttpResponseInitLike } from "../types/http";
type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;
const { app } = require("@azure/functions");
import { getContainer } from "../config/cosmosClient";
import { newId, nowIso } from "../utils";
import { Shop, ShopMember, User } from "../types/databaseTypes";

const usersContainer = getContainer("users");
const shopMembersContainer = getContainer("shopMembers");
const shopsContainer = getContainer("shops");

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

      const user: User = {
        id: newId(),
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

app.http("usersGetShops", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "users/{userId}/shops",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = request.params?.userId?.trim();
      if (!userId) {
        return json(400, { error: "userId is required" });
      }

      const membershipQuery = {
        query: "SELECT * FROM c WHERE c.userId = @userId AND c.isActive = true",
        parameters: [{ name: "@userId", value: userId }],
      };
      const { resources: memberships } = await shopMembersContainer
        .items.query<ShopMember>(membershipQuery)
        .fetchAll();

      if (memberships.length === 0) {
        return json(200, []);
      }

      const shopIds = Array.from(new Set(memberships.map((member) => member.shopId)));
      const shopQuery = {
        query: "SELECT * FROM c WHERE ARRAY_CONTAINS(@ids, c.id)",
        parameters: [{ name: "@ids", value: shopIds }],
      };
      const { resources: shops } = await shopsContainer.items.query<Shop>(shopQuery).fetchAll();
      const shopById = new Map(shops.map((shop) => [shop.id, shop]));

      const views = memberships
        .map((membership) => {
          const shop = shopById.get(membership.shopId);
          if (!shop) {
            return undefined;
          }
          return {
            shopId: shop.id,
            name: shop.name,
            address: shop.address,
            status: shop.status,
            acceptingOrders: shop.acceptingOrders,
            pickupEnabled: shop.fulfillmentOptions?.pickupEnabled === true,
            role: membership.role,
            isActiveMember: membership.isActive,
            updatedAt: shop.updatedAt,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));



      return json(200, views);
    } catch (error) {
      return json(500, { error: "Internal server error" });
    }
  },
});
