import { Plan } from '../../../domain/plan/Plan';
import { PlanPricing } from '../../../domain/plan/PlanPricing';

export interface GetPlanResultDto {
  plan: Plan;
  pricing: PlanPricing[];
}
