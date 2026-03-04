import { HttpRequest } from '@azure/functions';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const tenantName = process.env.ENTRA_TENANT_NAME!;
const tenantId = process.env.ENTRA_TENANT_ID!;

// JWKS fetched once and cached by jose
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks() {
  if (!jwks) {
    const jwksUrl = new URL(
      `https://${tenantName}.ciamlogin.com/${tenantId}/discovery/v2.0/keys`,
    );
    jwks = createRemoteJWKSet(jwksUrl);
  }
  return jwks;
}

/**
 * Extract user ID (oid claim) from the Bearer JWT in the Authorization header.
 * Verifies the JWT signature against Entra CIAM JWKS keys and validates the issuer.
 *
 * Audience is not strictly checked because the current access token may be for a
 * generic scope (no dedicated API scope registered in Entra yet). Tighten this once
 * a dedicated API scope is registered — add `audience: process.env.ENTRA_API_AUDIENCE`
 * to the jwtVerify options.
 */
export async function getUserIdFromAuth(request: HttpRequest): Promise<string> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }

  const token = authHeader.slice(7);

  // CIAM issuers use the tenant ID as the subdomain, not the tenant name.
  // Confirmed via: https://{tenantName}.ciamlogin.com/{tenantId}/v2.0/.well-known/openid-configuration
  const expectedIssuer = `https://${tenantId}.ciamlogin.com/${tenantId}/v2.0`;

  let payload: Record<string, unknown>;
  try {
    const result = await jwtVerify(token, getJwks(), {
      issuer: expectedIssuer,
      // audience: intentionally omitted — see comment above
    });
    payload = result.payload as Record<string, unknown>;
  } catch (err: any) {
    // jose throws typed errors (JWTExpired, JWSSignatureVerificationFailed, etc.)
    // Normalise to the single error string that all service catch blocks handle.
    console.error('[auth] jwtVerify failed:', err?.code, err?.message);
    throw new Error('Authentication required');
  }

  const oid = payload['oid'] as string | undefined;
  if (!oid) {
    throw new Error('Authentication required');
  }

  return oid;
}
