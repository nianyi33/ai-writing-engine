import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Work } from '../lib/types';
import { getAllWorks, saveWork, deleteWork, getChaptersByWork, deleteChapter } from '../lib/storage';
import {
  parseMarkdownFile, parseTextFile, parseDocxFile,
  readFileAsText, readFileAsArrayBuffer, generateBookContent,
  downloadFile, downloadBlob, exportDocx,
} from '../lib/file-importer';
import type { ExportFormat } from '../lib/file-importer';

interface WorksState {
  works: Work[];
  currentWorkId: string | null;
  loaded: boolean;
  loadWorks: () => Promise<void>;
  createWork: (title: string, type: Work['type']) => Promise<Work>;
  deleteWork: (id: string) => Promise<void>;
  renameWork: (id: string, title: string) => Promise<void>;
  setCurrentWork: (id: string | null) => void;
  updateWorkInMemory: (id: string, patch: Partial<Work>) => void;
  importWork: (file: File) => Promise<Work>;
  exportWork: (id: string, format: ExportFormat) => Promise<void>;
}

export const useWorksStore = create<WorksState>((set, get) => ({
  works: [],
  currentWorkId: null,
  loaded: false,

  loadWorks: async () => {
    try {
      const works = await getAllWorks();
      set({ works, loaded: true });
    } catch (err) {
      console.error('加载作品列表失败:', err);
      set({ loaded: true }); // Don't block UI — show empty state
    }
  },

  createWork: async (title, type) => {
    const now = Date.now();
    const work: Work = {
      id: uuid(),
      title,
      type,
      description: '',
      wordCount: 0,
      chapterCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await saveWork(work);
    set(s => ({ works: [work, ...s.works] }));
    return work;
  },

  deleteWork: async (id) => {
    await deleteWork(id);
    set(s => ({
      works: s.works.filter(w => w.id !== id),
      currentWorkId: s.currentWorkId === id ? null : s.currentWorkId,
    }));
  },

  renameWork: async (id, title) => {
    await saveWork({ ...get().works.find(w => w.id === id)!, title, updatedAt: Date.now() });
    set(s => ({
      works: s.works.map(w => (w.id === id ? { ...w, title, updatedAt: Date.now() } : w)),
    }));
  },

  setCurrentWork: (id) => set({ currentWorkId: id }),

  updateWorkInMemory: (id, patch) =>
    set(s => ({ works: s.works.map(w => (w.id === id ? { ...w, ...patch } : w)) })),

  importWork: async (file) => {
    const isDocx = file.name.endsWith('.docx');
    let result;
    if (isDocx) {
      const buffer = await readFileAsArrayBuffer(file);
      result = await parseDocxFile(buffer, file.name);
    } else {
      const content = await readFileAsText(file);
      const isMd = file.name.endsWith('.md');
      result = isMd ? parseMarkdownFile(content, file.name) : parseTextFile(content, file.name);
    }

    const now = Date.now();
    const work: Work = {
      id: uuid(),
      title: result.title,
      type: 'novel',
      description: '',
      wordCount: result.totalWords,
      chapterCount: result.chapters.length,
      createdAt: now,
      updatedAt: now,
    };
    await saveWork(work);

    // Import chapter modules dynamically
    const { saveChapter } = await import('../lib/storage');
    for (const ch of result.chapters) {
      await saveChapter({
        id: uuid(),
        workId: work.id,
        ...ch,
      });
    }

    set(s => ({ works: [work, ...s.works] }));
    return work;
  },

  exportWork: async (id, format) => {
    const work = get().works.find(w => w.id === id);
    if (!work) return;

    const chapters = await getChaptersByWork(id);
    const chapterData = chapters.map(c => ({ title: c.title, content: c.content }));

    if (format === 'docx') {
      const blob = await exportDocx(chapterData, work.title);
      downloadBlob(blob, `${work.title}.docx`);
    } else {
      const content = generateBookContent(chapterData, work.title);
      downloadFile(content, work.title, format);
    }
  },
}));
