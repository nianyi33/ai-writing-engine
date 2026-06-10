import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { AiConversation, AiMessage, Character } from '../lib/types';
import { useSettingsStore } from './useSettingsStore';
import { getGlobalModelConfig } from '../lib/model-router';

interface AiState {
  conversations: Map<string, AiConversation>;
  currentConversationId: string | null;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  _abortController: AbortController | null;

  startConversation: (scenario: AiConversation['scenario'], config?: { characterId?: string; workId?: string }) => string;
  sendMessage: (content: string, systemPrompt?: string) => Promise<string>;
  streamContinue: (context: string, instruction: string) => Promise<void>;
  streamRoleChat: (characterInfo: any, history: any[], userMessage: string) => Promise<void>;
  analyzeOutline: (outlineContent: string) => Promise<any>;
  generateOutline: (premise: string) => Promise<any>;
  reverseOutline: (content: string) => Promise<any>;
  deAi: (text: string, style?: string) => Promise<string>;
  analyzeBond: (characterName: string, interactionText: string, currentIntimacy: number) => Promise<any>;
  extractCharacters: (bookTitle: string, chapters: { title: string; content: string }[]) => Promise<{ characters: Partial<Character>[]; analysis: string }>;
  stopStreaming: () => void;
  acceptSuggestion: (conversationId: string) => string;
  rejectSuggestion: (conversationId: string) => void;
  retryLast: () => Promise<void>;
}

// Shared SSE stream reader — handles abort, cleanup, and streamingContent accumulation
async function streamSSE(
  response: Response,
  signal: AbortSignal,
  onToken: (token: string) => void,
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('无法读取响应流');

  const decoder = new TextDecoder();
  let fullContent = '';

  try {
    signal.throwIfAborted();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      for (const line of text.split('\n')) {
        if (signal.aborted) { reader.cancel(); break; }
        if (!line.startsWith('data: ')) continue;

        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'token') {
            fullContent += data.content;
            onToken(fullContent);
          } else if (data.type === 'error') {
            throw new Error(data.content);
          }
        } catch (e) {
          if ((e as Error).message?.includes('data.content')) throw e;
          // Skip JSON parse errors for partial chunks
        }
      }
    }
  } finally {
    try { reader.cancel(); } catch {}
  }

  return fullContent;
}

// Generic fetch helper
async function aiFetch(path: string, body: Record<string, unknown>): Promise<any> {
  const config = getApiConfig();
  if (!config.apiKey) throw new Error('请先配置 API Key');

  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, apiKey: config.apiKey, baseUrl: config.baseUrl, modelConfig: { model: config.model, temperature: config.temperature, maxTokens: config.maxTokens } }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || '请求失败');
  }
  return res.json();
}

function getApiConfig() {
  const settings = useSettingsStore.getState().settings;
  return getGlobalModelConfig(settings);
}

function apiUrl(path: string): string {
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
  return isTauri ? `http://localhost:3001${path}` : path;
}

