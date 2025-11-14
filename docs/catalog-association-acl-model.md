# Catalog + Associations + ACL Model

## Why restructure?

The original Cosmos DB schema had several implicit assumptions:

- **Products were “owned” by users** rather than shops, which limited future scenarios like transferring ownership, multi-shop catalogs, or richer role-based access.
- **Shop-specific merchandising** (availability, pricing, ordering) lived in a dedicated `productsInShop` container, which added coupling and duplicated fields already present on catalog items.
- **Access control** was mostly inferred from membership documents. There was no consistent, explicit ACL story for service principals, API keys, or role-based overrides.
- **Documents lacked a shared base contract** (tenant markers, tags, versions, metadata), making cross-container governance hard once the system grows.

To future-proof the platform, we rewrote `src/types/databaseTypes.ts` around three layers: Catalog, Associations, and ACL.

---

## Key design pillars

### 1. Catalog (reusable product core)

- `CatalogProduct` now carries variants, addon groups, media, tags, allergy info — everything needed for a reusable product template.
- Monetary values use a `{ amount, currency }` shape (`Money`) so multi-currency flows do not require schema changes.
- Variant/addon groups are first-class objects (`CatalogVariantGroup`, `CatalogAddonGroup`), keeping merchandising decisions near the catalog source.

### 2. Associations (shop-specific context)

- `ShopCatalogEntry` replaces `productsInShop`. Each entry ties a shop to a catalog product, with optional price overrides, channel flags, and category links.
- `Category` documents are hierarchical and denormalized with `catalogProductIds` for faster menu builds.
- `ProductCategoryLink` keeps the many-to-many graph explicit (“catalog + association”), making it easy to bulk move products between categories or shops.
- Every relationship document inherits from `DocumentBase`, giving us metadata, versioning, soft deletion (`archivedAt`), and tagging.

### 3. ACL (fine-grained authorization)

- `AccessControlEntry` lets us attach permissions to any document (`resourceType`, `resourceId`) and any principal (`user`, `role`, `service`, `apiKey`), with `allow`/`deny` semantics and expiry.
- `ShopMember` records become a specific flavor of association, while ACLs give us the flexibility to grant e.g. “inventory.write” to a service integration without inventing new membership roles.
- `AuditLog` now records `PrincipalRef` (same shape as ACL) so investigators know exactly which principal performed an action.

---

## Shared Document Contract

Every document extends `DocumentBase`, which includes:

- `kind` discriminator (`DocumentKind`) so any container can host heterogeneous items.
- Optional `tenantId`, `tags`, `metadata`, `version`, `archivedAt` — crucial for multi-tenant operations, filtering, and soft deletes.
- `createdAt`/`updatedAt` timestamps for observability.

This makes horizontal sharding and cross-container tooling (backups, analytics pipelines, compliance exports) far simpler.

---

## Practical benefits

- **Flexibility**: A product can be shared across shops, moved, or versioned without rethinking the database. Associations capture the shop-specific context.
- **Clear ownership boundaries**: Catalog data is reusable, shop data is contextual, ACLs are explicit — no more overloading `ownerUserId`.
- **Security**: We can express permissions for external services or future API keys without shoehorning them into shop membership.
- **Observability**: Unified `AuditLog` + `DocumentBase` gives us tagging, metadata, and principal attribution across the entire system.

---

## Next steps

1. **Align validation & Functions**: Update remaining code paths to rely on the new interfaces (many files still expect the legacy shapes).
2. **Migration plan**: Define scripts to transform existing Cosmos data into the catalog/association/ACL structure.
3. **Docs & SDKs**: Share the new schema with frontend teams or integration partners so they can plan for catalog reuse and ACL grants.

This refactor establishes a foundation for multi-tenant, multi-channel commerce without needing another schema rewrite when requirements evolve.

