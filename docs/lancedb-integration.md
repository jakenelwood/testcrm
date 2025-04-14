# LanceDB Integration Guide

This guide covers how to integrate LanceDB into the Quote Request Generator application for data storage with potential for AI capabilities in the future.

## Overview

LanceDB is a vector database designed for AI applications. For the Quote Request Generator, it will initially serve as our primary data store, with the ability to later leverage its vector search capabilities as we add AI features.

## Setup and Configuration

### 1. Docker Setup

The LanceDB service is defined in the docker-compose.yml file:

```yaml
# LanceDB service
lancedb:
  image: lancedb/lancedb:latest
  container_name: quote-request-lancedb
  restart: unless-stopped
  volumes:
    - lancedb-data:/data
  ports:
    - "8001:8000"
  environment:
    - LANCEDB_PORT=8000

volumes:
  lancedb-data: # Volume for LanceDB data
```

This configuration:
- Uses the official LanceDB image
- Maps port 8001 on the host to port 8000 in the container
- Creates a persistent volume for data storage

### 2. Installing the LanceDB Client

Install the LanceDB client in your Node.js backend:

```bash
npm install lancedb
```

For Python backend:

```bash
pip install lancedb
```

## Database Schema and Tables

For the Quote Request Generator, we'll need the following tables in LanceDB:

### 1. Clients Table
Stores client information for reuse across quote requests.

```javascript
// Node.js Example
const clientsTable = await db.createTable("clients", [
  {
    id: "client1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "555-123-4567",
    address: "123 Main St, Anytown, MN 55123",
    created_at: new Date().toISOString()
  }
]);
```

### 2. QuoteRequests Table
Stores the quote request data and metadata.

```javascript
// Node.js Example
const quoteRequestsTable = await db.createTable("quote_requests", [
  {
    id: "qr1",
    client_id: "client1",
    type: "auto", // "auto", "home", "specialty"
    status: "completed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    data: {
      // Form data matching placeholder structure
      pniname: "John Doe",
      pniaddr: "123 Main St, Anytown, MN 55123",
      // ... other form fields
    }
  }
]);
```

### 3. Documents Table
Stores generated document metadata.

```javascript
// Node.js Example
const documentsTable = await db.createTable("documents", [
  {
    id: "doc1",
    quote_request_id: "qr1",
    filename: "auto-request-2023-04-12.docx",
    file_path: "/app/documents/auto-request-2023-04-12.docx",
    created_at: new Date().toISOString(),
    file_type: "docx", // "docx" or "pdf"
    file_size: 1024 // size in bytes
  }
]);
```

## API Integration

### 1. Database Connection

Create a database service to manage the LanceDB connection:

```javascript
// services/database.js
const { connect } = require("lancedb");

class DatabaseService {
  constructor() {
    this.connection = null;
    this.db = null;
    this.connected = false;
  }

  async connect() {
    try {
      // Connect to LanceDB
      this.connection = await connect("http://lancedb:8000");
      this.db = this.connection;
      this.connected = true;
      console.log("Connected to LanceDB successfully");
      return this.db;
    } catch (error) {
      console.error("Error connecting to LanceDB:", error);
      throw error;
    }
  }

  async getTable(tableName) {
    if (!this.connected) {
      await this.connect();
    }
    
    try {
      return await this.db.openTable(tableName);
    } catch (error) {
      if (error.message.includes("does not exist")) {
        // Create table if it doesn't exist
        return await this.db.createTable(tableName, []);
      }
      throw error;
    }
  }
}

module.exports = new DatabaseService();
```

### 2. CRUD Operations

Create repositories for each entity to handle database operations:

```javascript
// repositories/clientRepository.js
const db = require('../services/database');

class ClientRepository {
  async getTable() {
    return await db.getTable('clients');
  }

  async findAll() {
    const table = await this.getTable();
    const result = await table.search().limit(1000).execute();
    return result.data;
  }

  async findById(id) {
    const table = await this.getTable();
    const result = await table.search().filter(`id = '${id}'`).execute();
    return result.data.length > 0 ? result.data[0] : null;
  }

  async create(client) {
    const table = await this.getTable();
    const newClient = {
      ...client,
      id: generateId(), // Implement ID generation function
      created_at: new Date().toISOString()
    };
    await table.add([newClient]);
    return newClient;
  }

  async update(id, clientData) {
    const table = await this.getTable();
    const existingClient = await this.findById(id);
    
    if (!existingClient) {
      throw new Error('Client not found');
    }
    
    const updatedClient = {
      ...existingClient,
      ...clientData,
      updated_at: new Date().toISOString()
    };
    
    // LanceDB doesn't have direct update methods, so we need to
    // perform a filter-and-replace operation
    await table.delete().filter(`id = '${id}'`).execute();
    await table.add([updatedClient]);
    
    return updatedClient;
  }

  async delete(id) {
    const table = await this.getTable();
    await table.delete().filter(`id = '${id}'`).execute();
    return { success: true };
  }
}

module.exports = new ClientRepository();
```

Create similar repositories for quote requests and documents.

### 3. API Endpoints

Set up RESTful API endpoints for each entity:

