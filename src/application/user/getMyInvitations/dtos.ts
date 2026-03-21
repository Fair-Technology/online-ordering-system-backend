export interface InvitationDto {
  shopId: string;
  shopName: string;
  shopSlug: string;
  role: string;
}

export interface GetMyInvitationsResultDto {
  invitations: InvitationDto[];
}
