import { HttpRequest } from '@azure/functions';
import {
  findShopById,
  updateShop,
} from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { getActorFromAuth, logAudit } from '../../_shared/auditHelpers';
import { ApplicationResult } from '../../_shared/types';
import { DeclineShopInvitationRequestDto, DeclineShopInvitationResultDto } from './dtos';

export async function executeDeclineShopInvitation(
  request: DeclineShopInvitationRequestDto,
  httpRequest: HttpRequest,
): Promise<ApplicationResult<DeclineShopInvitationResultDto>> {
  if (!request.shopId || request.shopId.trim() === '') {
    return { ok: false, code: 'INVALID_INPUT', error: 'shopId is required' };
  }

  try {
    const actor = await getActorFromAuth(httpRequest);

    const shop = await findShopById(request.shopId.trim());
    if (!shop) {
      return { ok: false, code: 'NOT_FOUND', error: 'Shop not found' };
    }

    const memberIndex = shop.members.findIndex(
      (m) => m.userId === actor.userId && !m.isActive,
    );

    if (memberIndex === -1) {
      return { ok: false, code: 'NOT_FOUND', error: 'No pending invitation found' };
    }

    shop.members.splice(memberIndex, 1);
    shop.updatedAt = new Date().toISOString();

    await updateShop(shop);

    logAudit(
      {
        shopId: shop.id,
        timestamp: new Date().toISOString(),
        actorId: actor.userId,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'member.invite.decline',
        entityType: 'member',
        entityId: actor.userId,
        entityName: '',
      },
      httpRequest,
    );

    return {
      ok: true,
      data: { shopId: shop.id, userId: actor.userId },
    };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return { ok: false, code: 'INTERNAL_ERROR', error: 'Failed to decline invitation' };
  }
}
