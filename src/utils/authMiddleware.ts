
import { HttpRequestLike, HttpResponseInitLike } from '../domain/otherTypes';
import { validateAccessToken, AuthResult } from './auth';

export async function requireAuth(
  request: HttpRequestLike,
  next: () => Promise<HttpResponseInitLike>
): Promise<HttpResponseInitLike> {
  const token = request.headers.get('authorization');

  if (!token) {
    return { status: 401, body: 'Unauthorized: Token missing' };
  }

  const result: AuthResult = await validateAccessToken(token);

  if (!result.valid) {
    return { status: 401, body: `Unauthorized: ${result.error}` };
  }

  console.log('Access token valid for user:', result.payload?.sub);
  
  // Pass the validated payload to the handler via request context if needed
  (request as any).authPayload = result.payload;
  
  return next();
}
