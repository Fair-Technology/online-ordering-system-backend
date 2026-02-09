import {
  findProductById,
  updateProduct as updateProductInRepo,
} from '../../../infrastructure/cosmos/product/CosmosProductRepository';
import { getUserIdFromAuth, assertCanManageProduct } from '../../../infrastructure/auth/authHelpers';
import { AddProductImageRequestDto, AddProductImageResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';
import { ProductImage } from '../../../domain/product/Product';
import { HttpRequest } from '@azure/functions';

export async function executeAddProductImage(
  request: AddProductImageRequestDto,
  httpRequest: HttpRequest
): Promise<ApplicationResult<AddProductImageResultDto>> {
  // Validate input
  if (!request.shopId || typeof request.shopId !== 'string' || request.shopId.trim() === '') {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'shopId is required and must be a non-empty string',
    };
  }

  if (!request.productId || typeof request.productId !== 'string' || request.productId.trim() === '') {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'productId is required and must be a non-empty string',
    };
  }

  if (!request.imageId || typeof request.imageId !== 'string' || request.imageId.trim() === '') {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'imageId is required and must be a non-empty string',
    };
  }

  if (!request.url || typeof request.url !== 'string' || request.url.trim() === '') {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'url is required and must be a non-empty string',
    };
  }

  // Validate optional fields
  if (request.alt !== undefined && typeof request.alt !== 'string') {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'alt must be a string if provided',
    };
  }

  if (request.sortOrder !== undefined && (typeof request.sortOrder !== 'number' || !Number.isInteger(request.sortOrder))) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'sortOrder must be an integer if provided',
    };
  }

  try {
    // Get user ID from auth
    const userId = getUserIdFromAuth(httpRequest);

    // Check if user can manage this product
    await assertCanManageProduct({
      userId,
      shopId: request.shopId.trim(),
      productId: request.productId.trim(),
    });

    // Load product
    const product = await findProductById(request.productId.trim(), request.shopId.trim());
    if (!product) {
      return {
        ok: false,
        code: 'NOT_FOUND',
        error: 'Product not found',
      };
    }

    // Create new image entry
    const now = new Date().toISOString();
    const newImage: ProductImage = {
      id: request.imageId.trim(),
      url: request.url.trim(),
      alt: request.alt?.trim(),
      sortOrder: request.sortOrder,
      createdAt: now,
    };

    // Initialize images array if missing
    if (!product.images) {
      product.images = [];
    }

    // Check if image with same ID already exists
    const existingImageIndex = product.images.findIndex(img => img.id === newImage.id);
    if (existingImageIndex !== -1) {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        error: 'Image with this ID already exists',
      };
    }

    // Append image to product
    product.images.push(newImage);

    // Update product updatedAt timestamp
    product.updatedAt = now;

    // Persist product
    await updateProductInRepo(product);

    return {
      ok: true,
      data: newImage,
    };
  } catch (error: any) {
    if (error.message.includes('not authorized') || error.message.includes('Authentication required')) {
      return {
        ok: false,
        code: 'FORBIDDEN',
        error: error.message,
      };
    }

    throw error;
  }
}
