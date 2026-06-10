# Prompt 目录总览

## 设计原则

1. **角色化** — 每个 Prompt 定义一个清晰的 AI 角色和职责边界
2. **结构化输出** — 尽可能要求 JSON 输出，方便前端解析展示
3. **参数化** — 变量用 `{{placeholder}}` 标记，运行时动态注入
4. **防幻觉** — 明确禁止编造、要求基于输入内容

## 6 套核心 Prompt

| 编号 | 名称 | 场景 | 输出格式 | 推荐模型 |
|------|------|------|---------|---------|
| 01 | 续写助手 | 光标处续写 | Markdown 纯文本 | DeepSeek (快+便宜) |
| 02 | 大纲分析 | 大纲质量评估 | JSON (评分+建议) | Claude (分析能力强) |
| 03 | 反向大纲 | 成品提取结构 | JSON (树形大纲) | Claude |
| 04 | 去AI味 | 改写自然化 | Markdown 纯文本 | DeepSeek |
| 05 | 角色对话 | 扮演角色聊天 | 纯文本对话 | Claude (角色扮演强) |
| 06 | 情缘分值 | 分析互动分值 | JSON (分值+事件) | DeepSeek |

## 模型路由策略

```
用户场景                    →   推荐模型           →   Fallback
───────────────────────────────────────────────────────────
续写 (日常高频，需快)        →   DeepSeek-Chat     →   GPT-4o-mini
大纲分析 (需深度推理)        →   Claude-Sonnet     →   DeepSeek-R1
去AI味 (需语言敏感度)        →   Claude-Sonnet     →   DeepSeek-Chat
角色对话 (需创意+一致性)     →   Claude-Sonnet     →   GPT-4o
情缘分值 (需结构化+低价)     →   DeepSeek-Chat     →   GPT-4o-mini
反向大纲 (需理解力)          →   Claude-Sonnet     →   DeepSeek-Chat
```

> 具体 Prompt 内容见各编号文件。
