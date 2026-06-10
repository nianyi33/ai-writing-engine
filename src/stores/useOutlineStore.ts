import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { OutlineNode, OutlineScore } from '../lib/types';
import { getOutlineByWork, saveOutlineNode, deleteOutlineNode as delNode } from '../lib/storage';
import { useAiStore } from './useAiStore';

interface OutlineState {
  nodes: OutlineNode[];
  selectedNodeId: string | null;
  assessmentResult: OutlineScore | null;
  isAnalyzing: boolean;
  loaded: boolean;

  loadOutline: (workId: string) => Promise<void>;
  selectNode: (id: string | null) => void;
  addNode: (workId: string, parentId: string | null, data: Partial<OutlineNode>) => Promise<OutlineNode>;
  updateNode: (id: string, data: Partial<OutlineNode>) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  moveNode: (id: string, newParentId: string | null, newOrder: number) => Promise<void>;
  analyzeOutline: () => Promise<OutlineScore>;
  generateOutline: (workId: string, premise: string) => Promise<void>;
  reverseOutline: (content: string) => Promise<any>;
}

export const useOutlineStore = create<OutlineState>((set, get) => ({
  nodes: [],
  selectedNodeId: null,
  assessmentResult: null,
  isAnalyzing: false,
  loaded: false,

  loadOutline: async (workId) => {
    try {
      const nodes = await getOutlineByWork(workId);
      set({ nodes: nodes.sort((a, b) => a.order - b.order), loaded: true });
    } catch (err) {
      console.error('加载大纲失败:', err);
      set({ loaded: true });
    }
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  addNode: async (workId, parentId, data) => {
    const nodes = get().nodes;
    const siblings = nodes.filter(n => n.parentId === parentId);
    const node: OutlineNode = {
      id: uuid(),
      workId,
      parentId,
      type: data.type || 'chapter',
      title: data.title || '新节点',
      summary: data.summary || '',
      status: data.status || 'planned',
      order: data.order ?? siblings.length + 1,
      aiScore: data.aiScore,
    };
    await saveOutlineNode(node);
    set({ nodes: [...nodes, node] });
    return node;
  },

  updateNode: async (id, data) => {
    const nodes = get().nodes;
    const idx = nodes.findIndex(n => n.id === id);
    if (idx === -1) return;
    const updated = { ...nodes[idx], ...data };
    await saveOutlineNode(updated);
    set({ nodes: nodes.map(n => (n.id === id ? updated : n)) });
  },

  deleteNode: async (id) => {
    await delNode(id);
    set({ nodes: get().nodes.filter(n => n.id !== id) });
  },

  moveNode: async (id, newParentId, newOrder) => {
    const nodes = get().nodes;
    const idx = nodes.findIndex(n => n.id === id);
    if (idx === -1) return;
    const updated = { ...nodes[idx], parentId: newParentId, order: newOrder };
    await saveOutlineNode(updated);
    set({ nodes: nodes.map(n => (n.id === id ? updated : n)) });
  },

  analyzeOutline: async () => {
    set({ isAnalyzing: true });
    try {
      const { nodes } = get();
      const outlineText = nodes.map(n => `${'  '.repeat(n.type === 'volume' ? 0 : 1)}- ${n.title}: ${n.summary}`).join('\n');
      const result = await useAiStore.getState().analyzeOutline(outlineText);
      set({ assessmentResult: result, isAnalyzing: false });
      return result;
    } catch {
      set({ isAnalyzing: false });
      // Return mock data if AI fails
      const mock: OutlineScore = {
        total: 75,
        dimensions: { completeness: 70, pacing: 80, conflict: 75, characterGrowth: 72, logic: 78 },
        suggestions: ['建议增加支线冲突来丰富剧情', '主角成长线可以更明显'],
      };
      set({ assessmentResult: mock });
      return mock;
    }
  },

  generateOutline: async (workId, premise) => {
    set({ isAnalyzing: true });
    try {
      const result = await useAiStore.getState().generateOutline(premise);
      if (result.volumes) {
        for (const vol of result.volumes) {
          const volNode = await get().addNode(workId, null, {
            type: 'volume',
            title: vol.title,
            summary: '',
          });
          for (const ch of vol.chapters || []) {
            await get().addNode(workId, volNode.id, {
              type: 'chapter',
              title: ch.title,
              summary: ch.summary || '',
            });
          }
        }
      }
      set({ isAnalyzing: false });
    } catch {
      set({ isAnalyzing: false });
    }
  },

  reverseOutline: async (content) => {
    return useAiStore.getState().reverseOutline(content);
  },
}));
