import {
  Product,
  ProductCategory,
  Order,
  Shop,
  ShopHours,
  ShopMember,
  User,
} from './databaseTypes';

export type UserResponse = User;
export type ShopResponse = Shop;
export type ShopMemberResponse = ShopMember;
export type ShopHoursResponse = ShopHours;
export interface ProductResponse extends Product {
  categoryDetails: ProductCategory[];
}
export type ProductCategoryResponse = ProductCategory;
export type OrderResponse = Order;

export interface ShopMenuResponse {
  shop: Shop;
  categories: ProductCategoryResponse[];
  products: ProductResponse[];
}
