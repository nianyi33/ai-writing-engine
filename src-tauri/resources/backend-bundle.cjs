"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// backend/server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express4 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);

// backend/routes/system.routes.ts
var import_express = require("express");

// shared/models.ts
var PROVIDERS = [
  { id: "deepseek", name: "DeepSeek", baseUrl: "https://api.deepseek.com", website: "https://platform.deepseek.com", docsUrl: "https://platform.deepseek.com/api-docs" },
  { id: "qwen", name: "\u901A\u4E49\u5343\u95EE", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", website: "https://dashscope.console.aliyun.com", docsUrl: "https://help.aliyun.com/zh/model-studio" },
  { id: "zhipu", name: "\u667A\u8C31 GLM", baseUrl: "https://open.bigmodel.cn/api/paas/v4", website: "https://open.bigmodel.cn", docsUrl: "https://open.bigmodel.cn/dev/api" },
  { id: "moonshot", name: "\u6708\u4E4B\u6697\u9762 Kimi", baseUrl: "https://api.moonshot.cn/v1", website: "https://platform.moonshot.cn", docsUrl: "https://platform.moonshot.cn/docs" },
  { id: "anthropic", name: "Anthropic Claude", baseUrl: "https://api.anthropic.com", website: "https://console.anthropic.com", docsUrl: "https://docs.anthropic.com" },
  { id: "openai", name: "OpenAI GPT", baseUrl: "https://api.openai.com/v1", website: "https://platform.openai.com", docsUrl: "https://platform.openai.com/docs" }
];
var PROVIDERS_WITH_MODELS = PROVIDERS.map((p) => ({
  ...p,
  models: []
}));
var MODELS = [
  { id: "deepseek-chat", name: "DeepSeek V3", provider: "deepseek", category: "fast" },
  { id: "deepseek-reasoner", name: "DeepSeek R1", provider: "deepseek", category: "reasoning" },
  { id: "qwen-turbo", name: "Qwen Turbo", provider: "qwen", category: "fast" },
  { id: "qwen-plus", name: "Qwen Plus", provider: "qwen", category: "balanced" },
  { id: "qwen-max", name: "Qwen Max", provider: "qwen", category: "powerful" },
  { id: "glm-4-flash", name: "GLM-4 Flash", provider: "zhipu", category: "fast" },
  { id: "glm-4", name: "GLM-4", provider: "zhipu", category: "balanced" },
  { id: "glm-4-plus", name: "GLM-4 Plus", provider: "zhipu", category: "powerful" },
  { id: "moonshot-v1-8k", name: "Moonshot v1 (8K)", provider: "moonshot", category: "fast" },
  { id: "moonshot-v1-32k", name: "Moonshot v1 (32K)", provider: "moonshot", category: "balanced" },
  { id: "moonshot-v1-128k", name: "Moonshot v1 (128K)", provider: "moonshot", category: "powerful" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", provider: "anthropic", category: "fast" },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "anthropic", category: "balanced" },
  { id: "claude-opus-4-8", name: "Claude Opus 4.8", provider: "anthropic", category: "powerful" },
  { id: "gpt-5.5-instant", name: "GPT-5.5 Instant", provider: "openai", category: "fast" },
  { id: "gpt-5.4-thinking", name: "GPT-5.4 Thinking", provider: "openai", category: "balanced" },
  { id: "gpt-5.4-pro", name: "GPT-5.4 Pro", provider: "openai", category: "powerful" }
];
for (const m of MODELS) {
  const p = PROVIDERS_WITH_MODELS.find((p2) => p2.id === m.provider);
  if (p) p.models.push(m);
}

// backend/routes/system.routes.ts
var systemRouter = (0, import_express.Router)();
systemRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});
systemRouter.get("/models", (_req, res) => {
  res.json({
    providers: PROVIDERS.map(({ id, name, baseUrl, website }) => ({ id, name, baseUrl, website })),
    models: MODELS
  });
});

// backend/routes/ai.routes.ts
var import_express2 = require("express");

