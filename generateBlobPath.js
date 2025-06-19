/**
 * Generates a blob storage path for a billing record.
 * Naming convention: billing-archive/YYYY/MM/{billingId}.json
 * 
 * @param {Object} record - The billing record
 * @param {string} record.id - Unique billing ID
 * @param {string} record.timestamp - ISO 8601 timestamp (e.g. "2024-03-01T00:00:00Z")
 * @returns {string} - The generated blob path
 */
function generateBlobPath(record) {
  const date = new Date(record.timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `billing-archive/${year}/${month}/${record.id}.json`;
}

// 🔽 Sample usage (for test/debug)
if (require.main === module) {
  const sample = {
    id: "INV-123456",
    timestamp: "2024-03-01T00:00:00Z"
  };
  console.log(generateBlobPath(sample)); // billing-archive/2024/03/INV-123456.json
}

module.exports = generateBlobPath;
