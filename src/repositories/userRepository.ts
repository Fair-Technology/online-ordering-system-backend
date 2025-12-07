import { getContainer } from '../infrastructure/cosmosClient';
import { User } from '../domain/databaseTypes';

const usersContainer = getContainer('users');

export async function listUsersRepository(): Promise<User[]> {
  const { resources } = await usersContainer.items
    .query<User>({ query: 'SELECT * FROM c ORDER BY c.createdAt DESC' })
    .fetchAll();
  return resources;
}

export async function getUserByIdRepository(
  userId: string,
): Promise<User | null> {
  const { resource } = await usersContainer.item(userId, userId).read<User>();
  return resource ?? null;
}

export async function createUserRepository(user: User): Promise<User> {
  const { resource } = await usersContainer.items.create(user);
  return resource ?? user;
}

export async function updateUserRepository(user: User): Promise<User> {
  const { resource } = await usersContainer.items.upsert(user);
  return resource ?? user;
}

export async function deleteUserRepository(userId: string): Promise<void> {
  await usersContainer.item(userId, userId).delete();
}
