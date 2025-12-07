import { ProductCategory } from '../domain/databaseTypes';
import { hydrateCategory } from '../domain/category.hydrator';
import {
  createCategoryRepository,
  deleteCategoryRepository,
  getCategoryByIdRepository,
  listCategoriesRepository,
  updateCategoryRepository,
} from '../repositories/categoryRepository';
import { newId, nowIso } from '../utils/general';

export async function listCategoriesService(): Promise<ProductCategory[]> {
  const docs = await listCategoriesRepository();
  return docs.map(hydrateCategory);
}

export async function getCategoryByIdService(
  categoryId: string,
): Promise<ProductCategory> {
  const category = await getCategoryByIdRepository(categoryId);
  if (!category) {
    throw Object.assign(new Error('Category not found'), { status: 404 });
  }
  return hydrateCategory(category);
}

export interface CategoryInput {
  name: string;
  description?: string;
  parentCategoryId?: string;
  position?: number;
  isActive?: boolean;
}

export async function createCategoryService(
  input: CategoryInput,
): Promise<ProductCategory> {
  if (!input.name?.trim()) {
    throw Object.assign(new Error('name is required'), { status: 400 });
  }

  const timestamp = nowIso();
  const category: ProductCategory = {
    id: newId(),
    name: input.name.trim(),
    description: input.description,
    parentCategoryId: input.parentCategoryId,
    position: input.position,
    isActive: input.isActive ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const created = await createCategoryRepository(category);
  return hydrateCategory(created);
}

export async function updateCategoryService(
  categoryId: string,
  input: CategoryInput,
): Promise<ProductCategory> {
  const existing = await getCategoryByIdService(categoryId);
  const updated: ProductCategory = {
    ...existing,
    name: input.name?.trim() ?? existing.name,
    description: input.description ?? existing.description,
    parentCategoryId: input.parentCategoryId ?? existing.parentCategoryId,
    position: input.position ?? existing.position,
    isActive: input.isActive ?? existing.isActive,
    updatedAt: nowIso(),
  };
  const resource = await updateCategoryRepository(updated);
  return hydrateCategory(resource);
}

export async function deleteCategoryService(categoryId: string): Promise<void> {
  await deleteCategoryRepository(categoryId);
}
