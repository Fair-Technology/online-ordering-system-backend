import { randomUUID } from "crypto";
import { getContainer } from "./config/cosmosClient";
import { HttpRequestLike, HttpResponseInitLike } from "./types/http";
import { AuditLog, OrderStatus } from "./types/databaseTypes";
type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;
const usersContainer = getContainer("users");


const auditLogContainer = getContainer("auditLogs");

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ["accepted", "rejected", "cancelled"],
  accepted: ["ready_for_pickup", "cancelled"],
  ready_for_pickup: ["completed"],
  completed: [],
  cancelled: [],
  rejected: [],
};

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function canTransition(fromStatus: OrderStatus, toStatus: OrderStatus): boolean {
  if (fromStatus === toStatus) {
    return false;
  }
  const allowed = ORDER_TRANSITIONS[fromStatus] ?? [];
  return allowed.includes(toStatus);
}

export async function isShopOpenNow(shopId: string): Promise<boolean> {
  // TODO: Check shopHours container instead of blindly allowing new orders.
  void shopId;
  return true;
}

type AuditLogInput = Omit<AuditLog, "id" | "timestamp"> & { timestamp?: string };

export async function writeAuditLog(entry: AuditLogInput): Promise<void> {
  const payload: AuditLog = {
    id: newId(),
    timestamp: entry.timestamp ?? nowIso(),
    ...entry,
  };

  await auditLogContainer.items.create(payload);
}



////////////////////////////
export function json(status: number, body: unknown): HttpResponseInit {
  return { status, jsonBody: body };
}

export type Ctx = { userId?: string; body?: any };
export type GuardResult =
  | { next: true; ctx: Ctx }
  | { next: false; response: any };

export type Guard = (req: HttpRequest, ctx: Ctx) => Promise<GuardResult>;



// 2️⃣ Body Guard
export const bodyGuard: Guard = async (req, ctx) => {
  const body = await req.json().catch(() => null);
  if (!body?.id) {
    return { next: false, response: json(400, { message: "Missing id" }) };
  }
  return { next: true, ctx: { ...ctx, body } };
};

// 3️⃣ Idempotent Guard
export const idempotentGuard: Guard = async (_req, ctx) => {
  const id = ctx.body.id;
  const itemRef = usersContainer.item(id, id);
  const existing = await itemRef.read().catch(() => null);
  if (existing?.resource) {
    return { next: false, response: json(200, existing.resource) };
  }
  return { next: true, ctx };
};

// Helper to run guards
export async function runGuards(
  req: HttpRequest,
  guards: Guard[],
  seed: Ctx = {}
): Promise<GuardResult> {
  let ctx = seed;
  for (const g of guards) {
    const res = await g(req, ctx);
    if (!res.next) return res;
    ctx = res.ctx;
  }
  return { next: true, ctx };
}