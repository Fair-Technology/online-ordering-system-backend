import {
  FulfillmentOptions,
  Shop,
  ShopMemberRole,
  ShopStatus,
} from './shop.entity';
import { ShopEntity } from './shop.entity';

export interface ShopDTO {
  id: string;
  name: string;
  status: ShopStatus;
  acceptingOrders: boolean;
  timezone?: string;
  address?: string;
  fulfillment: {
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
    deliveryRadiusKm?: number;
    deliveryFee?: number;
  };
  updatedAt: string;
}

export function mapShopToDTO(shop: ShopEntity): ShopDTO {
  return {
    id: shop.id,
    name: shop.name,
    status: shop.status,
    acceptingOrders: shop.acceptingOrders,
    timezone: shop.timezone,
    address: shop.address,
    fulfillment: {
      pickupEnabled: shop.fulfillmentOptions.pickupEnabled,
      deliveryEnabled: shop.fulfillmentOptions.deliveryEnabled,
      deliveryRadiusKm: shop.fulfillmentOptions.deliveryRadiusKm,
      deliveryFee: shop.fulfillmentOptions.deliveryFee?.amount,
    },
    updatedAt: shop.updatedAt,
  };
}

export interface ShopSettingsPayload {
  name?: string;
  slug?: string;
  legalName?: string;
  address?: string;
  timezone?: string;
  status?: ShopStatus;
  acceptingOrders?: boolean;
  paymentPolicy?: Shop['paymentPolicy'];
  orderAcceptanceMode?: Shop['orderAcceptanceMode'];
  allowGuestCheckout?: boolean;
  fulfillmentOptions?: Partial<FulfillmentOptions>;
  defaultCurrency?: string;
}

export interface CreateShopRequest extends ShopSettingsPayload {
  ownerUserId: string;
}

export type UpdateShopRequest = ShopSettingsPayload;

export interface ShopMemberInvitePayload {
  userId: string;
  role: ShopMemberRole;
  invitedByUserId?: string;
}

export interface ShopMemberUpdatePayload {
  role?: ShopMemberRole;
  isActive?: boolean;
}

export interface ManagedShopView {
  shopId: string;
  name: string;
  status: ShopStatus;
  acceptingOrders: boolean;
  role: ShopMemberRole;
}
