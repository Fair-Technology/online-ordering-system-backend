import { HttpRequest } from '@azure/functions';
import {
  createShop as createShopInRepo,
  findShopBySlug,
} from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { createCategory as createCategoryInRepo } from '../../../infrastructure/cosmos/category/CosmosCategoryRepository';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { CreateShopRequestDto, CreateShopResultDto } from './dtos';
import { ApplicationResult } from '../../_shared/types';
import { Shop } from '../../../domain/shop/Shop';
import { Category } from '../../../domain/category/Category';
import { validateUniqueSlug } from './slugHelpers';
import { seedTaxRatesForCountry } from '../../_shared/countryTaxRates';
import { upsertSubscription } from '../../../infrastructure/cosmos/subscription/CosmosSubscriptionRepository';
import { upsertUsage } from '../../../infrastructure/cosmos/usage/CosmosUsageRepository';
import { findPlanByInternalKey } from '../../../infrastructure/cosmos/plan/CosmosPlanRepository';
import { ShopSubscription } from '../../../domain/subscription/ShopSubscription';
import { ShopUsage } from '../../../domain/usage/ShopUsage';

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
    !request.countryCode ||
    typeof request.countryCode !== 'string' ||
    request.countryCode.trim() === ''
  ) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'countryCode is required and must be a non-empty string',
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
    const userId = await getUserIdFromAuth(httpRequest);

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
    const countryCode = request.countryCode.trim().toUpperCase();

    const shop: Shop = {
      id: shopId,
      slug: generatedSlug,
      name: request.name.trim(),
      // Set safe defaults automatically
      isDeleted: false,
      isPaused: true,
      allowGuestCheckout: true,
      // Required fields from user
      countryCode,
      currency: request.currency.trim(),
      timezone: request.timezone.trim(),
      paymentPolicy: request.paymentPolicy.trim(),
      minOrderAmountCents: request.minOrderAmountCents,
      address: request.address,
      openingHours: request.openingHours,
      // Optional fields with defaults
      pausedMessage: request.pausedMessage ?? 'We will be online very soon',
      orderAcceptanceMode: request.orderAcceptanceMode || 'auto',
      closures: request.closures || [],
      members: [{ userId, role: 'owner', isActive: true }],
      roles: [{ id: 'staff', name: 'Staff', permissions: ['view_orders' as const] }],
      taxRates: seedTaxRatesForCountry(countryCode),
      branding: request.branding ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const createdShop = await createShopInRepo(shop);

    const defaultCategory: Category = {
      id: crypto.randomUUID(),
      shopId: createdShop.id,
      name: 'Default category',
      sortOrder: 0,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
    await createCategoryInRepo(defaultCategory);

    // Initialize subscription on free plan
    const freePlan = await findPlanByInternalKey('free');
    const subscription: ShopSubscription = {
      id: shopId,
      shopId,
      planId: freePlan?.id ?? 'default-free',
      status: 'free',
      billingInterval: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      billingCustomerId: null,
      billingSubscriptionId: null,
      cancelAtPeriodEnd: false,
      planSource: 'default',
      overriddenBy: null,
      overrideReason: null,
      overrideExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await upsertSubscription(subscription);

    // Initialize usage counters
    const usage: ShopUsage = {
      id: shopId,
      shopId,
      activeProductCount: 0,
      periodStart: null,
      periodEnd: null,
      lastReconciled: null,
      createdAt: now,
      updatedAt: now,
    };
    await upsertUsage(usage);

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
