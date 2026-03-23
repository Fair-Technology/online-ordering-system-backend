import { HttpRequest } from '@azure/functions';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { findUserById } from '../../../infrastructure/cosmos/user/CosmosUserRepository';
import { getSystemConfig } from '../../../infrastructure/cosmos/system/CosmosSystemConfigRepository';
import { ApplicationResult } from '../../_shared/types';
import { GetSystemConfigResultDto } from './dtos';

export async function executeGetSystemConfig(
  httpRequest: HttpRequest,
): Promise<ApplicationResult<GetSystemConfigResultDto>> {
  try {
    const userId = await getUserIdFromAuth(httpRequest);
    const user = await findUserById(userId);
    if (user?.systemRole !== 'superadmin') {
      return { ok: false, code: 'FORBIDDEN', error: 'Superadmin access required' };
    }

    const config = await getSystemConfig();
    return { ok: true, data: { maxShopsDefault: config.maxShopsDefault } };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return { ok: false, code: 'INTERNAL_ERROR', error: 'Failed to get system config' };
  }
}
