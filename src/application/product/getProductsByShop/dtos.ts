export interface GetProductsByShopRequestDto {
  shopId: string;
}

export interface ProductDto {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetProductsByShopResultDto {
  products: ProductDto[];
}
