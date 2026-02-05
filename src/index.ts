// Entry point for Azure Functions v4
// This file imports all function definitions to register them with the runtime

// Shop endpoints
import './functions/shop/getShop/index';
import './functions/shop/getShopBySlug/index';
import './functions/shop/createShop/index';
import './functions/shop/updateShop/index';
import './functions/shop/deleteShop/index';

// Product endpoints
import './functions/product/getProductsByShop/index';
import './functions/product/getProduct/index';
import './functions/product/createProduct/index';
import './functions/product/updateProduct/index';
import './functions/product/deleteProduct/index';

// Swagger endpoints
import './functions/swagger/swaggerJson/index';
import './functions/swagger/swaggerUi/index';
