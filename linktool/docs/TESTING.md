# Connector Testing Guide

使用 `@mcplinx/linktool` 的测试工具简化 connector 测试用例的实现。

## 安装

测试工具已包含在 `@mcplinx/linktool` 包中，无需额外安装。

```bash
npm install --save-dev @mcplinx/linktool
```

## 快速开始

### 1. 真实请求测试（集成测试）

适用于需要测试完整流程的场景，包括真实的 HTTP 请求。

```typescript
import { createTestContext } from '@mcplinx/linktool/lib/test-utils';
import { describe, it, expect } from 'vitest';

describe('Sync Tool Integration Test', () => {
  it('should transform data', async () => {
    const { connector, bundle, z } = await createTestContext(process.cwd(), {
      authData: {
        api_key: 'test_api_key_12345',
        base_url: 'https://api.example.com'
      },
      inputData: {
        type: 'transform',
        input: { text: 'hello' }
      }
    });

    const tool = connector.tools?.sync_transform;
    if (!tool) {
      throw new Error('Tool not found');
    }

    const result = await tool.perform(z, bundle);
    expect(result).toHaveProperty('transformed');
  });
});
```

### 2. Mock 请求测试（单元测试）

适用于快速、可重复的单元测试，不依赖外部服务。

```typescript
import { createMockTestContext, RequestMock } from '@mcplinx/linktool/lib/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Sync Tool Unit Test', () => {
  let mock: RequestMock;

  beforeEach(() => {
    mock = new RequestMock();
  });

  it('should handle API response', async () => {
    // 设置 mock 响应
    mock.mockByUrl('/tasks/sync', {
      status: 200,
      body: { result: { transformed: 'HELLO' } }
    });

    const { connector, bundle, z } = await createMockTestContext(
      process.cwd(),
      mock.createHandler(),
      {
        authData: { api_key: 'test_key' },
        inputData: { type: 'transform', input: { text: 'hello' } }
      }
    );

    const tool = connector.tools?.sync_transform;
    if (!tool) {
      throw new Error('Tool not found');
    }

    const result = await tool.perform(z, bundle);
    expect(result.transformed).toBe('HELLO');
    
    // 验证请求已发送
    expect(mock.verifyRequestMade('/tasks/sync')).toBe(true);
  });
});
```

## API 参考

### `createTestContext(connectorPath, options?)`

创建真实请求的测试上下文。

**参数：**
- `connectorPath: string` - Connector 目录路径（通常是 `process.cwd()`）
- `options?: TestContextOptions` - 测试选项
  - `authData?: Record<string, any>` - 认证数据
  - `inputData?: Record<string, any>` - 输入数据
  - `vars?: Record<string, any>` - 环境变量（非敏感）
  - `secrets?: Record<string, any>` - 密钥（敏感）
  - `meta?: Record<string, any>` - 元数据

**返回：**
- `connector: ConnectorDefinition` - Connector 定义
- `bundle: Bundle` - Bundle 对象
- `z: RuntimeContext` - Runtime 上下文（支持真实 HTTP 请求）

### `createMockTestContext(connectorPath, mockRequest, options?)`

创建 Mock 请求的测试上下文。

**参数：**
- `connectorPath: string` - Connector 目录路径
- `mockRequest: MockRequestHandler` - Mock 请求处理器（通常使用 `RequestMock.createHandler()`）
- `options?: TestContextOptions` - 测试选项（同上）

**返回：**
- 同 `createTestContext`

### `RequestMock`

请求 Mock 管理器，用于模拟 HTTP 请求和验证请求行为。

#### 方法

**`mockResponse(status, body, headers?)`**
设置默认响应。

```typescript
mock.mockResponse(200, { success: true });
```

**`mockByUrl(urlPattern, response)`**
根据 URL 模式设置响应。

```typescript
mock.mockByUrl('/api/users', {
  status: 200,
  body: [{ id: 1, name: 'John' }],
  headers: { 'Content-Type': 'application/json' }
});
```

**`createHandler()`**
创建 Mock 请求处理器。

```typescript
const handler = mock.createHandler();
const { z } = await createMockTestContext(process.cwd(), handler, options);
```

**`verifyRequestMade(urlPattern)`**
验证是否发送了匹配的请求。

```typescript
expect(mock.verifyRequestMade('/api/users')).toBe(true);
```

**`verifyHeaderSent(urlPattern, headerName, headerValue?)`**
验证请求头。

```typescript
expect(mock.verifyHeaderSent('/api/users', 'Authorization', 'Bearer token')).toBe(true);
```

**`verifyRequestBody(urlPattern, expectedBody)`**
验证请求体。

