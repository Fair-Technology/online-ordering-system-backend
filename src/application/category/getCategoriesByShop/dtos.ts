export interface GetCategoriesByShopRequestDto {
  shopId: string;
}

export interface CategoryDto {
  id: string;
  shopId: string;
  name: string;
  sortOrder: number;
  icon?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type GetCategoriesByShopResultDto = CategoryDto[];
