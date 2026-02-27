import { HttpRequest } from '@azure/functions';
import {
  findProductById,
  updateProduct,
} from '../../../infrastructure/cosmos/product/CosmosProductRepository';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { DeleteProductRequestDto, DeleteProductResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

export async function executeDeleteProduct(
  request: DeleteProductRequestDto,
  httpRequest: HttpRequest,
): Promise<ApplicationResult<DeleteProductResultDto>> {
  // Validate input
  if (
    !request.productId ||
    typeof request.productId !== 'string' ||
    request.productId.trim() === ''
  ) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'productId is required and must be a non-empty string',
    };
  }

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
    getUserIdFromAuth(httpRequest);

    const product = await findProductById(
      request.productId.trim(),
      request.shopId.trim(),
    );

    if (!product) {
      return {
        ok: false,
        code: 'NOT_FOUND',
        error: 'Product not found',
      };
    }

    // Soft delete by setting isDeleted flag
    const deletedProduct = {
      ...product,
      isDeleted: true,
      updatedAt: new Date().toISOString(),
    };

    await updateProduct(deletedProduct);

    return {
      ok: true,
      data: { success: true },
    };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to delete product',
    };
  }
}
