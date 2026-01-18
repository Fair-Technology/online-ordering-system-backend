import { getContainer } from '../infrastructure/cosmosClient';
import { HttpRequestLike } from '../domain/otherTypes';
import { Order, OrderStatus } from '../domain/order.entity';
import { Shop } from '../domain/shop.entity';
import {
  CreateOrderRequest,
  OrderItemPayload,
  UpdateOrderStatusRequest,
} from '../domain/order.dto';

const shopsContainer = getContainer('shops');
const ordersContainer = getContainer('orders');

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['accepted', 'rejected', 'cancelled'],
  accepted: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['completed'],
  completed: [],
  cancelled: [],
  rejected: [],
};

export class ValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function readJson<T>(req: HttpRequestLike): Promise<T | null> {
  return (await req.json().catch(() => null)) as T | null;
}

function ensureString(
  value: unknown,
  message: string,
  required = true,
): string | undefined {
  if (value === undefined || value === null) {
    if (required) {
      throw new ValidationError(message);
    }
    return undefined;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(message);
  }
  return value.trim();
}

function requireRouteParam(
  req: HttpRequestLike,
  name: string,
  friendlyName = name,
): string {
  const value = req.params?.[name];
  if (!value || typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${friendlyName} is required`, 400);
  }
  return value.trim();
}

async function getShopOrThrow(shopId: string): Promise<Shop> {
  const { resource } = await shopsContainer.item(shopId, shopId).read<Shop>();
  if (!resource) {
    throw new ValidationError('Shop not found', 404);
  }
  return resource;
}

export function validateOrdersList(req: HttpRequestLike) {
  const shopId = requireRouteParam(req, 'shopId');
  const statusesParam = req.query?.get('status');
  const statuses = statusesParam
    ? statusesParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  return { shopId, statuses };
}

export async function validateOrdersCreate(req: HttpRequestLike) {
  const shopId = requireRouteParam(req, 'shopId');
  await getShopOrThrow(shopId);
  const payload = await readJson<CreateOrderRequest>(req);
  if (!payload) {
    throw new ValidationError('Invalid body');
  }
  const userId = ensureString(payload.userId, 'userId is required');
  const customerName = ensureString(
    payload.customerName,
    'customerName is required',
  );
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new ValidationError('items must be provided');
  }
  return {
    shopId,
    userId: userId!,
    customerName: customerName!,
    customerPhone: payload.customerPhone?.trim(),
    customerNotes: payload.customerNotes?.trim(),
    items: payload.items as OrderItemPayload[],
    fulfillmentType: payload.fulfillmentType ?? 'pickup',
    scheduledFor: payload.scheduledFor,
  };
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

export async function validateOrdersUpdateStatus(req: HttpRequestLike) {
  const shopId = requireRouteParam(req, 'shopId');
  const orderId = requireRouteParam(req, 'orderId');
  const payload = await readJson<UpdateOrderStatusRequest>(req);
  if (!payload || typeof payload.nextStatus !== 'string') {
    throw new ValidationError('nextStatus is required');
  }
  const { resource } = await ordersContainer
    .item(orderId, orderId)
    .read<Order>();
  if (!resource || resource.shopId !== shopId) {
    throw new ValidationError('Order not found', 404);
  }
  return { order: resource, nextStatus: payload.nextStatus };
}
