import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { BondRecord } from '../lib/types';
import { getBondsByCharacter, saveBondRecord } from '../lib/storage';

interface BondState {
  records: BondRecord[];
  loaded: boolean;
  loadBonds: (characterId: string) => Promise<void>;
  addRecord: (record: Omit<BondRecord, 'id' | 'intimacyAfter' | 'timestamp'>) => Promise<void>;
  getIntimacy: (characterId: string) => number;
  getBondHistory: (characterId: string) => BondRecord[];
}

export const useBondStore = create<BondState>((set, get) => ({
  records: [],
  loaded: false,

  loadBonds: async (characterId) => {
    try {
      const records = await getBondsByCharacter(characterId);
      set({ records, loaded: true });
    } catch (err) {
      console.error('加载情缘记录失败:', err);
      set({ loaded: true });
    }
  },

  addRecord: async (record) => {
    const records = get().records;
    const charRecords = records.filter(r => r.characterId === record.characterId);
    const lastRecord = charRecords[0];
    const intimacyAfter = (lastRecord?.intimacyAfter ?? 0) + record.intimacyDelta;

    const full: BondRecord = {
      id: uuid(),
      ...record,
      intimacyAfter,
      timestamp: Date.now(),
    };
    await saveBondRecord(full);
    set({ records: [full, ...records] });
  },

  getIntimacy: (characterId) => {
    const records = get().records;
    const latest = records.find(r => r.characterId === characterId);
    return latest?.intimacyAfter ?? 0;
  },

  getBondHistory: (characterId) => {
    return get().records.filter(r => r.characterId === characterId);
  },
}));
