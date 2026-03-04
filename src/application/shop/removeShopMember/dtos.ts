export interface RemoveShopMemberRequestDto {
  shopId: string;
  targetUserId: string;
}

export interface RemoveShopMemberResultDto {
  members: Array<{ userId: string; role: string; isActive: boolean }>;
}
