
const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

app.http('getHello', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    route: 'hello',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        return {
            status: 200,
            headers: {
                'Content-Type': 'text/plain'
            },
            body: 'hello manish and aslam - edited'
        };
    }
});

app.http('getInfo', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'info',
    handler: async (request, context) => {
        try {
            // Access environment variables set in Azure Function App Configuration
            const endpoint = process.env.COSMOS_DB_ENDPOINT;
            const key = process.env.COSMOS_DB_KEY;
            const databaseId = process.env.COSMOS_DB_DATABASE_ID;
            const containerId = process.env.COSMOS_DB_CONTAINER_ID;

            // Create Cosmos DB client
            const client = new CosmosClient({ endpoint, key });
            const database = client.database(databaseId);
            const container = database.container(containerId);

            // Query items from Cosmos DB
            const { resources: items } = await container.items.readAll().fetchAll();

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: containerId
            };
        } catch (error) {
            context.log.error('Error querying Cosmos DB:', error);
            return {
                status: 500,
                body: 'Internal Server Error'
            };
        }
    }
});
