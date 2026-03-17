import { Plan } from '../../../domain/plan/Plan';

export interface UpdatePlanRequestDto {
  name?: string;
  isVisible?: boolean;
  sortOrder?: number;
  limits?: { key: string; value: number }[];
}

export interface UpdatePlanResultDto {
  plan: Plan;
}
