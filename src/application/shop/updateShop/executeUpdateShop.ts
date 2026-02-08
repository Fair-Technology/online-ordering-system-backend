import {
  findShopById,
  updateShop as updateShopInRepo,
} from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { UpdateShopRequestDto, UpdateShopResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

export async function executeUpdateShop(
  request: UpdateShopRequestDto,
): Promise<ApplicationResult<UpdateShopResultDto>> {
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

    // Update only provided fields
    const updatedShop = {
      ...shop,
      ...(request.name !== undefined && { name: request.name }),
      ...(request.acceptingOrders !== undefined && {
        acceptingOrders: request.acceptingOrders,
      }),
      ...(request.isPaused !== undefined && { isPaused: request.isPaused }),
      ...(request.pausedMessage !== undefined && {
        pausedMessage: request.pausedMessage,
      }),
      ...(request.paymentPolicy !== undefined && {
        paymentPolicy: request.paymentPolicy,
      }),
      ...(request.allowGuestCheckout !== undefined && {
        allowGuestCheckout: request.allowGuestCheckout,
      }),
      ...(request.currency !== undefined && { currency: request.currency }),
      ...(request.timezone !== undefined && { timezone: request.timezone }),
      ...(request.minOrderAmountCents !== undefined && {
        minOrderAmountCents: request.minOrderAmountCents,
      }),
      ...(request.address !== undefined && {
        address: { ...shop.address, ...request.address },
      }),
      updatedAt: new Date().toISOString(),
    };

    const result = await updateShopInRepo(updatedShop);

    const resultDto: UpdateShopResultDto = {
      id: result.id,
      slug: result.slug,
      name: result.name,
      isDeleted: result.isDeleted,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };

    return {
      ok: true,
      data: resultDto,
    };
  } catch (error) {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to update shop',
    };
  }
}
