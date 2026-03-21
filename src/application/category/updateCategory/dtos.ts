export interface UpdateCategoryRequestDto {
  categoryId: string;
  shopId: string;
  name?: string;
  sortOrder?: number;
  icon?: string;
}

export interface UpdateCategoryResultDto {
  id: string;
  shopId: string;
  name: string;
  sortOrder: number;
  icon?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
