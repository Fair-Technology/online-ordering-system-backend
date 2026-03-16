export interface GetCategoryRequestDto {
  categoryId: string;
  shopId: string;
}

export interface GetCategoryResultDto {
  id: string;
  shopId: string;
  name: string;
  sortOrder: number;
  hasStar: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
