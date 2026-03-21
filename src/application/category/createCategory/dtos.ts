export interface CreateCategoryRequestDto {
  shopId: string;
  name: string;
  sortOrder?: number;
  icon?: string;
}

export interface CreateCategoryResultDto {
  id: string;
  shopId: string;
  name: string;
  sortOrder: number;
  icon?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
