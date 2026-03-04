export interface DeleteShopRoleRequestDto {
  shopId: string;
  roleId: string;
}

export interface DeleteShopRoleResultDto {
  roles: Array<{ id: string; name: string; permissions: string[] }>;
}
