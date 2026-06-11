import React, { useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button, Dropdown, Badge, Tooltip, message } from 'antd';
import {
  HomeOutlined, EditOutlined, ApartmentOutlined, TeamOutlined,
  HeartOutlined, BarChartOutlined, SettingOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, PlusOutlined,
  BulbOutlined, BulbFilled, SaveOutlined,
} from '@ant-design/icons';
import { useWorksStore } from '../stores/useWorksStore';
import { useEditorStore } from '../stores/useEditorStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { ErrorBoundary } from './ErrorBoundary';

export const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract workId from URL path — AppShell is a layout route without :workId param
  const workId = useMemo(() => {
    const match = location.pathname.match(/\/work\/([^/]+)/);
    return match ? match[1] : undefined;
  }, [location.pathname]);

  const { works, currentWorkId, loadWorks, setCurrentWork, createWork } = useWorksStore();
  const { saveStatus, saveChapter, isDirty, currentChapter } = useEditorStore();
  const { settings, updateSettings, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadWorks();
    loadSettings();
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, []);

  useEffect(() => {
    if (workId && workId !== currentWorkId) {
      setCurrentWork(workId);
    }
  }, [workId, currentWorkId, setCurrentWork]);

  const currentWork = works.find(w => w.id === currentWorkId);

  const handleCreateWork = async () => {
    const work = await createWork('新作品', 'novel');
    navigate(`/work/${work.id}`);
  };

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
  };

  const showSidebar = currentWorkId && ['/work/', '/outline', '/characters', '/bonds', '/stats'].some(p =>
    location.pathname.includes(p)
  );

  return (
    <div className="h-full flex flex-col bg-surface-main">
      {/* Skip to content — keyboard accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-primary focus:text-white focus:rounded-md focus:no-underline">
        跳到内容
      </a>

      {/* Top Bar */}
      <header className="h-12 bg-surface-secondary border-b border-white/[0.04] flex items-center px-4 shrink-0 z-10 relative">
        {/* Subtle top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent" />
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
            aria-label="回到首页"
          >
            <span className="text-lg" aria-hidden="true">✍️</span>
            <span className="text-ink-title font-semibold text-sm hidden sm:inline tracking-tight">写作引擎</span>
          </button>

          {/* Work selector */}
          {currentWorkId && (
            <Dropdown
              menu={{
                items: works.map(w => ({
                  key: w.id,
                  label: (
                    <div className="flex items-center justify-between">
                      <span>{w.title}</span>
                      <span className="text-xs text-ink-disabled">{w.wordCount.toLocaleString()}字</span>
                    </div>
                  ),
                  onClick: () => navigate(`/work/${w.id}`),
                })),
              }}
              trigger={['click']}
            >
              <button className="btn-ghost text-sm max-w-[200px] truncate">
                {currentWork?.title || '选择作品'}
                <span className="ml-1 text-xs">▼</span>
              </button>
            </Dropdown>
          )}

          {/* Nav tabs */}
          {currentWorkId && (
            <nav className="flex items-center gap-0.5 ml-2">
              {[
                { path: `/work/${currentWorkId}`, icon: <EditOutlined />, label: '编辑' },
                { path: `/work/${currentWorkId}/outline`, icon: <ApartmentOutlined />, label: '大纲' },
                { path: `/work/${currentWorkId}/characters`, icon: <TeamOutlined />, label: '角色' },
                { path: `/work/${currentWorkId}/bonds`, icon: <HeartOutlined />, label: '情缘' },
                { path: `/work/${currentWorkId}/stats`, icon: <BarChartOutlined />, label: '统计' },
              ].map(item => {
                const isActive = location.pathname === item.path;
                return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative px-3 py-1.5 rounded-md text-xs transition-colors duration-200 ${
                    isActive
                      ? 'text-ink-title'
                      : 'text-ink-muted hover:text-ink-body hover:bg-surface-hover'
                  }`}
                >
                  {item.icon} <span className="ml-1 hidden md:inline">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-accent-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  )}
                </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Save indicator */}
          {currentWorkId && (
            <Tooltip title={saveStatus === 'saved' ? '已保存' : saveStatus === 'saving' ? '保存中...' : '未保存'}>
              <button onClick={saveChapter} className="btn-ghost text-sm">
                <SaveOutlined className={isDirty ? 'text-accent-warning' : 'text-ink-muted'} />
                <span className="ml-1 text-xs hidden sm:inline">
                  {saveStatus === 'saved' ? '已保存' : saveStatus === 'saving' ? '保存中' : '未保存'}
                </span>
              </button>
            </Tooltip>
          )}

          <Tooltip title={settings.theme === 'dark' ? '亮色模式' : '暗色模式'}>
            <button onClick={toggleTheme} className="btn-ghost" aria-label={settings.theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}>
              {settings.theme === 'dark' ? <BulbFilled /> : <BulbOutlined />}
            </button>
          </Tooltip>

          <Tooltip title="设置">
            <button onClick={() => navigate('/settings')} className="btn-ghost" aria-label="打开设置">
              <SettingOutlined />
            </button>
          </Tooltip>
        </div>
      </header>

      {/* Body */}
      <main id="main-content" className="flex-1 flex overflow-hidden">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Status Bar */}
      {currentWorkId && (
        <footer className="h-7 bg-surface-secondary border-t border-white/[0.04] flex items-center px-4 text-[11px] text-ink-disabled shrink-0 gap-4">
          <span>字数 <span className="text-ink-muted tabular-nums">{currentChapter?.wordCount?.toLocaleString() || 0}</span></span>
          <span className="w-px h-3 bg-white/[0.06]" />
          {currentChapter && <span>章节 <span className="text-ink-muted">{currentChapter.title}</span></span>}
          <span className="w-px h-3 bg-white/[0.06]" />
          <span className="text-ink-muted">自动保存</span>
          <span className="ml-auto text-[10px] tracking-wider opacity-50">WRITING ENGINE v1</span>
        </footer>
      )}
    </div>
  );
};