// backend/services/ai-client.factory.ts
var import_openai = require("openai");
var import_sdk = __toESM(require("@anthropic-ai/sdk"), 1);
function createAiClient(params) {
  if (params.provider === "anthropic") {
    return createAnthropicClient(params.apiKey, params.baseUrl);
  }
  return createOpenAiCompatibleClient(params.apiKey, params.baseUrl);
}
function createOpenAiCompatibleClient(apiKey, baseUrl) {
  const client = new import_openai.OpenAI({
    apiKey,
    baseURL: baseUrl || "https://api.deepseek.com",
    timeout: 12e4,
    maxRetries: 1
  });
  return {
    provider: "openai-compatible",
    async chat(options) {
      const completion = await client.chat.completions.create({
        model: options.model,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        messages: options.messages
      });
      return completion.choices[0]?.message?.content || "";
    },
    async *streamChat(options) {
      const stream = await client.chat.completions.create({
        model: options.model,
        temperature: options.temperature ?? 0.8,
        max_tokens: options.maxTokens ?? 2048,
        messages: options.messages,
        stream: true
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) yield delta;
      }
    }
  };
}
function createAnthropicClient(apiKey, baseUrl) {
  const client = new import_sdk.default({
    apiKey,
    baseURL: baseUrl || "https://api.anthropic.com",
    timeout: 12e4,
    maxRetries: 1
  });
  return {
    provider: "anthropic",
    async chat(options) {
      const { system, messages } = extractSystemAndMessages(options.messages);
      const message = await client.messages.create({
        model: options.model,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
        system: system || void 0,
        messages
      });
      const textBlock = message.content.find((block) => block.type === "text");
      return textBlock?.text || "";
    },
    async *streamChat(options) {
      const { system, messages } = extractSystemAndMessages(options.messages);
      const stream = client.messages.stream({
        model: options.model,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.8,
        system: system || void 0,
        messages
      });
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield event.delta.text;
        }
      }
    }
  };
}
function extractSystemAndMessages(allMessages) {
  const systemParts = [];
  const messages = [];
  for (const msg of allMessages) {
    if (msg.role === "system") {
      systemParts.push(msg.content);
    } else {
      messages.push({ role: msg.role, content: msg.content });
    }
  }
  return { system: systemParts.join("\n\n"), messages };
}
function detectProvider(modelId) {
  if (modelId.startsWith("claude-")) return "anthropic";
  if (modelId.startsWith("gpt-")) return "openai";
  if (modelId.startsWith("qwen-")) return "qwen";
  if (modelId.startsWith("glm-")) return "zhipu";
  if (modelId.startsWith("moonshot-")) return "moonshot";
  if (modelId.startsWith("deepseek-")) return "deepseek";
  return "custom";
}

// backend/schemas/ai.schemas.ts
var import_zod = require("zod");
var modelConfigSchema = import_zod.z.object({
  model: import_zod.z.string().min(1, "\u6A21\u578B\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A").default("deepseek-chat"),
  temperature: import_zod.z.number().min(0).max(2).optional().default(0.8),
  maxTokens: import_zod.z.number().min(1).max(128e3).optional().default(2048)
});
var apiKeySchema = import_zod.z.string().min(1, "API Key \u4E0D\u80FD\u4E3A\u7A7A");
var baseUrlSchema = import_zod.z.string().url("API \u5730\u5740\u683C\u5F0F\u4E0D\u6B63\u786E").optional();
var continueSchema = import_zod.z.object({
  systemPrompt: import_zod.z.string().min(1),
  context: import_zod.z.string(),
  instruction: import_zod.z.string(),
  modelConfig: modelConfigSchema.optional(),
  apiKey: apiKeySchema,
  baseUrl: baseUrlSchema
});
var outlineAnalyzeSchema = import_zod.z.object({
  outlineContent: import_zod.z.string().min(1, "\u5927\u7EB2\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A"),
  modelConfig: modelConfigSchema.optional(),
  apiKey: apiKeySchema,
  baseUrl: baseUrlSchema
});
var outlineGenerateSchema = import_zod.z.object({
  premise: import_zod.z.string().min(1, "\u6545\u4E8B\u6897\u6982\u4E0D\u80FD\u4E3A\u7A7A"),
  modelConfig: modelConfigSchema.optional(),
  apiKey: apiKeySchema,
  baseUrl: baseUrlSchema
});
var reverseOutlineSchema = import_zod.z.object({
  content: import_zod.z.string().min(1, "\u6587\u672C\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A"),
  modelConfig: modelConfigSchema.optional(),
  apiKey: apiKeySchema,
  baseUrl: baseUrlSchema
});
var deAiSchema = import_zod.z.object({
  text: import_zod.z.string().min(1, "\u6587\u672C\u4E0D\u80FD\u4E3A\u7A7A"),
  style: import_zod.z.string().optional().default("\u7F51\u6587\u98CE\u683C"),
  modelConfig: modelConfigSchema.optional(),
  apiKey: apiKeySchema,
  baseUrl: baseUrlSchema
});
var roleChatSchema = import_zod.z.object({
  characterInfo: import_zod.z.object({
    name: import_zod.z.string().min(1),
    personality: import_zod.z.string(),
    speechStyle: import_zod.z.string(),
    background: import_zod.z.string()
  }),
  history: import_zod.z.array(import_zod.z.object({
    role: import_zod.z.enum(["user", "assistant"]),
    content: import_zod.z.string()
  })).optional().default([]),
  userMessage: import_zod.z.string().min(1, "\u6D88\u606F\u4E0D\u80FD\u4E3A\u7A7A"),
  modelConfig: modelConfigSchema.optional(),
  apiKey: apiKeySchema,
  baseUrl: baseUrlSchema
});
var bondAnalyzeSchema = import_zod.z.object({
  characterName: import_zod.z.string().min(1, "\u89D2\u8272\u540D\u4E0D\u80FD\u4E3A\u7A7A"),
  interactionText: import_zod.z.string().min(1, "\u4E92\u52A8\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A"),
  currentIntimacy: import_zod.z.number().min(-100).max(100),
  modelConfig: modelConfigSchema.optional(),
  apiKey: apiKeySchema,
  baseUrl: baseUrlSchema
});
var extractCharactersSchema = import_zod.z.object({
  bookTitle: import_zod.z.string().optional().default("\u672A\u77E5"),
  chapters: import_zod.z.array(import_zod.z.object({
    title: import_zod.z.string(),
    content: import_zod.z.string()
  })).min(1, "\u81F3\u5C11\u9700\u8981\u4E00\u4E2A\u7AE0\u8282"),
  modelConfig: modelConfigSchema.optional(),
  apiKey: apiKeySchema,
  baseUrl: baseUrlSchema
});

