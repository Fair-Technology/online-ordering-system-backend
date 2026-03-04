import { HttpRequest } from '@azure/functions';
import {
  findShopById,
  updateShop,
} from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { checkIsOwner } from '../../_shared/permissions';
import { AddShopMemberRequestDto, AddShopMemberResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

export async function executeAddShopMember(
  request: AddShopMemberRequestDto,
  httpRequest: HttpRequest,
): Promise<ApplicationResult<AddShopMemberResultDto>> {
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
    !request.userId ||
    typeof request.userId !== 'string' ||
    request.userId.trim() === ''
  ) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'userId is required and must be a non-empty string',
    };
  }

  if (!request.role || typeof request.role !== 'string' || request.role.trim() === '') {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'role is required and must be a non-empty string',
    };
  }

  try {
    const callerId = await getUserIdFromAuth(httpRequest);

    const shop = await findShopById(request.shopId.trim());

    if (!shop) {
      return {
        ok: false,
        code: 'NOT_FOUND',
        error: 'Shop not found',
      };
    }

    const ownerError = checkIsOwner(shop, callerId);
    if (ownerError) return ownerError;

    const role = request.role.trim();

    // Validate that the role exists (unless assigning 'owner')
    if (role !== 'owner') {
      const roleExists = shop.roles.some((r) => r.id === role);
      if (!roleExists) {
        return {
          ok: false,
          code: 'INVALID_INPUT',
          error: `Role '${role}' does not exist in this shop`,
        };
      }
    }

    const alreadyMember = shop.members.some(
      (m) => m.userId === request.userId.trim() && m.isActive,
    );

    if (alreadyMember) {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        error: 'User is already an active member of this shop',
      };
    }

    shop.members.push({
      userId: request.userId.trim(),
      role,
      isActive: true,
    });

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
      error: 'Failed to add shop member',
    };
  }
}
