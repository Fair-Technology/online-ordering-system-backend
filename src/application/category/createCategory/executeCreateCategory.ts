import {
  createCategory as createCategoryInRepo,
  findCategoryBySlugAndShopId,
} from '../../../infrastructure/cosmos/category/CosmosCategoryRepository';
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

  if (
    !request.slug ||
    typeof request.slug !== 'string' ||
    request.slug.trim() === ''
  ) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'slug is required and must be a non-empty string',
    };
  }

  try {
    // Check if slug already exists in this shop
    const existingCategory = await findCategoryBySlugAndShopId(
      request.slug.trim(),
      request.shopId.trim(),
    );
    if (existingCategory) {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        error: 'A category with this slug already exists in this shop',
      };
    }

    const now = new Date().toISOString();
    const categoryId = crypto.randomUUID();

    const category: Category = {
      id: categoryId,
      shopId: request.shopId.trim(),
      name: request.name.trim(),
      slug: request.slug.trim(),
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
      slug: createdCategory.slug,
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
      error: 'Failed to create category',
    };
  }
}
