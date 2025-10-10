"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = exports.client = void 0;
exports.ensureContainerExists = ensureContainerExists;
exports.getContainer = getContainer;
const cosmos_1 = require("@azure/cosmos");
const endpoint = process.env.COSMOS_DB_ENDPOINT || "";
const key = process.env.COSMOS_DB_KEY || "";
const databaseId = process.env.COSMOS_DB_DATABASE_ID || "";
exports.client = new cosmos_1.CosmosClient({ endpoint, key });
exports.database = exports.client.database(databaseId);
async function ensureContainerExists(containerId) {
    try {
        await exports.database.containers.createIfNotExists({
            id: containerId,
            // cast to any to avoid strict SDK type mismatch in this minimal helper
            partitionKey: { kind: "Hash", paths: ["/id"] },
        });
    }
    catch (error) {
        console.error("Error creating container:", error);
    }
    return exports.database.container(containerId);
}
function getContainer(containerId) {
    return exports.database.container(containerId);
}
