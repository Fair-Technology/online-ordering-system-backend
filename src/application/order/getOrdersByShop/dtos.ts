export type GetOrdersByShopRequestDto = { shopId: string };

export type OrderItemDto = {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  selectedVariantOptionId?: string | null;
  selectedAddonOptionIds?: string[] | null;
  lineTotalCents: number;
};

export type OrderDto = {
  id: string;
  orderRef: string;
  status: 'pending_payment' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  items: OrderItemDto[];
  subtotalCents: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
  createdAt: string;
};

export type GetOrdersByShopResultDto = OrderDto[];
