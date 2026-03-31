import { HttpRequest } from '@azure/functions';
import {
  findShopById,
  updateShop,
} from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { checkIsOwner } from '../../_shared/permissions';
import { ApplicationResult } from '../../_shared/types';
import { DisconnectStripeAccountRequestDto, DisconnectStripeAccountResultDto } from './dtos';

export async function executeDisconnectStripeAccount(
  request: DisconnectStripeAccountRequestDto,
  httpRequest: HttpRequest,
): Promise<ApplicationResult<DisconnectStripeAccountResultDto>> {
  if (!request.shopId || request.shopId.trim() === '') {
    return { ok: false, code: 'INVALID_INPUT', error: 'shopId is required' };
  }

  try {
    const userId = await getUserIdFromAuth(httpRequest);

    const shop = await findShopById(request.shopId.trim());
    if (!shop) {
      return { ok: false, code: 'NOT_FOUND', error: 'Shop not found' };
    }

    const ownerError = checkIsOwner(shop, userId);
    if (ownerError) return ownerError;

    await updateShop({
      ...shop,
      stripe: null,
      isPaused: true,
      updatedAt: new Date().toISOString(),
    });

    return { ok: true, data: { shopId: shop.id } };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return { ok: false, code: 'INTERNAL_ERROR', error: 'Failed to disconnect Stripe account' };
  }
}
