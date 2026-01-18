import { User } from '../domain/user.entity';
import { hydrateUser } from '../domain/user.hydrator';
import {
  createUserRepository,
  deleteUserRepository,
  getUserByIdRepository,
  listUsersRepository,
  updateUserRepository,
} from '../repositories/userRepository';
import { newId } from '../utils/general';

export async function listUsersService(): Promise<User[]> {
  const docs = await listUsersRepository();
  return docs.map(hydrateUser);
}

export async function getUserByIdService(userId: string): Promise<User> {
  const user = await getUserByIdRepository(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  return hydrateUser(user);
}

export async function createUserService(id?: string): Promise<User> {
  const userId = (id ?? newId()).trim();
  if (userId.length === 0) {
    throw Object.assign(new Error('id is required'), { status: 400 });
  }
  const existing = await getUserByIdRepository(userId);
  if (existing) {
    throw Object.assign(new Error('User already exists'), { status: 409 });
  }
  const created = await createUserRepository({ id: userId });
  return hydrateUser(created);
}

export async function updateUserService(userId: string): Promise<User> {
  const user = await getUserByIdService(userId);
  const updated = await updateUserRepository(user);
  return hydrateUser(updated);
}

export async function deleteUserService(userId: string): Promise<void> {
  const existing = await getUserByIdRepository(userId);
  if (!existing) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  await deleteUserRepository(userId);
}
