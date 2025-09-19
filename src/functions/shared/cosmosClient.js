const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE_ID;

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);

//ensure container exists ONCE at startup
async function ensureContainerExists(containerId) {
  try {
    await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { kind: "Hash", paths: ["/id"] },
    });
  } catch (error) {
    console.error("Error creating container:", error);
  }

  return database.container(containerId);
}

/**
 * Get an existing container (no creation)
 */
function getContainer(containerId) {
  return database.container(containerId);
}

module.exports = { client, database, ensureContainerExists, getContainer };