```javascript
// routes/clients.js
const express = require('express');
const router = express.Router();
const clientRepository = require('../repositories/clientRepository');

// Get all clients
router.get('/api/clients', async (req, res) => {
  try {
    const clients = await clientRepository.findAll();
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get client by ID
router.get('/api/clients/:id', async (req, res) => {
  try {
    const client = await clientRepository.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create client
router.post('/api/clients', async (req, res) => {
  try {
    const newClient = await clientRepository.create(req.body);
    res.status(201).json(newClient);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update client
router.put('/api/clients/:id', async (req, res) => {
  try {
    const updatedClient = await clientRepository.update(req.params.id, req.body);
    res.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete client
router.delete('/api/clients/:id', async (req, res) => {
  try {
    await clientRepository.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

Set up similar routes for quote requests and documents.

## Frontend Integration

Add API service classes to the frontend to interact with the LanceDB API:

```typescript
// services/clientService.ts
import { API_BASE_URL } from '../lib/api-config';

interface Client {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at?: string;
  updated_at?: string;
}

export const getClients = async (): Promise<Client[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clients`);
    if (!response.ok) {
      throw new Error('Failed to fetch clients');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

export const getClientById = async (id: string): Promise<Client> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clients/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch client');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching client ${id}:`, error);
    throw error;
  }
};

export const createClient = async (client: Client): Promise<Client> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(client),
    });
    if (!response.ok) {
      throw new Error('Failed to create client');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};

export const updateClient = async (id: string, client: Partial<Client>): Promise<Client> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(client),
    });
    if (!response.ok) {
      throw new Error('Failed to update client');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error updating client ${id}:`, error);
    throw error;
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete client');
    }
  } catch (error) {
    console.error(`Error deleting client ${id}:`, error);
    throw error;
  }
};
```

Create similar service classes for quote requests and documents.

## Future AI Capabilities

LanceDB's vector search capabilities can be leveraged for future AI features:

### 1. Smart Form Pre-filling

```javascript
// Example of using vector search for similar quote requests
async function findSimilarQuoteRequests(clientData) {
  const table = await db.getTable('quote_requests');
  
  // Convert client data to vector representation
  const clientVector = await generateClientVector(clientData);
  
  // Search for similar quote requests
  const result = await table.search(clientVector)
    .limit(5)
    .execute();
    
  return result.data;
}
```

### 2. Document Analysis

```javascript
// Example of analyzing document content
async function analyzeDocument(documentText) {
  const table = await db.getTable('document_analysis');
  
  // Convert document to vector representation
  const docVector = await generateDocumentVector(documentText);
  
  // Store document analysis
  await table.add([{
    id: generateId(),
    document_text: documentText,
    vector: docVector,
    created_at: new Date().toISOString()
  }]);
  
  // Find similar documents
  const result = await table.search(docVector)
    .limit(5)
    .execute();
    
  return result.data;
}
```

## Testing LanceDB Integration

Create a test script to verify LanceDB integration:

```javascript
// test-lancedb.js
const db = require('./services/database');

async function testLanceDB() {
  try {
    // Connect to LanceDB
    await db.connect();
    console.log('Connected to LanceDB successfully');
    
    // Create test client
    const clientsTable = await db.getTable('clients');
    const testClient = {
      id: 'test-client-' + Date.now(),
      name: 'Test Client',
      email: 'test@example.com',
      phone: '555-123-4567',
      address: '123 Test St, Testville, MN 55123',
      created_at: new Date().toISOString()
    };
    
    await clientsTable.add([testClient]);
    console.log('Test client created:', testClient);
    
    // Verify client was added
    const result = await clientsTable.search().filter(`id = '${testClient.id}'`).execute();
    console.log('Retrieved client:', result.data[0]);
    
    // Clean up
    await clientsTable.delete().filter(`id = '${testClient.id}'`).execute();
    console.log('Test client deleted');
    
    console.log('LanceDB test completed successfully');
  } catch (error) {
    console.error('LanceDB test error:', error);
  }
}

testLanceDB();
```

## Best Practices for LanceDB

1. **Connection Management**: Open a single connection to LanceDB and reuse it across requests.

2. **Error Handling**: Implement robust error handling for database operations with proper logging.

3. **Index Design**: For larger datasets, use appropriate indexing strategies to improve query performance.

4. **Backup Strategy**: Implement regular backups of the LanceDB volume to prevent data loss.

5. **Monitoring**: Set up monitoring for database performance and storage usage.

## Troubleshooting

### Common Issues and Solutions

1. **Connection Refused**:
   - Ensure the LanceDB container is running: `docker ps | grep lancedb`
   - Check the container logs: `docker logs quote-request-lancedb`
   - Verify the port mapping in docker-compose.yml

2. **Permission Errors**:
   - Check the volume permissions: `docker exec -it quote-request-lancedb ls -la /data`
   - Fix permission issues: `docker exec -it quote-request-lancedb chown -R 1000:1000 /data`

3. **Query Performance**:
   - For slow queries, check table size: `await table.countRows()`
   - Consider using more specific filters in your queries
   - Implement pagination for large result sets 