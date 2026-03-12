# API Reference

## Overview

This API reference provides comprehensive documentation for all available endpoints, parameters, and response formats.

## Base URL

```
https://api.example.com/v1
```

## Authentication

### API Key Authentication

Include your API key in the request header:

```
Authorization: Bearer your-api-key-here
```

### Request Signing (Optional)

For enhanced security, requests can be signed using HMAC-SHA256:

```javascript
const signature = crypto
  .createHmac('sha256', secretKey)
  .update(`${method}${path}${timestamp}${body}`)
  .digest('hex');

headers['X-Signature'] = signature;
headers['X-Timestamp'] = timestamp;
```

## Endpoints

## Synchronous Operations

### POST /tasks/sync

Performs synchronous data processing operations.

#### Request

```http
POST /tasks/sync
Content-Type: application/json
Authorization: Bearer your-api-key

{
  "type": "transform|calculate|validate",
  "input": {
    // Input data - varies by type
  },
  "options": {
    // Optional processing options
  }
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Processing type: `transform`, `calculate`, `validate` |
| `input` | object | Yes | Input data object |
| `options` | object | No | Additional processing options |

#### Transform Type Parameters

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "string",
      "description": "Data to transform"
    },
    "format": {
      "type": "string",
      "enum": ["uppercase", "lowercase", "titlecase"],
      "default": "uppercase"
    }
  },
  "required": ["data"]
}
```

**Example Request:**
```json
{
  "type": "transform",
  "input": {
    "data": "hello world",
    "format": "uppercase"
  }
}
```

#### Calculate Type Parameters

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "numbers": {
      "type": "array",
      "items": { "type": "number" },
      "description": "Array of numbers to calculate"
    },
    "operation": {
      "type": "string",
      "enum": ["sum", "average", "min", "max"],
      "default": "sum"
    }
  },
  "required": ["numbers"]
}
```

**Example Request:**
```json
{
  "type": "calculate",
  "input": {
    "numbers": [1, 2, 3, 4, 5],
    "operation": "average"
  }
}
```

#### Validate Type Parameters

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "any",
      "description": "Data to validate"
    },
    "schema": {
      "type": "object",
      "description": "JSON Schema for validation"
    }
  },
  "required": ["data", "schema"]
}
```

#### Response

**Success Response (200):**
```json
{
  "result": {
    // Processed result - varies by operation type
  },
  "metadata": {
    "processingTimeMs": 45,
    "server": "server-01"
  }
}
```

**Error Response (400/500):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "input.data",
      "issue": "required field missing"
    }
  }
}
```

## Asynchronous Operations

### POST /tasks/async

Submits an asynchronous processing task.

#### Request

```http
POST /tasks/async
Content-Type: application/json
Authorization: Bearer your-api-key

{
  "type": "process|analyze|generate",
  "input": {
    // Input data
  },
  "webhookUrl": "https://your-app.com/webhook",
  "options": {
    // Optional processing options
  }
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Processing type: `process`, `analyze`, `generate` |
| `input` | object | Yes | Input data object |
| `webhookUrl` | string | Yes | URL to receive completion callbacks |
| `options` | object | No | Additional processing options |

#### Process Type Parameters

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "any",
      "description": "Data to process"
    },
    "priority": {
      "type": "string",
      "enum": ["low", "normal", "high"],
      "default": "normal"
    },
    "timeout": {
      "type": "integer",
      "minimum": 30,
      "maximum": 3600,
      "default": 300,
      "description": "Timeout in seconds"
    }
  },
  "required": ["data"]
}
```

#### Response

**Success Response (202):**
```json
{
  "taskId": "task_1704369600000_abc123",
  "status": "pending",
  "webhookSupported": true,
  "taskInfoUrl": "https://api.example.com/tasks/task_1704369600000_abc123",
  "estimatedDuration": 5000,
  "submittedAt": "2024-01-04T12:00:00Z"
}
```

### GET /tasks/{taskId}

Retrieves the current status of an asynchronous task.

#### Request

```http
GET /tasks/{taskId}
Authorization: Bearer your-api-key
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | Task identifier from async submission |

#### Response

**Pending/Running Status (200):**
```json
{
  "taskId": "task_1704369600000_abc123",
  "status": "running",
  "progress": 0.65,
  "estimatedTimeRemaining": 1750,
  "startedAt": "2024-01-04T12:00:02Z",
  "lastUpdated": "2024-01-04T12:00:05Z"
}
```

**Completed Status (200):**
```json
{
  "taskId": "task_1704369600000_abc123",
  "status": "completed",
  "result": {
    "processed": true,
    "output": "Processed data result",
    "processingTimeMs": 5234
  },
  "completedAt": "2024-01-04T12:00:07Z",
  "webhookDelivered": true
}
```

