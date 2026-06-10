import { Router, Request, Response } from 'express';
import { createAiClient, detectProvider } from '../services/ai-client.factory';
import {
  continueSchema, outlineAnalyzeSchema, outlineGenerateSchema,
  reverseOutlineSchema, deAiSchema, roleChatSchema,
  bondAnalyzeSchema, extractCharactersSchema,
} from '../schemas/ai.schemas';
import { validate } from '../middleware/validate';
import { rateLimiter } from '../middleware/rate-limiter';

export const aiRouter = Router();

// Apply rate limiting to all AI routes
aiRouter.use('/ai', rateLimiter(10));

// ── SSE helper ──
function setupSSE(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
}

// ── AI Continue (streaming) ──
aiRouter.post('/ai/continue', validate(continueSchema), async (req: Request, res: Response) => {
  try {
    const { systemPrompt, context, instruction, modelConfig, apiKey, baseUrl } = req.body;
    const provider = detectProvider(modelConfig?.model || 'deepseek-chat');
    const client = createAiClient({ apiKey, baseUrl, provider });

    setupSSE(res);

    const stream = client.streamChat({
      model: modelConfig?.model || 'deepseek-chat',
      temperature: modelConfig?.temperature ?? 0.8,
      maxTokens: modelConfig?.maxTokens ?? 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `【前文上下文】\n${context}\n\n【续写指令】\n${instruction}` },
      ],
    });

    for await (const token of stream) {
      res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'AI 请求失败', code: 'AI_ERROR' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', content: err.message })}\n\n`);
      res.end();
    }
  }
});

// ── Outline Analyze ──
aiRouter.post('/ai/outline/analyze', validate(outlineAnalyzeSchema), async (req: Request, res: Response) => {
  try {
    const { outlineContent, modelConfig, apiKey, baseUrl } = req.body;
    const provider = detectProvider(modelConfig?.model || 'deepseek-chat');
    const client = createAiClient({ apiKey, baseUrl, provider });

    const result = await client.chat({
      model: modelConfig?.model || 'deepseek-chat',
      temperature: 0.3,
      maxTokens: 4096,
      messages: [
        {
          role: 'system',
          content: `你是一位资深的网文编辑，擅长分析小说大纲的质量。请对以下大纲进行五维度评估，返回JSON。

评估维度（每项0-100分）：
- completeness：完整度（故事结构是否完整，起承转合是否齐全）
- pacing：节奏感（情节推进是否张弛有度）
- conflict：冲突密度（矛盾冲突是否足够密集和有力）
- characterGrowth：角色成长（角色是否有清晰的成长弧线）
- logic：逻辑严谨性（设定是否自洽，前后是否矛盾）

返回格式：
{
  "totalScore": 85,
  "dimensions": { "completeness": 80, "pacing": 90, "conflict": 75, "characterGrowth": 85, "logic": 90 },
  "suggestions": ["建议1", "建议2", "建议3"]
}`,
        },
        { role: 'user', content: outlineContent },
      ],
    });

    res.json(JSON.parse(result || '{}'));
  } catch (err: any) {
    res.status(500).json({ error: err.message, code: 'AI_ERROR' });
  }
});

// ── Outline Generate ──
aiRouter.post('/ai/outline/generate', validate(outlineGenerateSchema), async (req: Request, res: Response) => {
  try {
    const { premise, modelConfig, apiKey, baseUrl } = req.body;
    const provider = detectProvider(modelConfig?.model || 'deepseek-chat');
    const client = createAiClient({ apiKey, baseUrl, provider });

    const result = await client.chat({
      model: modelConfig?.model || 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 4096,
      messages: [
        {
          role: 'system',
          content: `你是一位资深网文大纲策划师。根据用户提供的故事梗概，生成一份完整的章节大纲。

返回JSON格式：
{
  "volumes": [
    {
      "title": "第一卷标题",
      "chapters": [
        { "title": "第1章 章节名", "summary": "本章内容概要，50字以内" }
      ]
    }
  ],
  "totalChapters": 30,
  "estimatedWords": "30万字"
}`,
        },
        { role: 'user', content: premise },
      ],
    });

    res.json(JSON.parse(result || '{}'));
  } catch (err: any) {
    res.status(500).json({ error: err.message, code: 'AI_ERROR' });
  }
});

