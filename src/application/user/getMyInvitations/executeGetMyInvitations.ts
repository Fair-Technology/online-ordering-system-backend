import { HttpRequest } from '@azure/functions';
import { findShopsByPendingMemberId } from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { getActorFromAuth } from '../../_shared/auditHelpers';
import { ApplicationResult } from '../../_shared/types';
import { GetMyInvitationsResultDto } from './dtos';

export async function executeGetMyInvitations(
  httpRequest: HttpRequest,
): Promise<ApplicationResult<GetMyInvitationsResultDto>> {
  try {
    const actor = await getActorFromAuth(httpRequest);

    const shops = await findShopsByPendingMemberId(actor.userId);

    const invitations = shops.map((shop) => {
      const member = shop.members.find(
        (m) => m.userId === actor.userId && !m.isActive,
      );
      return {
        shopId: shop.id,
        shopName: shop.name,
        shopSlug: shop.slug,
        role: member?.role ?? '',
      };
    });

    return { ok: true, data: { invitations } };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return { ok: false, code: 'INTERNAL_ERROR', error: 'Failed to retrieve invitations' };
  }
}
