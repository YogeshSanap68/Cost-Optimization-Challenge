// Azure Function code placeholder
const { CosmosClient } = require("@azure/cosmos");
const { BlobServiceClient } = require("@azure/storage-blob");

const cosmos = new CosmosClient(process.env.COSMOS_CONN_STRING);
const blobService = BlobServiceClient.fromConnectionString(process.env.BLOB_CONN_STRING);

const DATABASE_ID = "BillingDB";
const CONTAINER_ID = "Billing";
const BLOB_CONTAINER = "billing-archive";

module.exports = async function (context, myTimer) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 3);

  const container = cosmos.database(DATABASE_ID).container(CONTAINER_ID);
  const blobContainer = blobService.getContainerClient(BLOB_CONTAINER);
  await blobContainer.createIfNotExists();

  const query = {
    query: "SELECT * FROM c WHERE c.timestamp < @cutoff",
    parameters: [{ name: "@cutoff", value: cutoffDate.toISOString() }],
  };

  const { resources: oldRecords } = await container.items.query(query).fetchAll();

  for (const record of oldRecords) {
    const date = new Date(record.timestamp);
    const path = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${record.id}.json`;
    const blobClient = blobContainer.getBlockBlobClient(path);
    const data = JSON.stringify(record);

    await blobClient.upload(data, Buffer.byteLength(data));
    await container.item(record.id, record.id).delete();
  }
};