**Failed Status (200):**
```json
{
  "taskId": "task_1704369600000_abc123",
  "status": "failed",
  "error": {
    "code": "PROCESSING_ERROR",
    "message": "Failed to process input data",
    "details": "Invalid data format in input.field",
    "retryable": true,
    "retryAfter": 30000
  },
  "failedAt": "2024-01-04T12:00:03Z"
}
```

**Error Response (404):**
```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task not found or access denied"
  }
}
```

### DELETE /tasks/{taskId}

Cancels a pending or running task.

#### Request

```http
DELETE /tasks/{taskId}
Authorization: Bearer your-api-key
```

#### Response

**Success Response (200):**
```json
{
  "taskId": "task_1704369600000_abc123",
  "status": "cancelled",
  "cancelledAt": "2024-01-04T12:00:10Z"
}
```

## Webhook Callbacks

### Completion Webhook

When an async task completes, a POST request is sent to the specified webhook URL.

#### Request

```http
POST https://your-app.com/webhook
Content-Type: application/json
X-Webhook-Signature: signature
X-Webhook-Event: task.completed

{
  "event": "task.completed",
  "taskId": "task_1704369600000_abc123",
  "status": "completed",
  "result": {
    "processed": true,
    "output": "Final result data"
  },
  "completedAt": "2024-01-04T12:00:07Z",
  "processingTimeMs": 5234
}
```

#### Failure Webhook

```http
POST https://your-app.com/webhook
Content-Type: application/json
X-Webhook-Signature: signature
X-Webhook-Event: task.failed

{
  "event": "task.failed",
  "taskId": "task_1704369600000_abc123",
  "status": "failed",
  "error": {
    "code": "PROCESSING_ERROR",
    "message": "Processing failed",
    "retryable": false
  },
  "failedAt": "2024-01-04T12:00:03Z"
}
```

### Webhook Verification

Webhooks include a signature for verification:

```javascript
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');

if (expectedSignature === request.headers['x-webhook-signature']) {
  // Webhook is authentic
}
```

## Batch Operations

### POST /batch/sync

Process multiple synchronous operations in a single request.

#### Request

```http
POST /batch/sync
Content-Type: application/json
Authorization: Bearer your-api-key

{
  "operations": [
    {
      "id": "op1",
      "type": "transform",
      "input": { "data": "hello" }
    },
    {
      "id": "op2",
      "type": "calculate",
      "input": { "numbers": [1, 2, 3] }
    }
  ],
  "options": {
    "failFast": false,
    "concurrency": 5
  }
}
```

#### Response

```json
{
  "results": [
    {
      "id": "op1",
      "success": true,
      "result": { "data": "HELLO" }
    },
    {
      "id": "op2",
      "success": true,
      "result": { "sum": 6 }
    }
  ],
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "totalProcessingTimeMs": 89
  }
}
```

## Rate Limits

### Synchronous Operations
- **Per Minute**: 1000 requests
- **Per Hour**: 50000 requests
- **Concurrent**: 50 simultaneous requests

### Asynchronous Operations
- **Per Minute**: 100 task submissions
- **Per Hour**: 5000 task submissions
- **Active Tasks**: 100 concurrent tasks per user

### Headers
Rate limit status is included in response headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704369660
X-RateLimit-Retry-After: 60
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `AUTHENTICATION_ERROR` | 401 | Invalid or missing credentials |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |
| `PROCESSING_ERROR` | 500 | Internal processing error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## SDK Examples

### JavaScript SDK

```javascript
import { ExampleAPI } from '@example/api-sdk';

const client = new ExampleAPI({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.example.com/v1'
});

// Synchronous transform
const result = await client.sync.transform({
  data: 'hello world',
  format: 'uppercase'
});

// Asynchronous process
const task = await client.async.process({
  data: 'input data',
  webhookUrl: 'https://your-app.com/callback'
});

// Check status
const status = await client.tasks.get(task.taskId);
```

### Python SDK

```python
from example_api import ExampleAPI

client = ExampleAPI(
    api_key='your-api-key',
    base_url='https://api.example.com/v1'
)

# Synchronous transform
result = client.sync.transform(data='hello world', format='uppercase')

# Asynchronous process
task = client.async.process(
    data='input data',
    webhook_url='https://your-app.com/callback'
)

# Check status
status = client.tasks.get(task['task_id'])
```

## Changelog

### Version 1.0.0
- Initial release
- Synchronous transform operations
- Asynchronous task processing
- Webhook callbacks
- Basic authentication

### Version 1.1.0 (Upcoming)
- Batch operations support
- Enhanced error reporting
- Request signing support
- Advanced filtering options

## Support

For API support, please contact:
- **Email**: api-support@example.com
- **Documentation**: https://docs.example.com
- **Status Page**: https://status.example.com



