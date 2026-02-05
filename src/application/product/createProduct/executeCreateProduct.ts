import { CosmosProductRepository } from '../../../infrastructure/cosmos/product/CosmosProductRepository';
import { CreateProductRequestDto, CreateProductResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';
import { Product } from '../../../domain/product/Product';

const productRepository = new CosmosProductRepository();

export async function executeCreateProduct(request: CreateProductRequestDto): Promise<ApplicationResult<CreateProductResultDto>> {
  // Validate input
  if (!request.shopId || typeof request.shopId !== 'string' || request.shopId.trim() === '') {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'shopId is required and must be a non-empty string'
    };
  }

  if (!request.name || typeof request.name !== 'string' || request.name.trim() === '') {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'name is required and must be a non-empty string'
    };
  }

  if (!request.description || typeof request.description !== 'string') {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'description is required and must be a string'
    };
  }

  if (typeof request.price !== 'number' || request.price < 0) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'price is required and must be a non-negative number'
    };
  }

  try {
    const now = new Date().toISOString();
    const productId = crypto.randomUUID();

    const product: Product = {
      id: productId,
      shopId: request.shopId.trim(),
      name: request.name.trim(),
      description: request.description,
      sortOrder: request.sortOrder || 0,
      price: request.price,
      categoryIds: request.categoryIds || [],
      images: request.images || [],
      allergyInfo: request.allergyInfo || [],
      variantGroups: request.variantGroups,
      addonGroups: request.addonGroups,
      isAvailable: request.isAvailable ?? true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    };

    const createdProduct = await productRepository.create(product);

    const resultDto: CreateProductResultDto = {
      id: createdProduct.id,
      shopId: createdProduct.shopId,
      name: createdProduct.name,
      description: createdProduct.description,
      price: createdProduct.price,
      isAvailable: createdProduct.isAvailable,
      isDeleted: createdProduct.isDeleted,
      createdAt: createdProduct.createdAt,
      updatedAt: createdProduct.updatedAt
    };

    return {
      ok: true,
      data: resultDto
    };
  } catch (error) {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to create product'
    };
  }
}
