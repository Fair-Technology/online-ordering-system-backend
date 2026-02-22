import { Order, OrderStatus } from '../../../domain/order/Order';
import { orderContainer } from '../cosmosClient';

export async function createOrder(order: Order): Promise<Order> {
  try {
    const { resource } = await orderContainer.items.create<Order>(order);
    return resource!;
  } catch (error) {
    throw error;
  }
}

export async function findOrderById(
  orderId: string,
  shopId: string,
): Promise<Order | null> {
  try {
    const { resource } = await orderContainer
      .item(orderId, shopId)
      .read<Order>();
    return resource || null;
  } catch (error: any) {
    if (error.code === 404) {
      return null;
    }
    throw error;
  }
}

export async function updateOrderStatus(
  orderId: string,
  shopId: string,
  status: OrderStatus,
  updatedAt: string,
): Promise<void> {
  try {
    const { resource: existing } = await orderContainer
      .item(orderId, shopId)
      .read<Order>();
    if (!existing) return;
    await orderContainer
      .item(orderId, shopId)
      .replace<Order>({ ...existing, status, updatedAt });
  } catch (error) {
    throw error;
  }
}
