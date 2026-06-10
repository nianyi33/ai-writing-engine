import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { systemRouter } from '../routes/system.routes';
import { aiRouter } from '../routes/ai.routes';
import { fileRouter } from '../routes/file.routes';
import { errorHandler } from '../middleware/error-handler';
import { clearRateMap } from '../middleware/rate-limiter';

// ── Test app ──
function createTestApp() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use('/api', systemRouter);
  app.use('/api', aiRouter);
  app.use('/api', fileRouter);
  app.use(errorHandler);
  return app;
}

const app = createTestApp();

// Reset rate limiter state between tests
beforeEach(() => {
  clearRateMap();
});

describe('System Routes', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeTypeOf('number');
  });

  it('GET /api/models returns providers and models', async () => {
    const res = await request(app).get('/api/models');
    expect(res.status).toBe(200);
    expect(res.body.providers).toBeInstanceOf(Array);
    expect(res.body.models).toBeInstanceOf(Array);
    expect(res.body.providers.length).toBeGreaterThan(0);
    expect(res.body.models.length).toBeGreaterThan(0);

    // Check Anthropic provider exists
    const anthropic = res.body.providers.find((p: any) => p.id === 'anthropic');
    expect(anthropic).toBeDefined();

    // Check Claude models exist
    const claudeModels = res.body.models.filter((m: any) => m.provider === 'anthropic');
    expect(claudeModels.length).toBeGreaterThan(0);
  });
});

describe('Validation Middleware', () => {
  it('POST /api/ai/continue rejects empty body', async () => {
    const res = await request(app)
      .post('/api/ai/continue')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details).toBeInstanceOf(Array);
  });

  it('POST /api/ai/continue rejects missing apiKey', async () => {
    const res = await request(app)
      .post('/api/ai/continue')
      .send({
        systemPrompt: 'You are helpful',
        context: 'Some context',
        instruction: 'Continue writing',
        // missing apiKey
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/ai/outline/analyze rejects empty outlineContent', async () => {
    const res = await request(app)
      .post('/api/ai/outline/analyze')
      .send({
        outlineContent: '',
        apiKey: 'sk-test',
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/ai/de-ai rejects empty text', async () => {
    const res = await request(app)
      .post('/api/ai/de-ai')
      .send({
        text: '',
        apiKey: 'sk-test',
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/ai/role-chat rejects empty userMessage', async () => {
    const res = await request(app)
      .post('/api/ai/role-chat')
      .send({
        characterInfo: { name: 'Test', personality: 'Kind', speechStyle: 'Soft', background: 'Unknown' },
        userMessage: '',
        apiKey: 'sk-test',
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/ai/bond-analyze rejects invalid intimacy range', async () => {
    const res = await request(app)
      .post('/api/ai/bond-analyze')
      .send({
        characterName: 'Test',
        interactionText: 'Hello',
        currentIntimacy: 999, // out of range
        apiKey: 'sk-test',
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/ai/extract-characters rejects empty chapters', async () => {
    const res = await request(app)
      .post('/api/ai/extract-characters')
      .send({
        chapters: [],
        apiKey: 'sk-test',
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('File Routes', () => {
  it('POST /api/files/save returns success', async () => {
    const res = await request(app)
      .post('/api/files/save')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/files/read returns success', async () => {
    const res = await request(app).get('/api/files/read');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('AI Client Factory', () => {
  it('detectProvider identifies Anthropic models', async () => {
    const { detectProvider } = await import('../services/ai-client.factory');
    expect(detectProvider('claude-sonnet-4-6')).toBe('anthropic');
    expect(detectProvider('claude-opus-4-8')).toBe('anthropic');
    expect(detectProvider('claude-haiku-4-5')).toBe('anthropic');
  });

  it('detectProvider identifies other models', async () => {
    const { detectProvider } = await import('../services/ai-client.factory');
    expect(detectProvider('deepseek-chat')).toBe('deepseek');
    expect(detectProvider('qwen-max')).toBe('qwen');
    expect(detectProvider('gpt-5.5-instant')).toBe('openai');
    expect(detectProvider('glm-4')).toBe('zhipu');
    expect(detectProvider('moonshot-v1-8k')).toBe('moonshot');
    expect(detectProvider('unknown-model')).toBe('custom');
  });

  it('createAiClient returns Anthropic client for anthropic provider', async () => {
    const { createAiClient } = await import('../services/ai-client.factory');
    const client = createAiClient({
      apiKey: 'sk-ant-test',
      provider: 'anthropic',
    });
    expect(client.provider).toBe('anthropic');
  });

  it('createAiClient returns OpenAI-compatible client for other providers', async () => {
    const { createAiClient } = await import('../services/ai-client.factory');
    const client = createAiClient({
      apiKey: 'sk-test',
      provider: 'deepseek',
    });
    expect(client.provider).toBe('openai-compatible');
  });
});

describe('Zod Schema Defaults', () => {
  it('continueSchema applies defaults for modelConfig', async () => {
    const { continueSchema } = await import('../schemas/ai.schemas');
    const result = continueSchema.safeParse({
      systemPrompt: 'Test',
      context: 'Test',
      instruction: 'Test',
      apiKey: 'sk-test',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.modelConfig).toBeUndefined(); // optional, no default needed
    }
  });

  it('deAiSchema applies default style', async () => {
    const { deAiSchema } = await import('../schemas/ai.schemas');
    const result = deAiSchema.safeParse({
      text: 'Some text',
      apiKey: 'sk-test',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.style).toBe('网文风格');
    }
  });
});
