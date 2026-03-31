export interface CreateStripeAccountSessionRequestDto {
  shopId: string;
  purpose?: 'onboarding' | 'management';
}

export interface CreateStripeAccountSessionResultDto {
  clientSecret: string;
}
