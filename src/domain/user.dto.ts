import { UserEntity } from './user.entity';

export interface UserDTO {
  id: string;
}

export function mapUserToDTO(user: UserEntity): UserDTO {
  return {
    id: user.id,
  };
}
