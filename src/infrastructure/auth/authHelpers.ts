import { HttpRequest } from '@azure/functions';
import { decodeJwt } from 'jose';

/**
 * Extract user ID (oid claim) from the Bearer JWT in the Authorization header.
 * Decodes without signature verification — suitable for local dev and trusted
 * Azure infrastructure where the gateway already validates tokens.
 */
export function getUserIdFromAuth(request: HttpRequest): string {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }

  const token = authHeader.slice(7);
  const claims = decodeJwt(token);

  const oid = claims['oid'] as string | undefined;
  if (!oid) {
    throw new Error('Authentication required');
  }

  return oid;
}

/**
 * Verify that a user has permission to manage a specific product
 * @param params - Object containing userId, shopId, and productId
 * @throws Error if user doesn't have permission
 */
export async function assertCanManageProduct(params: {
  userId: string;
  shopId: string;
  productId: string;
}): Promise<void> {
  // TODO: Implement actual authorization logic
  // This should verify:
  // - User exists and is active
  // - User has permission to manage the shop (owner/staff role)
  // - Product belongs to the specified shop
  // - Any other business rules for product management
  
  const { userId, shopId, productId } = params;
  
  // Placeholder implementation - replace with actual authorization logic
  if (!userId || !shopId || !productId) {
    throw new Error('Missing required parameters for authorization check');
  }
  
  // For now, just validate that parameters are provided
  // In a real implementation, you would:
  // 1. Query the shop to check if user is a member with appropriate role
  // 2. Verify the product exists and belongs to the shop
  // 3. Check any additional business rules
  
  console.log(`Authorization check for user ${userId} to manage product ${productId} in shop ${shopId}`);
  
  // Placeholder - in real implementation, throw error if unauthorized
  // throw new Error('User not authorized to manage this product');
}
