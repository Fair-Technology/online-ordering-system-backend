import { CosmosShopRepository } from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { CreateShopRequestDto, CreateShopResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';
import { Shop } from '../../../domain/shop/Shop';

const shopRepository = new CosmosShopRepository();

export async function executeCreateShop(
  request: CreateShopRequestDto,
): Promise<ApplicationResult<CreateShopResultDto>> {
  // Validate input
  if (
    !request.slug ||
    typeof request.slug !== 'string' ||
    request.slug.trim() === ''
  ) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'slug is required and must be a non-empty string',
    };
  }

  if (
    !request.name ||
    typeof request.name !== 'string' ||
    request.name.trim() === ''
  ) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'name is required and must be a non-empty string',
    };
  }

  try {
    // Check if slug already exists
    const existingShop = await shopRepository.findBySlug(request.slug.trim());
    if (existingShop) {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        error: 'A shop with this slug already exists',
      };
    }
    const now = new Date().toISOString();
    const shopId = crypto.randomUUID();

    const shop: Shop = {
      id: shopId,
      slug: request.slug.trim(),
      name: request.name.trim(),
      isDeleted: request.isDeleted ?? false,
      acceptingOrders: request.acceptingOrders ?? true,
      isPaused: request.isPaused ?? false,
      pausedMessage: request.pausedMessage,
      paymentPolicy: request.paymentPolicy || 'pay_online',
      orderAcceptanceMode: request.orderAcceptanceMode || 'auto',
      allowGuestCheckout: request.allowGuestCheckout ?? true,
      currency: request.currency || 'AUD',
      timezone: request.timezone || 'Australia/Sydney',
      minOrderAmountCents: request.minOrderAmountCents || 0,
      address: request.address || {},
      openingHours: request.openingHours || {
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: [],
        sun: [],
      },
      closures: request.closures || [],
      members: request.members || [],
      createdAt: now,
      updatedAt: now,
    };

    const createdShop = await shopRepository.create(shop);

    const resultDto: CreateShopResultDto = {
      id: createdShop.id,
      slug: createdShop.slug,
      name: createdShop.name,
      isDeleted: createdShop.isDeleted,
      createdAt: createdShop.createdAt,
      updatedAt: createdShop.updatedAt,
    };

    return {
      ok: true,
      data: resultDto,
    };
  } catch (error: any) {
    // Handle Cosmos DB conflict errors (in case of race conditions)
    if (error.code === 409) {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        error: 'A shop with this slug already exists',
      };
    }

    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to create shop',
    };
  }
}
