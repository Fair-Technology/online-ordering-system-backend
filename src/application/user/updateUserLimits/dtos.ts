export interface UpdateUserLimitsRequestDto {
  maxShops: number | null;
}

export interface UpdateUserLimitsResultDto {
  userId: string;
  maxShops: number | null;
}
