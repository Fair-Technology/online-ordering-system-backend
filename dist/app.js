"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cosmosClient_1 = require("./config/cosmosClient");
(async () => {
    // Ensure necessary containers exist at startup
    await (0, cosmosClient_1.ensureContainerExists)("users");
    await (0, cosmosClient_1.ensureContainerExists)("shops");
    await (0, cosmosClient_1.ensureContainerExists)("items");
    await (0, cosmosClient_1.ensureContainerExists)("orders");
})();
// Register Azure Function HTTP triggers by requiring their modules so they execute on load
require("./functions/users");
require("./functions/shops");
require("./functions/items");
require("./functions/orders");
