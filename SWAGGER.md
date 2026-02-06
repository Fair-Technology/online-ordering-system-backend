# Swagger API Documentation

This project includes comprehensive Swagger/OpenAPI documentation for all CRUD endpoints.

## Accessing Swagger Documentation

### Swagger UI (Interactive Documentation)
- **URL**: `http://localhost:7071/api/swagger`
- **Description**: Interactive web interface to explore and test all API endpoints
- **Features**:
  - Browse all available endpoints
  - View request/response schemas
  - Test endpoints directly from the browser
  - See example requests and responses

### Swagger JSON Specification
- **URL**: `http://localhost:7071/api/swagger.json`
- **Description**: Raw OpenAPI 3.0 specification in JSON format
- **Use Cases**:
  - Import into API testing tools (Postman, Insomnia)
  - Generate client SDKs
  - API documentation tools

## Available API Endpoints

### Shop CRUD Operations
- `GET /api/shops/{shopId}` - Get shop by ID
- `POST /api/shops` - Create new shop
- `PATCH /api/shops/{shopId}` - Update shop
- `DELETE /api/shops/{shopId}` - Delete shop (soft delete)

### Product CRUD Operations
- `GET /api/products?shopId={shopId}` - Get all products for a shop
- `GET /api/products/{productId}?shopId={shopId}` - Get single product
- `POST /api/products` - Create new product
- `PATCH /api/products/{productId}` - Update product
- `DELETE /api/products/{productId}?shopId={shopId}` - Delete product (soft delete)

## Features

✅ **Complete API Coverage**: All CRUD endpoints documented
✅ **Request/Response Schemas**: Detailed data models for all operations
✅ **Parameter Documentation**: Path parameters, query parameters, and request bodies
✅ **Error Response Documentation**: Standard error responses (400, 404, 500)
✅ **Interactive Testing**: Try out endpoints directly from Swagger UI
✅ **CORS Enabled**: Cross-origin requests supported for development

## Development

The Swagger documentation is automatically updated when you modify the API endpoints. The specification is defined in:
- `src/swagger/swaggerSpec.ts` - OpenAPI specification
- `src/functions/swagger/swaggerJson/index.ts` - JSON endpoint
- `src/functions/swagger/swaggerUi/index.ts` - UI endpoint

## Usage Examples

### Testing with Swagger UI
1. Open `http://localhost:7071/api/swagger` in your browser
2. Expand any endpoint section
3. Click "Try it out"
4. Fill in the required parameters
5. Click "Execute" to test the endpoint

### Importing into Postman
1. Open Postman
2. Click "Import"
3. Enter URL: `http://localhost:7071/api/swagger.json`
4. All endpoints will be imported as a collection
