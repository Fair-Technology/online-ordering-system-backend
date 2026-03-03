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
  selectedVariantOptionName?: string; // snapshot at time of order
  selectedAddonOptionIds?: string[];
  selectedAddonOptionNames?: string[]; // snapshot at time of order
  lineTotalCents: number; // unitPriceCents × quantity
}

export interface Order {
  id: string; // UUID (Cosmos item id)
  shopId: string; // partition key
  orderRef: string; // human-readable e.g. "AB3-K7P"
  status: OrderStatus;
  items: OrderItem[];
  subtotalCents: number; // sum of all lineTotalCents (server-computed)
  currency: string; // from shop (e.g. "AUD")
  stripePaymentIntentId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
