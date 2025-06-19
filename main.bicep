param location string = resourceGroup().location
param storageAccountName string
param functionAppName string

resource storage 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
  }
}

resource blobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2021-09-01' = {
  name: '${storage.name}/default/billing-archive'
  properties: {
    publicAccess: 'None'
  }
}

resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: 'function-app-plan'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    reserved: false
  }
}

resource functionApp 'Microsoft.Web/sites@2022-03-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: storage.properties.primaryEndpoints.blob
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        {
          name: 'BLOB_CONN_STRING'
          value: listKeys(storage.id, '2022-09-01').keys[0].value
        }
      ]
    }
  }
  dependsOn: [storage, appServicePlan]
}
