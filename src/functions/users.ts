const { app } = require('@azure/functions');
import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../types/otherTypes';
import { getContainer } from '../config/cosmosClient';
import { User } from '../types/databaseTypes';
import {
  validateUserCreate,
  validateUsersGetById,
} from '../utils/businessLogic';
import { newId } from '../utils/general';
import { validateAccessToken } from '../utils/auth';

const usersContainer = getContainer('users');

async function readBody<T>(request: HttpRequestLike): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error('Invalid JSON body');
  }
}

// GET /users -> list user records
app.http('usersListAll', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users',
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    try {
      const authResult = await validateAccessToken(
        request.headers.get('authorization'),
      );
      console.log(
        authResult.valid ? 'access token valid' : 'access token invalid',
      );
      if (!authResult.valid) {
        return json(401, { message: authResult.error ?? 'Unauthorized' });
      }

      const { resources } = await usersContainer.items
        .query<User>({ query: 'SELECT * FROM c ORDER BY c.createdAt DESC' })
        .fetchAll();
      return json(200, resources);
    } catch (err: any) {
      const status = err.status || 500;
      return { status, body: err.message || 'Internal Server Error' };
    }
  },
});

// POST /users -> create a simple user record
app.http('userCreate', {
  methods: ['POST'],
  route: 'users',
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    const body = await validateUserCreate(request);

    try {
      const user: User = {
        id: body.id ?? newId(),
      };
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

// PATCH /users/{userId} -> update a user
app.http('usersUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'users/{userId}',
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    await validateUsersGetById(request);

    try {
      const userId = (request.params?.userId ?? '').trim();
      const { resource } = await usersContainer
        .item(userId, userId)
        .read<User>();
      if (!resource) {
        return json(404, { message: 'User not found' });
      }

      const updates = await readBody<Partial<User>>(request);
      if (updates.id && updates.id !== resource.id) {
        return json(400, { message: 'Cannot change user id' });
      }

      return json(200, resource);
    } catch (err: any) {
      const status = err.status || 500;
      return { status, body: err.message || 'Internal Server Error' };
    }
  },
});

// DELETE /users/{userId} -> delete a user
app.http('usersDelete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'users/{userId}',
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    await validateUsersGetById(request);

    try {
      const userId = (request.params?.userId ?? '').trim();
      const { resource } = await usersContainer
        .item(userId, userId)
        .read<User>();
      if (!resource) {
        return json(404, { message: 'User not found' });
      }

      await usersContainer.item(userId, userId).delete();
      return { status: 204 };
    } catch (err: any) {
      const status = err.status || 500;
      return { status, body: err.message || 'Internal Server Error' };
    }
  },
});
