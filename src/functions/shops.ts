import { HttpRequestLike, HttpResponseInitLike } from "../types/http";
type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;
const { app } = require("@azure/functions");
import { getContainer } from "../config/cosmosClient";
import { Shop, ShopHours, ShopMember } from "../types/models";
import { newId, nowIso, writeAuditLog } from "../utils";

const shopsContainer = getContainer("shops");
const shopMembersContainer = getContainer("shopMembers");
const shopHoursContainer = getContainer("shopHours");

const DEFAULT_PERMISSIONS = ["manage_products", "manage_orders"];
function json(status: number, body: unknown): HttpResponseInit {
  return { status, jsonBody: body };
}

function getActorUserId(request: HttpRequest): string {
  return request.headers.get("x-user-id") ?? "system";
}

function resolvePermissions(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return DEFAULT_PERMISSIONS;
  }
  const sanitized = input.filter((perm) => typeof perm === "string" && perm.length > 0);
  return sanitized.length > 0 ? sanitized : DEFAULT_PERMISSIONS;
}

async function readShop(shopId: string): Promise<Shop | undefined> {
  try {
    const { resource } = await shopsContainer.item(shopId, shopId).read<Shop>();
    return resource ?? undefined;
  } catch {
    return undefined;
  }
}

app.http("shopsCreate", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "shops",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const payload = (await request.json()) ?? {};
      const { name, address, ownerUserId } = payload;
      if (!name || typeof name !== "string" || !address || typeof address !== "string" || !ownerUserId || typeof ownerUserId !== "string") {
        return json(400, { message: "name, address, and ownerUserId are required" });
      }

      const timestamp = nowIso();
      const shop: Shop = {
        id: newId(),
        ownerUserId: ownerUserId.trim(),
        name: name.trim(),
        address: address.trim(),
        isActive: true,
        status: "open",
        acceptingOrders: true,
        paymentPolicy: "pay_on_pickup",
        orderAcceptanceMode: "manual",
        allowGuestCheckout: true,
        fulfillmentOptions: {
          pickupEnabled: true,
          deliveryEnabled: false,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const member: ShopMember = {
        id: newId(),
        shopId: shop.id,
        userId: ownerUserId,
        role: "owner",
        permissions: DEFAULT_PERMISSIONS,
        isActive: true,
        addedAt: timestamp,
      };

      await shopsContainer.items.create(shop);
      await shopMembersContainer.items.create(member);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: "shop",
        entityId: shop.id,
        shopId: shop.id,
        action: "CREATE",
        after: shop,
      });

      return json(201, shop);
    } catch (error: any) {
      return json(500, { message: "Failed to create shop", error: error?.message ?? String(error) });
    }
  },
});

app.http("shopsGetById", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "shops/{shopId}",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const { shopId } = request.params;
    const shop = await readShop(shopId);
    if (!shop) {
      return json(404, { message: "Shop not found" });
    }
    return json(200, shop);
  },
});

app.http("shopsUpdate", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "shops/{shopId}",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const { shopId } = request.params;
    const existing = await readShop(shopId);
    if (!existing) {
      return json(404, { message: "Shop not found" });
    }

    const payload = await request.json();
    const updates: Partial<Shop> = {};
    if (payload.status !== undefined) {
      if (typeof payload.status !== "string" || !["open", "closed"].includes(payload.status)) {
        return json(400, { message: "status must be 'open' or 'closed'" });
      }
      updates.status = payload.status;
    }
    if (payload.acceptingOrders !== undefined) {
      if (typeof payload.acceptingOrders !== "boolean") {
        return json(400, { message: "acceptingOrders must be a boolean" });
      }
      updates.acceptingOrders = payload.acceptingOrders;
    }
    if (payload.paymentPolicy !== undefined) {
      if (typeof payload.paymentPolicy !== "string" || !["pay_on_pickup", "prepaid_only"].includes(payload.paymentPolicy)) {
        return json(400, { message: "paymentPolicy must be pay_on_pickup or prepaid_only" });
      }
      updates.paymentPolicy = payload.paymentPolicy;
    }
    if (payload.orderAcceptanceMode !== undefined) {
      if (typeof payload.orderAcceptanceMode !== "string" || !["manual", "auto"].includes(payload.orderAcceptanceMode)) {
        return json(400, { message: "orderAcceptanceMode must be manual or auto" });
      }
      updates.orderAcceptanceMode = payload.orderAcceptanceMode;
    }
    if (payload.allowGuestCheckout !== undefined) {
      if (typeof payload.allowGuestCheckout !== "boolean") {
        return json(400, { message: "allowGuestCheckout must be a boolean" });
      }
      updates.allowGuestCheckout = payload.allowGuestCheckout;
    }
    if (payload.fulfillmentOptions !== undefined) {
      if (typeof payload.fulfillmentOptions !== "object" || payload.fulfillmentOptions === null) {
        return json(400, { message: "fulfillmentOptions must be an object" });
      }
      updates.fulfillmentOptions = {
        ...existing.fulfillmentOptions,
        ...payload.fulfillmentOptions,
      };
    }
    if (payload.isActive !== undefined) {
      if (typeof payload.isActive !== "boolean") {
        return json(400, { message: "isActive must be a boolean" });
      }
      updates.isActive = payload.isActive;
    }

    if (Object.keys(updates).length === 0) {
      return json(400, { message: "No updatable fields provided" });
    }

    const updatedShop: Shop = {
      ...existing,
      ...updates,
      updatedAt: nowIso(),
    };

    await shopsContainer.items.upsert(updatedShop);
    await writeAuditLog({
      actorUserId: getActorUserId(request),
      entityType: "shopSettings",
      entityId: updatedShop.id,
      shopId: updatedShop.id,
      action: "UPDATE",
      before: existing,
      after: updatedShop,
    });

    return json(200, updatedShop);
  },
});

