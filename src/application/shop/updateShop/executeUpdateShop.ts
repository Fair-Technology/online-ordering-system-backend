import { HttpRequest } from '@azure/functions';
import {
  findShopById,
  updateShop as updateShopInRepo,
} from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { UpdateShopRequestDto, UpdateShopResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';

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

export async function executeUpdateShop(
  request: UpdateShopRequestDto,
  httpRequest: HttpRequest,
): Promise<ApplicationResult<UpdateShopResultDto>> {
  // Validate input
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

  if (request.branding !== undefined) {
    const brandingError = validateBranding(request.branding);
    if (brandingError) {
      return { ok: false, code: 'INVALID_INPUT', error: brandingError };
    }
  }

  try {
    getUserIdFromAuth(httpRequest);

    const shop = await findShopById(request.shopId.trim());

    if (!shop) {
      return {
        ok: false,
        code: 'NOT_FOUND',
        error: 'Shop not found',
      };
    }

    // Update only provided fields
    const updatedShop = {
      ...shop,
      ...(request.name !== undefined && { name: request.name }),
      ...(request.acceptingOrders !== undefined && {
        acceptingOrders: request.acceptingOrders,
      }),
      ...(request.isPaused !== undefined && { isPaused: request.isPaused }),
      ...(request.pausedMessage !== undefined && {
        pausedMessage: request.pausedMessage,
      }),
      ...(request.paymentPolicy !== undefined && {
        paymentPolicy: request.paymentPolicy,
      }),
      ...(request.allowGuestCheckout !== undefined && {
        allowGuestCheckout: request.allowGuestCheckout,
      }),
      ...(request.currency !== undefined && { currency: request.currency }),
      ...(request.timezone !== undefined && { timezone: request.timezone }),
      ...(request.minOrderAmountCents !== undefined && {
        minOrderAmountCents: request.minOrderAmountCents,
      }),
      ...(request.address !== undefined && {
        address: { ...shop.address, ...request.address },
      }),
      ...(request.branding !== undefined && { branding: request.branding }),
      updatedAt: new Date().toISOString(),
    };

    const result = await updateShopInRepo(updatedShop);

    const resultDto: UpdateShopResultDto = {
      id: result.id,
      slug: result.slug,
      name: result.name,
      isDeleted: result.isDeleted,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };

    return {
      ok: true,
      data: resultDto,
    };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to update shop',
    };
  }
}
