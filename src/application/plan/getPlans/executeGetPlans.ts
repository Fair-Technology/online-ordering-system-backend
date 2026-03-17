import { HttpRequest } from '@azure/functions';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { findVisiblePlans } from '../../../infrastructure/cosmos/plan/CosmosPlanRepository';
import { ApplicationResult } from '../../_shared/types';
import { GetPlansResultDto } from './dtos';

export async function executeGetPlans(
  httpRequest: HttpRequest,
): Promise<ApplicationResult<GetPlansResultDto>> {
  try {
    await getUserIdFromAuth(httpRequest);

    const plans = await findVisiblePlans();
    return { ok: true, data: { plans } };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return { ok: false, code: 'INTERNAL_ERROR', error: 'Failed to retrieve plans' };
  }
}
