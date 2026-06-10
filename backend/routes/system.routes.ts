import { Router, Request, Response } from 'express';
import { PROVIDERS, MODELS } from '../../shared/models.js';

export const systemRouter = Router();

// ── Health check ──
systemRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ── Available models (single source from shared/models.ts) ──
systemRouter.get('/models', (_req: Request, res: Response) => {
  res.json({
    providers: PROVIDERS.map(({ id, name, baseUrl, website }) => ({ id, name, baseUrl, website })),
    models: MODELS,
  });
});
