export interface CheckoutItemDto {
  productId: string;
  quantity: number;
  selectedVariantOptionId?: string;
  selectedAddonOptionIds?: string[];
}

export interface CheckoutRequestDto {
  shopId: string;
  items: CheckoutItemDto[];
  customerEmail?: string;
  customerName?: string;
}

export interface CheckoutResultDto {
  orderId: string;
  clientSecret: string;
  subtotalCents: number;
  currency: string;
}