// backend/middleware/validate.ts
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(400).json({
        error: "\u8BF7\u6C42\u53C2\u6570\u6821\u9A8C\u5931\u8D25",
        code: "VALIDATION_ERROR",
        details: errors
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
function formatZodErrors(error) {
  return error.errors.map((e) => ({
    field: e.path.join("."),
    message: e.message
  }));
}

// backend/middleware/rate-limiter.ts
var rateMap = /* @__PURE__ */ new Map();
function rateLimiter(maxPerMin) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = rateMap.get(ip);
    if (!entry || now > entry.resetAt) {
      rateMap.set(ip, { count: 1, resetAt: now + 6e4 });
      next();
      return;
    }
    if (entry.count >= maxPerMin) {
      res.status(429).json({
        error: "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5",
        code: "RATE_LIMITED",
        retryAfter: Math.ceil((entry.resetAt - now) / 1e3)
      });
      return;
    }
    entry.count++;
    next();
  };
}

// backend/routes/ai.routes.ts
var aiRouter = (0, import_express2.Router)();
aiRouter.use("/ai", rateLimiter(10));
function setupSSE(res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
}
aiRouter.post("/ai/continue", validate(continueSchema), async (req, res) => {
  try {
    const { systemPrompt, context, instruction, modelConfig, apiKey, baseUrl } = req.body;
    const provider = detectProvider(modelConfig?.model || "deepseek-chat");
    const client = createAiClient({ apiKey, baseUrl, provider });
    setupSSE(res);
    const stream = client.streamChat({
      model: modelConfig?.model || "deepseek-chat",
      temperature: modelConfig?.temperature ?? 0.8,
      maxTokens: modelConfig?.maxTokens ?? 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `\u3010\u524D\u6587\u4E0A\u4E0B\u6587\u3011
${context}

\u3010\u7EED\u5199\u6307\u4EE4\u3011
${instruction}` }
      ]
    });
    for await (const token of stream) {
      res.write(`data: ${JSON.stringify({ type: "token", content: token })}

`);
    }
    res.write(`data: ${JSON.stringify({ type: "done" })}

`);
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "AI \u8BF7\u6C42\u5931\u8D25", code: "AI_ERROR" });
    } else {
      res.write(`data: ${JSON.stringify({ type: "error", content: err.message })}

`);
      res.end();
    }
  }
});
aiRouter.post("/ai/outline/analyze", validate(outlineAnalyzeSchema), async (req, res) => {
  try {
    const { outlineContent, modelConfig, apiKey, baseUrl } = req.body;
    const provider = detectProvider(modelConfig?.model || "deepseek-chat");
    const client = createAiClient({ apiKey, baseUrl, provider });
    const result = await client.chat({
      model: modelConfig?.model || "deepseek-chat",
      temperature: 0.3,
      maxTokens: 4096,
      messages: [
        {
          role: "system",
          content: `\u4F60\u662F\u4E00\u4F4D\u8D44\u6DF1\u7684\u7F51\u6587\u7F16\u8F91\uFF0C\u64C5\u957F\u5206\u6790\u5C0F\u8BF4\u5927\u7EB2\u7684\u8D28\u91CF\u3002\u8BF7\u5BF9\u4EE5\u4E0B\u5927\u7EB2\u8FDB\u884C\u4E94\u7EF4\u5EA6\u8BC4\u4F30\uFF0C\u8FD4\u56DEJSON\u3002

\u8BC4\u4F30\u7EF4\u5EA6\uFF08\u6BCF\u98790-100\u5206\uFF09\uFF1A
- completeness\uFF1A\u5B8C\u6574\u5EA6\uFF08\u6545\u4E8B\u7ED3\u6784\u662F\u5426\u5B8C\u6574\uFF0C\u8D77\u627F\u8F6C\u5408\u662F\u5426\u9F50\u5168\uFF09
- pacing\uFF1A\u8282\u594F\u611F\uFF08\u60C5\u8282\u63A8\u8FDB\u662F\u5426\u5F20\u5F1B\u6709\u5EA6\uFF09
- conflict\uFF1A\u51B2\u7A81\u5BC6\u5EA6\uFF08\u77DB\u76FE\u51B2\u7A81\u662F\u5426\u8DB3\u591F\u5BC6\u96C6\u548C\u6709\u529B\uFF09
- characterGrowth\uFF1A\u89D2\u8272\u6210\u957F\uFF08\u89D2\u8272\u662F\u5426\u6709\u6E05\u6670\u7684\u6210\u957F\u5F27\u7EBF\uFF09
- logic\uFF1A\u903B\u8F91\u4E25\u8C28\u6027\uFF08\u8BBE\u5B9A\u662F\u5426\u81EA\u6D3D\uFF0C\u524D\u540E\u662F\u5426\u77DB\u76FE\uFF09

\u8FD4\u56DE\u683C\u5F0F\uFF1A
{
  "totalScore": 85,
  "dimensions": { "completeness": 80, "pacing": 90, "conflict": 75, "characterGrowth": 85, "logic": 90 },
  "suggestions": ["\u5EFA\u8BAE1", "\u5EFA\u8BAE2", "\u5EFA\u8BAE3"]
}`
        },
        { role: "user", content: outlineContent }
      ]
    });
    res.json(JSON.parse(result || "{}"));
  } catch (err) {
    res.status(500).json({ error: err.message, code: "AI_ERROR" });
  }
});
aiRouter.post("/ai/outline/generate", validate(outlineGenerateSchema), async (req, res) => {
  try {
    const { premise, modelConfig, apiKey, baseUrl } = req.body;
    const provider = detectProvider(modelConfig?.model || "deepseek-chat");
    const client = createAiClient({ apiKey, baseUrl, provider });
    const result = await client.chat({
      model: modelConfig?.model || "deepseek-chat",
      temperature: 0.7,
      maxTokens: 4096,
      messages: [
        {
          role: "system",
          content: `\u4F60\u662F\u4E00\u4F4D\u8D44\u6DF1\u7F51\u6587\u5927\u7EB2\u7B56\u5212\u5E08\u3002\u6839\u636E\u7528\u6237\u63D0\u4F9B\u7684\u6545\u4E8B\u6897\u6982\uFF0C\u751F\u6210\u4E00\u4EFD\u5B8C\u6574\u7684\u7AE0\u8282\u5927\u7EB2\u3002

\u8FD4\u56DEJSON\u683C\u5F0F\uFF1A
{
  "volumes": [
    {
      "title": "\u7B2C\u4E00\u5377\u6807\u9898",
      "chapters": [
        { "title": "\u7B2C1\u7AE0 \u7AE0\u8282\u540D", "summary": "\u672C\u7AE0\u5185\u5BB9\u6982\u8981\uFF0C50\u5B57\u4EE5\u5185" }
      ]
    }
  ],
  "totalChapters": 30,
  "estimatedWords": "30\u4E07\u5B57"
}`
        },
        { role: "user", content: premise }
      ]
    });
    res.json(JSON.parse(result || "{}"));
  } catch (err) {
    res.status(500).json({ error: err.message, code: "AI_ERROR" });
  }
});
aiRouter.post("/ai/outline/reverse", validate(reverseOutlineSchema), async (req, res) => {
  try {
    const { content, modelConfig, apiKey, baseUrl } = req.body;
    const provider = detectProvider(modelConfig?.model || "deepseek-chat");
    const client = createAiClient({ apiKey, baseUrl, provider });
    const result = await client.chat({
      model: modelConfig?.model || "deepseek-chat",
      temperature: 0.3,
      maxTokens: 4096,
      messages: [
        {
          role: "system",
          content: `\u4F60\u662F\u4E00\u4F4D\u6587\u672C\u7ED3\u6784\u5206\u6790\u5E08\u3002\u8BF7\u5206\u6790\u4EE5\u4E0B\u5C0F\u8BF4\u7247\u6BB5\uFF0C\u63D0\u53D6\u5176\u5927\u7EB2\u7ED3\u6784\u3002

\u8FD4\u56DEJSON\u683C\u5F0F\uFF1A
{
  "structure": [
    { "title": "\u7AE0\u8282/\u6BB5\u843D\u540D", "type": "chapter|scene", "summary": "\u5185\u5BB9\u6982\u8981", "events": ["\u4E8B\u4EF61", "\u4E8B\u4EF62"], "characters": ["\u51FA\u73B0\u7684\u89D2\u8272"] }
  ],
  "overallAnalysis": "\u6574\u4F53\u7ED3\u6784\u5206\u6790"
}`
        },
        { role: "user", content }
      ]
    });
    res.json(JSON.parse(result || "{}"));
  } catch (err) {
    res.status(500).json({ error: err.message, code: "AI_ERROR" });
  }
});
aiRouter.post("/ai/de-ai", validate(deAiSchema), async (req, res) => {
  try {
    const { text, style, modelConfig, apiKey, baseUrl } = req.body;
    const provider = detectProvider(modelConfig?.model || "deepseek-chat");
    const client = createAiClient({ apiKey, baseUrl, provider });
    const result = await client.chat({
      model: modelConfig?.model || "deepseek-chat",
      temperature: 0.7,
      maxTokens: 4096,
      messages: [
        {
          role: "system",
          content: `\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u5C0F\u8BF4\u6DA6\u8272\u5E08\uFF0C\u4E13\u95E8\u53BB\u9664AI\u5199\u4F5C\u7684\u673A\u68B0\u611F\u3002\u8BF7\u5C06\u4EE5\u4E0B\u6587\u5B57\u6539\u5199\u4E3A\u66F4\u81EA\u7136\u7684${style || "\u7F51\u6587"}\u98CE\u683C\u3002

\u6539\u5199\u539F\u5219\uFF1A
1. \u6253\u7834\u8FC7\u4E8E\u89C4\u6574\u7684\u53E5\u5F0F\u7ED3\u6784\uFF0C\u957F\u77ED\u53E5\u4EA4\u9519
2. \u53BB\u9664"\u9996\u5148\u3001\u5176\u6B21\u3001\u7136\u540E\u3001\u6B64\u5916"\u7B49AI\u9AD8\u9891\u8FDE\u63A5\u8BCD
3. \u5C06\u9648\u8FF0\u53E5\u6539\u4E3A\u66F4\u6709\u753B\u9762\u611F\u7684\u63CF\u5199
4. \u52A0\u5165\u7B26\u5408\u4EBA\u7269\u6027\u683C\u7684\u5185\u5FC3\u72EC\u767D\u6216\u53E3\u8BED\u5316\u8868\u8FBE
5. \u4FDD\u7559\u539F\u610F\u548C\u60C5\u8282\uFF0C\u53EA\u6539\u8BED\u8A00\u98CE\u683C

\u8BF7\u76F4\u63A5\u8F93\u51FA\u6539\u5199\u540E\u7684\u6587\u672C\uFF0C\u4E0D\u8981\u52A0\u4EFB\u4F55\u89E3\u91CA\u3002`
        },
        { role: "user", content: text }
      ]
    });
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message, code: "AI_ERROR" });
  }
});
aiRouter.post("/ai/role-chat", validate(roleChatSchema), async (req, res) => {
  try {
    const { characterInfo, history, userMessage, modelConfig, apiKey, baseUrl } = req.body;
    const provider = detectProvider(modelConfig?.model || "deepseek-chat");
    const client = createAiClient({ apiKey, baseUrl, provider });
    setupSSE(res);
    const systemPrompt = `\u4F60\u73B0\u5728\u626E\u6F14\u4EE5\u4E0B\u89D2\u8272\uFF0C\u8BF7\u5B8C\u5168\u6C89\u6D78\u5728\u8FD9\u4E2A\u89D2\u8272\u4E2D\uFF0C\u7528\u89D2\u8272\u7684\u53E3\u543B\u3001\u6027\u683C\u548C\u8BF4\u8BDD\u98CE\u683C\u8FDB\u884C\u5BF9\u8BDD\u3002

\u89D2\u8272\u4FE1\u606F\uFF1A
- \u59D3\u540D\uFF1A${characterInfo.name}
- \u6027\u683C\uFF1A${characterInfo.personality}
- \u8BF4\u8BDD\u98CE\u683C\uFF1A${characterInfo.speechStyle}
- \u80CC\u666F\uFF1A${characterInfo.background}

\u89C4\u5219\uFF1A
1. \u59CB\u7EC8\u4FDD\u6301\u5728\u89D2\u8272\u5185\uFF0C\u4E0D\u8981\u8DF3\u51FA\u6765\u89E3\u91CA
2. \u7528\u89D2\u8272\u7684\u8BF4\u8BDD\u98CE\u683C\u56DE\u5E94\uFF0C\u4E0D\u8981\u7528AI\u7684\u53E3\u543B
3. \u53EF\u4EE5\u6839\u636E\u89D2\u8272\u7684\u6027\u683C\u8868\u8FBE\u60C5\u611F\uFF08\u6124\u6012\u3001\u559C\u60A6\u3001\u60B2\u4F24\u7B49\uFF09
4. \u53EF\u4EE5\u9002\u5F53\u5730\u63A8\u8FDB\u5267\u60C5\u6216\u5C55\u5F00\u65B0\u8BDD\u9898
5. \u56DE\u590D\u63A7\u5236\u5728200\u5B57\u4EE5\u5185\uFF0C\u50CF\u6B63\u5E38\u5BF9\u8BDD\u4E00\u6837`;
    const messages = [
      { role: "system", content: systemPrompt }
    ];
    for (const m of history || []) {
      messages.push({ role: m.role, content: m.content });
    }
    messages.push({ role: "user", content: userMessage });
    const stream = client.streamChat({
      model: modelConfig?.model || "deepseek-chat",
      temperature: 0.9,
      maxTokens: 1024,
      messages
    });
    for await (const token of stream) {
      res.write(`data: ${JSON.stringify({ type: "token", content: token })}

`);
    }
    res.write(`data: ${JSON.stringify({ type: "done" })}

`);
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message, code: "AI_ERROR" });
    } else {
      res.write(`data: ${JSON.stringify({ type: "error", content: err.message })}

`);
      res.end();
    }
  }
});
aiRouter.post("/ai/bond-analyze", validate(bondAnalyzeSchema), async (req, res) => {
  try {
    const { characterName, interactionText, currentIntimacy, modelConfig, apiKey, baseUrl } = req.body;
    const provider = detectProvider(modelConfig?.model || "deepseek-chat");
    const client = createAiClient({ apiKey, baseUrl, provider });
    const result = await client.chat({
      model: modelConfig?.model || "deepseek-chat",
      temperature: 0.3,
      maxTokens: 2048,
      messages: [
        {
          role: "system",
          content: `\u4F60\u662F\u4E00\u4F4D\u60C5\u611F\u5206\u6790\u5E08\uFF0C\u4E13\u95E8\u5206\u6790\u5C0F\u8BF4\u89D2\u8272\u4E4B\u95F4\u7684\u4E92\u52A8\u5E76\u91CF\u5316\u597D\u611F\u5EA6\u53D8\u5316\u3002

\u6839\u636E\u4E92\u52A8\u5185\u5BB9\uFF0C\u5224\u65AD\u597D\u611F\u5EA6\u7684\u53D8\u5316\u65B9\u5411\uFF08\u6B63\u503C\u4E3A\u589E\u52A0\u597D\u611F\uFF0C\u8D1F\u503C\u4E3A\u964D\u4F4E\u597D\u611F\uFF09\uFF0C\u8303\u56F4-10\u5230+10\u3002

\u8FD4\u56DEJSON\u683C\u5F0F\uFF1A
{
  "intimacyDelta": 3,
  "event": "\u7B80\u77ED\u63CF\u8FF0\u89E6\u53D1\u597D\u611F\u53D8\u5316\u7684\u4E8B\u4EF6\uFF0C15\u5B57\u4EE5\u5185",
  "memo": "AI\u751F\u6210\u7684\u8BB0\u5FC6\u70B9\uFF0C\u4E00\u53E5\u8BDD\u6982\u62EC\u8FD9\u6B21\u4E92\u52A8\u5BF9\u5173\u7CFB\u7684\u5F71\u54CD"
}`
        },
        {
          role: "user",
          content: `\u89D2\u8272\u540D\uFF1A${characterName}
\u5F53\u524D\u597D\u611F\u5EA6\uFF1A${currentIntimacy}
\u4E92\u52A8\u5185\u5BB9\uFF1A${interactionText}`
        }
      ]
    });
    res.json(JSON.parse(result || "{}"));
  } catch (err) {
    res.status(500).json({ error: err.message, code: "AI_ERROR" });
  }
});
aiRouter.post("/ai/extract-characters", validate(extractCharactersSchema), async (req, res) => {
  try {
    const { bookTitle, chapters, modelConfig, apiKey, baseUrl } = req.body;
    const provider = detectProvider(modelConfig?.model || "deepseek-chat");
    const client = createAiClient({ apiKey, baseUrl, provider });
    let fullText = "";
    const maxChars = 8e3;
    const sliceCount = Math.min(chapters.length, 20);
    for (const ch of chapters.slice(0, 20)) {
      const snippet = ch.content.slice(0, Math.floor(maxChars / sliceCount));
      fullText += `
--- \u7AE0\u8282\uFF1A${ch.title} ---
${snippet}`;
      if (fullText.length > maxChars) break;
    }
    const result = await client.chat({
      model: modelConfig?.model || "deepseek-chat",
      temperature: 0.3,
      maxTokens: 4096,
      messages: [
        {
          role: "system",
          content: `\u4F60\u662F\u4E00\u4F4D\u8D44\u6DF1\u6587\u5B66\u7F16\u8F91\uFF0C\u64C5\u957F\u4ECE\u5C0F\u8BF4\u6587\u672C\u4E2D\u8BC6\u522B\u548C\u6574\u7406\u89D2\u8272\u4FE1\u606F\u3002

\u8BF7\u4ED4\u7EC6\u9605\u8BFB\u4EE5\u4E0B\u5C0F\u8BF4\u7247\u6BB5\uFF0C\u63D0\u53D6\u51FA\u6240\u6709\u6709\u540D\u6709\u59D3\u7684\u89D2\u8272\uFF08\u5305\u62EC\u53EA\u63D0\u5230\u540D\u5B57\u4F46\u672A\u51FA\u573A\u7684\u89D2\u8272\uFF09\u3002

\u5BF9\u4E8E\u6BCF\u4E2A\u89D2\u8272\uFF0C\u4F60\u9700\u8981\u5C3D\u53EF\u80FD\u63A8\u65AD\uFF1A
- name: \u89D2\u8272\u59D3\u540D
- aliases: \u522B\u540D/\u7EF0\u53F7\u6570\u7EC4\uFF08\u5982\u6709\uFF09
- role: \u89D2\u8272\u5B9A\u4F4D\uFF0C\u5FC5\u987B\u662F\u4EE5\u4E0B\u4E4B\u4E00\uFF1Aprotagonist(\u4E3B\u89D2), antagonist(\u5BF9\u624B/\u53CD\u6D3E), supporting(\u91CD\u8981\u914D\u89D2), minor(\u6B21\u8981\u89D2\u8272/\u9F99\u5957)
- personality: \u6027\u683C\u7279\u5F81\u63CF\u8FF0\uFF08\u4ECE\u6587\u672C\u4E2D\u7684\u8A00\u884C\u63A8\u65AD\uFF0C50\u5B57\u4EE5\u5185\uFF09
- speechStyle: \u8BF4\u8BDD\u98CE\u683C\uFF08\u5982\u6709\u5BF9\u8BDD\u53EF\u63A8\u65AD\uFF0C\u5426\u5219\u586B"\u672A\u77E5"\uFF0C30\u5B57\u4EE5\u5185\uFF09
- background: \u80CC\u666F\u4FE1\u606F\uFF08\u4ECE\u6587\u672C\u4E2D\u63D0\u53D6\uFF0C80\u5B57\u4EE5\u5185\uFF09
- appearance: \u5916\u8C8C\u63CF\u8FF0\uFF08\u5982\u6709\uFF0C\u5426\u5219\u586B"\u672A\u77E5"\uFF09
- relationships: \u4E0E\u5176\u4ED6\u89D2\u8272\u7684\u5173\u7CFB\u6570\u7EC4\uFF0C\u683C\u5F0F [{"targetCharacterName": "\u5BF9\u65B9\u540D\u5B57", "relation": "\u5173\u7CFB\u63CF\u8FF0", "intimacy": \u597D\u611F\u5EA6(-100\u5230100), "description": "\u5173\u7CFB\u7B80\u8FF0"}]
- tags: \u6807\u7B7E\u6570\u7EC4\uFF0C\u5982["\u4FEE\u4ED9\u8005","\u51B7\u9177","\u5251\u5BA2"]

\u8FD4\u56DEJSON\u683C\u5F0F\uFF1A
{
  "characters": [
    {
      "name": "\u5F20\u4E09",
      "aliases": ["\u4E09\u54E5"],
      "role": "protagonist",
      "personality": "\u6C89\u7A33\u5185\u655B\uFF0C\u91CD\u60C5\u91CD\u4E49\uFF0C\u5076\u5C14\u51B2\u52A8",
      "speechStyle": "\u7B80\u6D01\u6709\u529B\uFF0C\u5076\u5C14\u5E26\u70B9\u51B7\u5E7D\u9ED8",
      "background": "\u9752\u4E91\u95E8\u9996\u5E2D\u5F1F\u5B50\uFF0C\u81EA\u5E7C\u88AB\u5E08\u7236\u6536\u517B\uFF0C\u8EAB\u4E16\u6210\u8C1C",
      "appearance": "\u4E00\u88AD\u9752\u886B\uFF0C\u8170\u95F4\u4F69\u5251\uFF0C\u5251\u7709\u661F\u76EE",
      "relationships": [
        {"targetCharacterName": "\u5E08\u7236\u7384\u6E05", "relation": "\u5E08\u5F92", "intimacy": 80, "description": "\u4EA6\u5E08\u4EA6\u7236\uFF0C\u611F\u60C5\u6DF1\u539A"}
      ],
      "tags": ["\u4FEE\u4ED9\u8005", "\u5251\u4FEE", "\u5B64\u513F"]
    }
  ],
  "analysis": "\u4E00\u53E5\u8BDD\u603B\u7ED3\u8FD9\u672C\u5C0F\u8BF4\u7684\u89D2\u8272\u683C\u5C40"
}

\u89C4\u5219\uFF1A
1. \u53EA\u63D0\u53D6\u6709\u540D\u6709\u59D3\u7684\u89D2\u8272\uFF08\u59D3\u540D\u6216\u56FA\u5B9A\u79F0\u8C13\uFF09\uFF0C\u4E0D\u8981\u63D0\u53D6"\u8DEF\u4EBA\u7532""\u5E97\u5C0F\u4E8C"\u8FD9\u7C7B\u4E00\u6B21\u6027\u9F99\u5957
2. \u4E3B\u89D2\u6700\u591A2\u4E2A\uFF0C\u91CD\u8981\u914D\u89D2\u4E0D\u8D85\u8FC78\u4E2A
3. \u5173\u7CFB\u53EA\u6807\u6CE8\u89D2\u8272\u4E4B\u95F4\u7684\u5173\u7CFB\uFF0C\u4E0D\u8981\u7F16\u9020
4. \u6027\u683C/\u8BF4\u8BDD\u98CE\u683C/\u80CC\u666F\u8981\u57FA\u4E8E\u6587\u672C\u63A8\u65AD\uFF0C\u65E0\u6CD5\u786E\u5B9A\u5C31\u586B"\u672A\u77E5"
5. \u522B\u540D\u5305\u62EC\uFF1A\u5916\u53F7\u3001\u5C0A\u79F0\u3001\u5316\u540D\u7B49`
        },
        {
          role: "user",
          content: `\u5C0F\u8BF4\u6807\u9898\uFF1A${bookTitle || "\u672A\u77E5"}

\u5C0F\u8BF4\u5185\u5BB9\uFF08\u6458\u8981\uFF09\uFF1A
${fullText}`
        }
      ]
    });
    const data = JSON.parse(result || '{"characters":[]}');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message, code: "AI_ERROR" });
  }
});

