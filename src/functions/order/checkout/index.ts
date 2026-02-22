import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeCheckout } from '../../../application/order/checkout/executeCheckout';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('checkout', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'orders',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const body = (await request.json()) as any;
      const result = await executeCheckout(body);
      return mapResultToHttp(result);
    } catch (error) {
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  },
});
