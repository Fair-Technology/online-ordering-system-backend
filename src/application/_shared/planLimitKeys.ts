export const PLAN_LIMIT_KEYS = {
  PRODUCT_LIMIT: 'PRODUCT_LIMIT',
} as const;

export type PlanLimitKey = typeof PLAN_LIMIT_KEYS[keyof typeof PLAN_LIMIT_KEYS];
