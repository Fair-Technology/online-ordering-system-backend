export interface PlanLimit {
  key: string;
  value: number; // -1 = unlimited
}

export interface Plan {
  id: string;
  name: string;
  internalKey: string; // e.g. 'free' | 'paid'
  isDefault: boolean;
  isVisible: boolean;
  sortOrder: number;
  limits: PlanLimit[];
  createdAt: string;
  updatedAt: string;
}
