export interface ShopUsage {
  id: string; // === shopId
  shopId: string;
  activeProductCount: number;
  periodStart: string | null;
  periodEnd: string | null;
  lastReconciled: string | null;
  createdAt: string;
  updatedAt: string;
}
