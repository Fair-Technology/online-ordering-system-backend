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
				body: { message: 'Shop created', shop: resource },
			};
		} catch (error) {
			context.log.error('Error creating shop:', error);
			return {
				status: 500,
				body: { message: 'Failed to create shop', error: error.message },
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
		// TODO: Fetch all shops from DB
		const shops = [];
		return {
			status: 200,
			body: shops,
		};
	},
});

// READ single shop
app.http('getShopById', {
	methods: ['GET'],
	authLevel: 'anonymous',
	route: 'superadmin/shops/{id}',
	handler: async (request, context) => {
		const { id } = request.params;
		// TODO: Fetch shop by id from DB
		const shop = null;
		if (!shop) {
			return { status: 404, body: { message: 'Shop not found' } };
		}
		return { status: 200, body: shop };
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
		// TODO: Update shop in DB
		return {
			status: 200,
			body: { message: `Shop ${id} updated`, updates },
		};
	},
});

// DELETE shop
app.http('deleteShop', {
	methods: ['DELETE'],
	authLevel: 'anonymous',
	route: 'superadmin/shops/{id}',
	handler: async (request, context) => {
		const { id } = request.params;
		// TODO: Delete shop from DB
		return {
			status: 204,
			body: null,
		};
	},
});
