import { openDB, IDBPDatabase } from 'idb';
import type { Work, Chapter, ChapterVersion, OutlineNode, Character, WorldSetting, BondRecord, UserSettings, StoryBranch } from './types';

const DB_NAME = 'ai-writing-engine';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // ── v1: initial stores ──
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains('works')) {
          const worksStore = db.createObjectStore('works', { keyPath: 'id' });
          worksStore.createIndex('updatedAt', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('chapters')) {
          const chaptersStore = db.createObjectStore('chapters', { keyPath: 'id' });
          chaptersStore.createIndex('workId', 'workId');
          chaptersStore.createIndex('workId_order', ['workId', 'order']);
        }
        if (!db.objectStoreNames.contains('versions')) {
          const versionsStore = db.createObjectStore('versions', { keyPath: 'id' });
          versionsStore.createIndex('chapterId', 'chapterId');
          versionsStore.createIndex('chapterId_sequence', ['chapterId', 'sequence']);
        }
        if (!db.objectStoreNames.contains('outline')) {
          const outlineStore = db.createObjectStore('outline', { keyPath: 'id' });
          outlineStore.createIndex('workId', 'workId');
        }
        if (!db.objectStoreNames.contains('characters')) {
          const charsStore = db.createObjectStore('characters', { keyPath: 'id' });
          charsStore.createIndex('workId', 'workId');
        }
        if (!db.objectStoreNames.contains('worldSettings')) {
          const wsStore = db.createObjectStore('worldSettings', { keyPath: 'id' });
          wsStore.createIndex('workId', 'workId');
        }
        if (!db.objectStoreNames.contains('bonds')) {
          const bondsStore = db.createObjectStore('bonds', { keyPath: 'id' });
          bondsStore.createIndex('characterId', 'characterId');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      }

      // ── v2: storyBranches + new indices ──
      if (oldVersion < 2) {
        // New store: storyBranches (migrated from localStorage)
        if (!db.objectStoreNames.contains('storyBranches')) {
          const branchStore = db.createObjectStore('storyBranches', { keyPath: 'id' });
          branchStore.createIndex('workId', 'workId');
        }
        // New indices for performance
        const tx = db.transaction as any;
        // outline: parentId index for child lookup
        if (db.objectStoreNames.contains('outline')) {
          const outlineStore = tx.objectStore('outline');
          if (!outlineStore.indexNames.contains('parentId')) {
            outlineStore.createIndex('parentId', 'parentId');
          }
        }
        // worldSettings: category index
        if (db.objectStoreNames.contains('worldSettings')) {
          const wsStore = tx.objectStore('worldSettings');
          if (!wsStore.indexNames.contains('category')) {
            wsStore.createIndex('category', 'category');
          }
        }
        // chapters: updatedAt index for sort
        if (db.objectStoreNames.contains('chapters')) {
          const chStore = tx.objectStore('chapters');
          if (!chStore.indexNames.contains('updatedAt')) {
            chStore.createIndex('updatedAt', 'updatedAt');
          }
        }
      }
    },
  });

  return dbInstance;
}

