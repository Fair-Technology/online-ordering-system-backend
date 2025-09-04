const { app } = require('@azure/functions');

app.http('hello', {
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
            body: 'hello manish and aslam'
        };
    }
});
