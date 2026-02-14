import { findCategoryById } from '../../../infrastructure/cosmos/category/CosmosCategoryRepository';
import { GetCategoryRequestDto, GetCategoryResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

export async function executeGetCategory(
  request: GetCategoryRequestDto,
): Promise<ApplicationResult<GetCategoryResultDto>> {
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
    const category = await findCategoryById(
      request.categoryId.trim(),
      request.shopId.trim(),
    );

    if (!category) {
      return {
        ok: false,
        code: 'NOT_FOUND',
        error: 'Category not found',
      };
    }

    const categoryDto: GetCategoryResultDto = {
      id: category.id,
      shopId: category.shopId,
      name: category.name,
      sortOrder: category.sortOrder,
      isDeleted: category.isDeleted,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    return {
      ok: true,
      data: categoryDto,
    };
  } catch (error) {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to retrieve category',
    };
  }
}
