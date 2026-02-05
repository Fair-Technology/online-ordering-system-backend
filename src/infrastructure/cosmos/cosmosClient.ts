import { CosmosClient, Database, Container } from '@azure/cosmos';

// Get environment variables with defaults for development
const endpoint = process.env.COSMOS_ENDPOINT || 'https://localhost:8081';
const key =
  process.env.COSMOS_KEY ||
  'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==';
const databaseId = process.env.COSMOS_DB_ID || 'test-db';
const shopContainerId = process.env.COSMOS_SHOP_CONTAINER || 'shops';

export const cosmosClient = new CosmosClient({ endpoint, key });
export const database: Database = cosmosClient.database(databaseId);
export const shopContainer: Container = database.container(shopContainerId);
