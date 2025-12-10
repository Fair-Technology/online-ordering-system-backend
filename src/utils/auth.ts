// auth/validateAccessToken.ts
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

const CLIENT_ID = '5940f49f-d6ec-4865-b38e-379de583765c';
const TENANT_ID = 'd220f4ca-2ba2-436a-a437-5779ae23584d';

// Copy-paste the iss but WITHOUT the trailing `/v2.0` for the base:
const AUTHORITY_BASE =
  `https://${TENANT_ID}.ciamlogin.com/${TENANT_ID}`;

const JWKS_URI = `${AUTHORITY_BASE}/discovery/v2.0/keys`;

// This MUST match the iss in your token exactly:
const ISSUER = `${AUTHORITY_BASE}/v2.0`;

// This MUST match aud in your token:
const AUDIENCE = CLIENT_ID;

const JWKS = createRemoteJWKSet(new URL(JWKS_URI));

export interface AuthResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
}

export async function validateAccessToken(
  authorizationHeader: string | null | undefined,
): Promise<AuthResult> {
  if (!authorizationHeader) {
    return { valid: false, error: 'No Authorization header' };
  }

  const token = authorizationHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { valid: false, error: 'Bearer header without token' };
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    return { valid: true, payload };
  } catch (err: any) {
    return {
      valid: false,
      error: err?.message ?? 'Token validation failed',
    };
  }
}