export const useAiStore = create<AiState>((set, get) => ({
  conversations: new Map(),
  currentConversationId: null,
  isStreaming: false,
  streamingContent: '',
  error: null,
  _abortController: null,

  startConversation: (scenario, config) => {
    const id = uuid();
    const conv: AiConversation = {
      id,
      workId: config?.workId,
      characterId: config?.characterId,
      scenario,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const conversations = new Map(get().conversations);
    conversations.set(id, conv);
    set({ conversations, currentConversationId: id, streamingContent: '', error: null });
    return id;
  },

  sendMessage: async (content, systemPrompt) => {
    const { currentConversationId, conversations } = get();
    if (!currentConversationId) return '';
    const conv = conversations.get(currentConversationId);
    if (!conv) return '';

    const userMsg: AiMessage = { role: 'user', content, tokens: content.length, timestamp: Date.now() };
    conv.messages.push(userMsg);

    try {
      const config = getApiConfig();
      if (!config.apiKey) {
        set({ error: '请先在设置中配置 API Key' });
        return '';
      }

      get().stopStreaming();
      const controller = new AbortController();
      set({ isStreaming: true, _abortController: controller });

      const response = await fetch(apiUrl('/api/ai/continue'), {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: systemPrompt || '',
          context: content,
          instruction: '',
          modelConfig: { model: config.model, temperature: config.temperature, maxTokens: config.maxTokens },
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
        }),
      });

      const fullContent = await streamSSE(response, controller.signal, (sc) => {
        set({ streamingContent: sc });
      });

      const assistantMsg: AiMessage = { role: 'assistant', content: fullContent, tokens: fullContent.length, timestamp: Date.now() };
      conv.messages.push(assistantMsg);
      conv.updatedAt = Date.now();
      set({ isStreaming: false, streamingContent: '' });
      return fullContent;
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        set({ isStreaming: false, error: e.message });
      } else {
        set({ isStreaming: false });
      }
      return '';
    }
  },

  streamContinue: async (context, instruction) => {
    // Abort any in-flight request
    get().stopStreaming();

    const controller = new AbortController();
    set({ isStreaming: true, streamingContent: '', error: null, _abortController: controller });

    try {
      const config = getApiConfig();
      if (!config.apiKey) {
        set({ error: '请先在设置中配置 API Key', isStreaming: false });
        return;
      }

      const response = await fetch(apiUrl('/api/ai/continue'), {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: '你是一个专业的网络小说续写助手。请根据前文内容和用户指令，用流畅自然的中文续写，保持文风一致。',
          context,
          instruction,
          modelConfig: { model: config.model, temperature: config.temperature, maxTokens: config.maxTokens },
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
        }),
      });

      await streamSSE(response, controller.signal, (fullContent) => {
        set({ streamingContent: fullContent });
      });

      set({ isStreaming: false });
    } catch (e: any) {
      if (e.name === 'AbortError') {
        set({ isStreaming: false, streamingContent: '' });
      } else {
        set({ isStreaming: false, error: e.message });
      }
    }
  },

  streamRoleChat: async (characterInfo, history, userMessage) => {
    get().stopStreaming();

    const controller = new AbortController();
    set({ isStreaming: true, streamingContent: '', error: null, _abortController: controller });

    try {
      const config = getApiConfig();
      if (!config.apiKey) {
        set({ error: '请先在设置中配置 API Key', isStreaming: false });
        return;
      }

      const response = await fetch(apiUrl('/api/ai/role-chat'), {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterInfo, history, userMessage,
          modelConfig: { model: config.model, temperature: config.temperature, maxTokens: config.maxTokens },
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
        }),
      });

      await streamSSE(response, controller.signal, (fullContent) => {
        set({ streamingContent: fullContent });
      });

      set({ isStreaming: false });
    } catch (e: any) {
      if (e.name === 'AbortError') {
        set({ isStreaming: false, streamingContent: '' });
      } else {
        set({ isStreaming: false, error: e.message });
      }
    }
  },

  analyzeOutline: async (outlineContent) => aiFetch('/api/ai/outline/analyze', { outlineContent }),

  generateOutline: async (premise) => aiFetch('/api/ai/outline/generate', { premise }),

  reverseOutline: async (content) => aiFetch('/api/ai/outline/reverse', { content }),

  deAi: async (text, style) => {
    set({ isStreaming: true, streamingContent: '', error: null });
    try {
      const data = await aiFetch('/api/ai/de-ai', { text, style });
      const result = data.result || '';
      set({ streamingContent: result, isStreaming: false });
      return result;
    } catch (e: any) {
      set({ isStreaming: false, error: e.message });
      return '';
    }
  },

  analyzeBond: async (characterName, interactionText, currentIntimacy) =>
    aiFetch('/api/ai/bond-analyze', { characterName, interactionText, currentIntimacy }),

  extractCharacters: async (bookTitle, chapters) =>
    aiFetch('/api/ai/extract-characters', { bookTitle, chapters, modelConfig: { model: getApiConfig().model, temperature: 0.3, maxTokens: 4096 } }),

  stopStreaming: () => {
    const { _abortController } = get();
    if (_abortController) {
      _abortController.abort();
    }
    set({ isStreaming: false, streamingContent: '', _abortController: null });
  },

  acceptSuggestion: (conversationId) => {
    const { streamingContent, conversations } = get();
    const conv = conversations.get(conversationId);
    const content = streamingContent || conv?.messages.filter(m => m.role === 'assistant').pop()?.content || '';
    return content;
  },

  rejectSuggestion: (conversationId) => {
    const conversations = new Map(get().conversations);
    conversations.delete(conversationId);
    set({ conversations, streamingContent: '' });
  },

  retryLast: async () => {
    const { currentConversationId, conversations } = get();
    if (!currentConversationId) return;
    const conv = conversations.get(currentConversationId);
    if (!conv || conv.messages.length < 2) return;
    // Remove last assistant message and retry
    conv.messages.pop();
    const lastUserMsg = conv.messages.filter(m => m.role === 'user').pop();
    if (lastUserMsg) {
      await get().sendMessage(lastUserMsg.content);
    }
  },
}));
