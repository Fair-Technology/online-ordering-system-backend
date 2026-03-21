export interface AddShopMemberRequestDto {
  shopId: string;
  userId?: string;
  email?: string;
  role: string; // 'owner' or any role id from shop.roles
}

export interface AddShopMemberResultDto {
  members: Array<{ userId: string; role: string; isActive: boolean }>;
}
