import { ShopMember, ShopMemberRole } from '../domain/shop.entity';
import {
  createShopMemberRepository,
  getShopMemberByIdRepository,
  listMembersByShopRepository,
  updateShopMemberRepository,
} from '../repositories/shopMemberRepository';
import { newId, nowIso } from '../utils/general';

export async function listShopMembersService(
  shopId: string,
): Promise<ShopMember[]> {
  return listMembersByShopRepository(shopId);
}

export interface ShopMemberInput {
  userId: string;
  role: ShopMemberRole;
  invitedByUserId?: string;
}

export async function createShopMemberService(
  shopId: string,
  input: ShopMemberInput,
): Promise<ShopMember> {
  const timestamp = nowIso();
  const member: ShopMember = {
    id: newId(),
    shopId,
    userId: input.userId,
    role: input.role,
    invitationStatus: 'accepted',
    invitedByUserId: input.invitedByUserId,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return createShopMemberRepository(member);
}

export async function updateShopMemberService(
  memberId: string,
  updates: Partial<Pick<ShopMember, 'role' | 'isActive'>>,
): Promise<ShopMember> {
  const existing = await getShopMemberByIdRepository(memberId);
  if (!existing) {
    throw Object.assign(new Error('Shop member not found'), { status: 404 });
  }
  const updated: ShopMember = {
    ...existing,
    role: updates.role ?? existing.role,
    isActive: updates.isActive ?? existing.isActive,
    updatedAt: nowIso(),
  };
  return updateShopMemberRepository(updated);
}
