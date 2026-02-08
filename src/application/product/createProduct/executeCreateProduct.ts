import { createProduct as createProductInRepo } from '../../../infrastructure/cosmos/product/CosmosProductRepository';
import { findCategoryById } from '../../../infrastructure/cosmos/category/CosmosCategoryRepository';
import { CreateProductRequestDto, CreateProductResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';
import { Product } from '../../../domain/product/Product';

export async function executeCreateProduct(
  request: CreateProductRequestDto,
): Promise<ApplicationResult<CreateProductResultDto>> {
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

  if (
    !request.name ||
    typeof request.name !== 'string' ||
    request.name.trim() === ''
  ) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'name is required and must be a non-empty string',
    };
  }

  if (!request.description || typeof request.description !== 'string') {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'description is required and must be a string',
    };
  }

  if (typeof request.price !== 'number' || request.price < 0) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'price is required and must be a non-negative number',
    };
  }

  // Validate categoryIds if provided
  if (request.categoryIds && request.categoryIds.length > 0) {
    // De-duplicate categoryIds
    const uniqueCategoryIds = [...new Set(request.categoryIds)];

    // Validate each categoryId
    const invalidCategoryIds: string[] = [];

    for (const categoryId of uniqueCategoryIds) {
      try {
        const category = await findCategoryById(
          categoryId,
          request.shopId.trim(),
        );
        if (
          !category ||
          category.isDeleted ||
          category.shopId !== request.shopId.trim()
        ) {
          invalidCategoryIds.push(categoryId);
        }
      } catch (error) {
        invalidCategoryIds.push(categoryId);
      }
    }

    if (invalidCategoryIds.length > 0) {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        error: `Invalid category IDs: ${invalidCategoryIds.join(', ')}. Categories must exist, be active, and belong to the same shop.`,
      };
    }

    // Update request with de-duplicated categoryIds
    request.categoryIds = uniqueCategoryIds;
  }

  try {
    const now = new Date().toISOString();
    const productId = crypto.randomUUID();

    const product: Product = {
      id: productId,
      shopId: request.shopId.trim(),
      name: request.name.trim(),
      description: request.description,
      sortOrder: request.sortOrder || 0,
      price: request.price,
      categoryIds: request.categoryIds || [],
      images: request.images || [],
      allergyInfo: request.allergyInfo || [],
      variantGroups: request.variantGroups,
      addonGroups: request.addonGroups,
      isAvailable: request.isAvailable ?? true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    const createdProduct = await createProductInRepo(product);

    const resultDto: CreateProductResultDto = {
      id: createdProduct.id,
      shopId: createdProduct.shopId,
      name: createdProduct.name,
      description: createdProduct.description,
      price: createdProduct.price,
      isAvailable: createdProduct.isAvailable,
      isDeleted: createdProduct.isDeleted,
      createdAt: createdProduct.createdAt,
      updatedAt: createdProduct.updatedAt,
    };

    return {
      ok: true,
      data: resultDto,
    };
  } catch (error) {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to create product',
    };
  }
}
