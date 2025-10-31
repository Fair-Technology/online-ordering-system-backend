import { HttpRequestLike, HttpResponseInitLike } from "../types/http";
type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;
const { app } = require("@azure/functions");
import { getContainer } from "../config/cosmosClient";
import {
  CreateProductInShopRequest,
  CreateProductRequest,
  ProductInShopResponse,
  UpdateProductInShopRequest,
  UpdateProductRequest,
} from "../types/apiTypes";
import { newId, nowIso, writeAuditLog } from "../utils";
import { ProductResponse } from "../types/responseTypes";
import { Category, Product, Shop } from "../types/databaseTypes";

const productsContainer = getContainer("products");
const productsInShopContainer = getContainer("productsInShop");
const categoriesContainer = getContainer("categories");
const shopsContainer = getContainer("shops");

function json(status: number, body: unknown): HttpResponseInit {
  return { status, jsonBody: body };
}

function getActorUserId(request: HttpRequest): string {
  return request.headers.get("x-user-id") ?? "system";
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

async function readShop(shopId: string): Promise<Shop | undefined> {
  try {
    const { resource } = await shopsContainer.item(shopId, shopId).read<Shop>();
    return resource ?? undefined;
  } catch {
    return undefined;
  }
}

// POST /products -> create a global catalog product definition
app.http("productsCreate", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "products",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const payload = ((await request.json()) ?? {}) as Partial<CreateProductRequest>;
      if (!payload.ownerUserId || typeof payload.ownerUserId !== "string") {
        return json(400, { message: "ownerUserId is required" });
      }
      if (!payload.name || typeof payload.name !== "string") {
        return json(400, { message: "name is required" });
      }
      if (typeof payload.isActive !== "boolean") {
        return json(400, { message: "isActive must be provided" });
      }
      if (!Array.isArray(payload.variantSchemes)) {
        return json(400, { message: "variantSchemes must be an array" });
      }
      if (!Array.isArray(payload.addonGroups)) {
        return json(400, { message: "addonGroups must be an array" });
      }

      const timestamp = nowIso();
      const product: Product = {
        id: newId(),
        ownerUserId: payload.ownerUserId.trim(),
        name: payload.name.trim(),
        description: payload.description,
        isAvailable: payload.isActive,
        createdAt: timestamp,
        updatedAt: timestamp,
        variantSchemes: payload.variantSchemes,
        addonGroups: payload.addonGroups,
      };

      await productsContainer.items.create(product);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: "product",
        entityId: product.id,
        action: "CREATE",
        after: product,
      });

      return json(201, product);
    } catch (error: any) {
      return json(500, { message: "Failed to create product", error: error?.message ?? String(error) });
    }
  },
});

// PATCH /products/{productId} -> update global product fields
app.http("productsUpdate", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "products/{productId}",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const { productId } = request.params;
    try {
      const { resource } = await productsContainer.item(productId, productId).read<Product>();
      if (!resource) {
        return json(404, { message: "Product not found" });
      }

      const payload = ((await request.json()) ?? {}) as UpdateProductRequest;
      const allowed: Partial<Product> = {};
      if (payload.name !== undefined) {
        if (typeof payload.name !== "string") {
          return json(400, { message: "name must be a string" });
        }
        allowed.name = payload.name.trim();
      }
      if (payload.description !== undefined) {
        if (typeof payload.description !== "string") {
          return json(400, { message: "description must be a string" });
        }
        allowed.description = payload.description;
      }
      if (payload.variantSchemes !== undefined) {
        if (!Array.isArray(payload.variantSchemes)) {
          return json(400, { message: "variantSchemes must be an array" });
        }
        allowed.variantSchemes = payload.variantSchemes;
      }
      if (payload.addonGroups !== undefined) {
        if (!Array.isArray(payload.addonGroups)) {
          return json(400, { message: "addonGroups must be an array" });
        }
        allowed.addonGroups = payload.addonGroups;
      }
      if (payload.isActive !== undefined) {
        if (typeof payload.isActive !== "boolean") {
          return json(400, { message: "isActive must be a boolean" });
        }
        allowed.isAvailable = payload.isActive;
      }

      if (Object.keys(allowed).length === 0) {
        return json(400, { message: "No updatable fields provided" });
      }

      const updated: Product = {
        ...resource,
        ...allowed,
        updatedAt: nowIso(),
      };

      await productsContainer.items.upsert(updated);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: "product",
        entityId: productId,
        action: "UPDATE",
        before: resource,
        after: updated,
      });

      return json(200, updated);
    } catch {
      return json(404, { message: "Product not found" });
    }
  },
});

