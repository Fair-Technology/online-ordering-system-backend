import { ShopBranding } from '../../../domain/shop/Shop';

export interface UpdateShopRequestDto {
  shopId: string;
  name?: string;
  acceptingOrders?: boolean;
  isPaused?: boolean;
  pausedMessage?: string;
  paymentPolicy?: 'pay_online' | string;
  allowGuestCheckout?: boolean;
  currency?: string;
  timezone?: string;
  minOrderAmountCents?: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  branding?: ShopBranding | null;
}

export interface UpdateShopResultDto {
  id: string;
  slug: string;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
