import React, { useEffect, useMemo } from 'react';
import { ConfigProvider, theme } from 'antd';
import { useSettingsStore } from '../stores/useSettingsStore';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const settings = useSettingsStore(s => s.settings);

  useEffect(() => {
    useSettingsStore.getState().loadSettings();
  }, []);

  const isDark = settings.theme === 'dark';

  const antTheme = useMemo(() => ({
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#3b82f6',
      colorBgContainer: isDark ? '#242424' : '#ffffff',
      colorBgElevated: isDark ? '#1a1a1a' : '#f5f5f5',
      colorBgLayout: isDark ? '#0d0d0d' : '#fafafa',
      colorText: isDark ? '#e5e5e5' : '#262626',
      colorTextSecondary: '#737373',
      colorBorder: isDark ? '#2a2a2a' : '#e5e5e5',
      borderRadius: 8,
      fontFamily: '"Geist", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    },
  }), [isDark]);

  return (
    <ConfigProvider theme={antTheme}>
      {children}
    </ConfigProvider>
  );
};
