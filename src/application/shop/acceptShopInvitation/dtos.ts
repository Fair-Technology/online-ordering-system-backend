export interface AcceptShopInvitationRequestDto {
  shopId: string;
}

export interface AcceptShopInvitationResultDto {
  shopId: string;
  userId: string;
  role: string;
}
