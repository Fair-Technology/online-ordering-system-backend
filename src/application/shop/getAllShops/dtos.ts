export interface GetAllShopsRequestDto {
  // No parameters needed for getting all shops
}

export interface ShopSummaryDto {
  id: string;
  slug: string;
  name: string;
  isDeleted: boolean;
  acceptingOrders: boolean;
  isPaused: boolean;
  pausedMessage?: string;
  paymentPolicy: string;
  orderAcceptanceMode: string;
  allowGuestCheckout: boolean;
  currency: string;
  timezone: string;
  minOrderAmountCents: number;
  address: {
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  openingHours: Record<
    'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
    Array<{
      open: string;
      close: string;
    }>
  >;
  closures: Array<{
    id: string;
    start: string;
    end: string;
    reason?: string;
  }>;
  members: Array<{
    userId: string;
    role: 'owner' | 'staff';
    isActive: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface GetAllShopsResultDto {
  shops: ShopSummaryDto[];
  total: number;
}