// ── Reverse Outline ──
aiRouter.post('/ai/outline/reverse', validate(reverseOutlineSchema), async (req: Request, res: Response) => {
  try {
    const { content, modelConfig, apiKey, baseUrl } = req.body;
    const provider = detectProvider(modelConfig?.model || 'deepseek-chat');
    const client = createAiClient({ apiKey, baseUrl, provider });

    const result = await client.chat({
      model: modelConfig?.model || 'deepseek-chat',
      temperature: 0.3,
      maxTokens: 4096,
      messages: [
        {
          role: 'system',
          content: `你是一位文本结构分析师。请分析以下小说片段，提取其大纲结构。

返回JSON格式：
{
  "structure": [
    { "title": "章节/段落名", "type": "chapter|scene", "summary": "内容概要", "events": ["事件1", "事件2"], "characters": ["出现的角色"] }
  ],
  "overallAnalysis": "整体结构分析"
}`,
        },
        { role: 'user', content },
      ],
    });

    res.json(JSON.parse(result || '{}'));
  } catch (err: any) {
    res.status(500).json({ error: err.message, code: 'AI_ERROR' });
  }
});

// ── De-AI ──
aiRouter.post('/ai/de-ai', validate(deAiSchema), async (req: Request, res: Response) => {
  try {
    const { text, style, modelConfig, apiKey, baseUrl } = req.body;
    const provider = detectProvider(modelConfig?.model || 'deepseek-chat');
    const client = createAiClient({ apiKey, baseUrl, provider });

    const result = await client.chat({
      model: modelConfig?.model || 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 4096,
      messages: [
        {
          role: 'system',
          content: `你是一位专业的小说润色师，专门去除AI写作的机械感。请将以下文字改写为更自然的${style || '网文'}风格。

改写原则：
1. 打破过于规整的句式结构，长短句交错
2. 去除"首先、其次、然后、此外"等AI高频连接词
3. 将陈述句改为更有画面感的描写
4. 加入符合人物性格的内心独白或口语化表达
5. 保留原意和情节，只改语言风格

请直接输出改写后的文本，不要加任何解释。`,
        },
        { role: 'user', content: text },
      ],
    });

    res.json({ result });
  } catch (err: any) {
    res.status(500).json({ error: err.message, code: 'AI_ERROR' });
  }
});

// ── Role Chat (streaming) ──
aiRouter.post('/ai/role-chat', validate(roleChatSchema), async (req: Request, res: Response) => {
  try {
    const { characterInfo, history, userMessage, modelConfig, apiKey, baseUrl } = req.body;
    const provider = detectProvider(modelConfig?.model || 'deepseek-chat');
    const client = createAiClient({ apiKey, baseUrl, provider });

    setupSSE(res);

    const systemPrompt = `你现在扮演以下角色，请完全沉浸在这个角色中，用角色的口吻、性格和说话风格进行对话。

角色信息：
- 姓名：${characterInfo.name}
- 性格：${characterInfo.personality}
- 说话风格：${characterInfo.speechStyle}
- 背景：${characterInfo.background}

规则：
1. 始终保持在角色内，不要跳出来解释
2. 用角色的说话风格回应，不要用AI的口吻
3. 可以根据角色的性格表达情感（愤怒、喜悦、悲伤等）
4. 可以适当地推进剧情或展开新话题
5. 回复控制在200字以内，像正常对话一样`;

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];
    for (const m of (history || [])) {
      messages.push({ role: m.role, content: m.content });
    }
    messages.push({ role: 'user', content: userMessage });

    const stream = client.streamChat({
      model: modelConfig?.model || 'deepseek-chat',
      temperature: 0.9,
      maxTokens: 1024,
      messages,
    });

    for await (const token of stream) {
      res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message, code: 'AI_ERROR' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', content: err.message })}\n\n`);
      res.end();
    }
  }
});