// POST /shops/{shopId}/products -> create a shop-specific product listing
app.http("productsInShopCreate", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "shops/{shopId}/products",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const { shopId } = request.params;
    const shop = await readShop(shopId);
    if (!shop) {
      return json(404, { message: "Shop not found" });
    }

    const payload = ((await request.json()) ?? {}) as Partial<CreateProductInShopRequest>;
    if (!payload.productId || typeof payload.productId !== "string") {
      return json(400, { message: "productId is required" });
    }
    if (payload.isAvailable === undefined || typeof payload.isAvailable !== "boolean") {
      return json(400, { message: "isAvailable must be provided" });
    }
    if (!Array.isArray(payload.categoryIds)) {
      return json(400, { message: "categoryIds must be an array" });
    }

    try {
      const { resource: product } = await productsContainer.item(payload.productId, payload.productId).read<Product>();
      if (!product) {
        return json(404, { message: "Product not found" });
      }

      const timestamp = nowIso();
      const record: ProductInShopResponse = {
        id: newId(),
        productId: product.id,
        shopId: shop.id,
        priceOverride: payload.priceOverride !== undefined ? Number(payload.priceOverride) : undefined,
        isAvailable: payload.isAvailable,
        categoryIds: sanitizeStringArray(payload.categoryIds),
        sortOrder: payload.sortOrder !== undefined ? Number(payload.sortOrder) : undefined,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await productsInShopContainer.items.create(record);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: "productInShop",
        entityId: record.id,
        shopId: shop.id,
        action: "CREATE",
        after: record,
      });

      return json(201, record);
    } catch {
      return json(404, { message: "Product not found" });
    }
  },
});

// PATCH /shops/{shopId}/products/{productInShopId} -> edit listing metadata
app.http("productsInShopUpdate", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "shops/{shopId}/products/{productInShopId}",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const { shopId, productInShopId } = request.params;
    try {
      const { resource } = await productsInShopContainer.item(productInShopId, productInShopId).read<ProductInShopResponse>();
      if (!resource || resource.shopId !== shopId) {
        return json(404, { message: "Product listing not found" });
      }

      const payload = ((await request.json()) ?? {}) as UpdateProductInShopRequest;
      const allowed: Partial<ProductInShopResponse> = {};
      if (payload.isAvailable !== undefined) {
        if (typeof payload.isAvailable !== "boolean") {
          return json(400, { message: "isAvailable must be a boolean" });
        }
        allowed.isAvailable = payload.isAvailable;
      }
      if (payload.priceOverride !== undefined) {
        allowed.priceOverride = Number(payload.priceOverride);
      }
      if (payload.categoryIds !== undefined) {
        if (!Array.isArray(payload.categoryIds)) {
          return json(400, { message: "categoryIds must be an array" });
        }
        allowed.categoryIds = sanitizeStringArray(payload.categoryIds);
      }
      if (payload.sortOrder !== undefined) {
        allowed.sortOrder = Number(payload.sortOrder);
      }

      if (Object.keys(allowed).length === 0) {
        return json(400, { message: "No updatable fields provided" });
      }

      const updated: ProductInShopResponse = {
        ...resource,
        ...allowed,
        updatedAt: nowIso(),
      };

      await productsInShopContainer.items.upsert(updated);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: "productInShop",
        entityId: productInShopId,
        shopId,
        action: "UPDATE",
        before: resource,
        after: updated,
      });

      return json(200, updated);
    } catch {
      return json(404, { message: "Product listing not found" });
    }
  },
});

// GET /shops/{shopId}/categories -> list categories for a shop
app.http("categoriesList", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "shops/{shopId}/categories",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const { shopId } = request.params;
    const querySpec = {
      query: "SELECT * FROM c WHERE c.shopId = @shopId ORDER BY c.sortOrder ASC",
      parameters: [{ name: "@shopId", value: shopId }],
    };
    const { resources } = await categoriesContainer.items.query<Category>(querySpec).fetchAll();
    return json(200, resources);
  },
});

// POST /shops/{shopId}/categories -> create a new category
app.http("categoriesCreate", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "shops/{shopId}/categories",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const { shopId } = request.params;
    const shop = await readShop(shopId);
    if (!shop) {
      return json(404, { message: "Shop not found" });
    }

    const payload = (await request.json()) ?? {};
    if (!payload.name || typeof payload.name !== "string") {
      return json(400, { message: "name is required" });
    }

    const timestamp = nowIso();
    const category: Category = {
      id: newId(),
      shopId,
      name: payload.name.trim(),
      description: payload.description,
      sortOrder: payload.sortOrder !== undefined ? Number(payload.sortOrder) : undefined,
      isActive: payload.isActive ?? true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await categoriesContainer.items.create(category);
    await writeAuditLog({
      actorUserId: getActorUserId(request),
      entityType: "category",
      entityId: category.id,
      shopId,
      action: "CREATE",
      after: category,
    });

    return json(201, category);
  },
});

