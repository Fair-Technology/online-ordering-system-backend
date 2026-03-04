export interface AddShopMemberRequestDto {
  shopId: string;
  userId: string;
  role: 'owner' | 'staff';
}

export interface AddShopMemberResultDto {
  members: Array<{ userId: string; role: 'owner' | 'staff'; isActive: boolean }>;
}
