const { CosmosClient } = require("@azure/cosmos");
const { BlobServiceClient } = require("@azure/storage-blob");
const generateBlobPath = require("../utils/generateBlobPath"); // helper for blob path

// Environment variables should be configured in Azure App Settings
const cosmos = new CosmosClient(process.env.COSMOS_CONN_STRING);
const blobService = BlobServiceClient.fromConnectionString(process.env.BLOB_CONN_STRING);

const DATABASE_ID = "BillingDB";
const CONTAINER_ID = "Billing";
const BLOB_CONTAINER = "billing-archive";

module.exports = async function (context, myTimer) {
  const timestamp = new Date();
  context.log(`Archive Function ran at: ${timestamp.toISOString()}`);

  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 3);

  const container = cosmos.database(DATABASE_ID).container(CONTAINER_ID);
  const blobContainer = blobService.getContainerClient(BLOB_CONTAINER);
  await blobContainer.createIfNotExists();

  const query = {
    query: "SELECT * FROM c WHERE c.timestamp < @cutoff",
    parameters: [{ name: "@cutoff", value: cutoffDate.toISOString() }]
  };

  const { resources: oldRecords } = await container.items.query(query).fetchAll();
  context.log(`Found ${oldRecords.length} records older than ${cutoffDate.toISOString()}`);

  for (const record of oldRecords) {
    try {
      const blobPath = generateBlobPath(record);
      const blockBlob = blobContainer.getBlockBlobClient(blobPath);
      const data = JSON.stringify(record);

      await blockBlob.upload(data, Buffer.byteLength(data), {
        blobHTTPHeaders: { blobContentType: "application/json" }
      });

      await container.item(record.id, record.id).delete();
      context.log(`Archived and deleted record ID: ${record.id}`);
    } catch (err) {
      context.log.error(`Error processing record ID: ${record.id}`, err.message);
    }
  }

  context.log("Archival complete ✅");
};