// PATCH /shops/{shopId}/categories/{categoryId} -> update category fields
app.http("categoriesUpdate", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "shops/{shopId}/categories/{categoryId}",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const { categoryId, shopId } = request.params;
    try {
      const { resource } = await categoriesContainer.item(categoryId, categoryId).read<Category>();
      if (!resource || resource.shopId !== shopId) {
        return json(404, { message: "Category not found" });
      }

      const payload = (await request.json()) ?? {};
      const allowed: Partial<Category> = {};
      if (payload.name !== undefined) {
        if (typeof payload.name !== "string") {
          return json(400, { message: "name must be a string" });
        }
        allowed.name = payload.name.trim();
      }
      if (payload.description !== undefined) {
        if (typeof payload.description !== "string") {
          return json(400, { message: "description must be a string" });
        }
        allowed.description = payload.description;
      }
      if (payload.sortOrder !== undefined) {
        allowed.sortOrder = Number(payload.sortOrder);
      }
      if (payload.isActive !== undefined) {
        allowed.isActive = Boolean(payload.isActive);
      }
      if (Object.keys(allowed).length === 0) {
        return json(400, { message: "No updatable fields provided" });
      }

      const updated: Category = {
        ...resource,
        ...allowed,
        updatedAt: nowIso(),
      };

      await categoriesContainer.items.upsert(updated);
      await writeAuditLog({
        actorUserId: getActorUserId(request),
        entityType: "category",
        entityId: categoryId,
        shopId,
        action: "UPDATE",
        before: resource,
        after: updated,
      });

      return json(200, updated);
    } catch {
      return json(404, { message: "Category not found" });
    }
  },
});

// GET /shops/{shopId}/menu -> fetch the full customer-facing menu payload
app.http("shopsMenu", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "shops/{shopId}/menu",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {

      //Dummy response for noww
    return json(200, {
      products: productsInShop
    });

    const { shopId } = request.params;
    const shop = await readShop(shopId);
    if (!shop) {
      return json(404, { message: "Shop not found" });
    }

    const [{ resources: categories }, { resources: listings }] = await Promise.all([
      categoriesContainer
        .items.query<Category>({
          query: "SELECT * FROM c WHERE c.shopId = @shopId AND c.isActive = true ORDER BY c.sortOrder ASC",
          parameters: [{ name: "@shopId", value: shopId }],
        })
        .fetchAll(),
      productsInShopContainer
        .items.query<ProductInShopResponse>({
          query: "SELECT * FROM c WHERE c.shopId = @shopId AND c.isAvailable = true",
          parameters: [{ name: "@shopId", value: shopId }],
        })
        .fetchAll(),
    ]);

    const productIds = Array.from(new Set(listings.map((item) => item.productId)));
    let products: Product[] = [];
    if (productIds.length > 0) {
      const { resources } = await productsContainer
        .items.query<Product>({
          query: "SELECT * FROM c WHERE ARRAY_CONTAINS(@ids, c.id)",
          parameters: [{ name: "@ids", value: productIds }],
        })
        .fetchAll();
      products = resources;
    }

    return json(200, {
      shop,
      categories,
      productsInShop: listings,
      products,
    });


  },
});


