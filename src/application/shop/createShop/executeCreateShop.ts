import { HttpRequest } from '@azure/functions';
import {
  createShop as createShopInRepo,
  findShopBySlug,
} from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { CreateShopRequestDto, CreateShopResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';
import { Shop } from '../../../domain/shop/Shop';
import { validateUniqueSlug } from './slugHelpers';

function validateBranding(branding: unknown): string | null {
  if (branding === null || branding === undefined) return null;
  if (typeof branding !== 'object' || Array.isArray(branding)) {
    return 'branding must be an object or null';
  }
  const b = branding as any;
  if (b.logoUrl !== null && b.logoUrl !== undefined) {
    if (typeof b.logoUrl !== 'string' || !b.logoUrl.startsWith('https://')) {
      return 'branding.logoUrl must be a valid https URL or null';
    }
  }
  if (b.heroImageUrl !== null && b.heroImageUrl !== undefined) {
    if (typeof b.heroImageUrl !== 'string' || !b.heroImageUrl.startsWith('https://')) {
      return 'branding.heroImageUrl must be a valid https URL or null';
    }
  }
  if (!b.colors || typeof b.colors !== 'object') {
    return 'branding.colors is required and must be an object';
  }
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  for (const field of ['primary', 'secondary', 'tertiary', 'background']) {
    if (typeof b.colors[field] !== 'string') {
      return `branding.colors.${field} is required`;
    }
    if (!hexRegex.test(b.colors[field])) {
      return `branding.colors.${field} must be a valid hex color (e.g. "#1D4ED8")`;
    }
  }
  return null;
}

export async function executeCreateShop(
  request: CreateShopRequestDto,
  httpRequest: HttpRequest,
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

  const brandingError = validateBranding(request.branding);
  if (brandingError) {
    return { ok: false, code: 'INVALID_INPUT', error: brandingError };
  }

  try {
    getUserIdFromAuth(httpRequest);

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
      branding: request.branding ?? null,
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
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
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
