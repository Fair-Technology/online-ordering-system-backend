import { CosmosShopRepository } from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { GetShopRequestDto, GetShopResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

const shopRepository = new CosmosShopRepository();

export async function executeGetShop(
  request: GetShopRequestDto,
): Promise<ApplicationResult<GetShopResultDto>> {
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
    const shop = await shopRepository.findById(request.shopId.trim());

    if (!shop) {
      return {
        ok: false,
        code: 'NOT_FOUND',
        error: 'Shop not found',
      };
    }

    const shopDto: GetShopResultDto = {
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      isDeleted: shop.isDeleted,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    };

    return {
      ok: true,
      data: shopDto,
    };
  } catch (error) {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to retrieve shop',
    };
  }
}
