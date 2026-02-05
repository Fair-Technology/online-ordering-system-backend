export interface CreateShopRequestDto {
  slug: string;
  name: string;
  currency: string;
  timezone: string;
  minOrderAmountCents: number;
  paymentPolicy: 'pay_online' | string;
  allowGuestCheckout: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export interface CreateShopResultDto {
  id: string;
  slug: string;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
