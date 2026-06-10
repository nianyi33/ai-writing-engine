# API 路由设计

## 设计原则

1. 后端只做代理和本地文件服务，不存储数据（数据在前端 IndexedDB）
2. API Key 只在后端内存中，前端通过后端代理访问 AI
3. 所有 AI 路由支持 SSE 流式输出

## 路由表

### AI 代理

| 方法 | 路径 | 说明 | 流式 |
|------|------|------|------|
| POST | `/api/ai/continue` | 续写助手 | ✅ SSE |
| POST | `/api/ai/outline/analyze` | 大纲分析 | ❌ JSON |
| POST | `/api/ai/outline/generate` | 一键生成大纲 | ❌ JSON |
| POST | `/api/ai/outline/reverse` | 反向大纲 | ❌ JSON |
| POST | `/api/ai/de-ai` | 去 AI 味 | ❌ JSON |
| POST | `/api/ai/role-chat` | 角色对话 | ✅ SSE |
| POST | `/api/ai/bond-analyze` | 情缘分值 | ❌ JSON |

### 本地文件操作

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/files/save` | 保存文件到本地 |
| GET | `/api/files/read` | 读取本地文件 |
| POST | `/api/files/export` | 导出为 EPUB/TXT |
| POST | `/api/files/import` | 导入本地文件 |

### 系统

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/models` | 获取可用模型列表 |

## 请求/响应示例

### POST `/api/ai/continue`

```typescript
// Request
{
  systemPrompt: string;      // 拼接好的完整 System Prompt
  context: string;           // 前后文
  instruction: string;       // 用户续写指令
  modelConfig: {
    model: string;           // 'deepseek-chat'
    temperature: number;
    maxTokens: number;
  };
  apiKey: string;            // 加密的 Key，后端解密
}

// Response: SSE 流式
// data: {"type":"token","content":"她"}
// data: {"type":"token","content":"推开"}
// data: {"type":"done"}
```

### POST `/api/ai/outline/analyze`

```typescript
// Request
{
  outlineContent: string;
  modelConfig: ModelConfig;
  apiKey: string;
}

// Response (JSON)
{
  totalScore: 82,
  dimensions: { ... },
  suggestions: [ ... ]
}
```

## 中间件

### rateLimiter
- 全局：每 IP 每分钟最多 30 次请求
- AI 路由：每 IP 每分钟最多 10 次

### apiKeyGuard
- 检查请求中是否包含有效的 apiKey
- Key 在内存中解密后使用，不落地

## 错误处理

```typescript
interface ApiError {
  error: string;
  code: 'RATE_LIMITED' | 'INVALID_KEY' | 'AI_TIMEOUT' | 'AI_ERROR' | 'INTERNAL';
  retryAfter?: number;      // 秒 (仅 RATE_LIMITED)
  details?: string;
}
```
