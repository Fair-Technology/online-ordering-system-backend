import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeRemoveShopMember } from '../../../application/shop/removeShopMember/executeRemoveShopMember';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('removeShopMember', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/members/{userId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.params.shopId;
      const targetUserId = request.params.userId;

      const result = await executeRemoveShopMember(
        { shopId, targetUserId },
        request,
      );

      return mapResultToHttp(result);
    } catch (error) {
      return {
        status: 500,
        jsonBody: { error: 'Internal server error' },
      };
    }
  },
});
