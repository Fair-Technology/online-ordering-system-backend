import { randomUUID } from 'crypto';
import { getContainer } from '../infrastructure/cosmosClient';
import { AuditLog, OrderStatus, PrincipalRef } from '../domain/databaseTypes';
import { HttpRequestLike } from '../domain/otherTypes';
type HttpRequest = HttpRequestLike;
import { Container } from '@azure/cosmos';

const auditLogContainer = getContainer('auditLogs');

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['accepted', 'rejected', 'cancelled'],
  accepted: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['completed'],
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

export function canTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
): boolean {
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

type AuditLogInput = {
  actorUserId?: string;
  actor?: PrincipalRef;
  shopId?: string;
  entityType: AuditLog['entityType'];
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
};

export async function writeAuditLog(entry: AuditLogInput): Promise<void> {
  const timestamp = nowIso();
  const actor: PrincipalRef =
    entry.actor ??
    ({
      type: 'user',
      id: entry.actorUserId ?? 'system',
    } as PrincipalRef);

  const payload: AuditLog = {
    id: newId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    actor,
    shopId: entry.shopId,
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
    before: entry.before,
    after: entry.after,
  };

  await auditLogContainer.items.create(payload);
}

export const getActorUserId = (request: HttpRequest): string => {
  return request.headers.get('x-user-id') ?? 'system';
};

export async function fetchByProperty<T>(
  container: Container,
  propertyName: string,
  propertyValue: string | number | boolean | (string | number | boolean)[],
): Promise<T[]> {
  let query: string;
  let parameters: { name: string; value: any }[];

  if (Array.isArray(propertyValue)) {
    query = `SELECT * FROM c WHERE ARRAY_CONTAINS(@values, c.${propertyName})`;
    parameters = [{ name: '@values', value: propertyValue }];
  } else {
    query = `SELECT * FROM c WHERE c.${propertyName} = @value`;
    parameters = [{ name: '@value', value: propertyValue }];
  }

  const { resources } = await container.items
    .query<T>({ query, parameters })
    .fetchAll();

  return resources;
}
