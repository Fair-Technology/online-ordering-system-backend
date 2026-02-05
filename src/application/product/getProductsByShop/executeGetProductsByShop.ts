import { CosmosProductRepository } from '../../../infrastructure/cosmos/product/CosmosProductRepository';
import { GetProductsByShopRequestDto, GetProductsByShopResultDto, ProductDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

const productRepository = new CosmosProductRepository();

export async function executeGetProductsByShop(request: GetProductsByShopRequestDto): Promise<ApplicationResult<GetProductsByShopResultDto>> {
  // Validate input
  if (!request.shopId || typeof request.shopId !== 'string' || request.shopId.trim() === '') {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'shopId is required and must be a non-empty string'
    };
  }

  try {
    const products = await productRepository.findByShopId(request.shopId.trim());
    
    const productDtos: ProductDto[] = products.map(product => ({
      id: product.id,
      shopId: product.shopId,
      name: product.name,
      description: product.description,
      price: product.price,
      isAvailable: product.isAvailable,
      isDeleted: product.isDeleted,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    return {
      ok: true,
      data: { products: productDtos }
    };
  } catch (error) {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to retrieve products'
    };
  }
}
