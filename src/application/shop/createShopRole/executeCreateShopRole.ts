import { HttpRequest } from '@azure/functions';
import {
  findShopById,
  updateShop,
} from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { checkIsOwner, VALID_PERMISSIONS } from '../../_shared/permissions';
import { ShopPermission } from '../../../domain/shop/Shop';
import { CreateShopRoleRequestDto, CreateShopRoleResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

export async function executeCreateShopRole(
  request: CreateShopRoleRequestDto,
  httpRequest: HttpRequest,
): Promise<ApplicationResult<CreateShopRoleResultDto>> {
  if (!request.shopId || typeof request.shopId !== 'string' || request.shopId.trim() === '') {
    return { ok: false, code: 'INVALID_INPUT', error: 'shopId is required and must be a non-empty string' };
  }

  if (!request.name || typeof request.name !== 'string' || request.name.trim() === '') {
    return { ok: false, code: 'INVALID_INPUT', error: 'name is required and must be a non-empty string' };
  }

  if (!Array.isArray(request.permissions)) {
    return { ok: false, code: 'INVALID_INPUT', error: 'permissions must be an array' };
  }

  const invalidPerms = request.permissions.filter((p) => !VALID_PERMISSIONS.includes(p as ShopPermission));
  if (invalidPerms.length > 0) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: `Invalid permissions: ${invalidPerms.join(', ')}. Valid values: ${VALID_PERMISSIONS.join(', ')}`,
    };
  }

  try {
    const userId = await getUserIdFromAuth(httpRequest);

    const shop = await findShopById(request.shopId.trim());
    if (!shop) {
      return { ok: false, code: 'NOT_FOUND', error: 'Shop not found' };
    }

    const ownerError = checkIsOwner(shop, userId);
    if (ownerError) return ownerError;

    const newRole = {
      id: crypto.randomUUID(),
      name: request.name.trim(),
      permissions: request.permissions as ShopPermission[],
    };

    shop.roles = [...(shop.roles ?? []), newRole];
    shop.updatedAt = new Date().toISOString();

    const updated = await updateShop(shop);

    return { ok: true, data: { roles: updated.roles } };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return { ok: false, code: 'INTERNAL_ERROR', error: 'Failed to create role' };
  }
}
