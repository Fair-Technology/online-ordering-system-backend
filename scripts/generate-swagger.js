#!/usr/bin/env node

/**
 * Script to generate swagger.json file from the TypeScript swagger specification
 * This allows for static hosting of the swagger spec and easier integration with tools
 */

const fs = require('fs');
const path = require('path');

// Import the compiled swagger spec
const { swaggerSpec } = require('../dist/swagger/swaggerSpec');

// Output paths
const outputDir = path.join(__dirname, '../public');
const outputFile = path.join(outputDir, 'swagger.json');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write the swagger spec to JSON file
try {
  fs.writeFileSync(outputFile, JSON.stringify(swaggerSpec, null, 2));
  console.log('✅ Swagger specification generated successfully!');
  console.log(`📄 File: ${outputFile}`);
  console.log(`📊 Size: ${fs.statSync(outputFile).size} bytes`);
  console.log(`🔗 Endpoints: ${Object.keys(swaggerSpec.paths).length}`);
  console.log(`📋 Schemas: ${Object.keys(swaggerSpec.components.schemas).length}`);
} catch (error) {
  console.error('❌ Error generating swagger specification:', error.message);
  process.exit(1);
}
