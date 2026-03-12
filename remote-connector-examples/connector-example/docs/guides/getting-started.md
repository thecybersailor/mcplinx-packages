# Getting Started Guide

## Quick Start

### 1. Basic Synchronous Transform

#### Transform Text to Uppercase
```json
{
  "type": "transform",
  "input": {
    "text": "hello world"
  }
}
```

**Expected Result:**
```json
{
  "result": {
    "text": "HELLO WORLD"
  }
}
```

#### Calculate Sum of Numbers
```json
{
  "type": "calculate",
  "input": {
    "numbers": [1, 2, 3, 4, 5]
  }
}
```

**Expected Result:**
```json
{
  "result": {
    "sum": 15,
    "count": 5,
    "average": 3.0
  }
}
```

### 2. Basic Asynchronous Process

#### Submit Background Task
```json
{
  "type": "process",
  "input": {
    "data": "sample input",
    "options": {
      "priority": "normal"
    }
  }
}
```

**Response:**
```json
{
  "taskId": "task_1704369600000_abc123",
  "status": "pending",
  "webhookSupported": true,
  "taskInfoUrl": "https://api.example.com/tasks/task_1704369600000_abc123"
}
```

#### Check Task Status
```
GET /tasks/task_1704369600000_abc123
```

**Response:**
```json
{
  "taskId": "task_1704369600000_abc123",
  "status": "running",
  "progress": 0.6,
  "estimatedTimeRemaining": 2.4
}
```

#### Completed Task Result
```json
{
  "taskId": "task_1704369600000_abc123",
  "status": "completed",
  "result": {
    "processed": true,
    "output": "Processed: sample input",
    "processingTimeMs": 5234,
    "metadata": {
      "worker": "worker-01",
      "queue": "normal-priority"
    }
  }
}
```

## Configuration

### Environment Setup

#### Required Environment Variables
```bash
# API Configuration
API_BASE_URL=https://api.example.com
API_KEY=your-api-key-here

# Authentication
AUTH_TOKEN=your-auth-token
AUTH_TYPE=api-key

# Processing Options
DEFAULT_TIMEOUT=30000
MAX_RETRIES=3
```

#### Optional Configuration
```bash
# Webhook Settings
WEBHOOK_SECRET=your-webhook-secret
WEBHOOK_TIMEOUT=5000

# Performance Tuning
CONCURRENT_LIMITS=10
BATCH_SIZE=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Authentication Methods

#### API Key Authentication
```javascript
const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};
```

#### Token Authentication
```javascript
const headers = {
  'X-API-Token': AUTH_TOKEN,
  'Content-Type': 'application/json'
};
```

#### OAuth2 Flow
```javascript
// 1. Get authorization code
const authUrl = `${API_BASE_URL}/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;

// 2. Exchange for access token
const tokenResponse = await fetch(`${API_BASE_URL}/oauth/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code: authCode,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  })
});
```

## Common Patterns

### Error Handling

#### Synchronous Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input format",
    "details": {
      "field": "input",
      "expected": "object",
      "received": "string"
    }
  }
}
```

#### Asynchronous Error Handling
```javascript
// Webhook error callback
{
  "taskId": "task_1704369600000_abc123",
  "status": "failed",
  "error": {
    "code": "PROCESSING_ERROR",
    "message": "Failed to process input data",
    "retryable": true,
    "retryAfter": 30000
  }
}
```

#### Retry Logic Implementation
```javascript
async function processWithRetry(input, maxRetries = 3) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const result = await submitTask(input);
      return result;
    } catch (error) {
      attempt++;

      if (!error.retryable || attempt >= maxRetries) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Batch Processing

#### Multiple Synchronous Operations
```javascript
async function batchSyncTransform(inputs) {
  const results = [];

  for (const input of inputs) {
    try {
      const result = await syncTransform({
        type: 'transform',
        input
      });
      results.push({ success: true, result });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }

  return results;
}
```

#### Batch Asynchronous Submission
```javascript
async function submitBatchTasks(inputs) {
  const taskPromises = inputs.map(input =>
    submitAsyncTask({
      type: 'process',
      input,
      webhookUrl: `${BASE_WEBHOOK_URL}/batch`
    })
  );

  const taskResults = await Promise.allSettled(taskPromises);

  return taskResults.map((result, index) => ({
    inputIndex: index,
    success: result.status === 'fulfilled',
    taskId: result.status === 'fulfilled' ? result.value.taskId : null,
    error: result.status === 'rejected' ? result.reason : null
  }));
}
```

### Monitoring and Logging

#### Basic Logging Setup
```javascript
class TaskMonitor {
  constructor() {
    this.tasks = new Map();
    this.eventListeners = [];
  }

  onTaskUpdate(callback) {
    this.eventListeners.push(callback);
  }

  async trackTask(taskId) {
    this.tasks.set(taskId, {
      id: taskId,
      status: 'pending',
      startTime: Date.now(),
      updates: []
    });

    // Poll for updates
    const pollInterval = setInterval(async () => {
      try {
        const status = await checkTaskStatus(taskId);
        this.updateTaskStatus(taskId, status);

        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error(`Failed to check status for ${taskId}:`, error);
      }
    }, 2000);

    return taskId;
  }

  updateTaskStatus(taskId, status) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.updates.push({
        timestamp: Date.now(),
        status: status.status,
        progress: status.progress
      });

      this.eventListeners.forEach(callback =>
        callback(taskId, status)
      );
    }
  }
}
```

#### Performance Monitoring
```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
  }

  recordRequest(startTime, success, responseTime) {
    this.metrics.totalRequests++;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    this.metrics.responseTimes.push(responseTime);

    // Keep only last 100 measurements
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes.shift();
    }

    // Update average
    this.metrics.averageResponseTime =
      this.metrics.responseTimes.reduce((a, b) => a + b, 0) /
      this.metrics.responseTimes.length;
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.successfulRequests / this.metrics.totalRequests,
      p95ResponseTime: this.calculatePercentile(95)
    };
  }

  calculatePercentile(percentile) {
    const sorted = [...this.metrics.responseTimes].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
}
```

## Advanced Usage

### Custom Processing Types

#### Defining Custom Transformers
```javascript
// Custom transformer function
function customTextProcessor(input) {
  return {
    original: input.text,
    processed: input.text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    wordCount: input.text.split(' ').length,
    characterCount: input.text.length
  };
}

