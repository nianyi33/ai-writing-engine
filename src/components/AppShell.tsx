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
      {/* Top Bar */}
      <header className="h-12 bg-surface-secondary border-b border-white/5 flex items-center px-4 shrink-0 z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
          >
            <span className="text-lg">✍️</span>
            <span className="text-gradient font-bold text-sm hidden sm:inline">AI写作引擎</span>
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
            <nav className="flex items-center gap-1 ml-2">
              {[
                { path: `/work/${currentWorkId}`, icon: <EditOutlined />, label: '编辑' },
                { path: `/work/${currentWorkId}/outline`, icon: <ApartmentOutlined />, label: '大纲' },
                { path: `/work/${currentWorkId}/characters`, icon: <TeamOutlined />, label: '角色' },
                { path: `/work/${currentWorkId}/bonds`, icon: <HeartOutlined />, label: '情缘' },
                { path: `/work/${currentWorkId}/stats`, icon: <BarChartOutlined />, label: '统计' },
              ].map(item => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-3 py-1.5 rounded-md text-xs transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-accent-primary/20 text-accent-primary'
                      : 'text-ink-muted hover:text-ink-body hover:bg-surface-hover'
                  }`}
                >
                  {item.icon} <span className="ml-1 hidden md:inline">{item.label}</span>
                </button>
              ))}
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
            <button onClick={toggleTheme} className="btn-ghost">
              {settings.theme === 'dark' ? <BulbFilled /> : <BulbOutlined />}
            </button>
          </Tooltip>

          <Tooltip title="设置">
            <button onClick={() => navigate('/settings')} className="btn-ghost">
              <SettingOutlined />
            </button>
          </Tooltip>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>

      {/* Status Bar */}
      {currentWorkId && (
        <footer className="h-6 bg-surface-secondary border-t border-white/5 flex items-center px-4 text-xs text-ink-disabled shrink-0">
          <span>字数: {currentChapter?.wordCount.toLocaleString() || 0}</span>
          {currentChapter && <span className="ml-3">章节: {currentChapter.title}</span>}
          <span className="ml-auto">AI写作引擎 v1.0</span>
        </footer>
      )}
    </div>
  );
};