// backend/routes/file.routes.ts
var import_express3 = require("express");
var fileRouter = (0, import_express3.Router)();
fileRouter.post("/files/save", async (_req, res) => {
  res.json({ success: true });
});
fileRouter.get("/files/read", async (_req, res) => {
  res.json({ success: true, message: "Client-side storage handles file reads" });
});

// backend/middleware/request-logger.ts
function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl } = req;
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const level = statusCode >= 500 ? "ERROR" : statusCode >= 400 ? "WARN" : "INFO";
    const ts = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19);
    console.log(
      `[${ts}] ${level} ${method} ${originalUrl} \u2192 ${statusCode} (${duration}ms)`
    );
  });
  next();
}
function printRoutes(routes) {
  console.log("\n   \u{1F4E1} API \u8DEF\u7531:");
  const maxLen = Math.max(...routes.map((r) => `${r.method} ${r.path}`.length));
  for (const r of routes) {
    const route = `${r.method} ${r.path}`;
    console.log(`   ${route.padEnd(maxLen + 2)} ${r.description}`);
  }
  console.log("");
}

// backend/middleware/error-handler.ts
function errorHandler(err, _req, res, _next) {
  console.error(`[ERROR] Unhandled error: ${err.message}`, err.stack);
  if (res.headersSent) {
    return;
  }
  res.status(500).json({
    error: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF",
    code: "INTERNAL",
    message: process.env.NODE_ENV === "production" ? void 0 : err.message
  });
}