// Usage
const result = await syncTransform({
  type: 'transform',
  input: {
    text: "hello world example",
    transformer: "customTextProcessor"
  }
});
```

#### Processing Pipeline
```javascript
class ProcessingPipeline {
  constructor() {
    this.steps = [];
  }

  addStep(stepFunction) {
    this.steps.push(stepFunction);
    return this;
  }

  async execute(input) {
    let result = input;

    for (const step of this.steps) {
      result = await step(result);
    }

    return result;
  }
}

// Usage
const pipeline = new ProcessingPipeline()
  .addStep(data => syncTransform({ type: 'validate', input: data }))
  .addStep(data => syncTransform({ type: 'transform', input: data }))
  .addStep(data => asyncProcess({ type: 'analyze', input: data }));

const finalResult = await pipeline.execute(initialData);
```

### Integration Examples

#### Node.js Integration
```javascript
const axios = require('axios');

class ExampleConnector {
  constructor(config) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async syncTransform(input) {
    const response = await this.client.post('/tasks/sync', {
      type: 'transform',
      input
    });
    return response.data.result;
  }

  async asyncProcess(input, webhookUrl) {
    const response = await this.client.post('/tasks/async', {
      type: 'process',
      input,
      webhookUrl
    });
    return response.data;
  }

  async checkStatus(taskId) {
    const response = await this.client.get(`/tasks/${taskId}`);
    return response.data;
  }
}
```

#### Python Integration
```python
import requests
import json
from typing import Dict, Any

class ExampleConnector:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {config["api_key"]}',
            'Content-Type': 'application/json'
        })

    def sync_transform(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        response = self.session.post(
            f'{self.config["api_url"]}/tasks/sync',
            json={
                'type': 'transform',
                'input': input_data
            }
        )
        response.raise_for_status()
        return response.json()['result']

    def async_process(self, input_data: Dict[str, Any], webhook_url: str) -> Dict[str, Any]:
        response = self.session.post(
            f'{self.config["api_url"]}/tasks/async',
            json={
                'type': 'process',
                'input': input_data,
                'webhook_url': webhook_url
            }
        )
        response.raise_for_status()
        return response.json()

    def check_status(self, task_id: str) -> Dict[str, Any]:
        response = self.session.get(
            f'{self.config["api_url"]}/tasks/{task_id}'
        )
        response.raise_for_status()
        return response.json()
```

#### React Integration
```jsx
import React, { useState, useEffect } from 'react';

function DataProcessor({ apiClient }) {
  const [tasks, setTasks] = useState([]);
  const [processing, setProcessing] = useState(false);

  const handleSyncTransform = async (input) => {
    setProcessing(true);
    try {
      const result = await apiClient.syncTransform(input);
      console.log('Transform result:', result);
    } catch (error) {
      console.error('Transform failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleAsyncProcess = async (input) => {
    try {
      const task = await apiClient.asyncProcess(input, webhookUrl);
      setTasks(prev => [...prev, { ...task, status: 'pending' }]);

      // Start polling for status
      pollTaskStatus(task.taskId);
    } catch (error) {
      console.error('Async process failed:', error);
    }
  };

  const pollTaskStatus = async (taskId) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await apiClient.checkStatus(taskId);
        setTasks(prev => prev.map(task =>
          task.taskId === taskId ? { ...task, ...status } : task
        ));

        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error(`Status check failed for ${taskId}:`, error);
        clearInterval(pollInterval);
      }
    }, 2000);
  };

  return (
    <div>
      <button
        onClick={() => handleSyncTransform({ text: 'hello world' })}
        disabled={processing}
      >
        {processing ? 'Processing...' : 'Transform Text'}
      </button>

      <button onClick={() => handleAsyncProcess({ data: 'test' })}>
        Start Async Task
      </button>

      <div>
        <h3>Active Tasks</h3>
        {tasks.map(task => (
          <div key={task.taskId}>
            Task {task.taskId}: {task.status}
            {task.progress && ` (${Math.round(task.progress * 100)}%)`}
          </div>
        ))}
      </div>
    </div>
  );
}
```



