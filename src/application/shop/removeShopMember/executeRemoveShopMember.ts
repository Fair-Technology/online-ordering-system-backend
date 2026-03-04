import { HttpRequest } from '@azure/functions';
import {
  findShopById,
  updateShop,
} from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { RemoveShopMemberRequestDto, RemoveShopMemberResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

export async function executeRemoveShopMember(
  request: RemoveShopMemberRequestDto,
  httpRequest: HttpRequest,
): Promise<ApplicationResult<RemoveShopMemberResultDto>> {
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

  if (
    !request.targetUserId ||
    typeof request.targetUserId !== 'string' ||
    request.targetUserId.trim() === ''
  ) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'targetUserId is required and must be a non-empty string',
    };
  }

  try {
    const callerId = getUserIdFromAuth(httpRequest);

    const shop = await findShopById(request.shopId.trim());

    if (!shop) {
      return {
        ok: false,
        code: 'NOT_FOUND',
        error: 'Shop not found',
      };
    }

    const callerMember = shop.members.find(
      (m) => m.userId === callerId && m.isActive && m.role === 'owner',
    );

    if (!callerMember) {
      return {
        ok: false,
        code: 'FORBIDDEN',
        error: 'Only active owners can remove members',
      };
    }

    const targetUserId = request.targetUserId.trim();
    const targetMember = shop.members.find((m) => m.userId === targetUserId);

    if (!targetMember) {
      return {
        ok: false,
        code: 'NOT_FOUND',
        error: 'Member not found in this shop',
      };
    }

    const activeOwnersAfterRemoval = shop.members.filter(
      (m) => m.isActive && m.role === 'owner' && m.userId !== targetUserId,
    );

    if (activeOwnersAfterRemoval.length === 0) {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        error: 'Cannot remove the last active owner',
      };
    }

    shop.members = shop.members.filter((m) => m.userId !== targetUserId);
    shop.updatedAt = new Date().toISOString();
    const updated = await updateShop(shop);

    return {
      ok: true,
      data: { members: updated.members },
    };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to remove shop member',
    };
  }
}
