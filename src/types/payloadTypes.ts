import {
  CatalogAddonGroup,
  CatalogAddonOption,
  CatalogProduct,
  CatalogVariant,
  CatalogVariantGroup,
  FulfillmentOptions,
  OrderItem,
  OrderStatus,
  PaymentPolicy,
  Shop,
  ShopCatalogEntry,
  ShopHours,
  ShopMemberRole,
  ShopStatus,
  UserRole,
} from './databaseTypes';

export interface MoneyInput {
  amount: number;
  currency?: string;
}

export type UserCreatePayload = {
  id: string;
  primaryEmail?: string;
  roles?: UserRole[];
};

export interface ShopSettingsPayload {
  name?: string;
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
  permissions?: string[];
}

export interface ShopMemberUpdatePayload {
  role?: ShopMemberRole;
  permissions?: string[];
  isActive?: boolean;
}

export interface ShopHoursPayload {
  timezone: string;
  weekly: ShopHours['weekly'];
}

export interface CatalogVariantPayload
  extends Omit<CatalogVariant, 'basePrice' | 'isActive'> {
  basePrice: MoneyInput;
  isActive?: boolean;
}

export interface CatalogVariantGroupPayload
  extends Omit<CatalogVariantGroup, 'variants'> {
  variants: CatalogVariantPayload[];
}

export interface CatalogAddonOptionPayload
  extends Omit<CatalogAddonOption, 'priceDelta'> {
  priceDelta: MoneyInput;
}

export interface CatalogAddonGroupPayload
  extends Omit<CatalogAddonGroup, 'options'> {
  options: CatalogAddonOptionPayload[];
}

export interface CreateCatalogProductRequest
  extends Omit<
    CatalogProduct,
    | 'id'
    | 'kind'
    | 'createdAt'
    | 'updatedAt'
    | 'variantGroups'
    | 'addonGroups'
    | 'media'
    | 'isActive'
    | 'ownerUserId'
  > {
  media?: CatalogProduct['media'];
  variantGroups: CatalogVariantGroupPayload[];
  addonGroups: CatalogAddonGroupPayload[];
  isActive?: boolean;
  ownerUserId?: string;
}

export type UpdateCatalogProductRequest = Partial<CreateCatalogProductRequest>;

export interface ShopCatalogEntryPayload
  extends Omit<
    ShopCatalogEntry,
    | 'id'
    | 'kind'
    | 'createdAt'
    | 'updatedAt'
    | 'priceOverride'
    | 'shopId'
    | 'productId'
  > {
  priceOverride?: MoneyInput;
}

export type CreateShopCatalogEntryRequest = ShopCatalogEntryPayload & {
  productId: string;
};

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentCategoryId?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateCategoryRequest = CreateCategoryRequest;

export interface OrderItemPayload
  extends Omit<
    OrderItem,
    | 'addons'
    | 'finalUnitPrice'
    | 'productNameSnapshot'
    | 'variantLabelSnapshot'
    | 'shopCatalogEntryId'
  > {
  shopCatalogEntryId: string;
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