// ── Works ──
export async function getAllWorks(): Promise<Work[]> {
  const db = await getDB();
  const works = await db.getAll('works');
  return works.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getWork(id: string): Promise<Work | undefined> {
  const db = await getDB();
  return db.get('works', id);
}

export async function saveWork(work: Work): Promise<void> {
  const db = await getDB();
  await db.put('works', { ...work, updatedAt: Date.now() });
}

export async function updateWorkField(id: string, patch: Partial<Work>): Promise<void> {
  const db = await getDB();
  const work = await db.get('works', id);
  if (work) {
    await db.put('works', { ...work, ...patch, updatedAt: Date.now() });
  }
}

export async function deleteWork(id: string): Promise<void> {
  const db = await getDB();
  const storeNames = ['chapters', 'versions', 'outline', 'characters', 'bonds', 'worldSettings', 'storyBranches', 'works'];
  const tx = db.transaction(storeNames, 'readwrite');

  const chapters = await tx.objectStore('chapters').getAll();
  for (const ch of chapters) {
    if (ch.workId !== id) continue;
    tx.objectStore('chapters').delete(ch.id);
    const allVersions = await tx.objectStore('versions').getAll();
    for (const v of allVersions) {
      if (v.chapterId === ch.id) tx.objectStore('versions').delete(v.id);
    }
  }

  const allOutline = await tx.objectStore('outline').getAll();
  for (const n of allOutline) {
    if (n.workId === id) tx.objectStore('outline').delete(n.id);
  }

  const allChars = await tx.objectStore('characters').getAll();
  for (const c of allChars) {
    if (c.workId === id) {
      tx.objectStore('characters').delete(c.id);
      const allBonds = await tx.objectStore('bonds').getAll();
      for (const b of allBonds) {
        if (b.characterId === c.id) tx.objectStore('bonds').delete(b.id);
      }
    }
  }

  for (const w of await tx.objectStore('worldSettings').getAll()) {
    if (w.workId === id) tx.objectStore('worldSettings').delete(w.id);
  }
  for (const b of await tx.objectStore('storyBranches').getAll()) {
    if (b.workId === id) tx.objectStore('storyBranches').delete(b.id);
  }

  tx.objectStore('works').delete(id);
  await tx.done;
}

// ── Chapters ──
export async function getChaptersByWork(workId: string): Promise<Chapter[]> {
  const db = await getDB();
  const chapters = await db.getAllFromIndex('chapters', 'workId', workId);
  return chapters.sort((a, b) => a.order - b.order);
}

export async function getChapter(id: string): Promise<Chapter | undefined> {
  const db = await getDB();
  return db.get('chapters', id);
}

export async function saveChapter(chapter: Chapter): Promise<void> {
  const db = await getDB();
  await db.put('chapters', { ...chapter, updatedAt: Date.now() });
}

export async function deleteChapter(id: string): Promise<void> {
  const db = await getDB();
  const versions = await db.getAllFromIndex('versions', 'chapterId', id);
  for (const v of versions) await db.delete('versions', v.id);
  await db.delete('chapters', id);
}

// ── Versions ──
export async function getVersionsByChapter(chapterId: string): Promise<ChapterVersion[]> {
  const db = await getDB();
  const versions = await db.getAllFromIndex('versions', 'chapterId', chapterId);
  return versions.sort((a, b) => b.sequence - a.sequence);
}

export async function saveVersion(version: ChapterVersion): Promise<void> {
  const db = await getDB();
  await db.put('versions', version);
}

export async function deleteOldVersions(chapterId: string, keepCount = 10): Promise<void> {
  const db = await getDB();
  const versions = await getVersionsByChapter(chapterId);
  if (versions.length > keepCount) {
    for (const v of versions.slice(keepCount)) {
      await db.delete('versions', v.id);
    }
  }
}

// ── Outline ──
export async function getOutlineByWork(workId: string): Promise<OutlineNode[]> {
  const db = await getDB();
  return db.getAllFromIndex('outline', 'workId', workId);
}

export async function saveOutlineNode(node: OutlineNode): Promise<void> {
  const db = await getDB();
  await db.put('outline', node);
}

export async function deleteOutlineNode(id: string): Promise<void> {
  const db = await getDB();
  // Use parentId index for efficient child lookup
  const children = await db.getAllFromIndex('outline', 'parentId', id);
  for (const child of children) await db.delete('outline', child.id);
  await db.delete('outline', id);
}

// ── Characters ──
export async function getCharactersByWork(workId: string): Promise<Character[]> {
  const db = await getDB();
  return db.getAllFromIndex('characters', 'workId', workId);
}

export async function saveCharacter(char: Character): Promise<void> {
  const db = await getDB();
  await db.put('characters', char);
}

export async function deleteCharacter(id: string): Promise<void> {
  const db = await getDB();
  const bonds = await db.getAllFromIndex('bonds', 'characterId', id);
  for (const b of bonds) await db.delete('bonds', b.id);
  await db.delete('characters', id);
}

// ── World Settings ──
export async function getWorldSettingsByWork(workId: string): Promise<WorldSetting[]> {
  const db = await getDB();
  return db.getAllFromIndex('worldSettings', 'workId', workId);
}

export async function saveWorldSetting(ws: WorldSetting): Promise<void> {
  const db = await getDB();
  await db.put('worldSettings', ws);
}

export async function deleteWorldSetting(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('worldSettings', id);
}

// ── Bonds ──
export async function getBondsByCharacter(characterId: string): Promise<BondRecord[]> {
  const db = await getDB();
  const bonds = await db.getAllFromIndex('bonds', 'characterId', characterId);
  return bonds.sort((a, b) => b.timestamp - a.timestamp);
}

export async function saveBondRecord(record: BondRecord): Promise<void> {
  const db = await getDB();
  await db.put('bonds', record);
}

// ── Story Branches (migrated from localStorage) ──
export async function getBranchesByWork(workId: string): Promise<StoryBranch[]> {
  const db = await getDB();
  const branches = await db.getAllFromIndex('storyBranches', 'workId', workId);
  return branches.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveBranch(branch: StoryBranch): Promise<void> {
  const db = await getDB();
  await db.put('storyBranches', { ...branch, updatedAt: Date.now() });
}

export async function deleteBranch(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('storyBranches', id);
}

// ── Settings ──
export const DEFAULT_SETTINGS: UserSettings = {
  apiKeys: [],
  activeModel: 'deepseek-chat',
  temperature: 0.8,
  maxTokens: 2048,
  theme: 'dark',
  fontSize: 16,
  autoSaveInterval: 30000,
  writingStyle: '网文风格',
};

export async function getSettings(): Promise<UserSettings> {
  const db = await getDB();
  const settings = await db.get('settings', 'app');
  if (!settings) {
    await db.put('settings', DEFAULT_SETTINGS, 'app');
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'app');
}
