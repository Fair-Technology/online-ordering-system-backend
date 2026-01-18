import { Order, OrderItem, OrderStatus } from './order.entity';

export type OrderResponse = Order;

export type OrderItemPayload = Pick<
  OrderItem,
  'productId' | 'productVariantId' | 'quantity'
> & {
  addonOptionIds?: string[];
};

export interface CreateOrderRequest {
  userId: string;
  customerName: string;
  customerPhone?: string;
  customerNotes?: string;
  items: OrderItemPayload[];
  fulfillmentType?: 'pickup' | 'delivery';
  scheduledFor?: string;
}

export interface UpdateOrderStatusRequest {
  nextStatus: OrderStatus;
}
