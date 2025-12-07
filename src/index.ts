import { ensureContainerExists } from './infrastructure/cosmosClient';

const requiredContainers = [
  'users',
  'shops',
  'shopMembers',
  'shopHours',
  'categories',
  'products',
  'shopProducts',
  'orders',
  'auditLogs',
];

(async () => {
  // Ensure necessary containers exist at startup
  await Promise.all(requiredContainers.map((id) => ensureContainerExists(id)));
})();

// Register Azure Function HTTP triggers by requiring their modules so they execute on load
require('./functions/auditLogs');
require('./functions/categories');
require('./functions/orders');
require('./functions/products');
require('./functions/shopHours');
require('./functions/shopMembers');
require('./functions/shops');
require('./functions/users');
