import { Shop } from '../../../domain/shop/Shop';

export interface SetShopLogoRequestDto {
  shopId: string;
  imageId: string;
  url: string;
}

export type SetShopLogoResultDto = Pick<Shop, 'id' | 'slug' | 'name' | 'isDeleted' | 'createdAt' | 'updatedAt' | 'branding'>;
