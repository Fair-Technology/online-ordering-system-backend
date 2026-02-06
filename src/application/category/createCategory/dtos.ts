export interface CreateCategoryRequestDto {
  shopId: string;
  name: string;
  slug: string;
  sortOrder?: number;
}

export interface CreateCategoryResultDto {
  id: string;
  shopId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
