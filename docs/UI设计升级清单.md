# AI 写作引擎 — UI 设计升级清单

> 基于 impeccable audit + taste-skill + Product Register 标准  
> 目标：从"AI 生成的暗色工具"升级为"专业写作产品"

---

## 一、配色系统 — 彻底重构 🔴 P0

### 问题
- 深紫底 `#1a1a2e` + 红粉 `#e94560` = AI 配色第一页
- 71 处硬编码 hex，Tailwind token 和 Ant Design token 两套体系不统一
- `glass-card` 毛玻璃全局滥用

### 改法

| 项目 | 当前值 | 目标值 | 理由 |
|------|--------|--------|------|
| 主背景 | `#1a1a2e`（深紫） | `#0d0d0d` 或 `#111111`（纯暗灰） | 工具感，不带色偏 |
| 次级背景 | `#16213e`（深蓝） | `#1a1a1a` | 微妙层次，不跳色 |
| 卡片表面 | `#0f3460`（中蓝） | `#242424` | 同上 |
| hover 表面 | `#1a4a7a`（亮蓝） | `#2a2a2a` | 同上 |
| 强调色 | `#e94560`（红粉） | `#3b82f6`（蓝）或 `#a78bfa`（紫灰） | 单色强调，去掉骚红 |
| 成功色 | `#27ae60` | `#22c55e` | 更亮的绿 |
| 警告色 | `#f39c12` | `#f59e0b` | 更亮的橙 |
| 错误色 | `#e74c3c` | `#ef4444` | 更亮的红 |
| 正文 | `#e0e0e0` | `#e5e5e5` | 差不大 |
| 标题 | `#ffffff` | `#fafafa` | 稍柔 |
| 辅助文字 | `#a0a0b0` | `#737373` | 低对比度更干净 |
| 禁用文字 | `#606070` | `#525252` | 同上 |

### 执行
- [ ] 改 `tailwind.config.js` → `colors` 全部替换
- [ ] 改 `src/main.tsx` → Ant Design `ConfigProvider theme` 同步
- [ ] 改 `src/App.css` → 所有硬编码 hex 替换为 Tailwind class
- [ ] 改 `src/App.css` → `.glass-card` / `.glass-panel` 改为纯色卡片（去 backdrop-blur）
- [ ] 改 `.text-gradient` → 去掉渐变色，改为纯白色粗体
- [ ] 改 `.cm-editor` 相关硬编码色值
- [ ] 改 `.markdown-preview` 相关硬编码色值
- [ ] 改 Ant Design 覆写 `.ant-modal-content` 等硬编码

---

## 二、字体系统 🔴 P0

### 问题
- UI 字体用的是系统默认（PingFang / Microsoft YaHei），太普通
- 编辑器衬线体 `Source Han Serif SC` 很不错，保留

### 改法

| 用途 | 当前 | 目标 |
|------|------|------|
| UI 正文/按钮/标签 | PingFang SC / Microsoft YaHei | **Geist** 或 **Inter**（从 Google Fonts 加载） |
| 编辑器正文 | Source Han Serif SC ✅ | 保留 |
| 代码/等宽 | Cascadia Code ✅ | 保留 |
| 标题/Header | 同 UI 字体 | Geist **SemiBold (600)** |

### 执行
- [ ] `index.html` 里加 Google Fonts link：`Geist`（或本地引入 woff2）
- [ ] 改 `tailwind.config.js` → `fontFamily.ui` 加入 Geist
- [ ] 改 `tailwind.config.js` → 加 `fontWeight` 梯度：`medium: 500, semibold: 600`
- [ ] 全局标题加 `tracking-tight`（收紧字距）
- [ ] 正文行高统一 `leading-relaxed`（1.625）

---

## 三、布局 & 间距 🟡 P1

### 问题
- 卡片圆角统一 `rounded-lg`（8px），没有层次
- 间距偏紧，不够"呼吸"
- 内容区 `max-w-xl`（Settings）/ 无约束（Editor），不统一

### 改法

