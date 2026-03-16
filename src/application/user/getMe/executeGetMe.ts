import { HttpRequest } from '@azure/functions';
import { upsertUser } from '../../../infrastructure/cosmos/user/CosmosUserRepository';
import { getActorFromAuth } from '../../_shared/auditHelpers';
import { ApplicationResult } from '../../_shared/types';
import { GetMeResultDto } from './dtos';

export async function executeGetMe(
  httpRequest: HttpRequest,
): Promise<ApplicationResult<GetMeResultDto>> {
  try {
    const actor = await getActorFromAuth(httpRequest);
    const now = new Date().toISOString();

    const profile = await upsertUser({
      id: actor.userId,
      email: actor.email,
      name: actor.name,
      systemRole: 'user',
      createdAt: now,
      updatedAt: now,
    });

    return {
      ok: true,
      data: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        systemRole: profile.systemRole,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return { ok: false, code: 'INTERNAL_ERROR', error: 'Failed to retrieve user profile' };
  }
}
