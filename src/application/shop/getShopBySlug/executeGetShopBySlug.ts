import { CosmosShopRepository } from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { GetShopBySlugRequestDto, GetShopBySlugResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

const shopRepository = new CosmosShopRepository();

export async function executeGetShopBySlug(request: GetShopBySlugRequestDto): Promise<ApplicationResult<GetShopBySlugResultDto>> {
  // Validate input
  if (!request.slug || typeof request.slug !== 'string' || request.slug.trim() === '') {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'slug is required and must be a non-empty string'
    };
  }

  try {
    const shop = await shopRepository.findBySlug(request.slug.trim());
    
    if (!shop) {
      return {
        ok: false,
        code: 'NOT_FOUND',
        error: 'Shop not found'
      };
    }

    const shopDto: GetShopBySlugResultDto = {
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      isDeleted: shop.isDeleted,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    };

    return {
      ok: true,
      data: shopDto
    };
  } catch (error) {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to retrieve shop'
    };
  }
}
