import { HttpRequest } from '@azure/functions';
import {
  findShopById,
  updateShop,
} from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { checkIsOwner } from '../../_shared/permissions';
import { DeleteShopRoleRequestDto, DeleteShopRoleResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';
import { getActorFromAuth, logAudit } from '../../_shared/auditHelpers';

export async function executeDeleteShopRole(
  request: DeleteShopRoleRequestDto,
  httpRequest: HttpRequest,
): Promise<ApplicationResult<DeleteShopRoleResultDto>> {
  if (!request.shopId || typeof request.shopId !== 'string' || request.shopId.trim() === '') {
    return { ok: false, code: 'INVALID_INPUT', error: 'shopId is required and must be a non-empty string' };
  }

  if (!request.roleId || typeof request.roleId !== 'string' || request.roleId.trim() === '') {
    return { ok: false, code: 'INVALID_INPUT', error: 'roleId is required and must be a non-empty string' };
  }

  if (request.roleId.trim() === 'owner') {
    return { ok: false, code: 'INVALID_INPUT', error: 'Cannot delete the owner role' };
  }

  try {
    const actor = await getActorFromAuth(httpRequest);
    const userId = actor.userId;

    const shop = await findShopById(request.shopId.trim());
    if (!shop) {
      return { ok: false, code: 'NOT_FOUND', error: 'Shop not found' };
    }

    const ownerError = checkIsOwner(shop, userId);
    if (ownerError) return ownerError;

    const roleId = request.roleId.trim();

    const roleToDelete = shop.roles.find((r) => r.id === roleId);
    if (!roleToDelete) {
      return { ok: false, code: 'NOT_FOUND', error: 'Role not found' };
    }

    const membersUsingRole = shop.members.filter((m) => m.isActive && m.role === roleId);
    if (membersUsingRole.length > 0) {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        error: 'Cannot delete a role that is assigned to active members',
      };
    }

    shop.roles = shop.roles.filter((r) => r.id !== roleId);
    shop.updatedAt = new Date().toISOString();

    const updated = await updateShop(shop);

    logAudit(
      {
        shopId: shop.id,
        timestamp: new Date().toISOString(),
        actorId: actor.userId,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'role.delete',
        entityType: 'role',
        entityId: roleToDelete.id,
        entityName: roleToDelete.name,
      },
      httpRequest,
    );

    return { ok: true, data: { roles: updated.roles } };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return { ok: false, code: 'INTERNAL_ERROR', error: 'Failed to delete role' };
  }
}
