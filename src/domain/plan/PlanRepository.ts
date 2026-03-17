import { Plan } from './Plan';

export interface PlanRepository {
  findPlanById(id: string): Promise<Plan | null>;
  findPlanByInternalKey(key: string): Promise<Plan | null>;
  findAllPlans(): Promise<Plan[]>;
  findVisiblePlans(): Promise<Plan[]>;
  createPlan(plan: Plan): Promise<Plan>;
  updatePlan(plan: Plan): Promise<Plan>;
}
