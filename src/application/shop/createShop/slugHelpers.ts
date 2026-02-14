/**
 * Generate a URL-friendly slug from a shop name
 * Example: "Burger King Belconnen" -> "burger-king-belconnen"
 */
export function generateSlugFromName(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      // Replace spaces and special characters with hyphens
      .replace(/[^a-z0-9]+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
      // Replace multiple consecutive hyphens with single hyphen
      .replace(/-+/g, '-')
  );
}

/**
 * Validates that a slug generated from the shop name is unique
 * Throws an error if the slug already exists
 * @param name The shop name to generate slug from
 * @param checkSlugExists Function that returns true if slug already exists
 * @returns The generated slug if unique
 * @throws Error if slug already exists
 */
export async function validateUniqueSlug(
  name: string,
  checkSlugExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const slug = generateSlugFromName(name);

  const slugExists = await checkSlugExists(slug);
  if (slugExists) {
    throw new Error('A shop with this name already exists');
  }

  return slug;
}
