export interface UpdateCategoryRequestDto {
  categoryId: string;
  shopId: string;
  name?: string;
  slug?: string;
  sortOrder?: number;
}

export interface UpdateCategoryResultDto {
  id: string;
  shopId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
