export interface ProductSchedule {
  startDate: string; // "YYYY-MM-DD" — inclusive
  endDate?: string | null; // "YYYY-MM-DD" — inclusive; null/absent = run indefinitely
  startTime?: string | null; // "HH:mm" 24-hour — daily window open; absent = 00:00
  endTime?: string | null; // "HH:mm" 24-hour — daily window close; absent = 23:59
  daysOfWeek?: number[]; // 0=Sun 1=Mon … 6=Sat; absent/empty = every day
  // Optional special pricing during this window
  offerPrice?: number | null; // cents; must be < product.price when set
  offerLabel?: string | null; // optional display label, max 50 chars
}

export interface ProductImage {
  id: string; // UUID for the image
  url: string; // Full blob URL (without SAS)
  alt?: string; // Optional alt text for accessibility
  sortOrder?: number; // Optional sort order for image display
  createdAt: string; // ISO datetime when image was added
}

export interface Product {
  // Identity & ownership
  id: string; // UUID (Cosmos item id)
  shopId: string; // owning shop UUID

  // Core info
  name: string; // product name
  description: string;

  // Pricing
  price: number; // base price in cents (mandatory, 0 only if truly free)

  // Categorisation
  categoryIds: string[]; // references Category ids (no duplication)

  // Images
  images: ProductImage[];

  // Special info (dietary labels, badges, etc.)
  specialInfo?: Array<{ name: string; icon: string }>;

  // Variants (optional)
  variantGroups?: Array<{
    id: string;
    name: string;
    options: Array<{
      id: string;
      name: string;
      priceDelta: number; // cents
      isAvailable: boolean; // independent availability
    }>;
  }>;

  // Addons (optional)
  addonGroups?: Array<{
    id: string;
    name: string;
    minSelectable: number; // e.g. 0 or 1
    maxSelectable: number; // no unlimited; large number allowed
    options: Array<{
      id: string;
      name: string;
      priceDelta: number; // cents
      isAvailable: boolean;
    }>;
  }>;

  // Tax
  taxRateId: string | null; // references ShopTaxRate.id; null = no tax assigned

  // Availability schedule (optional)
  schedule?: ProductSchedule | null;

  // Availability & lifecycle
  isAvailable: boolean; // visible/purchasable if true
  isDeleted: boolean; // soft delete flag

  // Audit
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}
