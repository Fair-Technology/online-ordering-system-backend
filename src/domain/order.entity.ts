import { DocumentBase, Money } from './baseTypes';

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'rejected'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'authorized' | 'paid' | 'refunded';

export interface OrderItemAddonSnapshot {
  addonOptionId: string;
  nameSnapshot: string;
  priceDeltaSnapshot: Money;
}

export interface OrderItem {
  productId: string;
  productVariantId: string;
  productNameSnapshot: string;
  variantLabelSnapshot: string;
  finalUnitPrice: Money;
  quantity: number;
  addons: OrderItemAddonSnapshot[];
}

export interface Order extends DocumentBase {
  shopId: string;
  userId: string; // can be "guest"
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: Money;
  submittedAt: string;
  customerName: string;
  customerPhone?: string;
  customerNotes?: string;
  fulfillmentSlot?: {
    type: 'pickup' | 'delivery';
    scheduledFor?: string;
  };
  items: OrderItem[];
}