// backend/server.ts
var import_path = __toESM(require("path"), 1);
var import_fs = require("fs");
var app = (0, import_express4.default)();
var PORT = Number(process.env.PORT) || 3001;
var isProduction = process.env.NODE_ENV === "production";
var distDir = import_path.default.resolve(process.cwd(), "dist");
app.use((0, import_cors.default)({
  origin: isProduction ? process.env.CORS_ORIGIN || "http://localhost:5173" : true,
  // allow all origins in dev (including LAN)
  credentials: true
}));
app.use(import_express4.default.json({ limit: "10mb" }));
app.use(requestLogger);
app.use("/api", systemRouter);
app.use("/api", aiRouter);
app.use("/api", fileRouter);
app.use(import_express4.default.static(distDir));
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    const indexPath = import_path.default.join(distDir, "index.html");
    if ((0, import_fs.existsSync)(indexPath)) {
      res.sendFile(indexPath);
      return;
    }
  }
  next();
});
app.use(errorHandler);
app.listen(PORT, () => {
  const staticServing = (0, import_fs.existsSync)(distDir);
  console.log(`
\u{1F527} AI\u5199\u4F5C\u5F15\u64CE\u540E\u7AEF\u5DF2\u542F\u52A8 \u2192 http://localhost:${PORT}
`);
  console.log(`   \u6A21\u5F0F: ${isProduction ? "\u751F\u4EA7" : "\u5F00\u53D1"}`);
  console.log(`   CORS: ${isProduction ? process.env.CORS_ORIGIN || "http://localhost:5173" : "\u5141\u8BB8\u5168\u90E8\uFF08\u542B\u5C40\u57DF\u7F51\uFF09"}`);
  if (staticServing) {
    console.log(`   \u9759\u6001\u6587\u4EF6: dist/`);
    console.log(`   \u{1F310} \u6253\u5F00\u6D4F\u89C8\u5668: http://localhost:${PORT}`);
  }
  printRoutes([
    { method: "GET", path: "/api/health", description: "\u5065\u5EB7\u68C0\u67E5" },
    { method: "GET", path: "/api/models", description: "\u5382\u5546+\u6A21\u578B\u5217\u8868 (7\u538220+\u6A21\u578B)" },
    { method: "POST", path: "/api/ai/continue", description: "AI \u7EED\u5199 (SSE \u6D41\u5F0F)" },
    { method: "POST", path: "/api/ai/outline/analyze", description: "\u5927\u7EB2\u5206\u6790\u8BC4\u5206" },
    { method: "POST", path: "/api/ai/outline/generate", description: "\u4E00\u952E\u751F\u6210\u5927\u7EB2" },
    { method: "POST", path: "/api/ai/outline/reverse", description: "\u53CD\u5411\u63D0\u53D6\u5927\u7EB2" },
    { method: "POST", path: "/api/ai/de-ai", description: "\u53BB AI \u5473\u6DA6\u8272" },
    { method: "POST", path: "/api/ai/role-chat", description: "\u89D2\u8272\u5BF9\u8BDD (SSE \u6D41\u5F0F)" },
    { method: "POST", path: "/api/ai/bond-analyze", description: "\u60C5\u7F18\u597D\u611F\u5206\u6790" },
    { method: "POST", path: "/api/ai/extract-characters", description: "AI \u89D2\u8272\u667A\u80FD\u63D0\u53D6" },
    { method: "POST", path: "/api/files/save", description: "\u6587\u4EF6\u4FDD\u5B58 (PWA \u900F\u4F20)" },
    { method: "GET", path: "/api/files/read", description: "\u6587\u4EF6\u8BFB\u53D6 (PWA \u900F\u4F20)" }
  ]);
  console.log(`   \u540E\u7AEF\u7248\u672C: 1.0.0 (\u6A21\u5757\u5316\u67B6\u6784)
`);
});
var server_default = app;
