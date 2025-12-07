import { CosmosClient, Database, Container } from "@azure/cosmos";

const endpoint = process.env.COSMOS_DB_ENDPOINT || "";
const key = process.env.COSMOS_DB_KEY || "";
const databaseId = process.env.COSMOS_DB_DATABASE_ID || "";

export const client = new CosmosClient({ endpoint, key });
export const database: Database = client.database(databaseId);

export async function ensureContainerExists(containerId: string): Promise<Container> {
  try {
    await database.containers.createIfNotExists({
      id: containerId,
      // cast to any to avoid strict SDK type mismatch in this minimal helper
      partitionKey: { kind: "Hash", paths: ["/id"] } as any,
    } as any);
  } catch (error) {
    console.error("Error creating container:", error);
  }

  return database.container(containerId);
}

export function getContainer(containerId: string): Container {
  return database.container(containerId);
}
