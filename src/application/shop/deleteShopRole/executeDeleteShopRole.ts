import { HttpRequest } from '@azure/functions';
import {
  findShopById,
  updateShop,
} from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { checkIsOwner } from '../../_shared/permissions';
import { DeleteShopRoleRequestDto, DeleteShopRoleResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

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
    const userId = await getUserIdFromAuth(httpRequest);

    const shop = await findShopById(request.shopId.trim());
    if (!shop) {
      return { ok: false, code: 'NOT_FOUND', error: 'Shop not found' };
    }

    const ownerError = checkIsOwner(shop, userId);
    if (ownerError) return ownerError;

    const roleId = request.roleId.trim();

    const roleExists = shop.roles.some((r) => r.id === roleId);
    if (!roleExists) {
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

    return { ok: true, data: { roles: updated.roles } };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return { ok: false, code: 'INTERNAL_ERROR', error: 'Failed to delete role' };
  }
}
