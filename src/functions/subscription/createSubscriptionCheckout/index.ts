import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeCreateSubscriptionCheckout } from '../../../application/subscription/createSubscriptionCheckout/executeCreateSubscriptionCheckout';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('createSubscriptionCheckout', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/subscription/checkout',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.params.shopId;
      const result = await executeCreateSubscriptionCheckout(shopId, request);
      return mapResultToHttp(result);
    } catch (error) {
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  },
});
