import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Chapter } from '../lib/types';
import { getChaptersByWork, getChapter, saveChapter, saveChapters, deleteChapter as deleteCh, updateWorkField } from '../lib/storage';
import { createVersion } from '../lib/version-manager';
import { countChineseWords } from '../lib/file-importer';
import { useWorksStore } from './useWorksStore';
import { useSettingsStore } from './useSettingsStore';
import { useStatsStore } from './useStatsStore';

interface EditorState {
  chapters: Chapter[];
  currentChapter: Chapter | null;
  content: string;
  wordCount: number;
  isDirty: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  loaded: boolean;
  loadChapters: (workId: string) => Promise<void>;
  loadChapter: (id: string) => Promise<void>;
  updateContent: (content: string) => void;
  saveChapter: () => Promise<void>;
  createChapter: (workId: string, title: string) => Promise<Chapter>;
  deleteChapter: (id: string) => Promise<void>;
  reorderChapters: (fromIndex: number, toIndex: number) => Promise<void>;
  triggerAutoSave: () => Promise<void>;
}

// Module-level timer and debounce state (store-scoped since only one editor at a time)
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
let wordCountTimer: ReturnType<typeof setTimeout> | null = null;
let lastWordCountContent = '';

function debouncedWordCount(content: string, set: (s: Partial<EditorState>) => void): void {
  // Immediate update for short text, debounce for long text
  if (content.length < 2000) {
    set({ wordCount: countChineseWords(content) });
    lastWordCountContent = content;
    return;
  }

  if (wordCountTimer) clearTimeout(wordCountTimer);
  wordCountTimer = setTimeout(() => {
    set({ wordCount: countChineseWords(content) });
    lastWordCountContent = content;
  }, 500);
}

export const useEditorStore = create<EditorState>((set, get) => ({
  chapters: [],
  currentChapter: null,
  content: '',
  wordCount: 0,
  isDirty: false,
  saveStatus: 'saved',
  loaded: false,

  loadChapters: async (workId) => {
    try {
      const chapters = await getChaptersByWork(workId);
      set({ chapters, loaded: true });
    } catch (err) {
      console.error('加载章节列表失败:', err);
      set({ loaded: true });
    }
  },

  loadChapter: async (id) => {
    try {
      const state = get();
      if (state.isDirty && state.currentChapter) {
        await state.saveChapter();
      }
      const chapter = await getChapter(id);
      if (chapter) {
        const wc = countChineseWords(chapter.content);
        lastWordCountContent = chapter.content;
        set({
          currentChapter: chapter,
          content: chapter.content,
          wordCount: wc,
          isDirty: false,
          saveStatus: 'saved',
        });
      }
    } catch (err) {
      console.error('加载章节内容失败:', err);
      set({ saveStatus: 'error' });
    }
  },

  updateContent: (content) => {
    // Debounce word count for performance on large documents
    debouncedWordCount(content, (patch) => set(patch));

    set({
      content,
      isDirty: true,
      saveStatus: 'unsaved',
    });

    // Read autoSaveInterval from user settings (not hardcoded 30s)
    const settings = useSettingsStore.getState().settings;
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      get().triggerAutoSave();
    }, settings.autoSaveInterval ?? 30000);
  },

  saveChapter: async () => {
    const { currentChapter, content, isDirty } = get();
    if (!currentChapter || !isDirty) return;

    set({ saveStatus: 'saving' });
    try {
      // Create version snapshot before save
      await createVersion(currentChapter, 'auto_save', '自动保存');
      const updated: Chapter = {
        ...currentChapter,
        content,
        wordCount: countChineseWords(content),
        updatedAt: Date.now(),
      };
      await saveChapter(updated);

      // Update chapters list in-place
      const chapters = get().chapters.map(c => c.id === updated.id ? updated : c);
      set({
        currentChapter: updated,
        chapters,
        isDirty: false,
        saveStatus: 'saved',
      });

      // Incremental work update — no full loadWorks() reload
      const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
      const { currentWorkId, works } = useWorksStore.getState();
      const work = works.find(w => w.id === currentWorkId);
      if (work) {
        // Update IndexedDB
        await updateWorkField(work.id, { wordCount: totalWords, chapterCount: chapters.length });
        // Update in-memory store without re-reading DB
        useWorksStore.getState().updateWorkInMemory(work.id, { wordCount: totalWords, chapterCount: chapters.length, updatedAt: Date.now() });
      }

      // Track stats
      const delta = updated.wordCount - currentChapter.wordCount;
      if (delta > 0) useStatsStore.getState().trackWriting(delta);
    } catch {
      set({ saveStatus: 'error' });
    }
  },

  createChapter: async (workId, title) => {
    const chapters = get().chapters;
    const chapter: Chapter = {
      id: uuid(),
      workId,
      title,
      content: '',
      wordCount: 0,
      order: chapters.length + 1,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveChapter(chapter);
    const newChapters = [...chapters, chapter];
    set({ chapters: newChapters });

    // Incremental update
    const totalWords = newChapters.reduce((s, c) => s + c.wordCount, 0);
    await updateWorkField(workId, { wordCount: totalWords, chapterCount: newChapters.length });
    useWorksStore.getState().updateWorkInMemory(workId, { wordCount: totalWords, chapterCount: newChapters.length, updatedAt: Date.now() });

    return chapter;
  },

  deleteChapter: async (id) => {
    await deleteCh(id);
    const { currentChapter } = get();
    const remaining = get().chapters.filter(c => c.id !== id).map((c, i) => ({ ...c, order: i + 1 }));
    set({
      chapters: remaining,
      currentChapter: currentChapter?.id === id ? null : currentChapter,
      content: currentChapter?.id === id ? '' : get().content,
      isDirty: false,
    });

    // Persist reorder
    for (const ch of remaining) await saveChapter(ch);

    // Incremental work update
    const totalWords = remaining.reduce((s, c) => s + c.wordCount, 0);
    const { currentWorkId, works } = useWorksStore.getState();
    const work = works.find(w => w.id === currentWorkId);
    if (work) {
      await updateWorkField(work.id, { wordCount: totalWords, chapterCount: remaining.length });
      useWorksStore.getState().updateWorkInMemory(work.id, { wordCount: totalWords, chapterCount: remaining.length, updatedAt: Date.now() });
    }
  },

  reorderChapters: async (fromIndex, toIndex) => {
    const chapters = [...get().chapters];
    const [moved] = chapters.splice(fromIndex, 1);
    chapters.splice(toIndex, 0, moved);
    const reordered = chapters.map((c, i) => ({ ...c, order: i + 1 }));
    set({ chapters: reordered });
    await saveChapters(reordered);
  },

  triggerAutoSave: async () => {
    if (get().isDirty) {
      await get().saveChapter();
    }
  },
}));
