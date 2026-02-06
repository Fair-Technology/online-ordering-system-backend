export interface Product {
  // Identity & ownership
  id: string;          // UUID (Cosmos item id)
  shopId: string;      // owning shop UUID

  // Core info
  name: string;        // product name
  description: string;
  sortOrder: number;

  // Pricing
  price: number;       // base price in cents (mandatory, 0 only if truly free)

  // Categorisation
  categoryIds: string[]; // references Category ids (no duplication)

  // Images
  images: Array<{
    id: string;
    url: string;
    isPrimary: boolean; // exactly one must be true
  }>;

  // Dietary / allergy info
  allergyInfo: string[]; // free-text

  // Variants (optional)
  variantGroups?: Array<{
    id: string;
    name: string;
    options: Array<{
      id: string;
      name: string;
      priceDelta: number;   // cents
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
      priceDelta: number;   // cents
      isAvailable: boolean;
    }>;
  }>;

  // Availability & lifecycle
  isAvailable: boolean; // visible/purchasable if true
  isDeleted: boolean;   // soft delete flag

  // Audit
  createdAt: string;    // ISO datetime
  updatedAt: string;    // ISO datetime
}
