import { Plan } from '../../../domain/plan/Plan';

export interface CreatePlanRequestDto {
  name: string;
  internalKey: string;
  isDefault?: boolean;
  isVisible?: boolean;
  sortOrder?: number;
  limits?: { key: string; value: number }[];
}

export interface CreatePlanResultDto {
  plan: Plan;
}
