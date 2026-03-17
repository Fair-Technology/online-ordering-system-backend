export const PLAN_LIMIT_KEYS = {
  PRODUCT_LIMIT: 'PRODUCT_LIMIT',
  SHOP_LIMIT: 'SHOP_LIMIT',
} as const;

export type PlanLimitKey = typeof PLAN_LIMIT_KEYS[keyof typeof PLAN_LIMIT_KEYS];

/** Returns -1 if the limit key is not present (treat as unlimited). */
export function getLimitValue(limits: { key: string; value: number }[], key: string): number {
  return limits.find((l) => l.key === key)?.value ?? -1;
}
