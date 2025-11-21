# Product + Associations + ACL Model

## Why restructure?

The original Cosmos DB schema had several implicit assumptions:

- **Products were “owned” by users** rather than shops, which limited future scenarios like transferring ownership, multi-shop libraries, or richer role-based access.
- **Shop-specific merchandising** (availability, pricing, ordering) lived in a dedicated `productsInShop` container, which added coupling and duplicated fields already present on product templates.
- **Access control** was mostly inferred from membership documents. There was no consistent, explicit ACL story for service principals, API keys, or role-based overrides.
- **Documents lacked a shared base contract** (tenant markers, tags, versions, metadata), making cross-container governance hard once the system grows.

To future-proof the platform, we rewrote `src/types/databaseTypes.ts` around three layers: Product templates, Associations, and ACL.

---

## Key design pillars

### 1. Product templates (shop-scoped core)

- `Product` now carries variants, addon groups, media, tags, allergy info — everything a shop needs for merchandising.
- Every product is anchored to a single `shopId`, so availability/pricing logic stays on the product document instead of a sidecar container.
- Monetary values use a `{ amount, currency }` shape (`Money`) so multi-currency flows do not require schema changes.
- Variant/addon groups are first-class objects (`ProductVariantGroup`, `ProductAddonGroup`), keeping merchandising decisions near the template source.
- Category assignments are captured as `product.categories` (string labels), which lets us hydrate responses with `ProductCategory` records while keeping writes simple.

### 2. Associations (shop-specific context)

- `ProductCategory` documents are hierarchical and scoped by `shopId`, making it trivial to build menus such as “Lunch” or “Drinks” per shop.
- `ShopProductMap` links a shop to the global product library so a single template can be surfaced in multiple storefronts. Each mapping can carry merchandising metadata such as availability or price overrides without mutating the source product.
- Association documents such as `ShopMember`, `ShopHours`, and ACL entries still inherit from `DocumentBase`, giving us metadata, versioning, soft deletion (`archivedAt`), and tagging.

### 3. ACL (fine-grained authorization)

- `AccessControlEntry` lets us attach permissions to any document (`resourceType`, `resourceId`) and any principal (`user`, `role`, `service`, `apiKey`), with `allow`/`deny` semantics and expiry.
- `ShopMember` records become a specific flavor of association, while ACLs give us the flexibility to grant e.g. “inventory.write” to a service integration without inventing new membership roles.
- `AuditLog` now records `PrincipalRef` (same shape as ACL) so investigators know exactly which principal performed an action.

---

## Shared Document Contract

Every document extends `DocumentBase`, which includes optional `tenantId`, tagging, metadata, versioning, soft deletion (`archivedAt`), plus the usual `createdAt`/`updatedAt` fields for observability.

This makes horizontal sharding and cross-container tooling (backups, analytics pipelines, compliance exports) far simpler.

---

## Practical benefits

- **Flexibility**: Eliminating `productsInShop` reduces write-amplification and keeps merchandising edits localized to the product document.
- **Clear ownership boundaries**: Product data is scoped to a shop, category associations are explicit, and ACLs remain separate — no more overloading `ownerUserId`.
- **Security**: We can express permissions for external services or future API keys without shoehorning them into shop membership.
- **Observability**: Unified `AuditLog` + `DocumentBase` gives us tagging, metadata, and principal attribution across the entire system.

---

## Next steps

1. **Align validation & Functions**: Update remaining code paths to rely on the new interfaces (many files still expect the legacy shapes).
2. **Migration plan**: Define scripts to transform existing Cosmos data into the product/association/ACL structure.
3. **Docs & SDKs**: Share the new schema with frontend teams or integration partners so they can plan for product-template reuse and ACL grants.

This refactor establishes a foundation for multi-tenant, multi-channel commerce without needing another schema rewrite when requirements evolve.
