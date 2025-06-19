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

    const cosmosContainer = cosmos.database(DATABASE_ID).container(CONTAINER_ID);
    const blobContainerClient = blobService.getContainerClient(BLOB_CONTAINER);
    await blobContainerClient.createIfNotExists();

    const query = {
        query: "SELECT * FROM c WHERE c.timestamp < @cutoff",
        parameters: [{ name: "@cutoff", value: cutoffDate.toISOString() }]
    };

    const { resources: oldRecords } = await cosmosContainer.items.query(query).fetchAll();

    context.log(`Found ${oldRecords.length} records older than 3 months`);

    for (const record of oldRecords) {
        try {
            const date = new Date(record.timestamp);
            const path = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${record.id}.json`;

            const blobClient = blobContainerClient.getBlockBlobClient(path);
            const data = JSON.stringify(record);
            await blobClient.upload(data, Buffer.byteLength(data));

            // Verify upload (optional)
            const exists = await blobClient.exists();
            if (exists) {
                await cosmosContainer.item(record.id, record.id).delete();
                context.log(`Archived & deleted: ${record.id}`);
            } else {
                context.log.warn(`Upload failed for: ${record.id}`);
            }

        } catch (error) {
            context.log.error(`Error processing record ${record.id}:`, error);
        }
    }
};
