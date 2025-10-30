import { HttpRequestLike, HttpResponseInitLike } from "../types/http";
type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;
const { app } = require("@azure/functions");
import { getContainer } from "../config/cosmosClient";
import { Category, Product, ProductInShop, Shop } from "../types/models";
import {
  CreateProductInShopRequest,
  CreateProductRequest,
  UpdateProductInShopRequest,
  UpdateProductRequest,
} from "../types/apiTypes";
import { newId, nowIso, writeAuditLog } from "../utils";
import { FrontendProductInShop } from "../types/responseTypes";

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
        isActive: payload.isActive,
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
        allowed.isActive = payload.isActive;
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
      const record: ProductInShop = {
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

app.http("productsInShopUpdate", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "shops/{shopId}/products/{productInShopId}",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const { shopId, productInShopId } = request.params;
    try {
      const { resource } = await productsInShopContainer.item(productInShopId, productInShopId).read<ProductInShop>();
      if (!resource || resource.shopId !== shopId) {
        return json(404, { message: "Product listing not found" });
      }

      const payload = ((await request.json()) ?? {}) as UpdateProductInShopRequest;
      const allowed: Partial<ProductInShop> = {};
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

      const updated: ProductInShop = {
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
        .items.query<ProductInShop>({
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
export const productsInShop: FrontendProductInShop[] = [
  // 🥘 MAINS
  {
    id: "prodInShop-001",
    isAvailable: true,
    price: 15.99,
    categories: [{ id: "mains", name: "Mains" }],
    product: {
      id: "product-001",
      name: "Grilled Chicken Plate",
      description: "Juicy grilled chicken served with roasted veggies and garlic sauce.",
      isActive: true,
      variantSchemes: [
        {
          id: "variantScheme-001",
          name: "Size",
          variants: [
            { id: "variant-001", label: "Regular", basePrice: 15.99, sku: "GC-R", isActive: true },
            { id: "variant-002", label: "Large", basePrice: 18.99, sku: "GC-L", isActive: true },
          ],
        },
      ],
      addonGroups: [
        {
          id: "addonGroup-001",
          name: "Extras",
          options: [
            { id: "addon-001", name: "Extra Sauce", priceDelta: 1.0, isActive: true },
            { id: "addon-002", name: "Grilled Bread", priceDelta: 2.0, isActive: true },
          ],
        },
      ],
    },
  },
  {
    id: "prodInShop-002",
    isAvailable: true,
    price: 13.49,
    categories: [{ id: "mains", name: "Mains" }],
    product: {
      id: "product-002",
      name: "Beef Lasagna",
      description: "Classic lasagna layered with seasoned beef, cheese, and tomato sauce.",
      isActive: true,
      variantSchemes: [
        {
          id: "variantScheme-002",
          name: "Serving",
          variants: [
            { id: "variant-003", label: "Single", basePrice: 13.49, sku: "LAS-S", isActive: true },
            { id: "variant-004", label: "Family", basePrice: 22.99, sku: "LAS-F", isActive: true },
          ],
        },
      ],
      addonGroups: [
        {
          id: "addonGroup-002",
          name: "Add-ons",
          options: [
            { id: "addon-003", name: "Extra Cheese", priceDelta: 1.5, isActive: true },
            { id: "addon-004", name: "Garlic Bread", priceDelta: 2.5, isActive: true },
          ],
        },
      ],
    },
  },
  {
    id: "prodInShop-003",
    isAvailable: true,
    price: 12.99,
    categories: [{ id: "mains", name: "Mains" }],
    product: {
      id: "product-003",
      name: "Veggie Stir Fry",
      description: "Fresh mixed vegetables stir-fried with soy and sesame sauce.",
      isActive: true,
      variantSchemes: [],
      addonGroups: [
        {
          id: "addonGroup-003",
          name: "Add Protein",
          options: [
            { id: "addon-005", name: "Chicken", priceDelta: 3.0, isActive: true },
            { id: "addon-006", name: "Tofu", priceDelta: 2.0, isActive: true },
          ],
        },
      ],
    },
  },

  // 🍟 SIDES
  {
    id: "prodInShop-004",
    isAvailable: true,
    price: 5.49,
    categories: [{ id: "sides", name: "Sides" }],
    product: {
      id: "product-004",
      name: "French Fries",
      description: "Crispy golden fries served with ketchup or aioli.",
      isActive: true,
      variantSchemes: [],
      addonGroups: [
        {
          id: "addonGroup-004",
          name: "Sauce Choice",
          options: [
            { id: "addon-007", name: "Aioli", priceDelta: 0.5, isActive: true },
            { id: "addon-008", name: "Chilli Sauce", priceDelta: 0.5, isActive: true },
          ],
        },
      ],
    },
  },
  {
    id: "prodInShop-005",
    isAvailable: true,
    price: 6.99,
    categories: [{ id: "sides", name: "Sides" }],
    product: {
      id: "product-005",
      name: "Onion Rings",
      description: "Crispy battered onion rings served with BBQ dip.",
      isActive: true,
      variantSchemes: [],
      addonGroups: [],
    },
  },

  // 🥤 DRINKS
  {
    id: "prodInShop-006",
    isAvailable: true,
    price: 3.49,
    categories: [{ id: "drinks", name: "Drinks" }],
    product: {
      id: "product-006",
      name: "Coca-Cola",
      description: "Classic Coke served chilled.",
      isActive: true,
      variantSchemes: [
        {
          id: "variantScheme-003",
          name: "Size",
          variants: [
            { id: "variant-005", label: "Can 375ml", basePrice: 3.49, sku: "COKE-375", isActive: true },
            { id: "variant-006", label: "Bottle 600ml", basePrice: 4.49, sku: "COKE-600", isActive: true },
          ],
        },
      ],
      addonGroups: [],
    },
  },
  {
    id: "prodInShop-007",
    isAvailable: true,
    price: 4.99,
    categories: [{ id: "drinks", name: "Drinks" }],
    product: {
      id: "product-007",
      name: "Iced Coffee",
      description: "Cold brew with milk and ice cream topping.",
      isActive: true,
      variantSchemes: [],
      addonGroups: [
        {
          id: "addonGroup-005",
          name: "Sweetener",
          options: [
            { id: "addon-009", name: "Sugar", priceDelta: 0, isActive: true },
            { id: "addon-010", name: "Honey", priceDelta: 0.5, isActive: true },
          ],
        },
      ],
    },
  },
  {
    id: "prodInShop-008",
    isAvailable: true,
    price: 2.99,
    categories: [{ id: "drinks", name: "Drinks" }],
    product: {
      id: "product-008",
      name: "Sparkling Water",
      description: "Refreshing mineral sparkling water.",
      isActive: true,
      variantSchemes: [],
      addonGroups: [],
    },
  },

  // 🍪 SNACKS
  {
    id: "prodInShop-009",
    isAvailable: true,
    price: 4.49,
    categories: [{ id: "snacks", name: "Snacks" }],
    product: {
      id: "product-009",
      name: "Cheese Sticks",
      description: "Mozzarella sticks coated in golden breadcrumbs.",
      isActive: true,
      variantSchemes: [],
      addonGroups: [],
    },
  },
  {
    id: "prodInShop-010",
    isAvailable: true,
    price: 3.99,
    categories: [{ id: "snacks", name: "Snacks" }],
    product: {
      id: "product-010",
      name: "Mini Spring Rolls",
      description: "Crispy mini rolls filled with vegetables.",
      isActive: true,
      variantSchemes: [],
      addonGroups: [],
    },
  },

  // 🍰 DESSERTS
  {
    id: "prodInShop-011",
    isAvailable: true,
    price: 6.99,
    categories: [{ id: "desserts", name: "Desserts" }],
    product: {
      id: "product-011",
      name: "Chocolate Lava Cake",
      description: "Warm chocolate cake with gooey molten center.",
      isActive: true,
      variantSchemes: [],
      addonGroups: [
        {
          id: "addonGroup-006",
          name: "Toppings",
          options: [
            { id: "addon-011", name: "Vanilla Ice Cream", priceDelta: 2.0, isActive: true },
            { id: "addon-012", name: "Whipped Cream", priceDelta: 1.0, isActive: true },
          ],
        },
      ],
    },
  },
  {
    id: "prodInShop-012",
    isAvailable: true,
    price: 5.49,
    categories: [{ id: "desserts", name: "Desserts" }],
    product: {
      id: "product-012",
      name: "Tiramisu Cup",
      description: "Italian-style tiramisu in a cup, layered with mascarpone.",
      isActive: true,
      variantSchemes: [],
      addonGroups: [],
    },
  },
];;
