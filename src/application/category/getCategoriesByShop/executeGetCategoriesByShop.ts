import { findCategoriesByShopId } from '../../../infrastructure/cosmos/category/CosmosCategoryRepository';
import {
  GetCategoriesByShopRequestDto,
  GetCategoriesByShopResultDto,
  CategoryDto,
} from './dtos';
import { ApplicationResult } from '../../_shared/types';

export async function executeGetCategoriesByShop(
  request: GetCategoriesByShopRequestDto,
): Promise<ApplicationResult<GetCategoriesByShopResultDto>> {
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
    const categories = await findCategoriesByShopId(request.shopId.trim());

    const categoryDtos: CategoryDto[] = categories.map((category) => ({
      id: category.id,
      shopId: category.shopId,
      name: category.name,
      sortOrder: category.sortOrder,
      isDeleted: category.isDeleted,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    return {
      ok: true,
      data: categoryDtos,
    };
  } catch (error) {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to retrieve categories',
    };
  }
}