| 项目 | 当前 | 目标 |
|------|------|------|
| 内容区最大宽度 | 不统一 | `max-w-4xl`（896px）统一约束 |
| 页面 padding | `p-6`（24px） | `p-8 md:p-12`（32/48px） |
| 卡片内边距 | `p-4`（16px） | `p-5`（20px）或 `p-6`（24px） |
| 卡片间距 | `mb-4`（16px） | `mb-5`（20px） |
| 卡片圆角 | 统一 `rounded-lg` | 外层 `rounded-xl`、内层 `rounded-lg`、按钮 `rounded-md` |
| Section 间距 | 无 | 两个 section 之间 `mb-8` |

### 执行
- [ ] 所有页面加统一 `max-w-4xl mx-auto`
- [ ] 全局 padding 扩大一级
- [ ] 卡片圆角分层
- [ ] Section 间加分隔间距

---

## 四、组件状态 🟡 P1

### 问题
Product Register 要求每个可交互组件有 **7 个状态**：default / hover / focus / active / disabled / loading / error。当前大部分只有 default 和 hover。

### 改法

每个按钮/输入框/卡片/链接必须补齐：

| 状态 | 按钮 | 输入框 | 卡片 |
|------|:--:|:--:|:--:|
| default | ✅ 有 | ✅ 有 | ✅ 有 |
| hover | ✅ `brightness-110` | ✅ border 变色 | ✅ bg 变色 |
| focus | ❌ **缺** | ✅ `ring-1` | ❌ **缺** |
| active | ✅ `scale-[0.97]` | ❌ **缺** | ❌ **缺** |
| disabled | ✅ `opacity-50` | ❌ **缺** | - |
| loading | ❌ **缺** | ❌ **缺** | ❌ **缺** |
| error | ❌ **缺** | ❌ **缺** | ❌ **缺** |

### 执行
- [ ] 所有 button 加 `focus:outline-none focus:ring-2 focus:ring-accent/40`
- [ ] 输入框加 disabled 样式、error 样式（红边框）
- [ ] 按钮加 loading spinner + "处理中…"文字
- [ ] 错误状态加 inline 红色提示（不弹窗）

---

## 五、动效 🟡 P1

### 问题
- 用了 `transition-all`（性能差，触发 layout/paint）
- 无入场动画延迟（staggered entry）
- 无路由切换过渡

### 改法

#### 5.1 替换 `transition-all`

| 当前 | 改为 |
|------|------|
| `transition-all duration-200` | `transition-colors duration-200`（颜色变化） |
| 同上 | `transition-opacity duration-200`（显隐） |
| 同上 | `transition-transform duration-200`（位移/缩放） |

#### 5.2 微交互（impeccable product 标准：150–250ms）

- [ ] 按钮 press：`active:scale-[0.98]` + `active:translate-y-px`
- [ ] hover 卡片：`hover:translate-y-[-2px]` + 微 shadow
- [ ] 开关/切换：200ms ease-out
- [ ] 下拉菜单：展开 `animate-slide-up`（已有）

#### 5.3 路由切换

- [ ] 加 `AnimatePresence`（或纯 CSS）：页面切换 fade-in + slide-up，不要闪白

#### 5.4 入场动画 — Staggered Entry（taste-skill）

- [ ] 列表页（Home / Roles / Outline）：卡片依次出现，每个 delay 50ms
- [ ] 用 Tailwind `animate-fade-in` + `animation-delay` 或 CSS custom property

---

## 六、空状态 & Loading 状态 🟡 P1

### 问题
Product Register：空状态是"教用户用这个界面"，不是"这里什么都没有"。

### 当前缺的

| 位置 | 现状 | 要做什么 |
|------|------|---------|
| 首页 - 无作品 | 只有一个"新建作品"按钮 + 空白 | 加引导文案：**"开始你的第一部作品。AI 会帮你从大纲到完稿。"** + 插图/图标 |
| 编辑器 - 无章节 | 空白编辑器 | 加引导：**"点击左侧 + 创建第一个章节，或导入已有文档"** |
| 大纲 - 空 | 空白 | 加引导：**"还没有大纲？让 AI 根据你的梗概一键生成。"** + 按钮 |
| 角色 - 空 | 空白 | 加引导：**"创建你的第一个角色。AI 可以从正文中智能提取。"** |
| 情缘 - 空 | 空白 | 加提示 |
| 加载中 | 一个 `<Spin>` | 改成骨架屏（Skeleton），匹配卡片形状 |

