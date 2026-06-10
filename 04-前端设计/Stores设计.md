# Stores 设计

使用 Zustand 5，每个 Store 一个文件，职责单一。

## Store 列表

### useWorksStore — 作品管理

```typescript
interface WorksState {
  works: Work[];
  currentWorkId: string | null;
  
  // Actions
  loadWorks: () => Promise<void>;
  createWork: (title: string, type: WorkType) => Promise<Work>;
  deleteWork: (id: string) => Promise<void>;
  renameWork: (id: string, title: string) => Promise<void>;
  setCurrentWork: (id: string) => void;
  importWork: (file: File) => Promise<Work>;
  exportWork: (id: string, format: 'epub' | 'txt') => Promise<void>;
}
```

### useEditorStore — 编辑器状态

```typescript
interface EditorState {
  currentChapter: Chapter | null;
  content: string;            // 当前编辑内容
  wordCount: number;          // 实时字数
  isDirty: boolean;           // 是否有未保存修改
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  
  // Actions
  loadChapter: (id: string) => Promise<void>;
  updateContent: (content: string) => void;
  saveChapter: () => Promise<void>;
  createChapter: (workId: string, title: string) => Promise<Chapter>;
  deleteChapter: (id: string) => Promise<void>;
  reorderChapter: (id: string, newOrder: number) => Promise<void>;
}
```

### useAiStore — AI 对话

```typescript
interface AiState {
  conversations: Map<string, AiConversation>;
  currentConversationId: string | null;
  isStreaming: boolean;
  streamingContent: string;     // 当前流式内容
  
  // Actions
  startConversation: (scenario: AiScenario, config?: { characterId?: string; workId?: string }) => string;
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  acceptSuggestion: (conversationId: string) => void;   // 接受 AI 建议 → 插入编辑器
  rejectSuggestion: (conversationId: string) => void;    // 拒绝
  retryLast: () => Promise<void>;
}
```

### useOutlineStore — 大纲

```typescript
interface OutlineState {
  nodes: OutlineNode[];
  selectedNodeId: string | null;
  assessmentResult: OutlineScore | null;
  isAnalyzing: boolean;
  
  // Actions
  loadOutline: (workId: string) => Promise<void>;
  addNode: (parentId: string | null, data: Partial<OutlineNode>) => void;
  updateNode: (id: string, data: Partial<OutlineNode>) => void;
  deleteNode: (id: string) => void;
  moveNode: (id: string, newParentId: string | null, newOrder: number) => void;
  analyzeOutline: () => Promise<OutlineScore>;
  generateOutline: (premise: string) => Promise<void>;
  reverseOutline: (content: string) => Promise<void>;
}
```

### useRoleStore — 角色卡片

```typescript
interface RoleState {
  characters: Character[];
  worldSettings: WorldSetting[];
  selectedCharacterId: string | null;
  
  // Actions
  loadCharacters: (workId: string) => Promise<void>;
  createCharacter: (data: Partial<Character>) => Promise<Character>;
  updateCharacter: (id: string, data: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  addRelation: (charId: string, relation: CharacterRelation) => void;
  // World Settings
  addWorldSetting: (data: Partial<WorldSetting>) => void;
  updateWorldSetting: (id: string, data: Partial<WorldSetting>) => void;
}
```

### useBondStore — 情缘

```typescript
interface BondState {
  records: BondRecord[];
  
  // Actions
  loadBonds: (characterId: string) => Promise<void>;
  addRecord: (record: Omit<BondRecord, 'id'>) => void;
  getIntimacy: (characterId: string) => number;    // 获取当前好感度
  getBondHistory: (characterId: string) => BondRecord[]; // 历史记录
}
```

### useSettingsStore — 设置

```typescript
interface SettingsState {
  settings: UserSettings;
  
  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  addApiKey: (entry: ApiKeyEntry) => void;
  removeApiKey: (provider: string) => void;
  addModelConfig: (config: ModelConfig) => void;
  updateModelConfig: (id: string, patch: Partial<ModelConfig>) => void;
  resetSettings: () => void;
}
```

### useStatsStore — 统计

```typescript
interface StatsState {
  dailyCounts: { date: string; words: number }[];
  sessionStart: number;
  sessionWords: number;
  streakDays: number;
  
  // Actions
  loadStats: (workId: string) => Promise<void>;
  trackWriting: (wordsAdded: number) => void;
  getTodayWords: () => number;
}
```

## Store 间通信

```
useAiStore.acceptSuggestion()
  → 调用 useEditorStore.updateContent()
  → 触发 useEditorStore.saveChapter()
  → useStatsStore.trackWriting()

useRoleStore.createCharacter()
  → useBondStore 初始化好感度为 0

useAiStore (角色对话模式)
  → 调用 useBondStore.addRecord()
```
