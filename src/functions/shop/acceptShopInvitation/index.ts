import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeAcceptShopInvitation } from '../../../application/shop/acceptShopInvitation/executeAcceptShopInvitation';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('acceptShopInvitation', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/invitations/accept',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.params.shopId;
      const result = await executeAcceptShopInvitation({ shopId }, request);
      return mapResultToHttp(result);
    } catch {
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  },
});
