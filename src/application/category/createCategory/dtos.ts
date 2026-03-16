export interface CreateCategoryRequestDto {
  shopId: string;
  name: string;
  sortOrder?: number;
  hasStar?: boolean;
}

export interface CreateCategoryResultDto {
  id: string;
  shopId: string;
  name: string;
  sortOrder: number;
  hasStar: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
