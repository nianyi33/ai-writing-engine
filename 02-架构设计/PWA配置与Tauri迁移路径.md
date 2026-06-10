# PWA 配置与 Tauri 迁移路径

## 目标

用户双击桌面图标打开，像普通软件一样使用。MVP 阶段用 PWA 达到 80% 体验，验证通过后加 Tauri 壳达到 100%。

---

## 阶段一：PWA（MVP 内置，零额外成本）

### 体验效果

```
Chrome/Edge 打开 localhost:3010
       ↓ 地址栏右侧出现安装图标 ─┤
       ↓ 点击"安装"              │  ← 浏览器自动检测 manifest
桌面生成快捷方式                   │
       ↓ 双击图标                 │
独立窗口启动（无地址栏/标签栏）    │
看起来 → 一个普通桌面应用          │
```

| 能做的 | 不能做的 |
|--------|---------|
| ✅ 桌面图标双击启动 | ❌ 系统托盘驻留 |
| ✅ 独立窗口无浏览器边框 | ❌ 全局快捷键注册 |
| ✅ 离线使用（IndexedDB 本地） | ❌ 文件关联（.md 文件右键"用AI写作引擎打开"） |
| ✅ 任务栏独立显示 | ❌ 开机自启 |
| ✅ 响应式窗口缩放 | ❌ 原生系统通知 |
| ✅ 自动更新（刷新即更新） | ❌ 最小化到托盘 |
| — | ❌ `File System Access API` 需用户手势触发 |
| — | ❌ 不能读取 `~/Documents` 之外的系统路径 |

### 实现步骤

#### 1. 创建 `manifest.json`

```json
{
  "name": "AI写作引擎",
  "short_name": "写作引擎",
  "description": "AI驱动的网络小说创作伴侣",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#e94560",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "categories": ["productivity", "utilities"],
  "lang": "zh-CN",
  "display_override": ["window-controls-overlay"],
  "edge_side_panel": {}
}
```

#### 2. 注册 Service Worker

```typescript
// src/sw.ts — Vite 构建时使用 vite-plugin-pwa
import { precacheAndRoute } from 'workbox-precaching';

// 预缓存静态资源
precacheAndRoute(self.__WB_MANIFEST);

// 离线回退：网络优先，失败则返回缓存
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
```

#### 3. Vite 配置 — `vite-plugin-pwa`

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AI写作引擎',
        short_name: '写作引擎',
        theme_color: '#e94560',
        background_color: '#1a1a2e',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // API 请求：网络优先
            urlPattern: /^\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 }
            }
          }
        ]
      }
    })
  ]
});
```

#### 4. npm 依赖

```bash
npm install -D vite-plugin-pwa workbox-precaching workbox-routing workbox-strategies
```

### 验证清单

- [ ] Chrome/Edge 打开页面，地址栏出现安装图标
- [ ] 点击安装后桌面生成快捷方式
- [ ] 双击桌面图标，独立窗口打开（无浏览器 UI）
- [ ] 断网后仍能打开应用（显示上次缓存内容）
- [ ] PWA 窗口中 IndexedDB 正常工作
- [ ] 需要在线功能时弹出"当前离线"提示

---

## 阶段二：Tauri 2 桌面壳（Phase 5+，加 3-5 天）

### 为什么 PWA 之后再加 Tauri

| 原因 | 说明 |
|------|------|
| **前端代码零改动** | Tauri 用 webview 渲染 React，6000+ 行前端代码全部复用 |
| **隔离验证** | 先确认产品有价值，再投入打包工作 |
| **学习曲线不阻塞 MVP** | Rust 编译链需要时间配置，不应拖慢第一版交付 |

### Tauri 2 带来的增量能力

| 能力 | PWA | Tauri | 写作场景价值 |
|------|-----|-------|-------------|
| 桌面图标 | ✅ | ✅ | — |
| 独立窗口 | ✅ | ✅ | — |
| 系统托盘 | ❌ | ✅ | 最小化到托盘，后台继续写 |
| 全局快捷键 | ❌ | ✅ | `Ctrl+Alt+W` 一键呼出写作窗口 |
| 文件关联 | ❌ | ✅ | `.md` 文件右键"用AI写作引擎打开" |
| 原生文件对话框 | ⚠️ | ✅ | 导入/导出体验更好 |
| 完整文件系统 | ⚠️ | ✅ | 自动扫描 `~/Documents/小说/` 所有 .md |
| 自动更新 | ❌ | ✅ | 版本更新自动下载安装 |
| 安装包 | ❌ | ✅ | `.exe` / `.dmg` 分发 |
| 包大小 | — | ~5MB | 极轻量 |

### Tauri 项目结构（新增部分）

```
code/
├── phase-5-writing/          ← React 前端（不变）
│   └── src/ ...
│
├── src-tauri/                ← 新增：Rust 后端壳
│   ├── Cargo.toml            ← Rust 依赖
│   ├── tauri.conf.json       ← 窗口配置
│   ├── capabilities/
│   │   └── default.json      ← 权限声明
│   ├── icons/                ← 应用图标
│   ├── src/
│   │   ├── main.rs           ← 入口
│   │   └── lib.rs            ← Tauri 命令注册
│   └── resources/            ← 打包资源
│
└── backend/                  ← Express 后端（可嵌入 Tauri sidecar）
```

### 核心 Rust 代码（最小可用）

```rust
// src-tauri/src/lib.rs
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // 启动时自动打开 Express 后端 sidecar
            // 或直接用 Rust 做后端（axum），不再需要 Node
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 迁移步骤

