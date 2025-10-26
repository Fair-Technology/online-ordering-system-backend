import { ensureContainerExists } from "./config/cosmosClient";

const requiredContainers = [
  "users",
  "shops",
  "shopMembers",
  "shopHours",
  "categories",
  "products",
  "productsInShop",
  "carts",
  "orders",
  "auditLogs",
];

(async () => {
  // Ensure necessary containers exist at startup
  await Promise.all(requiredContainers.map((id) => ensureContainerExists(id)));
})();

// Register Azure Function HTTP triggers by requiring their modules so they execute on load
require("./functions/users");
require("./functions/shops");
require("./functions/products");
require("./functions/orders");
