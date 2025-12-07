import { CategoryEntity } from './category.entity';

export interface CategoryDTO extends CategoryEntity {}

export function mapCategoryToDTO(category: CategoryEntity): CategoryDTO {
  return { ...category };
}