// ✅ Final dummy response to send to frontend
export const productsInShop: ProductResponse[] = [
  // 🥘 MAINS
  {
    id: "product-001",
    label: "Grilled Chicken Plate",
    imageURL: 'https://picsum.photos/200',
    description: "Juicy grilled chicken served with roasted veggies and garlic sauce.",
    isAvailable: true,
    price: 50,
    categories: [{ id: "mains", name: "Mains" }],
    variantTypes: [
      {
        id: "variantScheme-001",
        label: "Size",
        variants: [
          { id: "variant-001", label: "Regular", imageURL: "", priceDelta: 0, isAvailable: true },
          { id: "variant-002", label: "Large", imageURL: "", priceDelta: 30, isAvailable: true },
          { id: "variant-002b", label: "XXLarge", imageURL: "", priceDelta: 50, isAvailable: true },
        ],
      },
    ],
    addons: [
      {
        id: "addonGroup-001",
        label: "Extras",
        options: [
          { id: "addon-001", label: "Extra Sauce", imageURL: "", priceDelta: 1.0, isAvailable: true },
          { id: "addon-002", label: "Chilly", imageURL: "", priceDelta: 2.0, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "product-002",
    label: "Beef Lasagna",
    description: "Classic lasagna layered with seasoned beef, cheese, and tomato sauce.",
    isAvailable: true,
    price: 13.49,
    categories: [{ id: "mains", name: "Mains" }],
    variantTypes: [
      {
        id: "variantScheme-002",
        label: "Serving",
        variants: [
          { id: "variant-003", label: "Single", priceDelta: 0, isAvailable: true },
          { id: "variant-004", label: "Family", priceDelta: 22.99 - 13.49, isAvailable: true },
        ],
      },
    ],
    addons: [
      {
        id: "addonGroup-002",
        label: "Add-ons",
        options: [
          { id: "addon-003", label: "Extra Cheese", priceDelta: 1.5, isAvailable: true },
          { id: "addon-004", label: "Garlic Bread", priceDelta: 2.5, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "product-003",
    label: "Veggie Stir Fry",
    description: "Fresh mixed vegetables stir-fried with soy and sesame sauce.",
    isAvailable: true,
    price: 12.99,
    categories: [{ id: "mains", name: "Mains" }],
    variantTypes: [],
    addons: [
      {
        id: "addonGroup-003",
        label: "Add Protein",
        options: [
          { id: "addon-005", label: "Chicken", priceDelta: 3.0, isAvailable: true },
          { id: "addon-006", label: "Tofu", priceDelta: 2.0, isAvailable: true },
        ],
      },
    ],
  },

  // 🍟 SIDES
  {
    id: "product-004",
    label: "French Fries",
    description: "Crispy golden fries served with ketchup or aioli.",
    isAvailable: true,
    price: 5.49,
    categories: [{ id: "sides", name: "Sides" }],
    variantTypes: [],
    addons: [
      {
        id: "addonGroup-004",
        label: "Sauce Choice",
        options: [
          { id: "addon-007", label: "Aioli", priceDelta: 0.5, isAvailable: true },
          { id: "addon-008", label: "Chilli Sauce", priceDelta: 0.5, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "product-005",
    label: "Onion Rings",
    description: "Crispy battered onion rings served with BBQ dip.",
    isAvailable: true,
    price: 6.99,
    categories: [{ id: "sides", name: "Sides" }],
    variantTypes: [],
    addons: [],
  },

  // 🥤 DRINKS
  {
    id: "product-006",
    label: "Coca-Cola",
    description: "Classic Coke served chilled.",
    isAvailable: true,
    price: 3.49,
    categories: [{ id: "drinks", name: "Drinks" }],
    variantTypes: [
      {
        id: "variantScheme-003",
        label: "Size",
        variants: [
          { id: "variant-005", label: "Can 375ml", priceDelta: 0, isAvailable: true },
          { id: "variant-006", label: "Bottle 600ml", priceDelta: 4.49 - 3.49, isAvailable: true },
        ],
      },
    ],
    addons: [],
  },
  {
    id: "product-007",
    label: "Iced Coffee",
    description: "Cold brew with milk and ice cream topping.",
    isAvailable: true,
    price: 4.99,
    categories: [{ id: "drinks", name: "Drinks" }],
    variantTypes: [],
    addons: [
      {
        id: "addonGroup-005",
        label: "Sweetener",
        options: [
          { id: "addon-009", label: "Sugar", priceDelta: 0, isAvailable: true },
          { id: "addon-010", label: "Honey", priceDelta: 0.5, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "product-008",
    label: "Sparkling Water",
    description: "Refreshing mineral sparkling water.",
    isAvailable: true,
    price: 2.99,
    categories: [{ id: "drinks", name: "Drinks" }],
    variantTypes: [],
    addons: [],
  },

  // 🍪 SNACKS
  {
    id: "product-009",
    label: "Cheese Sticks",
    description: "Mozzarella sticks coated in golden breadcrumbs.",
    isAvailable: true,
    price: 4.49,
    categories: [{ id: "snacks", name: "Snacks" }],
    variantTypes: [],
    addons: [],
  },
  {
    id: "product-010",
    label: "Mini Spring Rolls",
    description: "Crispy mini rolls filled with vegetables.",
    isAvailable: true,
    price: 3.99,
    categories: [{ id: "snacks", name: "Snacks" }],
    variantTypes: [],
    addons: [],
  },

  // 🍰 DESSERTS
  {
    id: "product-011",
    label: "Chocolate Lava Cake",
    description: "Warm chocolate cake with gooey molten center.",
    isAvailable: true,
    price: 6.99,
    categories: [{ id: "desserts", name: "Desserts" }],
    variantTypes: [],
    addons: [
      {
        id: "addonGroup-006",
        label: "Toppings",
        options: [
          { id: "addon-011", label: "Vanilla Ice Cream", priceDelta: 2.0, isAvailable: true },
          { id: "addon-012", label: "Whipped Cream", priceDelta: 1.0, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "product-012",
    label: "Tiramisu Cup",
    description: "Italian-style tiramisu in a cup, layered with mascarpone.",
    isAvailable: true,
    price: 5.49,
    categories: [{ id: "desserts", name: "Desserts" }],
    variantTypes: [],
    addons: [],
  },
];
