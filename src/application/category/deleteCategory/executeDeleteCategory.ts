import {
  findCategoryById,
  updateCategory,
} from '../../../infrastructure/cosmos/category/CosmosCategoryRepository';
import { DeleteCategoryRequestDto, DeleteCategoryResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

export async function executeDeleteCategory(
  request: DeleteCategoryRequestDto,
): Promise<ApplicationResult<DeleteCategoryResultDto>> {
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

    const now = new Date().toISOString();

    // Soft delete
    const deletedCategory = {
      ...existingCategory,
      isDeleted: true,
      updatedAt: now,
    };

    const savedCategory = await updateCategory(deletedCategory);

    const resultDto: DeleteCategoryResultDto = {
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
  } catch (error) {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to delete category',
    };
  }
}
