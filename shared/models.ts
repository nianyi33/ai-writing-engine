// Single source of truth — used by both frontend (model-router.ts) and backend (system.routes.ts)

export interface SharedModel {
  id: string;
  name: string;
  provider: string;
  category: 'fast' | 'balanced' | 'powerful' | 'reasoning';
}

export interface SharedProvider {
  id: string;
  name: string;
  baseUrl: string;
  website: string;
  docsUrl: string;
}

export const PROVIDERS: SharedProvider[] = [
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', website: 'https://platform.deepseek.com', docsUrl: 'https://platform.deepseek.com/api-docs' },
  { id: 'qwen', name: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', website: 'https://dashscope.console.aliyun.com', docsUrl: 'https://help.aliyun.com/zh/model-studio' },
  { id: 'zhipu', name: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', website: 'https://open.bigmodel.cn', docsUrl: 'https://open.bigmodel.cn/dev/api' },
  { id: 'moonshot', name: '月之暗面 Kimi', baseUrl: 'https://api.moonshot.cn/v1', website: 'https://platform.moonshot.cn', docsUrl: 'https://platform.moonshot.cn/docs' },
  { id: 'anthropic', name: 'Anthropic Claude', baseUrl: 'https://api.anthropic.com', website: 'https://console.anthropic.com', docsUrl: 'https://docs.anthropic.com' },
  { id: 'openai', name: 'OpenAI GPT', baseUrl: 'https://api.openai.com/v1', website: 'https://platform.openai.com', docsUrl: 'https://platform.openai.com/docs' },
];

// Providers with their models (backward-compat for Settings UI)
export const PROVIDERS_WITH_MODELS = PROVIDERS.map(p => ({
  ...p,
  models: [] as SharedModel[],
}));

export const MODELS: SharedModel[] = [
  { id: 'deepseek-chat', name: 'DeepSeek V3', provider: 'deepseek', category: 'fast' },
  { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', provider: 'deepseek', category: 'powerful' },
  { id: 'deepseek-reasoner', name: 'DeepSeek R1', provider: 'deepseek', category: 'reasoning' },
  { id: 'qwen-turbo', name: 'Qwen Turbo', provider: 'qwen', category: 'fast' },
  { id: 'qwen-plus', name: 'Qwen Plus', provider: 'qwen', category: 'balanced' },
  { id: 'qwen-max', name: 'Qwen Max', provider: 'qwen', category: 'powerful' },
  { id: 'glm-4-flash', name: 'GLM-4 Flash', provider: 'zhipu', category: 'fast' },
  { id: 'glm-4', name: 'GLM-4', provider: 'zhipu', category: 'balanced' },
  { id: 'glm-4-plus', name: 'GLM-4 Plus', provider: 'zhipu', category: 'powerful' },
  { id: 'moonshot-v1-8k', name: 'Moonshot v1 (8K)', provider: 'moonshot', category: 'fast' },
  { id: 'moonshot-v1-32k', name: 'Moonshot v1 (32K)', provider: 'moonshot', category: 'balanced' },
  { id: 'moonshot-v1-128k', name: 'Moonshot v1 (128K)', provider: 'moonshot', category: 'powerful' },
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'anthropic', category: 'fast' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'anthropic', category: 'balanced' },
  { id: 'claude-opus-4-8', name: 'Claude Opus 4.8', provider: 'anthropic', category: 'powerful' },
  { id: 'gpt-5.5-instant', name: 'GPT-5.5 Instant', provider: 'openai', category: 'fast' },
  { id: 'gpt-5.4-thinking', name: 'GPT-5.4 Thinking', provider: 'openai', category: 'balanced' },
  { id: 'gpt-5.4-pro', name: 'GPT-5.4 Pro', provider: 'openai', category: 'powerful' },
];

// Backfill: populate PROVIDERS_WITH_MODELS.models from MODELS
for (const m of MODELS) {
  const p = PROVIDERS_WITH_MODELS.find(p => p.id === m.provider);
  if (p) p.models.push(m);
}
