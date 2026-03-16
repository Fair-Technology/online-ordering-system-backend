import { HttpRequest } from '@azure/functions';
import { getUserIdFromAuth } from './authHelpers';
import { findUserById } from '../cosmos/user/CosmosUserRepository';

/**
 * Verifies that the request carries a valid CIAM JWT and that the user has
 * systemRole === 'superadmin' in the users container.
 *
 * Returns the userId string if the caller is a superadmin, null otherwise.
 * Never throws.
 */
export async function verifySuperAdminToken(
  request: HttpRequest,
): Promise<string | null> {
  try {
    const userId = await getUserIdFromAuth(request);
    const profile = await findUserById(userId);
    if (profile?.systemRole === 'superadmin') {
      return userId;
    }
    return null;
  } catch {
    return null;
  }
}
