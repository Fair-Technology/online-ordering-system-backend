const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE_ID;
const shopContainerId = 'shop';

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);


// CREATE shop
app.http('createShop', {
	methods: ['POST'],
	authLevel: 'anonymous',
	route: 'superadmin/shops',
	handler: async (request, context) => {
		try {
			// Ensure the 'shop' container exists
			const { container } = await database.containers.createIfNotExists({
				id: shopContainerId,
				partitionKey: { kind: 'Hash', paths: ['/id'] },
			});

			const shop = await request.json();

			const { resource } = await container.items.create(shop);

			return {
				status: 201,
				body: JSON.stringify({ message: 'Shop created', shop: resource }),
			};
		} catch (error) {
			context.log.error('Error creating shop:', error);
			return {
				status: 500,
				body: JSON.stringify({ message: 'Failed to create shop', error: error.message }),
			};
		}
	},
});

// READ all shops
app.http('getShops', {
	methods: ['GET'],
	authLevel: 'anonymous',
	route: 'superadmin/shops',
	handler: async (request, context) => {
		try {
			const container = database.container(shopContainerId);
			const querySpec = {
				query: 'SELECT * FROM c'
			};
			const { resources: shops } = await container.items.query(querySpec).fetchAll();
			return {
				status: 200,
				body: JSON.stringify(shops),
			};
		} catch (error) {
			context.log.error('Error fetching shops:', error);
			return {
				status: 500,
				body: JSON.stringify({ message: 'Failed to fetch shops', error: error.message }),
			};
		}
	},
});

// READ single shop
app.http('getShopById', {
	methods: ['GET'],
	authLevel: 'anonymous',
	route: 'superadmin/shops/{id}',
	handler: async (request, context) => {
		const { id } = request.params;
		try {
			const container = database.container(shopContainerId);
			const { resource: shop } = await container.item(id, id).read();
			if (!shop) {
				return { status: 404, body: JSON.stringify({ message: 'Shop not found' }) };
			}
			return { status: 200, body: JSON.stringify(shop) };
		} catch (error) {
			context.log.error('Error fetching shop by id:', error);
			return {
				status: 500,
				body: JSON.stringify({ message: 'Failed to fetch shop', error: error.message }),
			};
		}
	},
});

// UPDATE shop
app.http('updateShop', {
	methods: ['PUT'],
	authLevel: 'anonymous',
	route: 'superadmin/shops/{id}',
	handler: async (request, context) => {
		const { id } = request.params;
		const updates = await request.json();
		try {
			const container = database.container(shopContainerId);
			// Read the existing shop
			const { resource: existingShop } = await container.item(id, id).read();
			if (!existingShop) {
				return { status: 404, body: JSON.stringify({ message: 'Shop not found' }) };
			}
			// Merge updates
			const updatedShop = { ...existingShop, ...updates, id };
			const { resource } = await container.items.upsert(updatedShop);
			return {
				status: 200,
				body: JSON.stringify({ message: `Shop ${id} updated`, shop: resource }),
			};
		} catch (error) {
			context.log.error('Error updating shop:', error);
			return {
				status: 500,
				body: JSON.stringify({ message: 'Failed to update shop', error: error.message }),
			};
		}
	},
});

// DELETE shop
app.http('deleteShop', {
	methods: ['DELETE'],
	authLevel: 'anonymous',
	route: 'superadmin/shops/{id}',
	handler: async (request, context) => {
		const { id } = request.params;
		try {
			const container = database.container(shopContainerId);
			await container.item(id, id).delete();
			return {
				status: 204,
				body: null,
			};
		} catch (error) {
			context.log.error('Error deleting shop:', error);
			return {
				status: 500,
				body: JSON.stringify({ message: 'Failed to delete shop', error: error.message }),
			};
		}
	},
});
