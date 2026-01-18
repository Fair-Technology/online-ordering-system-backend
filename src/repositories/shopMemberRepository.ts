import { getContainer } from '../infrastructure/cosmosClient';
import { ShopMember } from '../domain/shop.entity';

const shopMembersContainer = getContainer('shopMembers');

export async function listMembersByShopRepository(
  shopId: string,
): Promise<ShopMember[]> {
  const { resources } = await shopMembersContainer.items
    .query<ShopMember>({
      query: 'SELECT * FROM c WHERE c.shopId = @shopId ORDER BY c.createdAt DESC',
      parameters: [{ name: '@shopId', value: shopId }],
    })
    .fetchAll();
  return resources;
}

export async function listMembersByUserRepository(
  userId: string,
): Promise<ShopMember[]> {
  const { resources } = await shopMembersContainer.items
    .query<ShopMember>({
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.isActive = true',
      parameters: [{ name: '@userId', value: userId }],
    })
    .fetchAll();
  return resources;
}

export async function createShopMemberRepository(
  member: ShopMember,
): Promise<ShopMember> {
  const { resource } = await shopMembersContainer.items.create(member);
  return ((resource as unknown) as ShopMember) ?? member;
}

export async function getShopMemberByIdRepository(
  memberId: string,
): Promise<ShopMember | null> {
  const { resource } = await shopMembersContainer
    .item(memberId, memberId)
    .read<ShopMember>();
  return resource ?? null;
}

export async function updateShopMemberRepository(
  member: ShopMember,
): Promise<ShopMember> {
  const { resource } = await shopMembersContainer.items.upsert(member);
  return ((resource as unknown) as ShopMember) ?? member;
}
