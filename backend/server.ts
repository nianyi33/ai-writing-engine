import express from 'express';
import cors from 'cors';
import { systemRouter } from './routes/system.routes';
import { aiRouter } from './routes/ai.routes';
import { fileRouter } from './routes/file.routes';
import { requestLogger, printRoutes } from './middleware/request-logger';
import { errorHandler } from './middleware/error-handler';

import path from 'path';
import { existsSync } from 'fs';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Use cwd (project root) — more reliable than import.meta.url with tsx
const distDir = path.resolve(process.cwd(), 'dist');

// ── Global middleware ──
app.use(cors({
  origin: isProduction
    ? (process.env.CORS_ORIGIN || 'http://localhost:5173')
    : true, // allow all origins in dev (including LAN)
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// ── Mount routes ──
app.use('/api', systemRouter);
app.use('/api', aiRouter);
app.use('/api', fileRouter);

// ── Static files + SPA fallback (after API routes) ──
// Use express.static with absolute path and fallback
app.use(express.static(distDir));
// SPA fallback: all non-/api GET requests → index.html
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    // express.static didn't find the file, serve index.html for SPA routing
    const indexPath = path.join(distDir, 'index.html');
    if (existsSync(indexPath)) {
      res.sendFile(indexPath);
      return;
    }
  }
  next();
});

// ── Global error handler (must be last) ──
app.use(errorHandler);

// ── Start ──
app.listen(PORT, () => {
  const staticServing = existsSync(distDir);
  console.log(`\n🔧 AI写作引擎后端已启动 → http://localhost:${PORT}\n`);
  console.log(`   模式: ${isProduction ? '生产' : '开发'}`);
  console.log(`   CORS: ${isProduction ? (process.env.CORS_ORIGIN || 'http://localhost:5173') : '允许全部（含局域网）'}`);
  if (staticServing) {
    console.log(`   静态文件: dist/`);
    console.log(`   🌐 打开浏览器: http://localhost:${PORT}`);
  }

  printRoutes([
    { method: 'GET', path: '/api/health', description: '健康检查' },
    { method: 'GET', path: '/api/models', description: '厂商+模型列表 (7厂20+模型)' },
    { method: 'POST', path: '/api/ai/continue', description: 'AI 续写 (SSE 流式)' },
    { method: 'POST', path: '/api/ai/outline/analyze', description: '大纲分析评分' },
    { method: 'POST', path: '/api/ai/outline/generate', description: '一键生成大纲' },
    { method: 'POST', path: '/api/ai/outline/reverse', description: '反向提取大纲' },
    { method: 'POST', path: '/api/ai/de-ai', description: '去 AI 味润色' },
    { method: 'POST', path: '/api/ai/role-chat', description: '角色对话 (SSE 流式)' },
    { method: 'POST', path: '/api/ai/bond-analyze', description: '情缘好感分析' },
    { method: 'POST', path: '/api/ai/extract-characters', description: 'AI 角色智能提取' },
    { method: 'POST', path: '/api/files/save', description: '文件保存 (PWA 透传)' },
    { method: 'GET', path: '/api/files/read', description: '文件读取 (PWA 透传)' },
  ]);

  console.log(`   后端版本: 1.0.0 (模块化架构)\n`);
});

export default app;
