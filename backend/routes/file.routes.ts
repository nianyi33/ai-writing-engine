import { Router, Request, Response } from 'express';

export const fileRouter = Router();

// ── File save (pass-through — actual storage is client-side IndexedDB) ──
fileRouter.post('/files/save', async (_req: Request, res: Response) => {
  // In PWA mode: client-side IndexedDB handles storage
  // In Tauri mode: will integrate with @tauri-apps/plugin-fs
  res.json({ success: true });
});

// ── File read (pass-through) ──
fileRouter.get('/files/read', async (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Client-side storage handles file reads' });
});
