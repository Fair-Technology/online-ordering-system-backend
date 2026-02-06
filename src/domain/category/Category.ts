export interface Category {
  // Identity & ownership
  id: string;          // UUID (Cosmos item id)
  shopId: string;      // owning shop UUID

  // Core info
  name: string;        // category name
  slug: string;        // unique within shop, public identifier
  sortOrder: number;   // for ordering categories

  // Lifecycle
  isDeleted: boolean;  // soft delete flag

  // Audit
  createdAt: string;   // ISO datetime
  updatedAt: string;   // ISO datetime
}
