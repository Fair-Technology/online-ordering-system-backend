import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeGetMyInvitations } from '../../../application/user/getMyInvitations/executeGetMyInvitations';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('getMyInvitations', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users/me/invitations',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const result = await executeGetMyInvitations(request);
      return mapResultToHttp(result);
    } catch {
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  },
});
