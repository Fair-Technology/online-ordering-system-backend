import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { findUserById } from '../../../infrastructure/cosmos/user/CosmosUserRepository';
import { seedDefaultPlans } from '../../../application/_shared/seedPlans';

app.http('seedPlans', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'superadmin/seed-plans',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = await getUserIdFromAuth(request);
      const user = await findUserById(userId);
      if (user?.systemRole !== 'superadmin') {
        return { status: 403, jsonBody: { error: 'Superadmin access required' } };
      }
      await seedDefaultPlans();
      return { status: 200, jsonBody: { success: true, message: 'Plans seeded successfully' } };
    } catch (error: any) {
      if (error.message === 'Authentication required') {
        return { status: 403, jsonBody: { error: 'Authentication required' } };
      }
      return { status: 500, jsonBody: { error: 'Failed to seed plans' } };
    }
  },
});