app.http("shopMembersList", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "shops/{shopId}/members",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const { shopId } = request.params;
    const querySpec = {
      query: "SELECT * FROM c WHERE c.shopId = @shopId",
      parameters: [{ name: "@shopId", value: shopId }],
    };
    const { resources } = await shopMembersContainer.items.query<ShopMember>(querySpec).fetchAll();
    return json(200, resources);
  },
});

app.http("shopMembersCreate", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "shops/{shopId}/members",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const { shopId } = request.params;
    const shop = await readShop(shopId);
    if (!shop) {
      return json(404, { message: "Shop not found" });
    }

    const payload = (await request.json()) ?? {};
    if (!payload.userId || typeof payload.userId !== "string" || !payload.role || typeof payload.role !== "string") {
      return json(400, { message: "userId and role are required" });
    }
    if (!["admin", "staff"].includes(payload.role)) {
      return json(400, { message: "role must be 'admin' or 'staff'" });
    }

    if (payload.isActive !== undefined && typeof payload.isActive !== "boolean") {
      return json(400, { message: "isActive must be a boolean" });
    }

    const member: ShopMember = {
      id: newId(),
      shopId,
      userId: payload.userId.trim(),
      role: payload.role,
      permissions: resolvePermissions(payload.permissions),
      isActive: payload.isActive ?? true,
      addedAt: nowIso(),
    };

    await shopMembersContainer.items.create(member);
    await writeAuditLog({
      actorUserId: getActorUserId(request),
      entityType: "membership",
      entityId: member.id,
      shopId,
      action: "CREATE",
      after: member,
    });

    return json(201, member);
  },
});

app.http("shopMembersUpdate", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "shops/{shopId}/members/{memberId}",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const { shopId, memberId } = request.params;
    try {
      const { resource } = await shopMembersContainer.item(memberId, memberId).read<ShopMember>();
      if (!resource || resource.shopId !== shopId) {
        return json(404, { message: "Member not found" });
      }
      const payload = await request.json();
      const allowed: Partial<ShopMember> = {};
      if (payload?.role !== undefined) {
        if (typeof payload.role !== "string" || !["owner", "admin", "staff"].includes(payload.role)) {
          return json(400, { message: "role must be owner, admin, or staff" });
        }
        allowed.role = payload.role;
      }
      if (payload?.isActive !== undefined) {
        if (typeof payload.isActive !== "boolean") {
          return json(400, { message: "isActive must be a boolean" });
        }
        allowed.isActive = payload.isActive;
      }
      if (payload?.permissions !== undefined) {
        allowed.permissions = resolvePermissions(payload.permissions);
      }
      if (Object.keys(allowed).length === 0) {
        return json(400, { message: "No updatable fields provided" });
      }
      const updatedMember: ShopMember = { ...resource, ...allowed };
      await shopMembersContainer.items.upsert(updatedMember);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: "membership",
        entityId: memberId,
        shopId,
        action: "UPDATE",
        before: resource,
        after: updatedMember,
      });
      return json(200, updatedMember);
    } catch {
      return json(404, { message: "Member not found" });
    }
  },
});

app.http("shopHoursGet", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "shops/{shopId}/hours",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const { shopId } = request.params;
    try {
      const { resource } = await shopHoursContainer.item(shopId, shopId).read<ShopHours>();
      if (!resource) {
        return json(200, {});
      }
      return json(200, resource);
    } catch {
      return json(200, {});
    }
  },
});

app.http("shopHoursUpsert", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "shops/{shopId}/hours",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const { shopId } = request.params;
    const shop = await readShop(shopId);
    if (!shop) {
      return json(404, { message: "Shop not found" });
    }

    const payload = (await request.json()) ?? {};
    if (!payload.timezone || typeof payload.timezone !== "string") {
      return json(400, { message: "timezone is required" });
    }
    if (!payload.weekly || typeof payload.weekly !== "object" || Array.isArray(payload.weekly)) {
      return json(400, { message: "weekly schedule is required" });
    }

    const timestamp = nowIso();
    let existing: ShopHours | undefined;
    try {
      const { resource } = await shopHoursContainer.item(shopId, shopId).read<ShopHours>();
      existing = resource ?? undefined;
    } catch {
      existing = undefined;
    }

    const record: ShopHours = {
      id: shopId,
      shopId,
      timezone: payload.timezone.trim(),
      weekly: payload.weekly,
      updatedAt: timestamp,
    };

    await shopHoursContainer.items.upsert(record);
    await writeAuditLog({
      actorUserId: getActorUserId(request),
      entityType: "shopHours",
      entityId: shopId,
      shopId,
      action: existing ? "UPDATE" : "CREATE",
      before: existing,
      after: record,
    });

    return json(existing ? 200 : 201, record);
  },
});
