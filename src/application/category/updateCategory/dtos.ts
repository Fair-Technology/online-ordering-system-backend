export interface UpdateCategoryRequestDto {
  categoryId: string;
  shopId: string;
  name?: string;
  sortOrder?: number;
  hasStar?: boolean;
}

export interface UpdateCategoryResultDto {
  id: string;
  shopId: string;
  name: string;
  sortOrder: number;
  hasStar: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
