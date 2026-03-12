# Example Connector for Mock Service

这是一个示例connector,展示RemoteTask async tool的最佳实践。

## 功能

### 1. 同步工具: Transform Data (Sync)

演示同步API调用。

**使用场景**: 立即返回结果的操作,如数据转换、验证等。

**实现**:
- 简单的perform函数
- 立即返回结果

### 2. 异步工具: Process Data (Async) ⭐

演示完整的异步工作流,包括:
- ✅ `perform()`: 启动异步任务,传递webhookUrl
- ✅ `webhookHandler()`: 处理服务回调,解析状态
- ✅ `checkStatus()`: 主动轮询查询状态

**关键特性**:
1. **Webhook回调**: 任务完成后服务自动回调
2. **状态轮询**: 支持主动查询任务状态
3. **Connector控制**: 由connector自己解析和验证回调

## 使用方法

### 1. 安装依赖

```bash
cd /Users/wanglei/Projects/notelogic/remotetask/connectors/connector-example
npm install
```

### 2. 构建

```bash
npm run build
```

### 3. 发布到Host

```bash
npm run publish
```

## 代码示例

### Async Tool完整流程

```typescript
// 1️⃣ perform: 发起任务
perform: async (z, bundle): Promise<AsyncResult> => {
    // 从meta获取系统生成的webhookUrl
    const webhookUrl = bundle.meta?.webhookUrl;
    
    // 发起异步任务,传递webhookUrl给服务
    const response = await z.request({
        url: '/tasks/async',
        method: 'POST',
        json: {
            type: 'process',
            input: bundle.inputData,
            webhookUrl  // 🔑 传递给服务
        }
    });
    
    return {
        taskId: response.data.taskId,
        status: 'pending',
        webhookSupported: true
    };
}

// 2️⃣ webhookHandler: 处理回调
webhookHandler: async (z, bundle): Promise<WebhookResult> => {
    const { body } = bundle.rawRequest;
    
    // 🔑 Connector自己解析回调,判断状态
    return {
        taskId: body.taskId,
        status: body.status === 'completed' ? 'completed' : 'failed',
        result: body.result,
        error: body.error
    };
}

// 3️⃣ checkStatus: 轮询状态 (可选)
checkStatus: async (z, bundle): Promise<CheckResult> => {
    const { taskId } = bundle.inputData;
    
    const response = await z.request({
        url: `/tasks/${taskId}`,
        method: 'GET'
    });
    
    return {
        taskId,
        status: response.data.status,
        result: response.data.result
    };
}
```

## 认证配置

### OAuth2 认证

本 connector 使用 OAuth2 认证方式。

#### 登录步骤

1. **运行认证命令**：
   ```bash
   cd /Users/wanglei/Projects/notelogic/remotetask/connectors/connector-example
   npx linktool test auth
   ```

2. **配置回调 URL**：
   - 命令会显示一个固定的回调 URL，例如：`https://tun.dev.mcplinx.com/GYvC95LR/connector-example/callback`
   - 这个 URL 基于你的用户 ID，是固定的，只需要配置一次

3. **自动打开浏览器**：
   - linktool 会自动打开浏览器，跳转到 OAuth2 授权页面
   - Mock Service Provider 会自动授权并重定向回回调 URL

4. **完成认证**：
   - linktool 会自动接收回调，交换 access token
   - 认证信息会保存到 `.linktool/connection.json`

#### Mock Service Provider OAuth2 配置

- **Client ID**: `mock_client_id`
- **Client Secret**: `mock_client_secret`
- **授权端点**: `https://mock.dev.mcplinx.com/oauth2/authorize`
- **Token 端点**: `https://mock.dev.mcplinx.com/oauth2/token`

## 测试

### 前置条件

1. 部署Mock Service Provider
2. 完成OAuth2认证（运行 `npx linktool test auth`）

### 测试同步工具

创建instance后,调用`sync_transform`工具:
```json
{
  "type": "transform",
  "input": {"text": "hello world"}
}
```

### 测试异步工具

调用`async_process`工具:
```json
{
  "type": "process",
  "input": {"data": "test"}
}
```

任务会在3-8秒后完成,系统会收到webhook回调。

## 学习要点

1. **Webhook URL**: 由系统生成,通过`bundle.meta.webhookUrl`获取
2. **状态解析**: Connector自己解析回调,判断任务状态
3. **错误处理**: Connector负责验证和错误处理
4. **双机制**: 支持webhook回调和主动轮询两种方式
