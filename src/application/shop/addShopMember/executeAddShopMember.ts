import { HttpRequest } from '@azure/functions';
import {
  findShopById,
  updateShop,
} from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { findUserByEmail } from '../../../infrastructure/cosmos/user/CosmosUserRepository';
import { checkIsOwner } from '../../_shared/permissions';
import { AddShopMemberRequestDto, AddShopMemberResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';
import { getActorFromAuth, logAudit } from '../../_shared/auditHelpers';

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

  const hasUserId = request.userId && typeof request.userId === 'string' && request.userId.trim() !== '';
  const hasEmail = request.email && typeof request.email === 'string' && request.email.trim() !== '';

  if (!hasUserId && !hasEmail) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'Either userId or email is required',
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
    const actor = await getActorFromAuth(httpRequest);
    const callerId = actor.userId;

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

    // Resolve userId: from direct input or by email lookup
    let resolvedUserId: string;

    if (hasUserId) {
      resolvedUserId = request.userId!.trim();
    } else {
      const user = await findUserByEmail(request.email!.trim());
      if (!user) {
        return {
          ok: false,
          code: 'NOT_FOUND',
          error: 'No account found for this email. They need to sign up first.',
        };
      }
      resolvedUserId = user.id;
    }

    // Check if already an active member
    const alreadyActiveMember = shop.members.some(
      (m) => m.userId === resolvedUserId && m.isActive,
    );

    if (alreadyActiveMember) {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        error: 'User is already an active member of this shop',
      };
    }

    // Check if already has a pending invite
    const alreadyPending = shop.members.some(
      (m) => m.userId === resolvedUserId && !m.isActive,
    );

    if (alreadyPending) {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        error: 'User already has a pending invitation to this shop',
      };
    }

    shop.members.push({
      userId: resolvedUserId,
      role,
      isActive: false,
    });

    shop.updatedAt = new Date().toISOString();
    const updated = await updateShop(shop);

    logAudit(
      {
        shopId: shop.id,
        timestamp: new Date().toISOString(),
        actorId: actor.userId,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'member.invite',
        entityType: 'member',
        entityId: resolvedUserId,
        entityName: role,
      },
      httpRequest,
    );

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
