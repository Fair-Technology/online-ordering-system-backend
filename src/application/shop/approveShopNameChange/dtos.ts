export interface ApproveShopNameChangeRequestDto {
  shopId: string;
}

export interface ApproveShopNameChangeResultDto {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
}
