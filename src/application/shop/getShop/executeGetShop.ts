import { findShopById } from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { GetShopRequestDto, GetShopResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

export async function executeGetShop(
  request: GetShopRequestDto,
): Promise<ApplicationResult<GetShopResultDto>> {
  // Validate input
  if (
    !request.shopId ||
    typeof request.shopId !== 'string' ||
    request.shopId.trim() === ''
  ) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'shopId is required and must be a non-empty string',
    };
  }

  try {
    const shop = await findShopById(request.shopId.trim());

    if (!shop) {
      return {
        ok: false,
        code: 'NOT_FOUND',
        error: 'Shop not found',
      };
    }

    const shopDto: GetShopResultDto = {
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      isDeleted: shop.isDeleted,
      acceptingOrders: shop.acceptingOrders,
      isPaused: shop.isPaused,
      pausedMessage: shop.pausedMessage,
      paymentPolicy: shop.paymentPolicy,
      orderAcceptanceMode: shop.orderAcceptanceMode,
      allowGuestCheckout: shop.allowGuestCheckout,
      currency: shop.currency,
      timezone: shop.timezone,
      minOrderAmountCents: shop.minOrderAmountCents,
      address: shop.address,
      openingHours: shop.openingHours,
      closures: shop.closures,
      members: shop.members,
      branding: shop.branding ?? null,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    };

    return {
      ok: true,
      data: shopDto,
    };
  } catch (error) {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to retrieve shop',
    };
  }
}
