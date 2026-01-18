import { DocumentBase, Money } from './baseTypes';

export type ShopStatus = 'draft' | 'open' | 'closed' | 'suspended';
export type PaymentPolicy = 'pay_on_pickup' | 'prepaid_only';
export type OrderAcceptanceMode = 'auto' | 'manual';
export type ShopMemberRole = 'owner' | 'manager' | 'staff' | 'viewer';

export interface Shop extends DocumentBase {
  name: string;
  slug: string;
  ownerUserId: string;
  legalName?: string;
  address?: string;
  timezone?: string;
  status: ShopStatus;
  acceptingOrders: boolean;
  paymentPolicy: PaymentPolicy;
  orderAcceptanceMode: OrderAcceptanceMode;
  allowGuestCheckout: boolean;
  fulfillmentOptions: FulfillmentOptions;
  defaultCurrency: string;
}

export interface FulfillmentOptions {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryRadiusKm?: number;
  deliveryFee?: Money;
  leadTimeMinutes?: number;
}

export interface ShopMember extends DocumentBase {
  shopId: string;
  userId: string;
  role: ShopMemberRole;
  invitationStatus?: 'pending' | 'accepted' | 'revoked';
  invitedByUserId?: string;
  isActive: boolean;
}

export interface ShopHours extends DocumentBase {
  shopId: string;
  timezone: string;
  weekly: {
    monday?: ShopHoursWindow[];
    tuesday?: ShopHoursWindow[];
    wednesday?: ShopHoursWindow[];
    thursday?: ShopHoursWindow[];
    friday?: ShopHoursWindow[];
    saturday?: ShopHoursWindow[];
    sunday?: ShopHoursWindow[];
  };
}

export interface ShopHoursWindow {
  opensAt: string; // "09:00"
  closesAt: string; // "17:00"
  isClosed?: boolean;
}

export type ShopEntity = Shop;
