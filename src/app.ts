import { ensureContainerExists } from "./config/cosmosClient";

(async () => {
  // Ensure necessary containers exist at startup
  await ensureContainerExists("users");
  await ensureContainerExists("shops");
  await ensureContainerExists("items");
  await ensureContainerExists("orders");
})();

// Register Azure Function HTTP triggers by requiring their modules so they execute on load
require("./functions/users");
require("./functions/shops");
require("./functions/items");
require("./functions/orders");
