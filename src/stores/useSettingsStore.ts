import { create } from 'zustand';
import type { UserSettings, ApiKeyEntry } from '../lib/types';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '../lib/storage';
import { encryptApiKey, decryptApiKey, isCryptoAvailable } from '../lib/crypto';

interface SettingsState {
  settings: UserSettings;
  loaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  addApiKey: (entry: ApiKeyEntry) => Promise<void>;
  removeApiKey: (provider: string) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  loadSettings: async () => {
    try {
      const settings = await getSettings();
      // Decrypt API keys on load
      if (isCryptoAvailable()) {
        const decryptedKeys = await Promise.all(
          settings.apiKeys.map(async (k) => {
            try {
              return { ...k, key: await decryptApiKey(k.key) };
            } catch {
              // Legacy plaintext key or corrupted — keep as-is
              return k;
            }
          }),
        );
        settings.apiKeys = decryptedKeys;
      }
      set({ settings, loaded: true });
    } catch (err) {
      console.error('加载设置失败，使用默认值:', err);
      set({ settings: DEFAULT_SETTINGS, loaded: true });
    }
  },

  updateSettings: async (patch) => {
    const newSettings = { ...get().settings, ...patch };
    await saveSettings(newSettings);
    set({ settings: newSettings });
    document.documentElement.classList.toggle('dark', newSettings.theme === 'dark');
  },

  addApiKey: async (entry) => {
    const settings = get().settings;
    const keys = settings.apiKeys.filter(k => k.provider !== entry.provider);
    // Encrypt the key before persisting
    if (isCryptoAvailable()) {
      const encryptedKey = await encryptApiKey(entry.key);
      keys.push({ ...entry, key: encryptedKey });
    } else {
      keys.push(entry);
    }
    const newSettings = { ...settings, apiKeys: keys };
    await saveSettings(newSettings);
    // Update in-memory state with decrypted key for runtime use
    const memorySettings = {
      ...newSettings,
      apiKeys: keys.map(k => k.provider === entry.provider ? entry : k),
    };
    set({ settings: memorySettings });
  },

  removeApiKey: async (provider) => {
    const settings = get().settings;
    const newSettings = { ...settings, apiKeys: settings.apiKeys.filter(k => k.provider !== provider) };
    await saveSettings(newSettings);
    set({ settings: newSettings });
  },

  resetSettings: async () => {
    await saveSettings(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },
}));
