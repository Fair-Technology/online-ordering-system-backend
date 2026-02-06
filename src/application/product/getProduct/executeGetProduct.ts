import { CosmosProductRepository } from '../../../infrastructure/cosmos/product/CosmosProductRepository';
import { GetProductRequestDto, GetProductResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

const productRepository = new CosmosProductRepository();

export async function executeGetProduct(request: GetProductRequestDto): Promise<ApplicationResult<GetProductResultDto>> {
  // Validate input
  if (!request.productId || typeof request.productId !== 'string' || request.productId.trim() === '') {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'productId is required and must be a non-empty string'
    };
  }

  if (!request.shopId || typeof request.shopId !== 'string' || request.shopId.trim() === '') {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'shopId is required and must be a non-empty string'
    };
  }

  try {
    const product = await productRepository.findById(request.productId.trim(), request.shopId.trim());
    
    if (!product) {
      return {
        ok: false,
        code: 'NOT_FOUND',
        error: 'Product not found'
      };
    }

    const productDto: GetProductResultDto = {
      id: product.id,
      shopId: product.shopId,
      name: product.name,
      description: product.description,
      price: product.price,
      isAvailable: product.isAvailable,
      isDeleted: product.isDeleted,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };

    return {
      ok: true,
      data: productDto
    };
  } catch (error) {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to retrieve product'
    };
  }
}
