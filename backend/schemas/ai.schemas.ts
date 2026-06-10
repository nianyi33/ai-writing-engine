import { z } from 'zod';

// ── Model Config ──
export const modelConfigSchema = z.object({
  model: z.string().min(1, '模型名称不能为空').default('deepseek-chat'),
  temperature: z.number().min(0).max(2).optional().default(0.8),
  maxTokens: z.number().min(1).max(128000).optional().default(2048),
});

// ── Common ──
const apiKeySchema = z.string().min(1, 'API Key 不能为空');
const baseUrlSchema = z.string().url('API 地址格式不正确').optional();

// ── AI Continue (streaming) ──
export const continueSchema = z.object({
  systemPrompt: z.string().min(1),
  context: z.string(),
  instruction: z.string(),
  modelConfig: modelConfigSchema.optional(),
  apiKey: apiKeySchema,
  baseUrl: baseUrlSchema,
});

// ── Outline Analyze ──
export const outlineAnalyzeSchema = z.object({
  outlineContent: z.string().min(1, '大纲内容不能为空'),
  modelConfig: modelConfigSchema.optional(),
  apiKey: apiKeySchema,
  baseUrl: baseUrlSchema,
});

// ── Outline Generate ──
export const outlineGenerateSchema = z.object({
  premise: z.string().min(1, '故事梗概不能为空'),
  modelConfig: modelConfigSchema.optional(),
  apiKey: apiKeySchema,
  baseUrl: baseUrlSchema,
});

// ── Reverse Outline ──
export const reverseOutlineSchema = z.object({
  content: z.string().min(1, '文本内容不能为空'),
  modelConfig: modelConfigSchema.optional(),
  apiKey: apiKeySchema,
  baseUrl: baseUrlSchema,
});

// ── De-AI ──
export const deAiSchema = z.object({
  text: z.string().min(1, '文本不能为空'),
  style: z.string().optional().default('网文风格'),
  modelConfig: modelConfigSchema.optional(),
  apiKey: apiKeySchema,
  baseUrl: baseUrlSchema,
});

// ── Role Chat (streaming) ──
export const roleChatSchema = z.object({
  characterInfo: z.object({
    name: z.string().min(1),
    personality: z.string(),
    speechStyle: z.string(),
    background: z.string(),
  }),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
  userMessage: z.string().min(1, '消息不能为空'),
  modelConfig: modelConfigSchema.optional(),
  apiKey: apiKeySchema,
  baseUrl: baseUrlSchema,
});

// ── Bond Analyze ──
export const bondAnalyzeSchema = z.object({
  characterName: z.string().min(1, '角色名不能为空'),
  interactionText: z.string().min(1, '互动内容不能为空'),
  currentIntimacy: z.number().min(-100).max(100),
  modelConfig: modelConfigSchema.optional(),
  apiKey: apiKeySchema,
  baseUrl: baseUrlSchema,
});

// ── Extract Characters ──
export const extractCharactersSchema = z.object({
  bookTitle: z.string().optional().default('未知'),
  chapters: z.array(z.object({
    title: z.string(),
    content: z.string(),
  })).min(1, '至少需要一个章节'),
  modelConfig: modelConfigSchema.optional(),
  apiKey: apiKeySchema,
  baseUrl: baseUrlSchema,
});

// ── Inferred type exports ──
export type ContinueRequest = z.infer<typeof continueSchema>;
export type OutlineAnalyzeRequest = z.infer<typeof outlineAnalyzeSchema>;
export type OutlineGenerateRequest = z.infer<typeof outlineGenerateSchema>;
export type ReverseOutlineRequest = z.infer<typeof reverseOutlineSchema>;
export type DeAiRequest = z.infer<typeof deAiSchema>;
export type RoleChatRequest = z.infer<typeof roleChatSchema>;
export type BondAnalyzeRequest = z.infer<typeof bondAnalyzeSchema>;
export type ExtractCharactersRequest = z.infer<typeof extractCharactersSchema>;