// ── Bond Analyze ──
aiRouter.post('/ai/bond-analyze', validate(bondAnalyzeSchema), async (req: Request, res: Response) => {
  try {
    const { characterName, interactionText, currentIntimacy, modelConfig, apiKey, baseUrl } = req.body;
    const provider = detectProvider(modelConfig?.model || 'deepseek-chat');
    const client = createAiClient({ apiKey, baseUrl, provider });

    const result = await client.chat({
      model: modelConfig?.model || 'deepseek-chat',
      temperature: 0.3,
      maxTokens: 2048,
      messages: [
        {
          role: 'system',
          content: `你是一位情感分析师，专门分析小说角色之间的互动并量化好感度变化。

根据互动内容，判断好感度的变化方向（正值为增加好感，负值为降低好感），范围-10到+10。

返回JSON格式：
{
  "intimacyDelta": 3,
  "event": "简短描述触发好感变化的事件，15字以内",
  "memo": "AI生成的记忆点，一句话概括这次互动对关系的影响"
}`,
        },
        {
          role: 'user',
          content: `角色名：${characterName}\n当前好感度：${currentIntimacy}\n互动内容：${interactionText}`,
        },
      ],
    });

    res.json(JSON.parse(result || '{}'));
  } catch (err: any) {
    res.status(500).json({ error: err.message, code: 'AI_ERROR' });
  }
});

// ── Extract Characters ──
aiRouter.post('/ai/extract-characters', validate(extractCharactersSchema), async (req: Request, res: Response) => {
  try {
    const { bookTitle, chapters, modelConfig, apiKey, baseUrl } = req.body;
    const provider = detectProvider(modelConfig?.model || 'deepseek-chat');
    const client = createAiClient({ apiKey, baseUrl, provider });

    // Build a condensed text representation
    let fullText = '';
    const maxChars = 8000;
    const sliceCount = Math.min(chapters.length, 20);
    for (const ch of chapters.slice(0, 20)) {
      const snippet = ch.content.slice(0, Math.floor(maxChars / sliceCount));
      fullText += `\n--- 章节：${ch.title} ---\n${snippet}`;
      if (fullText.length > maxChars) break;
    }

    const result = await client.chat({
      model: modelConfig?.model || 'deepseek-chat',
      temperature: 0.3,
      maxTokens: 4096,
      messages: [
        {
          role: 'system',
          content: `你是一位资深文学编辑，擅长从小说文本中识别和整理角色信息。

请仔细阅读以下小说片段，提取出所有有名有姓的角色（包括只提到名字但未出场的角色）。

对于每个角色，你需要尽可能推断：
- name: 角色姓名
- aliases: 别名/绰号数组（如有）
- role: 角色定位，必须是以下之一：protagonist(主角), antagonist(对手/反派), supporting(重要配角), minor(次要角色/龙套)
- personality: 性格特征描述（从文本中的言行推断，50字以内）
- speechStyle: 说话风格（如有对话可推断，否则填"未知"，30字以内）
- background: 背景信息（从文本中提取，80字以内）
- appearance: 外貌描述（如有，否则填"未知"）
- relationships: 与其他角色的关系数组，格式 [{"targetCharacterName": "对方名字", "relation": "关系描述", "intimacy": 好感度(-100到100), "description": "关系简述"}]
- tags: 标签数组，如["修仙者","冷酷","剑客"]

返回JSON格式：
{
  "characters": [
    {
      "name": "张三",
      "aliases": ["三哥"],
      "role": "protagonist",
      "personality": "沉稳内敛，重情重义，偶尔冲动",
      "speechStyle": "简洁有力，偶尔带点冷幽默",
      "background": "青云门首席弟子，自幼被师父收养，身世成谜",
      "appearance": "一袭青衫，腰间佩剑，剑眉星目",
      "relationships": [
        {"targetCharacterName": "师父玄清", "relation": "师徒", "intimacy": 80, "description": "亦师亦父，感情深厚"}
      ],
      "tags": ["修仙者", "剑修", "孤儿"]
    }
  ],
  "analysis": "一句话总结这本小说的角色格局"
}

规则：
1. 只提取有名有姓的角色（姓名或固定称谓），不要提取"路人甲""店小二"这类一次性龙套
2. 主角最多2个，重要配角不超过8个
3. 关系只标注角色之间的关系，不要编造
4. 性格/说话风格/背景要基于文本推断，无法确定就填"未知"
5. 别名包括：外号、尊称、化名等`,
        },
        {
          role: 'user',
          content: `小说标题：${bookTitle || '未知'}\n\n小说内容（摘要）：\n${fullText}`,
        },
      ],
    });

    const data = JSON.parse(result || '{"characters":[]}');
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message, code: 'AI_ERROR' });
  }
});
