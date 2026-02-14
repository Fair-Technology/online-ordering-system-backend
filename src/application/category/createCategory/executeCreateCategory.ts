import { createCategory as createCategoryInRepo } from '../../../infrastructure/cosmos/category/CosmosCategoryRepository';
import { CreateCategoryRequestDto, CreateCategoryResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';
import { Category } from '../../../domain/category/Category';

export async function executeCreateCategory(
  request: CreateCategoryRequestDto,
): Promise<ApplicationResult<CreateCategoryResultDto>> {
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

  try {
    const now = new Date().toISOString();
    const categoryId = crypto.randomUUID();

    const category: Category = {
      id: categoryId,
      shopId: request.shopId.trim(),
      name: request.name.trim(),
      sortOrder: request.sortOrder || 0,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    const createdCategory = await createCategoryInRepo(category);

    const resultDto: CreateCategoryResultDto = {
      id: createdCategory.id,
      shopId: createdCategory.shopId,
      name: createdCategory.name,
      sortOrder: createdCategory.sortOrder,
      isDeleted: createdCategory.isDeleted,
      createdAt: createdCategory.createdAt,
      updatedAt: createdCategory.updatedAt,
    };

    return {
      ok: true,
      data: resultDto,
    };
  } catch (error: any) {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to create category',
    };
  }
}
