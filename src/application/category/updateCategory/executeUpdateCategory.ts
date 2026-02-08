import {
  findCategoryById,
  findCategoryBySlugAndShopId,
  updateCategory as updateCategoryInRepo,
} from '../../../infrastructure/cosmos/category/CosmosCategoryRepository';
import { UpdateCategoryRequestDto, UpdateCategoryResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

export async function executeUpdateCategory(
  request: UpdateCategoryRequestDto,
): Promise<ApplicationResult<UpdateCategoryResultDto>> {
  // Validate input
  if (
    !request.categoryId ||
    typeof request.categoryId !== 'string' ||
    request.categoryId.trim() === ''
  ) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'categoryId is required and must be a non-empty string',
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
    const existingCategory = await findCategoryById(
      request.categoryId.trim(),
      request.shopId.trim(),
    );

    if (!existingCategory) {
      return {
        ok: false,
        code: 'NOT_FOUND',
        error: 'Category not found',
      };
    }

    // Check slug uniqueness if slug is being updated
    if (request.slug && request.slug.trim() !== existingCategory.slug) {
      const categoryWithSlug = await findCategoryBySlugAndShopId(
        request.slug.trim(),
        request.shopId.trim(),
      );
      if (categoryWithSlug && categoryWithSlug.id !== existingCategory.id) {
        return {
          ok: false,
          code: 'INVALID_INPUT',
          error: 'A category with this slug already exists in this shop',
        };
      }
    }

    const now = new Date().toISOString();

    const updatedCategory = {
      ...existingCategory,
      name: request.name?.trim() || existingCategory.name,
      slug: request.slug?.trim() || existingCategory.slug,
      sortOrder:
        request.sortOrder !== undefined
          ? request.sortOrder
          : existingCategory.sortOrder,
      updatedAt: now,
    };

    const savedCategory = await updateCategoryInRepo(updatedCategory);

    const resultDto: UpdateCategoryResultDto = {
      id: savedCategory.id,
      shopId: savedCategory.shopId,
      name: savedCategory.name,
      slug: savedCategory.slug,
      sortOrder: savedCategory.sortOrder,
      isDeleted: savedCategory.isDeleted,
      createdAt: savedCategory.createdAt,
      updatedAt: savedCategory.updatedAt,
    };

    return {
      ok: true,
      data: resultDto,
    };
  } catch (error: any) {
    // Handle Cosmos DB conflict errors (in case of race conditions)
    if (error.code === 409) {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        error: 'A category with this slug already exists in this shop',
      };
    }

    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to update category',
    };
  }
}
