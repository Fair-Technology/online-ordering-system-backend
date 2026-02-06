export interface GetCategoriesByShopRequestDto {
  shopId: string;
}

export interface CategoryDto {
  id: string;
  shopId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type GetCategoriesByShopResultDto = CategoryDto[];
