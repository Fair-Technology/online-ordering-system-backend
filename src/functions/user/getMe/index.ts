import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeGetMe } from '../../../application/user/getMe/executeGetMe';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('getMe', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users/me',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const result = await executeGetMe(request);
      return mapResultToHttp(result);
    } catch {
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  },
});
