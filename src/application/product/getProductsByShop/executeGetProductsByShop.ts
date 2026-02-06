import { CosmosProductRepository } from '../../../infrastructure/cosmos/product/CosmosProductRepository';
import { CosmosCategoryRepository } from '../../../infrastructure/cosmos/category/CosmosCategoryRepository';
import {
  GetProductsByShopRequestDto,
  GetProductsByShopResultDto,
  ProductDto,
} from './dtos';
import { ApplicationResult } from '../../_shared/types';

const productRepository = new CosmosProductRepository();
const categoryRepository = new CosmosCategoryRepository();

export async function executeGetProductsByShop(
  request: GetProductsByShopRequestDto,
): Promise<ApplicationResult<GetProductsByShopResultDto>> {
  // Validate input
  if (
    !request.shopId ||
    typeof request.shopId !== 'string' ||
    request.shopId.trim() === ''
  ) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'shopId is required and must be a non-empty string',
    };
  }

  try {
    const products = await productRepository.findByShopId(
      request.shopId.trim(),
    );

    // Fetch category details for all products
    const productDtos: ProductDto[] = [];

    for (const product of products) {
      // Fetch category details for this product
      const categories: Array<{
        id: string;
        name: string;
        slug: string;
        sortOrder: number;
      }> = [];
      for (const categoryId of product.categoryIds || []) {
        try {
          const category = await categoryRepository.findById(
            categoryId,
            product.shopId,
          );
          if (category && !category.isDeleted) {
            categories.push({
              id: category.id,
              name: category.name,
              slug: category.slug,
              sortOrder: category.sortOrder,
            });
          }
        } catch (error) {
          // Skip invalid categories silently
        }
      }

      // Sort categories by sortOrder
      categories.sort((a, b) => a.sortOrder - b.sortOrder);

      productDtos.push({
        id: product.id,
        shopId: product.shopId,
        name: product.name,
        description: product.description,
        sortOrder: product.sortOrder,
        price: product.price,
        categories: categories,
        images: product.images,
        allergyInfo: product.allergyInfo,
        variantGroups: product.variantGroups,
        addonGroups: product.addonGroups,
        isAvailable: product.isAvailable,
        isDeleted: product.isDeleted,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      });
    }

    return {
      ok: true,
      data: productDtos,
    };
  } catch (error) {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to retrieve products',
    };
  }
}
