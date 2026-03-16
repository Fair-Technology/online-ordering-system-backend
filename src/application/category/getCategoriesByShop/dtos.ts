export interface GetCategoriesByShopRequestDto {
  shopId: string;
}

export interface CategoryDto {
  id: string;
  shopId: string;
  name: string;
  sortOrder: number;
  hasStar: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type GetCategoriesByShopResultDto = CategoryDto[];
