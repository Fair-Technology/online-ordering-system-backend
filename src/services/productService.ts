import {
  Product,
  ProductCategory,
  ProductAddonGroup,
  ProductAddonOption,
  ProductVariantGroup,
  ProductVariantOption,
  ShopProductMap,
  Money,
} from '../domain/databaseTypes';
import { hydrateProduct } from '../domain/product.hydrator';
import {
  createProductRepository,
  deleteProductRepository,
  getProductByIdRepository,
  getProductsByIds,
  listProductsRepository,
  ProductListFilters,
  updateProductRepository,
} from '../repositories/productRepository';
import { newId, nowIso } from '../utils/general';
import {
  createShopListingRepository,
  deleteListingById,
  getListingsByProductId,
  getListingsForShop,
} from '../repositories/shopProductRepository';
import { buildShopMenuDTO, ProductDTO } from '../domain/menu.dto';
import { getCategoriesByNames } from '../repositories/categoryRepository';
import { ProductResponse } from '../domain/responseTypes';
import {
  CreateProductRequest,
  UpdateProductRequest,
  ProductVariantGroupPayload,
  ProductVariantPayload,
  ProductAddonGroupPayload,
  ProductAddonOptionPayload,
  MoneyInput,
} from '../domain/payloadTypes';

export async function listProductsService(
  filters?: ProductListFilters,
): Promise<ProductResponse[]> {
  const docs = await listProductsRepository(filters);
  return enrichProducts(docs);
}

export async function getProductByIdService(
  productId: string,
): Promise<ProductResponse> {
  const product = await getProductByIdRepository(productId);
  if (!product) {
    throw Object.assign(new Error('Product not found'), { status: 404 });
  }
  const [response] = await enrichProducts([product]);
  return response;
}

export async function createProductService(
  shopId: string,
  input: CreateProductRequest,
): Promise<ProductResponse> {
  if (!input.label?.trim()) {
    throw Object.assign(new Error('label is required'), { status: 400 });
  }
  const timestamp = nowIso();
  const currency = 'USD';
  const product: Product = {
    id: newId(),
    ownerUserId: input.ownerUserId,
    label: input.label.trim(),
    price: input.price,
    description: input.description,
    categories: input.categories ?? [],
    tags: input.tags ?? [],
    media: input.media ?? [],
    allergyInfo: input.allergyInfo ?? [],
    variantGroups: normalizeVariantGroups(input.variantGroups ?? [], currency),
    addonGroups: normalizeAddonGroups(input.addonGroups ?? [], currency),
    isAvailable: input.isAvailable ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const created = await createProductRepository(product);
  const listing = await createShopListingRepository({
    id: newId(),
    shopId,
    productId: created.id,
    isAvailable: input.isAvailable ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  const [response] = await enrichProducts(
    [hydrateProduct(created)],
    new Map([[created.id, listing]]),
  );
  return response;
}

export async function updateProductService(
  productId: string,
  input: Partial<UpdateProductRequest>,
): Promise<ProductResponse> {
  const existingResponse = await getProductByIdService(productId);
  const existing = hydrateProduct(existingResponse);
  const updated: Product = {
    ...existing,
    ...input,
    label: input.label?.trim() ?? existing.label,
    categories: input.categories ?? existing.categories,
    tags: input.tags ?? existing.tags,
    media: input.media ?? existing.media,
    allergyInfo: input.allergyInfo ?? existing.allergyInfo,
    variantGroups: input.variantGroups
      ? normalizeVariantGroups(
          input.variantGroups,
          existingResponse?.shopContext?.priceOverride?.currency ??
            'USD',
        )
      : existing.variantGroups,
    addonGroups: input.addonGroups
      ? normalizeAddonGroups(
          input.addonGroups,
          existingResponse?.shopContext?.priceOverride?.currency ??
            'USD',
        )
      : existing.addonGroups,
    isAvailable: input.isAvailable ?? existing.isAvailable,
    updatedAt: nowIso(),
  };
  const resource = await updateProductRepository(updated);
  const [response] = await enrichProducts([resource]);
  return response;
}

export async function deleteProductService(productId: string): Promise<void> {
  await deleteProductRepository(productId);
  const listings = await getListingsByProductId(productId);
  await Promise.all(
    listings.map((listing) => deleteListingById(listing.id)),
  );
}

export async function listProductsForShopService(
  shopId: string,
): Promise<ProductDTO[]> {
  const listings = await getListingsForShop(shopId);
  if (listings.length === 0) {
    return [];
  }
  const productIds = [...new Set(listings.map((listing) => listing.productId))];
  const products = await getProductsByIds(productIds);
  const categoryNames = [
    ...new Set(products.flatMap((product) => product.categories ?? [])),
  ];
  const categories = await getCategoriesByNames(categoryNames);
  const listingsMap = new Map(
    listings.map((listing) => [listing.productId, listing]),
  );
  const menu = buildShopMenuDTO(products, categories, listingsMap);
  return menu.products;
}

async function enrichProducts(
  products: Product[],
  listingsMap?: Map<string, ShopProductMap>,
): Promise<ProductResponse[]> {
  if (products.length === 0) {
    return [];
  }
  const categoryNames = Array.from(
    new Set(products.flatMap((product) => product.categories ?? [])),
  );
  let categories: ProductCategory[] = [];
  if (categoryNames.length > 0) {
    categories = await getCategoriesByNames(categoryNames);
  }
  const categoryMap = new Map(categories.map((c) => [c.name, c]));
  return products.map((product) => {
    const listing = listingsMap?.get(product.id);
    return {
      ...product,
      categoryDetails: (product.categories ?? [])
        .map((name) => categoryMap.get(name))
        .filter(
          (category): category is ProductCategory => Boolean(category),
        ),
      shopContext: listing
        ? {
            shopId: listing.shopId,
            isAvailable: listing.isAvailable,
            priceOverride: listing.priceOverride,
            sortOrder: listing.sortOrder,
          }
        : undefined,
    };
  });
}

function normalizeVariantGroups(
  groups: ProductVariantGroupPayload[],
  currency: string,
): ProductVariantGroup[] {
  return groups.map((group) => ({
    id: group.id ?? newId(),
    label: group.label ?? '',
    options: (group.options ?? []).map((option) =>
      normalizeVariantOption(option, currency),
    ),
  }));
}

function normalizeVariantOption(
  option: ProductVariantPayload,
  currency: string,
): ProductVariantOption {
  return {
    id: option.id ?? newId(),
    label: option.label ?? '',
    priceDelta: toMoney(option.priceDelta, currency),
    isAvailable: option.isAvailable ?? true,
  };
}

function normalizeAddonGroups(
  groups: ProductAddonGroupPayload[],
  currency: string,
): ProductAddonGroup[] {
  return groups.map((group) => ({
    id: group.id ?? newId(),
    label: group.label ?? '',
    required: group.required ?? false,
    maxSelectable: group.maxSelectable,
    options: (group.options ?? []).map((option) =>
      normalizeAddonOption(option, currency),
    ),
  }));
}

function normalizeAddonOption(
  option: ProductAddonOptionPayload,
  currency: string,
): ProductAddonOption {
  return {
    id: option.id ?? newId(),
    label: option.label ?? '',
    priceDelta: toMoney(option.priceDelta, currency),
    isAvailable: option.isAvailable ?? true,
  };
}

function toMoney(input: MoneyInput, defaultCurrency: string): Money {
  return {
    amount: input.amount,
    currency: input.currency ?? defaultCurrency,
  };
}
