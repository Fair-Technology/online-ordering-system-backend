import { User } from './databaseTypes';
import { UserEntity } from './user.entity';

export function hydrateUser(doc: User): UserEntity {
  return { ...doc };
}
