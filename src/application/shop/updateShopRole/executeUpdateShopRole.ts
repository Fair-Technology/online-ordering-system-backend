import { HttpRequest } from '@azure/functions';
import {
  findShopById,
  updateShop,
} from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { checkIsOwner, VALID_PERMISSIONS } from '../../_shared/permissions';
import { ShopPermission } from '../../../domain/shop/Shop';
import { UpdateShopRoleRequestDto, UpdateShopRoleResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';
import { getActorFromAuth, diffFields, logAudit } from '../../_shared/auditHelpers';

export async function executeUpdateShopRole(
  request: UpdateShopRoleRequestDto,
  httpRequest: HttpRequest,
): Promise<ApplicationResult<UpdateShopRoleResultDto>> {
  if (!request.shopId || typeof request.shopId !== 'string' || request.shopId.trim() === '') {
    return { ok: false, code: 'INVALID_INPUT', error: 'shopId is required and must be a non-empty string' };
  }

  if (!request.roleId || typeof request.roleId !== 'string' || request.roleId.trim() === '') {
    return { ok: false, code: 'INVALID_INPUT', error: 'roleId is required and must be a non-empty string' };
  }

  if (request.roleId.trim() === 'owner') {
    return { ok: false, code: 'INVALID_INPUT', error: 'Cannot edit the owner role' };
  }

  if (request.name !== undefined && (typeof request.name !== 'string' || request.name.trim() === '')) {
    return { ok: false, code: 'INVALID_INPUT', error: 'name must be a non-empty string' };
  }

  if (request.permissions !== undefined) {
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

    const roleIndex = shop.roles.findIndex((r) => r.id === request.roleId.trim());
    if (roleIndex === -1) {
      return { ok: false, code: 'NOT_FOUND', error: 'Role not found' };
    }

    const existingRole = shop.roles[roleIndex];
    shop.roles[roleIndex] = {
      ...existingRole,
      ...(request.name !== undefined && { name: request.name.trim() }),
      ...(request.permissions !== undefined && { permissions: request.permissions as ShopPermission[] }),
    };
    const changes = diffFields(
      existingRole as unknown as Record<string, unknown>,
      shop.roles[roleIndex] as unknown as Record<string, unknown>,
      ['name', 'permissions'],
      [],
    );

    shop.updatedAt = new Date().toISOString();

    const updated = await updateShop(shop);

    logAudit(
      {
        shopId: shop.id,
        timestamp: new Date().toISOString(),
        actorId: actor.userId,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'role.update',
        entityType: 'role',
        entityId: shop.roles[roleIndex].id,
        entityName: shop.roles[roleIndex].name,
        changes,
      },
      httpRequest,
    );

    return { ok: true, data: { roles: updated.roles } };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return { ok: false, code: 'INTERNAL_ERROR', error: 'Failed to update role' };
  }
}
