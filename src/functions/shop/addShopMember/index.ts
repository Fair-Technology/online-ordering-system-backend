import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeAddShopMember } from '../../../application/shop/addShopMember/executeAddShopMember';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('addShopMember', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/members',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.params.shopId;
      const body = (await request.json()) as any;

      const result = await executeAddShopMember(
        { shopId, userId: body.userId, email: body.email, role: body.role },
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
