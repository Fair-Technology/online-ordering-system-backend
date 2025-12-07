import { Shop } from './databaseTypes';
import { ShopResponse } from './responseTypes';
import { ShopEntity } from './shop.entity';

export interface ShopDTO {
  id: string;
  name: string;
  status: string;
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

export function applyShopDTOToEntity(
  dto: ShopDTO,
  current: ShopResponse,
): Shop {
  return {
    ...current,
    name: dto.name,
    status: dto.status as Shop['status'],
    acceptingOrders: dto.acceptingOrders,
    timezone: dto.timezone,
    address: dto.address,
    fulfillmentOptions: {
      ...current.fulfillmentOptions,
      pickupEnabled: dto.fulfillment.pickupEnabled,
      deliveryEnabled: dto.fulfillment.deliveryEnabled,
      deliveryRadiusKm: dto.fulfillment.deliveryRadiusKm,
      deliveryFee: dto.fulfillment.deliveryFee
        ? {
            amount: dto.fulfillment.deliveryFee,
            currency: current.defaultCurrency,
          }
        : current.fulfillmentOptions.deliveryFee,
    },
    updatedAt: new Date().toISOString(),
  };
}
