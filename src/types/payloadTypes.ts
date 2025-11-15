import {
  ProductAddonGroup,
  ProductAddonOption,
  Product,
  ProductVariantTemplate,
  ProductVariantGroup,
  FulfillmentOptions,
  OrderItem,
  OrderStatus,
  PaymentPolicy,
  Shop,
  ShopHours,
  ShopMemberRole,
  ShopStatus,
} from './databaseTypes';

export interface MoneyInput {
  amount: number;
  currency?: string;
}

export type UserCreatePayload = {
  id: string;
};

export interface ShopSettingsPayload {
  name?: string;
  slug?: string;
  legalName?: string;
  address?: string;
  timezone?: string;
  status?: ShopStatus;
  acceptingOrders?: boolean;
  paymentPolicy?: PaymentPolicy;
  orderAcceptanceMode?: Shop['orderAcceptanceMode'];
  allowGuestCheckout?: boolean;
  fulfillmentOptions?: Partial<FulfillmentOptions>;
  defaultCurrency?: string;
}

export interface CreateShopRequest extends ShopSettingsPayload {
  ownerUserId: string;
}

export type UpdateShopRequest = ShopSettingsPayload;

export interface ShopMemberInvitePayload {
  userId: string;
  role: ShopMemberRole;
}

export interface ShopMemberUpdatePayload {
  role?: ShopMemberRole;
  isActive?: boolean;
}

export interface ShopHoursPayload {
  timezone: string;
  weekly: ShopHours['weekly'];
}

export interface ProductVariantPayload
  extends Omit<ProductVariantTemplate, 'basePrice' | 'isActive'> {
  basePrice: MoneyInput;
  isActive?: boolean;
}

export interface ProductVariantGroupPayload
  extends Omit<ProductVariantGroup, 'variants'> {
  variants: ProductVariantPayload[];
}

export interface ProductAddonOptionPayload
  extends Omit<ProductAddonOption, 'priceDelta'> {
  priceDelta: MoneyInput;
}

export interface ProductAddonGroupPayload
  extends Omit<ProductAddonGroup, 'options'> {
  options: ProductAddonOptionPayload[];
}

export interface CreateProductRequest
  extends Omit<
    Product,
    'id' | 'createdAt' | 'updatedAt' | 'variantGroups' | 'addonGroups' | 'categories' | 'isActive'
  > {
  variantGroups: ProductVariantGroupPayload[];
  addonGroups: ProductAddonGroupPayload[];
  categories?: string[];
  isActive?: boolean;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentCategoryId?: string;
  position?: number;
  isActive?: boolean;
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

export interface OrderItemPayload
  extends Omit<
    OrderItem,
    | 'addons'
    | 'finalUnitPrice'
    | 'productNameSnapshot'
    | 'variantLabelSnapshot'
  > {
  addonOptionIds?: string[];
}

export interface CreateOrderRequest {
  userId: string;
  customerName: string;
  customerPhone?: string;
  customerNotes?: string;
  items: OrderItemPayload[];
  fulfillmentType?: 'pickup' | 'delivery';
  scheduledFor?: string;
}

export interface UpdateOrderStatusRequest {
  nextStatus: OrderStatus;
}
