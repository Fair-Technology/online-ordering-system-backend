export interface ShopBrandingColors {
  primary: string;
  secondary: string;
  tertiary: string;
  background: string;
}

export interface ShopBranding {
  logoUrl: string | null;
  heroImageUrl: string | null;
  colors: ShopBrandingColors;
}

export interface Shop {
  // Identity
  id: string; // UUID (Cosmos item id)
  slug: string; // globally unique, public identifier
  name: string;

  // State & visibility
  isDeleted: boolean; // soft delete
  acceptingOrders: boolean; // default true
  isPaused: boolean;
  pausedMessage?: string; // required if isPaused === true

  // Payments & checkout
  paymentPolicy: 'pay_online' | string; // future-ready enum
  orderAcceptanceMode: 'auto'; // fixed for now
  allowGuestCheckout: boolean;

  // Locale & rules
  currency: string; // ISO code, e.g. "AUD"
  timezone: string; // e.g. "Australia/Sydney"
  minOrderAmountCents: number;

  // Address (structured)
  address: {
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };

  // Opening hours (per weekday)
  openingHours: Record<
    'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
    Array<{
      open: string; // "HH:mm"
      close: string; // "HH:mm"
    }>
  >;

  // One-off closures / holidays
  closures: Array<{
    id: string;
    start: string; // ISO datetime
    end: string; // ISO datetime
    reason?: string;
  }>;

  // Admins & staff
  members: Array<{
    userId: string; // Entra object id
    role: 'owner' | 'staff';
    isActive: boolean;
  }>;

  // Branding
  branding: ShopBranding | null;

  // Audit
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
