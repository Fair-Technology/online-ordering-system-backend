export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  productId: string;
  productName: string; // snapshot at time of order
  quantity: number;
  unitPriceCents: number; // server-computed (base + variant + addons)
  selectedVariantOptionId?: string;
  selectedAddonOptionIds?: string[];
  lineTotalCents: number; // unitPriceCents × quantity
}

export interface Order {
  id: string; // UUID (Cosmos item id)
  shopId: string; // partition key
  status: OrderStatus;
  items: OrderItem[];
  subtotalCents: number; // sum of all lineTotalCents (server-computed)
  currency: string; // from shop (e.g. "AUD")
  stripePaymentIntentId: string;
  customerEmail?: string;
  customerName?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
