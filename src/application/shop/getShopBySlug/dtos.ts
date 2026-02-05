export interface GetShopBySlugRequestDto {
  slug: string;
}

export interface GetShopBySlugResultDto {
  id: string;
  slug: string;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
