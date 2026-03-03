import { HttpRequest } from '@azure/functions';
import { findOrdersByShopId } from '../../../infrastructure/cosmos/order/CosmosOrderRepository';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import {
  GetOrdersByShopRequestDto,
  GetOrdersByShopResultDto,
  OrderDto,
} from './dtos';
import { ApplicationResult } from '../../_shared/types';

export async function executeGetOrdersByShop(
  request: GetOrdersByShopRequestDto,
  httpRequest: HttpRequest,
): Promise<ApplicationResult<GetOrdersByShopResultDto>> {
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

    const orders = await findOrdersByShopId(request.shopId.trim());

    const orderDtos: OrderDto[] = orders.map((order) => ({
      id: order.id,
      orderRef: order.orderRef,
      status: order.status,
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        selectedVariantOptionId: item.selectedVariantOptionId,
        selectedVariantOptionName: item.selectedVariantOptionName,
        selectedAddonOptionIds: item.selectedAddonOptionIds,
        selectedAddonOptionNames: item.selectedAddonOptionNames,
        lineTotalCents: item.lineTotalCents,
      })),
      subtotalCents: order.subtotalCents,
      currency: order.currency,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      customerNotes: order.customerNotes,
      createdAt: order.createdAt,
    }));

    return {
      ok: true,
      data: orderDtos,
    };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to retrieve orders',
    };
  }
}
