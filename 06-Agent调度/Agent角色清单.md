# Agent 角色清单

## 角色总览（10 个核心 + 5 个支援 = 15 个）

```
                         🔴 P0 铁三角 (每次参与)
        ┌──────────────────┼─────────────────────┐
  Senior Developer     Code Reviewer       Reality Checker
   (编码主执行者)       (代码审查)           (功能验证)

                         🟡 P1 开发层 (按阶段)
        ┌──────────────────┼─────────────────────┐
   Product Manager  Software Architect   Frontend Developer
    (需求梳理)         (架构设计)          (UI实现)

   Backend Architect Prompt Engineer     AI Engineer
    (后端+存储)         (6套Prompt)        (AI编排)

   UX Architect      UI Designer
    (交互设计)         (视觉设计)

                         🟢 P2 支援层 (按需)
        ┌──────────────────┼─────────────────────┐
   Brand Guardian   Security Architect  Database Optimizer
    (视觉一致)         (安全审计)           (存储优化)

   Accessibility     Performance
   Auditor           Benchmarker
    (无障碍)           (性能测试)
```

## 各角色详细说明

### Senior Developer
- **调用阶段**: Phase 2-6（全程）
- **职责**: 编写所有 React/TypeScript/Node 代码，协调前后端对接
- **输入**: 架构文档 + 设计稿
- **产出**: 可运行的前端页面 + 后端路由

### Code Reviewer
- **调用阶段**: 每个 Phase 结束时
- **职责**: 审查代码质量、类型安全、性能隐患、安全漏洞
- **输入**: 本轮改动的文件列表
- **产出**: 审查报告（分 P0/P1/P2 优先级）

### Reality Checker
- **调用阶段**: Phase 3-6（功能验证）
- **职责**: 实际启动应用，走通完整用户流程，确认功能可用
- **输入**: 部署好的开发环境
- **产出**: 验收报告（通过/不通过 + 问题截图）

### Product Manager
- **调用阶段**: Phase 1（需求梳理）
- **职责**: 定义 MVP 范围、用户故事、优先级排序
- **输入**: MuseAI 功能列表 + 用户画像
- **产出**: MVP功能清单 + 用户故事地图

### Software Architect
- **调用阶段**: Phase 1（架构设计）
- **职责**: 技术选型、模块划分、数据流设计
- **输入**: 现有项目代码 + 产品需求
- **产出**: 技术选型方案 + 模块架构图 + 数据模型定义

### Frontend Developer
- **调用阶段**: Phase 2 & 4-5
- **职责**: 所有前端页面、组件、路由、状态管理
- **输入**: 架构文档 + UI 设计规范
- **产出**: 可用的 React 应用

### Backend Architect
- **调用阶段**: Phase 2（基建）
- **职责**: Express 路由、本地存储集成、IndexedDB Schema
- **输入**: 架构文档
- **产出**: 可用的后端 API

### Prompt Engineer
- **调用阶段**: Phase 3（Prompt 工程）
- **职责**: 编写 6 套核心 System Prompt，确保输出稳定
- **输入**: 各场景需求说明
- **产出**: 6 套 Prompt 模板 + 参数说明

### AI Engineer
- **调用阶段**: Phase 3（AI 编排）
- **职责**: 多模型路由、SSE 流式集成、上下文管理优化、Token 计数
- **输入**: Prompt 模板
- **产出**: AI 调用层代码

### UX Architect
- **调用阶段**: Phase 5（交互设计）
- **职责**: 写作者工作流优化、信息架构、操作链路设计
- **输入**: 功能清单
- **产出**: 交互流程图 + 用户旅程地图

### UI Designer
- **调用阶段**: Phase 5（视觉设计）
- **职责**: 暗色主题、编辑器排版、组件视觉规范
- **输入**: UX 架构 + 现有设计系统
- **产出**: 色彩系统 + 排版规范 + 组件样式

### Security Architect
- **调用阶段**: Phase 6（安全审计）
- **职责**: API Key 存储安全、XSS 防护、数据传输加密
- **输入**: 完整代码
- **产出**: 安全审计报告

### Database Optimizer
- **调用阶段**: Phase 2 后按需
- **职责**: IndexedDB Schema 优化、索引设计、查询性能
- **输入**: 数据模型定义
- **产出**: 优化后的 Schema

### Performance Benchmarker
- **调用阶段**: Phase 4 后按需
- **职责**: 编辑器性能、大量文本渲染、内存泄漏检测
- **输入**: 运行中的应用
- **产出**: 性能报告 + 优化建议

### Brand Guardian
- **调用阶段**: Phase 5-6
- **职责**: 视觉一致性检查、品牌调性把控
- **输入**: UI 产出
- **产出**: 一致性审查报告

---

## 调度汇总

| Phase | 需要调用的 Agent |
|-------|-----------------|
| 1. 需求架构 | Product Manager → Software Architect |
| 2. 基建 | Frontend Developer ‖ Backend Architect → Code Reviewer |
| 3. AI核心 | Prompt Engineer ‖ AI Engineer → Reality Checker |
| 4. 功能串联 | Frontend Developer → Code Reviewer |
| 5. UI/UX | UX Architect → UI Designer → Frontend Developer |
| 6. 审查验收 | Code Reviewer → Reality Checker → Security Architect |

> 符号说明：`→` 串行依赖，`‖` 并行执行
