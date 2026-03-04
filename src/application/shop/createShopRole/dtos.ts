import { ShopPermission } from '../../../domain/shop/Shop';

export interface CreateShopRoleRequestDto {
  shopId: string;
  name: string;
  permissions: ShopPermission[];
}

export interface CreateShopRoleResultDto {
  roles: Array<{ id: string; name: string; permissions: string[] }>;
}
