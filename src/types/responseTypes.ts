import {
  CatalogProduct,
  Category,
  Order,
  Shop,
  ShopCatalogEntry,
  ShopHours,
  ShopMember,
  User,
} from './databaseTypes';

export type UserResponse = User;
export type ShopResponse = Shop;
export type ShopMemberResponse = ShopMember;
export type ShopHoursResponse = ShopHours;
export type CatalogProductResponse = CatalogProduct;
export type ShopCatalogEntryResponse = ShopCatalogEntry;
export type CategoryResponse = Category;
export type OrderResponse = Order;

export interface ShopMenuResponse {
  shop: Shop;
  categories: Category[];
  catalogEntries: ShopCatalogEntry[];
  catalogProducts: CatalogProduct[];
}
