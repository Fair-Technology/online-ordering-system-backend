import { User } from './user.entity';
import { UserEntity } from './user.entity';

export function hydrateUser(doc: User): UserEntity {
  return { ...doc };
}
