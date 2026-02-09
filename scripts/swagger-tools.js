#!/usr/bin/env node

/**
 * Advanced Swagger tools for generating, validating, and managing OpenAPI specifications
 */

const fs = require('fs');
const path = require('path');

// Command line argument parsing
const command = process.argv[2];

// Import the compiled swagger spec
function loadSwaggerSpec() {
  try {
    const { swaggerSpec } = require('../dist/swagger/swaggerSpec');
    return swaggerSpec;
  } catch (error) {
    console.error(
      '❌ Error loading swagger specification. Make sure to run "npm run build" first.',
    );
    console.error('   Error:', error.message);
    process.exit(1);
  }
}

// Generate swagger.json file
function generateSwaggerFile() {
  const swaggerSpec = loadSwaggerSpec();

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
    console.log(
      `📋 Schemas: ${Object.keys(swaggerSpec.components.schemas).length}`,
    );
    return outputFile;
  } catch (error) {
    console.error('❌ Error generating swagger specification:', error.message);
    process.exit(1);
  }
}

// Validate swagger specification
function validateSwaggerSpec() {
  const swaggerSpec = loadSwaggerSpec();

  console.log('🔍 Validating OpenAPI specification...');

  let isValid = true;
  const issues = [];

  // Basic validation checks
  if (!swaggerSpec.openapi) {
    issues.push('Missing openapi version');
    isValid = false;
  }

  if (
    !swaggerSpec.info ||
    !swaggerSpec.info.title ||
    !swaggerSpec.info.version
  ) {
    issues.push('Missing or incomplete info section');
    isValid = false;
  }

  if (!swaggerSpec.paths || Object.keys(swaggerSpec.paths).length === 0) {
    issues.push('No paths defined');
    isValid = false;
  }

  // Check for missing schema references
  const paths = swaggerSpec.paths;
  const schemas = swaggerSpec.components?.schemas || {};

  for (const [pathName, pathObj] of Object.entries(paths)) {
    for (const [method, methodObj] of Object.entries(pathObj)) {
      // Check request body schemas
      const requestBodySchema =
        methodObj.requestBody?.content?.['application/json']?.schema?.$ref;
      if (requestBodySchema) {
        const schemaName = requestBodySchema.replace(
          '#/components/schemas/',
          '',
        );
        if (!schemas[schemaName]) {
          issues.push(
            `Missing schema: ${schemaName} (referenced in ${method.toUpperCase()} ${pathName})`,
          );
          isValid = false;
        }
      }

      // Check response schemas
      if (methodObj.responses) {
        for (const [statusCode, response] of Object.entries(
          methodObj.responses,
        )) {
          const responseSchema =
            response.content?.['application/json']?.schema?.$ref;
          if (responseSchema) {
            const schemaName = responseSchema.replace(
              '#/components/schemas/',
              '',
            );
            if (!schemas[schemaName]) {
              issues.push(
                `Missing schema: ${schemaName} (referenced in ${method.toUpperCase()} ${pathName} response ${statusCode})`,
              );
              isValid = false;
            }
          }
        }
      }
    }
  }

  if (isValid) {
    console.log('✅ OpenAPI specification is valid!');
    console.log(`📊 Summary:`);
    console.log(`   - OpenAPI version: ${swaggerSpec.openapi}`);
    console.log(`   - API title: ${swaggerSpec.info.title}`);
    console.log(`   - API version: ${swaggerSpec.info.version}`);
    console.log(`   - Endpoints: ${Object.keys(swaggerSpec.paths).length}`);
    console.log(`   - Schemas: ${Object.keys(schemas).length}`);
  } else {
    console.log('❌ OpenAPI specification has issues:');
    issues.forEach((issue) => console.log(`   - ${issue}`));
    process.exit(1);
  }
}

// Show help
function showHelp() {
  console.log('Swagger Tools - OpenAPI Specification Management');
  console.log('');
  console.log('Usage: node scripts/swagger-tools.js <command>');
  console.log('');
  console.log('Commands:');
  console.log('  generate    Generate swagger.json file from TypeScript spec');
  console.log('  validate    Validate the OpenAPI specification');
  console.log('  help        Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/swagger-tools.js validate');
}

// Main execution
switch (command) {
  case 'generate':
    generateSwaggerFile();
    break;
  case 'validate':
    validateSwaggerSpec();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    if (!command) {
      // Default to generate if no command specified
      generateSwaggerFile();
    } else {
      console.error(`❌ Unknown command: ${command}`);
      showHelp();
      process.exit(1);
    }
}