```typescript
expect(mock.verifyRequestBody('/api/users', { name: 'John' })).toBe(true);
```

**`getCalls()`**
获取所有请求调用记录。

```typescript
const calls = mock.getCalls();
expect(calls.length).toBe(1);
expect(calls[0].url).toContain('/api/users');
```

**`getCallsByUrl(urlPattern)`**
获取匹配 URL 模式的请求调用。

```typescript
const calls = mock.getCallsByUrl('/api/users');
```

**`reset()`**
重置所有 Mock 和调用记录。

```typescript
beforeEach(() => {
  mock.reset();
});
```

## 测试场景示例

### 测试认证

```typescript
it('should test authentication', async () => {
  const { connector, bundle, z } = await createTestContext(process.cwd(), {
    authData: {
      api_key: 'test_key',
      base_url: 'https://api.example.com'
    }
  });

  if (connector.authentication?.test) {
    const result = await connector.authentication.test(z, bundle);
    expect(result).toBeDefined();
    expect(result.label).toBeDefined();
  }
});
```

### 测试错误处理

```typescript
it('should handle API errors', async () => {
  const mock = new RequestMock();
  mock.mockByUrl('/tasks/sync', {
    status: 500,
    body: { error: 'Internal Server Error' }
  });

  const { connector, bundle, z } = await createMockTestContext(
    process.cwd(),
    mock.createHandler(),
    { authData: { api_key: 'test_key' }, inputData: { text: 'hello' } }
  );

  const tool = connector.tools?.sync_transform;
  await expect(tool.perform(z, bundle)).rejects.toThrow();
});
```

### 测试 beforeRequest 拦截器

```typescript
it('should apply beforeRequest interceptors', async () => {
  const mock = new RequestMock();
  mock.mockByUrl('/tasks/sync', {
    status: 200,
    body: { result: {} }
  });

  const { connector, bundle, z } = await createMockTestContext(
    process.cwd(),
    mock.createHandler(),
    { authData: { api_key: 'test_key' }, inputData: { text: 'hello' } }
  );

  const tool = connector.tools?.sync_transform;
  await tool.perform(z, bundle);

  // 验证 beforeRequest 添加的请求头
  expect(mock.verifyHeaderSent('/tasks/sync', 'Authorization')).toBe(true);
});
```

### 测试异步工具

```typescript
it('should handle async tool', async () => {
  const mock = new RequestMock();
  mock.mockByUrl('/tasks/async', {
    status: 200,
    body: { taskId: 'task-123', status: 'pending' }
  });

  const { connector, bundle, z } = await createMockTestContext(
    process.cwd(),
    mock.createHandler(),
    {
      authData: { api_key: 'test_key' },
      inputData: { type: 'process', input: { data: 'test' } },
      meta: { webhookUrl: 'https://example.com/webhook' }
    }
  );

  const tool = connector.tools?.async_process;
  if (tool?.kind === 'async') {
    const result = await tool.perform(z, bundle);
    expect(result.taskId).toBe('task-123');
    expect(result.status).toBe('pending');
  }
});
```

## 最佳实践

### 1. 测试分层

- **单元测试**：使用 `createMockTestContext` + `RequestMock`，测试工具逻辑
- **集成测试**：使用 `createTestContext`，测试完整流程
- **E2E 测试**：使用 `linktool test run` CLI 命令

### 2. 测试组织

```
connector-example/
  src/
    tools/
      sync_transform.ts
  __tests__/
    tools/
      sync_transform.test.ts              # 单元测试（Mock）
      sync_transform.integration.test.ts  # 集成测试（真实请求）
    authentication.test.ts
```

### 3. 关键测试点

1. **认证测试**：测试 `authentication.test()` 函数
2. **beforeRequest 拦截器**：验证请求头、URL 修改
3. **工具执行**：测试 `tool.perform()` 的输入输出
4. **错误处理**：使用 `RequestMock` 模拟错误响应
5. **异步工具**：测试 `webhookHandler` 和 `checkStatus`

### 4. Mock 策略

- 使用 `mockByUrl` 为不同端点设置不同响应
- 使用 `verifyRequestMade` 验证请求是否发送
- 使用 `verifyHeaderSent` 验证认证头是否正确添加
- 使用 `verifyRequestBody` 验证请求体内容

## 注意事项

1. **beforeRequest 支持**：Mock 模式下也会自动应用 `beforeRequest` 拦截器
2. **类型安全**：所有函数都有完整的 TypeScript 类型定义
3. **环境变量**：`buildBundle` 会自动从 `process.env` 分离 `vars` 和 `secrets`（基于 manifest.json 的配置）

## 更多示例

查看 `src/lib/__tests__/test-utils.example.test.ts` 获取更多示例。

