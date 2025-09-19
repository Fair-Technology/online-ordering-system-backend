// Register HTTP triggers by importing their modules

const { ensureContainerExists } = require("./functions/shared/cosmosClient");

(async () => {
  // Ensure necessary containers exist at startup
  //await ensureContainerExists("shop");
  await ensureContainerExists("items");
})();

// Customer APIs
require("./functions/customerApis/getHello");

// Super Admin APIs
require("./functions/superAdminApis/getInfo");
require("./functions/superAdminApis/shops");

// Items APIs (shared between restaurant owners and customers)
require("./functions/sharedApis/items");
