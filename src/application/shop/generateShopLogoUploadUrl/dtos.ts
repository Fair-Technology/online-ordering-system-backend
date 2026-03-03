export interface GenerateShopLogoUploadUrlRequestDto {
  shopId: string;
  contentType: string;
}

export interface GenerateShopLogoUploadUrlResultDto {
  imageId: string;
  uploadUrl: string;
  blobUrl: string;
  expiresAt: string;
}
