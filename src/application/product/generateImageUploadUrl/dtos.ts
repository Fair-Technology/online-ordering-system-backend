export interface GenerateImageUploadUrlRequestDto {
  shopId: string;
  productId: string;
  contentType: string;
  fileName?: string;
  maxSizeBytes?: number;
}

export interface GenerateImageUploadUrlResultDto {
  imageId: string;
  uploadUrl: string;
  blobUrl: string;
  expiresAt: string;
}
