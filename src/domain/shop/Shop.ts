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

export type ShopPermission = 'view_orders' | 'manage_products' | 'manage_shop';

export interface ShopRole {
  id: string; // UUID for custom roles; 'staff' for the seeded default
  name: string; // display name: "Staff", "Kitchen", "Cashier"
  permissions: ShopPermission[];
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
    role: string; // 'owner' is reserved; all other values must match a ShopRole.id
    isActive: boolean;
  }>;

  // Custom roles (owner is hardcoded and not stored here)
  roles: ShopRole[];

  // Branding
  branding: ShopBranding | null;

  // Audit
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
