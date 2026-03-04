import { ShopPermission } from '../../../domain/shop/Shop';

export interface UpdateShopRoleRequestDto {
  shopId: string;
  roleId: string;
  name?: string;
  permissions?: ShopPermission[];
}

export interface UpdateShopRoleResultDto {
  roles: Array<{ id: string; name: string; permissions: string[] }>;
}
