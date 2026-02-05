export interface GetShopRequestDto {
  shopId: string;
}

export interface ShopDto {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetShopResultDto {
  shop: ShopDto;
}
