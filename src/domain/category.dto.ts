import { CategoryEntity } from './category.entity';

export interface CategoryDTO extends CategoryEntity {}

export interface CategoryInput {
  name: string;
  description?: string;
  parentCategoryId?: string;
  position?: number;
  isActive?: boolean;
}

export type CreateCategoryRequest = CategoryInput;
export type UpdateCategoryRequest = Partial<CategoryInput>;

export function mapCategoryToDTO(category: CategoryEntity): CategoryDTO {
  return { ...category };
}
