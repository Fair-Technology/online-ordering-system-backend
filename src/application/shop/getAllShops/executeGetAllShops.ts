import { HttpRequest } from '@azure/functions';
import { findAllShops } from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { GetAllShopsRequestDto, GetAllShopsResultDto, ShopSummaryDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

export async function executeGetAllShops(
  request: GetAllShopsRequestDto,
  httpRequest: HttpRequest,
): Promise<ApplicationResult<GetAllShopsResultDto>> {
  try {
    await getUserIdFromAuth(httpRequest);

    const shops = await findAllShops();

    const shopDtos: ShopSummaryDto[] = shops.map((shop) => ({
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      isDeleted: shop.isDeleted,
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
    }));

    const resultDto: GetAllShopsResultDto = {
      shops: shopDtos,
      total: shopDtos.length,
    };

    return {
      ok: true,
      data: resultDto,
    };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return {
        ok: false,
        code: 'FORBIDDEN',
        error: 'Authentication required',
      };
    }

    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to retrieve shops',
    };
  }
}
