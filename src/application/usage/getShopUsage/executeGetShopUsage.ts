import { HttpRequest } from '@azure/functions';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { findUserById } from '../../../infrastructure/cosmos/user/CosmosUserRepository';
import { findUsageByShopId, upsertUsage } from '../../../infrastructure/cosmos/usage/CosmosUsageRepository';
import { ApplicationResult } from '../../_shared/types';
import { GetShopUsageResultDto } from './dtos';
import { ShopUsage } from '../../../domain/usage/ShopUsage';

export async function executeGetShopUsage(
  shopId: string,
  httpRequest: HttpRequest,
): Promise<ApplicationResult<GetShopUsageResultDto>> {
  if (!shopId) {
    return { ok: false, code: 'INVALID_INPUT', error: 'shopId is required' };
  }

  try {
    const userId = await getUserIdFromAuth(httpRequest);
    const user = await findUserById(userId);
    if (user?.systemRole !== 'superadmin') {
      return { ok: false, code: 'FORBIDDEN', error: 'Superadmin access required' };
    }

    let usage = await findUsageByShopId(shopId);

    if (!usage) {
      const now = new Date().toISOString();
      const newUsage: ShopUsage = {
        id: shopId,
        shopId,
        activeProductCount: 0,
        periodStart: null,
        periodEnd: null,
        lastReconciled: null,
        createdAt: now,
        updatedAt: now,
      };
      usage = await upsertUsage(newUsage);
    }

    return { ok: true, data: { usage } };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return { ok: false, code: 'INTERNAL_ERROR', error: 'Failed to retrieve usage' };
  }
}
