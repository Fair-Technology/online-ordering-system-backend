import { HttpRequest } from '@azure/functions';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const superAdminTenantId = process.env.SUPERADMIN_ENTRA_TENANT_ID!;
const superAdminClientId = process.env.SUPERADMIN_ENTRA_CLIENT_ID!;

let superAdminJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getSuperAdminJwks() {
  if (!superAdminJwks) {
    const jwksUrl = new URL(
      `https://login.microsoftonline.com/${superAdminTenantId}/discovery/v2.0/keys`,
    );
    superAdminJwks = createRemoteJWKSet(jwksUrl);
  }
  return superAdminJwks;
}

export async function verifySuperAdminToken(
  request: HttpRequest,
): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.slice(7);
    const expectedIssuer = `https://login.microsoftonline.com/${superAdminTenantId}/v2.0`;

    await jwtVerify(token, getSuperAdminJwks(), {
      issuer: expectedIssuer,
      audience: superAdminClientId,
    });

    return true;
  } catch {
    return false;
  }
}
