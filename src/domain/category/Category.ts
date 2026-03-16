export interface Category {
  // Identity & ownership
  id: string; // UUID (Cosmos item id)
  shopId: string; // owning shop UUID

  // Core info
  name: string; // category name
  sortOrder: number; // for ordering categories
  hasStar: boolean; // whether to show a star icon in the frontend

  // Lifecycle
  isDeleted: boolean; // soft delete flag

  // Audit
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}
