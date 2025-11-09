const { app } = require('@azure/functions');
import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../types/otherTypes';
import { getContainer } from '../config/cosmosClient';
import {
  validateUserCreate,
  validateUsersGetById,
} from '../utils/businessLogic';
import { nowIso } from '../utils/general';

const usersContainer = getContainer('users');

// POST /users -> create a simple user record
app.http('userCreate', {
  methods: ['POST'],
  route: 'users',
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    const body = await validateUserCreate(request);

    try {
      const user = { id: body.id, createdAt: nowIso() };
      const { resource } = await usersContainer.items.create(user);
      return json(201, resource);
    } catch (err: any) {
      const status = err.status || 500;
      return { status, body: err.message || 'Internal Server Error' };
    }
  },
});

// GET /users/{userId} -> fetch a single user by id
app.http('usersGetById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users/{userId}',
  handler: async (req) => {
    await validateUsersGetById(req);

    try {
      const userId = (req.params?.userId ?? '').trim();
      const { resource } = await usersContainer.item(userId, userId).read();
      if (!resource) {
        return json(404, { message: 'User not found' });
      }
      return json(200, resource);
    } catch (err: any) {
      const status = err.status || 500;
      return { status, body: err.message || 'Internal Server Error' };
    }
  },
});