### 执行
- [ ] 每个列表/面板加 Empty State 组件（含图标 + 引导文案 + CTA 按钮）
- [ ] 全局 Spin 换成 Skeleton（Ant Design 自带 `<Skeleton>` 组件）

---

## 七、语义 HTML & A11y 🟢 P2

### 问题
- 454 个 `<div>`，零 `<nav>` / `<main>` / `<section>` / `<article>`
- 零 ARIA 属性
- 无 skip-to-content

### 执行
- [ ] `AppShell.tsx` → `<header>` 改成 `<header>`（已经是）、`<main>` 包 `<Outlet>`
- [ ] 导航栏 → `<nav>` 包导航按钮
- [ ] Settings 卡片 → `<section>`
- [ ] 所有按钮 → 加 `aria-label`（尤其图标按钮）
- [ ] 加 skip-link：`<a href="#main-content" className="sr-only focus:not-sr-only">跳到内容</a>`
- [ ] Modal → 加 `role="dialog"` `aria-modal="true"`
- [ ] 所有图标按钮 → `aria-label="创建作品"` 之类

---

## 八、响应式 & 移动端 🟢 P2

### 问题
- 有基础 `hidden sm:inline` 断点，但不系统
- 触摸目标 < 44px（btn-ghost 只有 ~28px 高）
- 侧边栏在手机上怎么处理？当前直接隐藏了

### 执行
- [ ] 触摸目标最小 44x44px：`btn-ghost` 最小 `py-2.5`（10px）
- [ ] 移动端导航：底部 tab bar（`fixed bottom-0`）替代隐藏的顶栏
- [ ] 表单/输入框最小高度 44px
- [ ] 测试 375px 宽度（iPhone SE）：滚动、溢出、按钮可点击

---

## 九、细节打磨 🟢 P3

### 反 AI 味细节（taste-skill）

- [ ] 去掉 6px 超细滚动条 → 改成 8px 或浏览器默认
- [ ] `.ant-modal-content` 等覆写不要用 `!important`，改用 ConfigProvider
- [ ] 卡片 shadow 带颜色（`shadow-surface-card/20`），不是纯黑 shadow
- [ ] 去掉所有 `Exclamation marks in success messages`（"已保存！"→"已保存"）
- [ ] logo "AI写作引擎" 前的 ✍️ emoji 考虑换成 SVG 图标

### 文案

- [ ] 去掉 "AI 驱动" 等 buzzword
- [ ] 错误提示用主动语态："无法连接，请检查网络" 而不是 "连接失败"
- [ ] 统一称呼：不要混用 "创作/写作/编辑"

---

## 十、代码质量 🟢 P3

- [ ] 清理 `!important`（`App.css` 第 128-132 行）→ 用 ConfigProvider 或 CSS 优先级
- [ ] 检查所有 import 是否真实存在于 `package.json`
- [ ] `z-index` 建立 scale：`z-10`(topbar) / `z-20`(dropdown) / `z-30`(modal) / `z-40`(tooltip) / `z-50`(toast)
- [ ] 清除 dead code 和 注释掉的代码

---

## 执行顺序（按投入产出比）

```
配色 → 字体 → 按钮状态 → 毛玻璃去重 → 空状态 → 
动效 → 布局间距 → 响应式 → A11y → 细节打磨
```

| 阶段 | 内容 | 文件改动数 | 预计时间 |
|------|------|:--:|:--:|
| 第 1 轮 | 配色 + 字体 | 3 个文件 | 30 分钟 |
| 第 2 轮 | 按钮状态 + 去毛玻璃 | 2 个文件 | 20 分钟 |
| 第 3 轮 | 空状态组件 | 5-6 个页面 | 40 分钟 |
| 第 4 轮 | 动效 + 布局 | 2-3 个文件 | 30 分钟 |
| 第 5 轮 | A11y + 响应式 | 全局 | 40 分钟 |
| 第 6 轮 | 细节 + 文案 | 全局 | 20 分钟 |
