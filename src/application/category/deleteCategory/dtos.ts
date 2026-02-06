export interface DeleteCategoryRequestDto {
  categoryId: string;
  shopId: string;
}

export interface DeleteCategoryResultDto {
  id: string;
  shopId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
