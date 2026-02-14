import {
  findCategoryById,
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

    const now = new Date().toISOString();

    const updatedCategory = {
      ...existingCategory,
      name: request.name?.trim() || existingCategory.name,
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
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to update category',
    };
  }
}
