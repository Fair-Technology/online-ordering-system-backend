export interface DocumentBase {
  id: string;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  version?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export type Money = {
  amount: number;
  currency: string;
};
