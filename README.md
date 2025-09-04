# Restaurant Ordering System Backend - Azure Function App

This is an Azure Function App that provides a simple HTTP API endpoint.

## Prerequisites

- Node.js (version 18 or later)
- Azure Functions Core Tools
- Azure CLI (for deployment)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Azure Functions Core Tools globally (if not already installed):
```bash
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

## Running Locally

To run the function locally:

```bash
npm start
```

or

```bash
func start
```

The function will be available at: `http://localhost:7071/api/hello`

## API Endpoints

### GET/POST /api/hello

Returns a simple greeting message.

**Response:**
```
hello manish and aslam
```

**Example:**
```bash
curl http://localhost:7071/api/hello
```

## Deployment to Azure

1. Login to Azure:
```bash
az login
```

2. Create a resource group (if needed):
```bash
az group create --name myResourceGroup --location eastus
```

3. Create a storage account:
```bash
az storage account create --name mystorageaccount --location eastus --resource-group myResourceGroup --sku Standard_LRS
```

4. Create a function app:
```bash
az functionapp create --resource-group myResourceGroup --consumption-plan-location eastus --runtime node --runtime-version 18 --functions-version 4 --name myFunctionApp --storage-account mystorageaccount
```

5. Deploy the function:
```bash
func azure functionapp publish myFunctionApp
```

## Project Structure

```
├── src/
│   └── functions/
│       └── hello.js          # Main HTTP trigger function
├── host.json                 # Function app configuration
├── local.settings.json       # Local development settings
├── package.json              # Node.js dependencies
└── README.md                 # This file
```
