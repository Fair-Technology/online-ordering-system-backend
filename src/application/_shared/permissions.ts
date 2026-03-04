import { Shop, ShopPermission } from '../../domain/shop/Shop';
import { ApplicationError } from './types';

export type { ShopPermission };

/**
 * Check whether a user has a specific permission on a shop.
 *
 * - 'owner' role always passes (full access).
 * - All other roles are looked up in shop.roles[].permissions.
 * - Returns null if access is granted, or an ApplicationError if denied.
 *
 * 'manage_members' is intentionally not a grantable permission — only owners
 * can add/remove members, enforced by calling this function with 'owner' check.
 */
export function checkShopPermission(
  shop: Shop,
  userId: string,
  permission: ShopPermission,
): ApplicationError | null {
  const member = shop.members.find((m) => m.userId === userId && m.isActive);

  if (!member) {
    return { ok: false, code: 'FORBIDDEN', error: 'User is not a member of this shop' };
  }

  if (member.role === 'owner') {
    return null; // owners have full access
  }

  const role = shop.roles.find((r) => r.id === member.role);

  if (!role) {
    return { ok: false, code: 'FORBIDDEN', error: 'Role not found' };
  }

  if (!role.permissions.includes(permission)) {
    return { ok: false, code: 'FORBIDDEN', error: 'Insufficient permissions' };
  }

  return null;
}

/**
 * Check whether a user is an owner of the shop.
 * Returns null if they are, or an ApplicationError if not.
 */
export function checkIsOwner(shop: Shop, userId: string): ApplicationError | null {
  const member = shop.members.find(
    (m) => m.userId === userId && m.isActive && m.role === 'owner',
  );

  if (!member) {
    return { ok: false, code: 'FORBIDDEN', error: 'Only shop owners can perform this action' };
  }

  return null;
}

export const VALID_PERMISSIONS: ShopPermission[] = [
  'view_orders',
  'manage_products',
  'manage_shop',
];
