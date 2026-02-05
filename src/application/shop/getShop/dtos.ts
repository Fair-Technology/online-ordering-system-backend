export interface GetShopRequestDto {
  shopId: string;
}

export interface GetShopResultDto {
  id: string;
  slug: string;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
