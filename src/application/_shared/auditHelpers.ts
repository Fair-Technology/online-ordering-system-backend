import { HttpRequest } from '@azure/functions';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { AuditChange, AuditEntry } from '../../domain/audit/AuditEntry';
import { createAuditEntry } from '../../infrastructure/cosmos/audit/CosmosAuditRepository';

const AUDIT_TTL = 7776000; // 90 days in seconds

// Re-use CIAM JWKS from the existing auth flow (cached by jose)
const tenantName = process.env.ENTRA_TENANT_NAME!;
const tenantId = process.env.ENTRA_TENANT_ID!;
const apiClientId = process.env.ENTRA_CLIENT_ID!;

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

export async function getActorFromAuth(
  request: HttpRequest,
): Promise<{ userId: string; email?: string; name?: string }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }

  const token = authHeader.slice(7);
  const expectedIssuer = `https://${tenantId}.ciamlogin.com/${tenantId}/v2.0`;

  let payload: Record<string, unknown>;
  try {
    const result = await jwtVerify(token, getJwks(), {
      issuer: expectedIssuer,
      audience: apiClientId,
    });
    payload = result.payload as Record<string, unknown>;
  } catch {
    throw new Error('Authentication required');
  }

  const oid = payload['oid'] as string | undefined;
  if (!oid) throw new Error('Authentication required');

  return {
    userId: oid,
    email: payload['preferred_username'] as string | undefined,
    name: payload['name'] as string | undefined,
  };
}

export function diffFields<T extends Record<string, unknown>>(
  oldObj: T,
  newObj: T,
  scalarFields: string[],
  complexFields: string[],
): AuditChange[] {
  const changes: AuditChange[] = [];

  for (const field of scalarFields) {
    const oldVal = oldObj[field];
    const newVal = newObj[field];
    if (oldVal !== newVal) {
      changes.push({ field, from: oldVal, to: newVal });
    }
  }

  for (const field of complexFields) {
    const oldVal = oldObj[field];
    const newVal = newObj[field];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ field, from: '[updated]', to: '[updated]' });
    }
  }

  return changes;
}

export function logAudit(
  entry: Omit<AuditEntry, 'id' | 'ttl'>,
  request: HttpRequest,
): void {
  const full: AuditEntry = {
    ...entry,
    id: crypto.randomUUID(),
    ttl: AUDIT_TTL,
    ipAddress:
      request.headers.get('x-forwarded-for') ??
      request.headers.get('x-real-ip') ??
      undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  };

  createAuditEntry(full).catch((err) => {
    console.error('[audit] Failed to write audit entry:', err?.message);
  });
}
