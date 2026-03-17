import { HttpRequest } from '@azure/functions';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { findUserById } from '../../../infrastructure/cosmos/user/CosmosUserRepository';
import { findUsageByShopId, upsertUsage } from '../../../infrastructure/cosmos/usage/CosmosUsageRepository';
import { productContainer } from '../../../infrastructure/cosmos/cosmosClient';
import { ApplicationResult } from '../../_shared/types';
import { ReconcileShopUsageResultDto } from './dtos';
import { ShopUsage } from '../../../domain/usage/ShopUsage';

export async function executeReconcileShopUsage(
  shopId: string,
  httpRequest: HttpRequest,
): Promise<ApplicationResult<ReconcileShopUsageResultDto>> {
  if (!shopId) {
    return { ok: false, code: 'INVALID_INPUT', error: 'shopId is required' };
  }

  try {
    const userId = await getUserIdFromAuth(httpRequest);
    const user = await findUserById(userId);
    if (user?.systemRole !== 'superadmin') {
      return { ok: false, code: 'FORBIDDEN', error: 'Superadmin access required' };
    }

    // Count active, non-deleted products for this shop
    const querySpec = {
      query: 'SELECT VALUE COUNT(1) FROM c WHERE c.shopId = @shopId AND c.isDeleted = false AND c.isAvailable = true',
      parameters: [{ name: '@shopId', value: shopId }],
    };
    const { resources } = await productContainer.items.query<number>(querySpec).fetchAll();
    const reconciledCount = resources[0] ?? 0;

    const now = new Date().toISOString();
    const existing = await findUsageByShopId(shopId);

    const updated: ShopUsage = {
      id: shopId,
      shopId,
      activeProductCount: reconciledCount,
      periodStart: existing?.periodStart ?? null,
      periodEnd: existing?.periodEnd ?? null,
      lastReconciled: now,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    const result = await upsertUsage(updated);
    return { ok: true, data: { usage: result, reconciledCount } };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return { ok: false, code: 'INTERNAL_ERROR', error: 'Failed to reconcile usage' };
  }
}
