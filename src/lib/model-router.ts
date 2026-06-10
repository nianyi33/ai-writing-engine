import type { UserSettings } from './types';
import { PROVIDERS_WITH_MODELS, MODELS } from '../../shared/models';
import type { SharedModel, SharedProvider } from '../../shared/models';

export type { SharedModel as ModelInfo, SharedProvider as ProviderInfo };
export const PROVIDERS = PROVIDERS_WITH_MODELS;

// ── Flat model list ──
export const AVAILABLE_MODELS = MODELS;

// ── Provider lookup helpers ──
export function getProvider(id: string): SharedProvider | undefined {
  return PROVIDERS.find(p => p.id === id);
}

export function getProviderForModel(modelId: string): string {
  const model = MODELS.find(m => m.id === modelId);
  return model?.provider || 'custom';
}

export function getDefaultBaseUrl(provider: string): string {
  return getProvider(provider)?.baseUrl || 'https://api.openai.com/v1';
}

/**
 * Get the global model config — one model for ALL scenarios
 * Resolves provider from the active model, then looks up the matching API key
 */
export function getGlobalModelConfig(settings: UserSettings) {
  const modelId = settings.activeModel || 'deepseek-chat';
  const provider = getProviderForModel(modelId);
  const apiKeyEntry = settings.apiKeys.find(k => k.provider === provider);

  return {
    model: modelId,
    temperature: settings.temperature ?? 0.8,
    maxTokens: settings.maxTokens ?? 2048,
    provider,
    apiKey: apiKeyEntry?.key || '',
    baseUrl: apiKeyEntry?.baseUrl || getDefaultBaseUrl(provider),
  };
}