```
Step 1: 安装 Tauri CLI + Rust 工具链
   cargo install tauri-cli --version "^2"
   确认 rustc 版本 ≥ 1.77

Step 2: 在 phase-5-writing 目录下初始化 Tauri
   cd code/phase-5-writing
   npm install @tauri-apps/api @tauri-apps/cli
   npx tauri init

Step 3: 配置 tauri.conf.json
   - devUrl: "http://localhost:3010" (开发模式)
   - frontendDist: "../dist" (生产模式)
   - 窗口标题: "AI写作引擎"
   - 窗口大小: 1280x800, 最小 900x600

Step 4: 替换 File System Access API → Tauri fs plugin
   - 安装 @tauri-apps/plugin-fs
   - 将 fileSystem.ts 中的 File System Access API 调用替换为 Tauri API
   - 前端代码改动量 < 200 行

Step 5: Express → Rust axum（可选）
   - 保留 Express（作为 sidecar 子进程运行）
   - 或：用 Rust axum 重写 API 路由（约 500 行 Rust）
   - 推荐先保留 Express，后续按需迁移

Step 6: 编译打包
   npx tauri build
   输出：
     Windows → .msi / .exe (~5MB)
     macOS   → .dmg (~8MB)
     Linux   → .deb / .AppImage (~6MB)

Step 7: 代码签名 + 自动更新
   - Windows: 购买代码签名证书 → 签名 .exe
   - macOS: Apple Developer 证书 → 公证 .dmg
   - 自动更新: Tauri updater plugin
```

### Tauri 配置示例

```json
// src-tauri/tauri.conf.json
{
  "productName": "AI写作引擎",
  "version": "0.1.0",
  "identifier": "com.ai-writing-engine.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:3010",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "title": "AI写作引擎",
        "width": 1280,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600,
        "center": true
      }
    ],
    "security": {
      "csp": null
    },
    "withGlobalTauri": true
  },
  "plugins": {
    "fs": {
      "scope": ["$DOCUMENT/AI写作引擎/**", "$DOCUMENT/小说/**"]
    },
    "updater": {
      "endpoints": ["https://releases.ai-writing-engine.com/latest.json"],
      "pubkey": "..."
    }
  }
}
```

### 迁移前后的代码量变化

| 层级 | PWA 阶段 | Tauri 阶段 | 增量 |
|------|---------|-----------|------|
| React 前端 | ~5000 行 | ~5200 行 | +200 行（Tauri API 适配） |
| Express 后端 | ~500 行 | ~500 行 | 不变（sidecar 模式） |
| Rust 层 | 0 | ~800 行 | +800 行（全新） |
| 配置/脚本 | 5 文件 | +8 文件 | +8 文件 |

---

## 双阶段对比总结

```
                   PWA                    Tauri 2
              ─────────────         ──────────────
开发成本          0                     3-5 天
安装体验         ⭐⭐⭐                  ⭐⭐⭐⭐⭐
文件系统         ⭐⭐⭐                  ⭐⭐⭐⭐⭐
系统集成         ⭐⭐                    ⭐⭐⭐⭐⭐
分发方式         浏览器安装               .exe / .dmg
适合阶段         MVP 验证                正式发布
```

**策略**: MVP 用 PWA 快速验证 → 确认产品有价值 → 加 Tauri 壳正式分发。
