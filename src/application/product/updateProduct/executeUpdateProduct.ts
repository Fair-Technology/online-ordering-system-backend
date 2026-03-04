import { HttpRequest } from '@azure/functions';
import {
  findProductById,
  updateProduct as updateProductInRepo,
} from '../../../infrastructure/cosmos/product/CosmosProductRepository';
import { findCategoryById } from '../../../infrastructure/cosmos/category/CosmosCategoryRepository';
import { findShopById } from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { checkShopPermission } from '../../_shared/permissions';
import { deleteBlob, extractBlobPath } from '../../../infrastructure/storage/blobStorageHelpers';
import { UpdateProductRequestDto, UpdateProductResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

export async function executeUpdateProduct(
  request: UpdateProductRequestDto,
  httpRequest: HttpRequest,
): Promise<ApplicationResult<UpdateProductResultDto>> {
  // Validate input
  if (
    !request.productId ||
    typeof request.productId !== 'string' ||
    request.productId.trim() === ''
  ) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'productId is required and must be a non-empty string',
    };
  }

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
    const userId = await getUserIdFromAuth(httpRequest);

    const product = await findProductById(
      request.productId.trim(),
      request.shopId.trim(),
    );

    if (!product) {
      return {
        ok: false,
        code: 'NOT_FOUND',
        error: 'Product not found',
      };
    }

    const shop = await findShopById(product.shopId);
    if (!shop) {
      return { ok: false, code: 'NOT_FOUND', error: 'Shop not found' };
    }

    const permError = checkShopPermission(shop, userId, 'manage_products');
    if (permError) return permError;

    // Validate categoryIds if provided
    if (request.categoryIds !== undefined && request.categoryIds.length > 0) {
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

    // Update only provided fields
    const updatedProduct = {
      ...product,
      ...(request.name !== undefined && { name: request.name }),
      ...(request.description !== undefined && {
        description: request.description,
      }),
      ...(request.price !== undefined && { price: request.price }),
      ...(request.sortOrder !== undefined && { sortOrder: request.sortOrder }),
      ...(request.categoryIds !== undefined && {
        categoryIds: request.categoryIds,
      }),
      ...(request.images !== undefined && { images: request.images }),
      ...(request.allergyInfo !== undefined && {
        allergyInfo: request.allergyInfo,
      }),
      ...(request.variantGroups !== undefined && {
        variantGroups: request.variantGroups,
      }),
      ...(request.addonGroups !== undefined && {
        addonGroups: request.addonGroups,
      }),
      ...(request.isAvailable !== undefined && {
        isAvailable: request.isAvailable,
      }),
      updatedAt: new Date().toISOString(),
    };

    const result = await updateProductInRepo(updatedProduct);

    // Delete blobs for images removed from the array — best effort
    if (request.images !== undefined) {
      const removedImages = (product.images ?? []).filter(
        (old) => !(request.images ?? []).some((n) => n.id === old.id),
      );
      await Promise.allSettled(
        removedImages.map((img) => {
          const path = extractBlobPath(img.url);
          return path ? deleteBlob(path) : Promise.resolve();
        }),
      );
    }

    const resultDto: UpdateProductResultDto = {
      id: result.id,
      shopId: result.shopId,
      name: result.name,
      description: result.description,
      price: result.price,
      isAvailable: result.isAvailable,
      isDeleted: result.isDeleted,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };

    return {
      ok: true,
      data: resultDto,
    };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to update product',
    };
  }
}
