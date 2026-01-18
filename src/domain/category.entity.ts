import { DocumentBase } from './baseTypes';

export interface ProductCategory extends DocumentBase {
  name: string;
  description?: string;
  position?: number;
  isActive: boolean;
  parentCategoryId?: string;
}

export type CategoryEntity = ProductCategory;
