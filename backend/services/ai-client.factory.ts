import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// ── Types ──
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  messages: ChatMessage[];
}

/**
 * Unified AI client that routes to the correct provider SDK.
 *
 * - OpenAI-compatible (DeepSeek/Qwen/Zhipu/Moonshot/OpenAI/custom): uses `openai` SDK
 * - Anthropic (Claude): uses `@anthropic-ai/sdk`, auto-converts message format
 */
export interface AiClient {
  /** Non-streaming chat — returns full response text */
  chat(options: ChatOptions): Promise<string>;

  /** Streaming chat — AsyncGenerator that yields content deltas */
  streamChat(options: ChatOptions): AsyncGenerator<string, void, unknown>;

  /** Provider this client is bound to */
  provider: string;
}

// ── Factory ──
export function createAiClient(params: {
  apiKey: string;
  baseUrl?: string;
  provider: string;
}): AiClient {
  if (params.provider === 'anthropic') {
    return createAnthropicClient(params.apiKey, params.baseUrl);
  }
  return createOpenAiCompatibleClient(params.apiKey, params.baseUrl);
}

// ── OpenAI-compatible client ──
function createOpenAiCompatibleClient(apiKey: string, baseUrl?: string): AiClient {
  const client = new OpenAI({
    apiKey,
    baseURL: baseUrl || 'https://api.deepseek.com',
    timeout: 120000,
    maxRetries: 1,
  });

  return {
    provider: 'openai-compatible',

    async chat(options: ChatOptions): Promise<string> {
      const completion = await client.chat.completions.create({
        model: options.model,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        messages: options.messages as any,
      });
      return completion.choices[0]?.message?.content || '';
    },

    async *streamChat(options: ChatOptions): AsyncGenerator<string, void, unknown> {
      const stream = await client.chat.completions.create({
        model: options.model,
        temperature: options.temperature ?? 0.8,
        max_tokens: options.maxTokens ?? 2048,
        messages: options.messages as any,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = (chunk.choices[0]?.delta as any)?.content;
        if (delta) yield delta as string;
      }
    },
  };
}

// ── Anthropic (Claude) client ──
function createAnthropicClient(apiKey: string, baseUrl?: string): AiClient {
  const client = new Anthropic({
    apiKey,
    baseURL: baseUrl || 'https://api.anthropic.com',
    timeout: 120000,
    maxRetries: 1,
  });

  return {
    provider: 'anthropic',

    async chat(options: ChatOptions): Promise<string> {
      const { system, messages } = extractSystemAndMessages(options.messages);

      // Anthropic doesn't support response_format, but the calling code
      // includes JSON instructions in the system prompt
      const message = await client.messages.create({
        model: options.model,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
        system: system || undefined,
        messages: messages as Array<{ role: 'user' | 'assistant'; content: string }>,
      });

      // Extract text from first content block
      const textBlock = message.content.find((block) => block.type === 'text');
      return (textBlock as any)?.text || '';
    },

    async *streamChat(options: ChatOptions): AsyncGenerator<string, void, unknown> {
      const { system, messages } = extractSystemAndMessages(options.messages);

      const stream = client.messages.stream({
        model: options.model,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.8,
        system: system || undefined,
        messages: messages as Array<{ role: 'user' | 'assistant'; content: string }>,
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield event.delta.text;
        }
      }
    },
  };
}

// ── Helper: extract system message(s) for Anthropic ──
function extractSystemAndMessages(allMessages: ChatMessage[]): {
  system: string;
  messages: ChatMessage[];
} {
  const systemParts: string[] = [];
  const messages: ChatMessage[] = [];

  for (const msg of allMessages) {
    if (msg.role === 'system') {
      systemParts.push(msg.content);
    } else {
      // Anthropic only accepts 'user' | 'assistant'
      messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
    }
  }

  return { system: systemParts.join('\n\n'), messages };
}

// ── Determine provider from model ID ──
export function detectProvider(modelId: string): string {
  if (modelId.startsWith('claude-')) return 'anthropic';
  if (modelId.startsWith('gpt-')) return 'openai';
  if (modelId.startsWith('qwen-')) return 'qwen';
  if (modelId.startsWith('glm-')) return 'zhipu';
  if (modelId.startsWith('moonshot-')) return 'moonshot';
  if (modelId.startsWith('deepseek-')) return 'deepseek';
  return 'custom';
}
