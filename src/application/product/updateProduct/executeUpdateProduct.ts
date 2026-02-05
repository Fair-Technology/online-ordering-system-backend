import { CosmosProductRepository } from '../../../infrastructure/cosmos/product/CosmosProductRepository';
import { UpdateProductRequestDto, UpdateProductResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

const productRepository = new CosmosProductRepository();

export async function executeUpdateProduct(request: UpdateProductRequestDto): Promise<ApplicationResult<UpdateProductResultDto>> {
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

    // Update only provided fields
    const updatedProduct = {
      ...product,
      ...(request.name !== undefined && { name: request.name }),
      ...(request.description !== undefined && { description: request.description }),
      ...(request.price !== undefined && { price: request.price }),
      ...(request.sortOrder !== undefined && { sortOrder: request.sortOrder }),
      ...(request.categoryIds !== undefined && { categoryIds: request.categoryIds }),
      ...(request.images !== undefined && { images: request.images }),
      ...(request.allergyInfo !== undefined && { allergyInfo: request.allergyInfo }),
      ...(request.variantGroups !== undefined && { variantGroups: request.variantGroups }),
      ...(request.addonGroups !== undefined && { addonGroups: request.addonGroups }),
      ...(request.isAvailable !== undefined && { isAvailable: request.isAvailable }),
      updatedAt: new Date().toISOString()
    };

    const result = await productRepository.update(updatedProduct);

    const resultDto: UpdateProductResultDto = {
      id: result.id,
      shopId: result.shopId,
      name: result.name,
      description: result.description,
      price: result.price,
      isAvailable: result.isAvailable,
      isDeleted: result.isDeleted,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    };

    return {
      ok: true,
      data: resultDto
    };
  } catch (error) {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to update product'
    };
  }
}
