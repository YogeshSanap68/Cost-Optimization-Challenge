@description('Name of the Storage Account')
param storageAccountName string = 'billingstore${uniqueString(resourceGroup().id)}'

@description('Name of the Function App')
param functionAppName string = 'billing-archiver-fn'

@description('Location for all resources')
param location string = resourceGroup().location

@description('SKU for Storage Account')
param storageSku string = 'Standard_LRS'

@description('Runtime stack for Function App')
param functionRuntime string = 'node'

@description('App Service Plan name')
param hostingPlanName string = 'billing-archiver-plan'

resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: storageSku
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
  }
}

resource blobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  name: '${storageAccount.name}/default/billing-archive'
  properties: {
    publicAccess: 'None'
  }
}

resource hostingPlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: hostingPlanName
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  kind: 'functionapp'
  properties: {
    reserved: false
  }
}

resource functionApp 'Microsoft.Web/sites@2022-03-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: hostingPlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: storageAccount.properties.primaryEndpoints.blob
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: functionRuntime
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18'
        }
        {
          name: 'BLOB_CONN_STRING'
          value: storageAccount.listKeys().keys[0].value
        }
        // Cosmos DB connection string to be set manually or via Key Vault
        {
          name: 'COSMOS_CONN_STRING'
          value: '<replace-with-connection-string>'
        }
      ]
    }
    httpsOnly: true
  }
  dependsOn: [
    hostingPlan
    storageAccount
  ]
}
