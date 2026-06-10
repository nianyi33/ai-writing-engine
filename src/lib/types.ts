// ── Works ──
export interface Work {
  id: string;
  title: string;
  type: 'novel' | 'short' | 'essay';
  description: string;
  coverImage?: string;
  wordCount: number;
  chapterCount: number;
  createdAt: number;
  updatedAt: number;
}

// ── Chapters ──
export interface Chapter {
  id: string;
  workId: string;
  title: string;
  content: string;
  wordCount: number;
  order: number;
  status: 'draft' | 'writing' | 'done';
  createdAt: number;
  updatedAt: number;
}

// ── Versions ──
export interface ChapterVersion {
  id: string;
  chapterId: string;
  content: string;
  contentHash: string;
  trigger: 'manual' | 'ai_before_modify' | 'auto_save';
  description: string;
  timestamp: number;
  sequence: number;
}

// ── Outline ──
export interface OutlineNode {
  id: string;
  workId: string;
  parentId: string | null;
  type: 'volume' | 'chapter' | 'section' | 'scene';
  title: string;
  summary: string;
  status: 'planned' | 'writing' | 'done';
  order: number;
  aiScore?: OutlineScore;
}

export interface OutlineScore {
  total: number;
  dimensions: {
    completeness: number;
    pacing: number;
    conflict: number;
    characterGrowth: number;
    logic: number;
  };
  suggestions: string[];
}

// ── Characters ──
export interface Character {
  id: string;
  workId: string;
  name: string;
  aliases: string[];
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  personality: string;
  speechStyle: string;
  background: string;
  appearance: string;
  relationships: CharacterRelation[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CharacterRelation {
  targetCharacterId: string;
  relation: string;
  intimacy: number;
  description: string;
}

// ── World Settings ──
export interface WorldSetting {
  id: string;
  workId: string;
  category: 'geography' | 'history' | 'magic' | 'technology' | 'culture' | 'other';
  title: string;
  content: string;
  tags: string[];
}

// ── Bonds ──
export interface BondRecord {
  id: string;
  characterId: string;
  chapterId?: string;
  event: string;
  intimacyDelta: number;
  intimacyAfter: number;
  memo: string;
  timestamp: number;
}

// ── AI ──
export interface AiConversation {
  id: string;
  workId?: string;
  characterId?: string;
  scenario: 'continue' | 'outline_analysis' | 'de_ai' | 'role_chat' | 'reverse_outline';
  messages: AiMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens: number;
  timestamp: number;
}

// ── Settings ──
export interface UserSettings {
  apiKeys: ApiKeyEntry[];
  activeModel: string;          // 全局模型 ID — 所有功能共用
  temperature: number;          // 全局 temperature
  maxTokens: number;            // 全局 max tokens
  theme: 'dark' | 'light';
  fontSize: number;
  autoSaveInterval: number;
  writingStyle: string;
}

export interface ApiKeyEntry {
  provider: string;
  key: string;
  baseUrl: string;
}

// ── Stats ──
export interface WritingStats {
  dailyCounts: { date: string; words: number }[];
  sessionStart: number;
  sessionWords: number;
  streakDays: number;
}

// ── Branch (分支结局) ──
export interface StoryBranch {
  id: string;
  workId: string;
  name: string;
  description: string;
  forkChapterId: string;
  forkPosition: number;
  parentBranchId: string | null;
  chapters: BranchChapter[];
  createdAt: number;
  updatedAt: number;
}

export interface BranchChapter {
  id: string;
  title: string;
  content: string;
  summary: string;
  order: number;
  status: 'draft' | 'writing' | 'done';
}
