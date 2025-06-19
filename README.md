# 🔄 Azure Billing Records Archival – Serverless Hot-Cold Storage Solution

## 📘 Overview

This solution provides a cost-optimized, serverless architecture to store and retrieve billing records in Azure using **Cosmos DB for hot data** and **Azure Blob Storage for archived (cold) data**.  
It uses **Azure Functions** to automate data archival while ensuring **API compatibility**, **zero downtime**, and **easy scalability**.

---

## 📌 Use Case

- Your application stores billing records in **Azure Cosmos DB**
- Older records (e.g., >3 months) are **rarely accessed**
- Cosmos DB cost is rising due to growing data volume
- You want to **reduce cost** by moving cold data to **Blob Storage**, while keeping APIs unchanged

---

## 🏗️ Architecture

```plaintext
            +---------------------+
            |  Client/API Layer   |
            +---------------------+
                      |
                +-------------+
                | Read Logic  | <---------+
                +-------------+           |
                 |          |             |
     +-----------+     +----+-------------+
     |                         |
+------------+       +------------------+
| Cosmos DB  |       | Azure Blob       |
| (Hot Data) |       | Storage (Cold)   |
+------------+       +------------------+
     ^                         ^
     |                         |
     |     +-------------------------------------+
     |     |  Azure Function (Scheduled Archival)|
     |     +-------------------------------------+

How It Works
Step	Description
1️⃣	All billing records are initially written to Cosmos DB.
2️⃣	A timer-triggered Azure Function runs daily.
3️⃣	It moves records older than 3 months to Blob Storage in JSON format.
4️⃣	Once the record is safely archived, it's deleted from Cosmos DB.
5️⃣	Read requests first check Cosmos DB, then fallback to Blob if not found.
 Key Benefits
✅ Cost reduction via cold storage

✅ No API changes — seamless integration

✅ Highly durable and scalable

✅ Easy to deploy and maintain

✅ Zero downtime migration
Blob Naming Convention--billing-archive/YYYY/MM/<billingId>.json


Technologies Used
Azure Cosmos DB (NoSQL API)

Azure Blob Storage

Azure Functions (Timer Trigger)

Blob Lifecycle Management

Terraform / Bicep (for Infra-as-Code)

GitHub Actions (optional for CI/CD)


Repository Structure
📦 root
 ┣ 📁 function-app/             # Azure Function source code
 ┣ 📁 infra/
 ┃ ┣ 📄 main.bicep              # Bicep script for Function + Storage
 ┃ ┗ 📄 lifecycle.json          # Blob storage lifecycle policy
 ┣ 📁 docs/
 ┃ ┗ 📄 architecture.png        # Architecture diagram
 ┗ 📄 README.md

Deployment

 Deploy Infrastructure
az deployment group create \
  --resource-group <your-rg> \
  --template-file infra/main.bicep \
  --parameters storageAccountName=mybillingstore functionAppName=billing-archiver

Deploy Function Code
func azure functionapp publish <function-app-name> --python




