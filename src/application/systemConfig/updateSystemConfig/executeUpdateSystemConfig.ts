import { HttpRequest } from '@azure/functions';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { findUserById } from '../../../infrastructure/cosmos/user/CosmosUserRepository';
import { upsertSystemConfig } from '../../../infrastructure/cosmos/system/CosmosSystemConfigRepository';
import { ApplicationResult } from '../../_shared/types';
import { UpdateSystemConfigRequestDto, UpdateSystemConfigResultDto } from './dtos';

export async function executeUpdateSystemConfig(
  request: UpdateSystemConfigRequestDto,
  httpRequest: HttpRequest,
): Promise<ApplicationResult<UpdateSystemConfigResultDto>> {
  if (typeof request.maxShopsDefault !== 'number') {
    return { ok: false, code: 'INVALID_INPUT', error: 'maxShopsDefault must be a number' };
  }
  if (!Number.isInteger(request.maxShopsDefault) || request.maxShopsDefault < -1) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'maxShopsDefault must be an integer >= -1 (use -1 for unlimited)',
    };
  }

  try {
    const userId = await getUserIdFromAuth(httpRequest);
    const user = await findUserById(userId);
    if (user?.systemRole !== 'superadmin') {
      return { ok: false, code: 'FORBIDDEN', error: 'Superadmin access required' };
    }

    const updated = await upsertSystemConfig({ maxShopsDefault: request.maxShopsDefault });
    return { ok: true, data: { maxShopsDefault: updated.maxShopsDefault } };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return { ok: false, code: 'INTERNAL_ERROR', error: 'Failed to update system config' };
  }
}
