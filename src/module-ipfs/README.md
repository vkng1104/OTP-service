# IPFS Module

This module provides functionality to interact with IPFS (InterPlanetary File System) using the Pinata service.

## Features

- Upload JSON data to IPFS
- Retrieve JSON data from IPFS using Content Identifiers (CIDs)

## API Endpoints

### Upload JSON to IPFS

```
POST api/ipfs/json
```

Uploads JSON data to IPFS and returns a Content Identifier (CID).

#### Request Body

Any valid JSON object.

Example:

```json
{
  "filename": "abc.json",
  "json": {
    "name": "John Doe",
    "age": 30,
    "isActive": true,
    "settings": {
        "theme": "dark",
        "notifications": true
    }
  }
}
```

#### Response

```json
{
  "cid": "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

### Get JSON from IPFS

```
GET api/ipfs/json/:cid
```

Retrieves JSON data from IPFS using the provided Content Identifier (CID).

#### URL Parameters

- `cid`: The Content Identifier for the JSON data

#### Response

```json
{
  "json": {
    "name": "John Doe",
    "age": 30,
    "isActive": true,
    "settings": {
      "theme": "dark",
      "notifications": true
    }
  },
  "url": "https://gateway.pinata.cloud/ipfs/QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

## Usage Examples

### Uploading JSON Data

```typescript
// Using fetch API
const response = await fetch("/ipfs/json", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "John Doe",
    age: 30,
    isActive: true,
  }),
});

const { cid } = await response.json();
console.log("Uploaded JSON with CID:", cid);
```

### Retrieving JSON Data

```typescript
// Using fetch API
const cid = "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const response = await fetch(`/ipfs/json/${cid}`);
const data = await response.json();
console.log("Retrieved JSON data:", data.data);
console.log("IPFS URL:", data.url);
```

## Environment Variables

The following environment variables are required for the IPFS service to work:

- `PINATA_API_KEY`: Your Pinata API key
- `PINATA_API_SECRET`: Your Pinata API secret
- `PINATA_JWT`: Your Pinata JWT token
- `PINATA_GATEWAY`: Your Pinata gateway URL

## Implementation Details

The IPFS module uses the Pinata SDK to interact with IPFS. It leverages the Metadata class from the common module to handle JSON data.
