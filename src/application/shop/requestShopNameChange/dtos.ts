export interface RequestShopNameChangeRequestDto {
  shopId: string;
  requestedName: string;
}

export interface RequestShopNameChangeResultDto {
  id: string;
  pendingNameChange: {
    requestedName: string;
    requestedSlug: string;
    requestedBy: string;
    requestedAt: string;
  };
}
