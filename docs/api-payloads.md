# Reference Payloads for Local API Testing

Use these JSON snippets to exercise the HTTP endpoints exposed by the local Azure Functions host (`http://localhost:7071/api`). Replace any `*-uuid` placeholders with real IDs returned from previous calls.

## Shops

### Create a Shop — `POST /shops`
```json
{
  "name": "Downtown Beans",
  "address": "123 Market St",
  "ownerUserId": "user-abc123",
  "isActive": true,
  "status": "open",
  "acceptingOrders": true,
  "paymentPolicy": "pay_on_pickup",
  "orderAcceptanceMode": "manual",
  "allowGuestCheckout": true,
  "fulfillmentOptions": {
    "pickupEnabled": true,
    "deliveryEnabled": false,
    "deliveryRadiusKm": 5,
    "deliveryFee": 3
}
```

### Update Shop Settings — `PATCH /shops/{shopId}`
```json
{
  "status": "open",
  "acceptingOrders": false,
  "paymentPolicy": "pay_on_pickup",
  "orderAcceptanceMode": "manual",
  "allowGuestCheckout": true,
  "fulfillmentOptions": {
    "deliveryEnabled": true,
    "deliveryRadiusKm": 8
  },
  "isActive": true
}
```

### Upsert Shop Hours — `PUT /shops/{shopId}/hours`
```json
{
  "timezone": "America/New_York",
  "weekly": {
    "monday": [{ "open": "08:00", "close": "16:00" }],
    "tuesday": [{ "open": "08:00", "close": "16:00" }],
    "friday": [
      { "open": "09:00", "close": "12:00" },
      { "open": "13:00", "close": "18:00" }
    ]
  }
}
```

## Categories

### Create Category — `POST /shops/{shopId}/categories`
```json
{
  "name": "Breakfast",
  "description": "Morning favorites",
  "sortOrder": 1,
  "isActive": true
}
```

### Update Category — `PATCH /shops/{shopId}/categories/{categoryId}`
```json
{
  "description": "Morning + brunch",
  "sortOrder": 2,
  "isActive": true
}
```

## Products

### Create Product — `POST /products`
```json
{
  "ownerUserId": "user-abc123",
  "name": "Latte",
  "description": "Espresso with steamed milk",
  "isActive": true,
  "variantSchemes": [
    {
      "id": "size",
      "name": "Size",
      "variants": [
        { "id": "small", "label": "Small", "basePrice": 4.25, "isActive": true },
        { "id": "large", "label": "Large", "basePrice": 5.25, "isActive": true }
      ]
    }
  ],
  "addonGroups": [
    {
      "id": "milk",
      "name": "Milk Options",
      "required": false,
      "options": [
        { "id": "almond", "name": "Almond Milk", "priceDelta": 0.5, "isActive": true },
        { "id": "oat", "name": "Oat Milk", "priceDelta": 0.75, "isActive": true }
      ]
    }
  ]
}
```

### Update Product — `PATCH /products/{productId}`
```json
{
  "description": "House-roasted espresso with steamed milk",
  "addonGroups": [
    {
      "id": "milk",
      "name": "Milk Options",
      "required": false,
      "options": [
        { "id": "almond", "name": "Almond Milk", "priceDelta": 0.5, "isActive": true }
      ]
    }
  ],
  "isActive": true
}
```

### Create Product Listing in Shop — `POST /shops/{shopId}/products`
```json
{
  "productId": "product-uuid",
  "priceOverride": 4.95,
  "isAvailable": true,
  "categories": ["Lunch"],
  "sortOrder": 10
}
```

### Update Product Listing — `PATCH /shops/{shopId}/products/{productInShopId}`
```json
{
  "priceOverride": 5.25,
  "isAvailable": true,
  "categories": ["Lunch", "Seasonal"],
  "sortOrder": 5
}
```

## Orders

### Create Order — `POST /shops/{shopId}/orders`
```json
{
  "userId": "customer-xyz789",
  "customerName": "Jane Doe",
  "customerPhone": "555-0100",
  "customerNotes": "Extra hot please",
  "items": [
    {
      "productId": "product-uuid",
      "productVariantId": "large",
      "quantity": 2,
      "addonOptionIds": ["almond"]
    }
  ]
}
```

### Update Order Status — `PATCH /shops/{shopId}/orders/{orderId}/status`
```json
{
  "nextStatus": "accepted"
}
```

## Shop Members

### Create Member — `POST /shops/{shopId}/members`
```json
{
  "userId": "staff-xyz789",
  "role": "staff",
  "permissions": ["manage_orders", "manage_products"],
  "isActive": true
}
```

### Update Member — `PATCH /shops/{shopId}/members/{memberId}`
```json
{
  "role": "admin",
  "permissions": ["manage_orders"],
  "isActive": true
}
```

## Users

### Create User — `POST /users`
```json
{
  "id": "user-xyz789"
}
```
