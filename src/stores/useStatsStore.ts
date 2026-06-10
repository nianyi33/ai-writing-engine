import { create } from 'zustand';

interface DailyCount {
  date: string;
  words: number;
}

interface StatsState {
  dailyCounts: DailyCount[];
  sessionStart: number;
  sessionWords: number;
  streakDays: number;
  loaded: boolean;

  loadStats: (workId: string) => Promise<void>;
  trackWriting: (wordsAdded: number) => void;
  getTodayWords: () => number;
  getStreakDays: () => number;
}

// Store stats per work in localStorage
function getStatsKey(workId: string) { return `ai-writing-stats-${workId}`; }

export const useStatsStore = create<StatsState>((set, get) => ({
  dailyCounts: [],
  sessionStart: Date.now(),
  sessionWords: 0,
  streakDays: 0,
  loaded: false,

  loadStats: async (workId) => {
    try {
      const raw = localStorage.getItem(getStatsKey(workId));
      if (raw) {
        const data = JSON.parse(raw);
        set({
          dailyCounts: data.dailyCounts || [],
          sessionWords: 0,
          sessionStart: Date.now(),
          streakDays: data.streakDays || 0,
          loaded: true,
        });
      } else {
        set({ dailyCounts: [], sessionWords: 0, streakDays: 0, loaded: true });
      }
    } catch {
      set({ dailyCounts: [], sessionWords: 0, streakDays: 0, loaded: true });
    }
  },

  trackWriting: (wordsAdded) => {
    if (wordsAdded <= 0) return;
    const state = get();
    const today = new Date().toISOString().split('T')[0];
    const counts = [...state.dailyCounts];
    const todayEntry = counts.find(c => c.date === today);

    if (todayEntry) {
      todayEntry.words += wordsAdded;
    } else {
      counts.push({ date: today, words: wordsAdded });
    }

    // Calculate streak
    let streak = 0;
    const sorted = [...counts].sort((a, b) => b.date.localeCompare(a.date));
    const todayDate = new Date(today);
    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date(todayDate);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split('T')[0];
      if (sorted.find(c => c.date === expectedStr)) {
        streak++;
      } else {
        break;
      }
    }

    set({
      dailyCounts: counts,
      sessionWords: state.sessionWords + wordsAdded,
      streakDays: streak,
    });
  },

  getTodayWords: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().dailyCounts.find(c => c.date === today)?.words ?? 0;
  },

  getStreakDays: () => get().streakDays,
}));
