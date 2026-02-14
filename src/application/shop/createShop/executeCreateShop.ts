import {
  createShop as createShopInRepo,
  findShopBySlug,
} from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { CreateShopRequestDto, CreateShopResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';
import { Shop } from '../../../domain/shop/Shop';
import { validateUniqueSlug } from './slugHelpers';

export async function executeCreateShop(
  request: CreateShopRequestDto,
): Promise<ApplicationResult<CreateShopResultDto>> {
  // Validate required fields
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

  if (
    !request.currency ||
    typeof request.currency !== 'string' ||
    request.currency.trim() === ''
  ) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'currency is required and must be a non-empty string',
    };
  }

  if (
    !request.timezone ||
    typeof request.timezone !== 'string' ||
    request.timezone.trim() === ''
  ) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'timezone is required and must be a non-empty string',
    };
  }

  if (!request.address || typeof request.address !== 'object') {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'address is required and must be an object',
    };
  }

  if (
    !request.paymentPolicy ||
    typeof request.paymentPolicy !== 'string' ||
    request.paymentPolicy.trim() === ''
  ) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'paymentPolicy is required and must be a non-empty string',
    };
  }

  if (
    typeof request.minOrderAmountCents !== 'number' ||
    request.minOrderAmountCents < 0
  ) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error:
        'minOrderAmountCents is required and must be a non-negative number',
    };
  }

  // Validate openingHours
  if (!request.openingHours || typeof request.openingHours !== 'object') {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'openingHours is required',
    };
  }

  // Check that at least one day has opening hours
  const hasOpeningHours = Object.values(request.openingHours).some(
    (dayHours) => Array.isArray(dayHours) && dayHours.length > 0,
  );

  if (!hasOpeningHours) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'At least one day must have opening hours',
    };
  }

  try {
    // Validate that slug generated from name is unique
    const checkSlugExists = async (slug: string): Promise<boolean> => {
      const existingShop = await findShopBySlug(slug);
      return existingShop !== null;
    };

    const generatedSlug = await validateUniqueSlug(
      request.name.trim(),
      checkSlugExists,
    );

    const now = new Date().toISOString();
    const shopId = crypto.randomUUID();

    const shop: Shop = {
      id: shopId,
      slug: generatedSlug,
      name: request.name.trim(),
      // Set safe defaults automatically
      isDeleted: false,
      acceptingOrders: true,
      isPaused: false,
      allowGuestCheckout: true,
      // Required fields from user
      currency: request.currency.trim(),
      timezone: request.timezone.trim(),
      paymentPolicy: request.paymentPolicy.trim(),
      minOrderAmountCents: request.minOrderAmountCents,
      address: request.address,
      openingHours: request.openingHours,
      // Optional fields with defaults
      pausedMessage: request.pausedMessage,
      orderAcceptanceMode: request.orderAcceptanceMode || 'auto',
      closures: request.closures || [],
      members: request.members || [],
      createdAt: now,
      updatedAt: now,
    };

    const createdShop = await createShopInRepo(shop);

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
    // Handle slug validation error
    if (error.message === 'A shop with this name already exists') {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        error: 'A shop with this name already exists',
      };
    }

    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to create shop',
    };
  }
}
