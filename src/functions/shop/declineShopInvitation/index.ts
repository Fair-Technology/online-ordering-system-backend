import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeDeclineShopInvitation } from '../../../application/shop/declineShopInvitation/executeDeclineShopInvitation';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('declineShopInvitation', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/invitations/decline',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.params.shopId;
      const result = await executeDeclineShopInvitation({ shopId }, request);
      return mapResultToHttp(result);
    } catch {
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  },
});
