import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Character, CharacterRelation, WorldSetting } from '../lib/types';
import { getCharactersByWork, getWorldSettingsByWork, saveCharacter, deleteCharacter as delChar, saveWorldSetting, deleteWorldSetting } from '../lib/storage';

interface RoleState {
  characters: Character[];
  worldSettings: WorldSetting[];
  selectedCharacterId: string | null;
  loaded: boolean;

  loadAll: (workId: string) => Promise<void>;
  selectCharacter: (id: string | null) => void;
  createCharacter: (workId: string, data: Partial<Character>) => Promise<Character>;
  updateCharacter: (id: string, data: Partial<Character>) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  addRelation: (charId: string, relation: CharacterRelation) => Promise<void>;
  removeRelation: (charId: string, targetId: string) => Promise<void>;
  addWorldSetting: (workId: string, data: Partial<WorldSetting>) => Promise<void>;
  updateWorldSetting: (id: string, data: Partial<WorldSetting>) => Promise<void>;
  removeWorldSetting: (id: string) => Promise<void>;
}

export const useRoleStore = create<RoleState>((set, get) => ({
  characters: [],
  worldSettings: [],
  selectedCharacterId: null,
  loaded: false,

  loadAll: async (workId) => {
    try {
      const [characters, worldSettings] = await Promise.all([
        getCharactersByWork(workId),
        getWorldSettingsByWork(workId),
      ]);
      set({ characters, worldSettings, loaded: true });
    } catch (err) {
      console.error('加载角色数据失败:', err);
      set({ loaded: true });
    }
  },

  selectCharacter: (id) => set({ selectedCharacterId: id }),

  createCharacter: async (workId, data) => {
    const now = Date.now();
    const char: Character = {
      id: uuid(),
      workId,
      name: data.name || '新角色',
      aliases: data.aliases || [],
      role: data.role || 'supporting',
      personality: data.personality || '',
      speechStyle: data.speechStyle || '',
      background: data.background || '',
      appearance: data.appearance || '',
      relationships: data.relationships || [],
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
    };
    await saveCharacter(char);
    set(s => ({ characters: [...s.characters, char] }));
    return char;
  },

  updateCharacter: async (id, data) => {
    const chars = get().characters;
    const idx = chars.findIndex(c => c.id === id);
    if (idx === -1) return;
    const updated = { ...chars[idx], ...data, updatedAt: Date.now() };
    await saveCharacter(updated);
    set({ characters: chars.map(c => (c.id === id ? updated : c)) });
  },

  deleteCharacter: async (id) => {
    await delChar(id);
    set(s => ({
      characters: s.characters.filter(c => c.id !== id),
      selectedCharacterId: s.selectedCharacterId === id ? null : s.selectedCharacterId,
    }));
  },

  addRelation: async (charId, relation) => {
    const chars = get().characters;
    const char = chars.find(c => c.id === charId);
    if (!char) return;
    const updated = {
      ...char,
      relationships: [...char.relationships, relation],
      updatedAt: Date.now(),
    };
    await saveCharacter(updated);
    set({ characters: chars.map(c => (c.id === charId ? updated : c)) });
  },

  removeRelation: async (charId, targetId) => {
    const chars = get().characters;
    const char = chars.find(c => c.id === charId);
    if (!char) return;
    const updated = {
      ...char,
      relationships: char.relationships.filter(r => r.targetCharacterId !== targetId),
      updatedAt: Date.now(),
    };
    await saveCharacter(updated);
    set({ characters: chars.map(c => (c.id === charId ? updated : c)) });
  },

  addWorldSetting: async (workId, data) => {
    const ws: WorldSetting = {
      id: uuid(),
      workId,
      category: data.category || 'other',
      title: data.title || '',
      content: data.content || '',
      tags: data.tags || [],
    };
    await saveWorldSetting(ws);
    set(s => ({ worldSettings: [...s.worldSettings, ws] }));
  },

  updateWorldSetting: async (id, data) => {
    const wss = get().worldSettings;
    const idx = wss.findIndex(w => w.id === id);
    if (idx === -1) return;
    const updated = { ...wss[idx], ...data };
    await saveWorldSetting(updated);
    set({ worldSettings: wss.map(w => (w.id === id ? updated : w)) });
  },

  removeWorldSetting: async (id) => {
    await deleteWorldSetting(id);
    set(s => ({ worldSettings: s.worldSettings.filter(w => w.id !== id) }));
  },
}));
