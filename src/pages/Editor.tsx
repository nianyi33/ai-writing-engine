import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tooltip, Input, Popconfirm, message, Empty, Spin } from 'antd';
import {
  PlusOutlined, DeleteOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  RobotOutlined, HistoryOutlined, EyeOutlined, EyeInvisibleOutlined,
  FileAddOutlined, TeamOutlined,
} from '@ant-design/icons';
import { MarkdownEditor } from '../components/MarkdownEditor';
import { MarkdownPreview } from '../components/MarkdownPreview';
import { AiSidebar } from '../components/AiSidebar';
import { VersionHistory } from '../components/VersionHistory';
import { useEditorStore } from '../stores/useEditorStore';
import { useWorksStore } from '../stores/useWorksStore';
import { useOutlineStore } from '../stores/useOutlineStore';
import { createVersion } from '../lib/version-manager';

const Editor: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const navigate = useNavigate();
  const {
    chapters, currentChapter, content, wordCount, isDirty, saveStatus,
    loaded, loadChapters, loadChapter, updateContent, saveChapter,
    createChapter, deleteChapter,
  } = useEditorStore();
  const { nodes: outlineNodes, loadOutline } = useOutlineStore();
  const { currentWorkId } = useWorksStore();

  const [showAi, setShowAi] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [addingChapter, setAddingChapter] = useState(false);

  useEffect(() => {
    if (workId) {
      loadChapters(workId).then(() => {
        const chs = useEditorStore.getState().chapters;
        if (chs.length > 0) {
          loadChapter(chs[0].id);
        }
      });
      loadOutline(workId);
    }
  }, [workId]);

  const handleCreateChapter = async () => {
    if (!workId || !newChapterTitle.trim()) return;
    const ch = await createChapter(workId, newChapterTitle.trim());
    setNewChapterTitle('');
    setAddingChapter(false);
    loadChapter(ch.id);
    message.success('章节已创建');
  };

  const handleDeleteChapter = async (id: string) => {
    await deleteChapter(id);
    const chs = useEditorStore.getState().chapters;
    if (chs.length > 0) {
      loadChapter(chs[0].id);
    }
  };

  const handleSave = async () => {
    if (currentChapter) {
      await createVersion(currentChapter, 'manual', '手动保存');
      await saveChapter();
    }
  };

  const handleRestoreVersion = (content: string) => {
    updateContent(content);
    saveChapter();
  };

  const handleToggleAi = () => {
    if (!currentChapter) {
      message.warning('请先创建或打开一个章节');
      return;
    }
    setShowAi(!showAi);
  };

  // Show loading only if truly still loading for the first time
  if (!workId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Empty description="请先选择或创建作品" />
      </div>
    );
  }

  if (chapters.length === 0 && !loaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden animate-fade-in">
      {/* Chapter sidebar */}
      <div className="w-48 bg-surface-secondary border-r border-white/5 flex flex-col shrink-0">
        <div className="p-2 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-medium text-ink-muted">章节列表</span>
          <Tooltip title="新建章节">
            <button
              onClick={() => setAddingChapter(true)}
              className="text-ink-muted hover:text-accent-primary transition-colors text-sm"
            >
              <PlusOutlined />
            </button>
          </Tooltip>
        </div>

        <div className="flex-1 overflow-auto p-1">
          {addingChapter && (
            <div className="p-2 animate-slide-up">
              <Input
                size="small"
                value={newChapterTitle}
                onChange={e => setNewChapterTitle(e.target.value)}
                placeholder="章节名称"
                onPressEnter={handleCreateChapter}
                onBlur={() => { if (!newChapterTitle.trim()) setAddingChapter(false); }}
                autoFocus
                style={{ background: '#0f3460', border: '1px solid #1a4a7a', color: '#e0e0e0' }}
              />
            </div>
          )}

          {chapters.map((ch) => (
            <div
              key={ch.id}
              className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-sm transition-all mb-0.5 ${
                currentChapter?.id === ch.id
                  ? 'bg-accent-primary/20 text-accent-primary'
                  : 'text-ink-body hover:bg-surface-hover'
              }`}
              onClick={() => {
                if (isDirty) saveChapter();
                loadChapter(ch.id);
              }}
            >
              <div className="flex-1 min-w-0 truncate text-xs">
                <span className="mr-1 opacity-50">{ch.order}.</span>
                {ch.title}
              </div>
              <div className="hidden group-hover:flex items-center gap-0.5">
                <span className="text-[10px] text-ink-disabled">{ch.wordCount}</span>
                <Popconfirm
                  title="删除此章节？"
                  onConfirm={() => handleDeleteChapter(ch.id)}
                  okText="删除"
                  cancelText="取消"
                >
                  <button
                    className="text-ink-disabled hover:text-accent-error text-[10px] ml-1"
                    onClick={e => e.stopPropagation()}
                  >
                    <DeleteOutlined />
                  </button>
                </Popconfirm>
              </div>
            </div>
          ))}

          {chapters.length === 0 && !addingChapter && (
            <div className="text-center py-8 text-ink-disabled text-xs">
              <p>暂无章节</p>
              <button
                onClick={() => setAddingChapter(true)}
                className="text-accent-primary mt-2 hover:underline"
              >
                + 创建第一章
              </button>
            </div>
          )}
        </div>

        {/* Chapter actions */}
        <div className="p-2 border-t border-white/5">
          <div className="flex gap-1">
            <Tooltip title="版本历史">
              <button
                onClick={() => currentChapter && setShowVersions(true)}
                className="btn-ghost flex-1 text-xs"
                disabled={!currentChapter}
              >
                <HistoryOutlined />
              </button>
            </Tooltip>
            <Tooltip title="AI助手">
              <button onClick={handleToggleAi} className={`btn-ghost flex-1 text-xs ${showAi ? 'text-accent-primary' : ''}`}>
                <RobotOutlined />
              </button>
            </Tooltip>
            <Tooltip title={showPreview ? '隐藏预览' : '显示预览'}>
              <button onClick={() => setShowPreview(!showPreview)} className={`btn-ghost flex-1 text-xs ${showPreview ? 'text-accent-primary' : ''}`}>
                {showPreview ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              </button>
            </Tooltip>
          </div>
          <Tooltip title="AI 分析全文自动识别角色">
            <button
              onClick={() => chapters.length > 0 ? navigate(`/work/${workId}/characters`) : message.warning('请先导入或创建章节')}
              className="btn-ghost w-full text-[10px] mt-1 text-ink-disabled hover:text-accent-primary"
            >
              <TeamOutlined className="mr-1" />提取角色
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Editor + Preview area */}
      <div className={`flex-1 flex ${showPreview ? 'flex-row' : ''}`}>
        <div className={`${showPreview ? 'flex-1' : 'flex-1'} flex flex-col`}>
          {/* Chapter header */}
          {currentChapter && (
            <div className="h-9 bg-surface-secondary border-b border-white/5 flex items-center px-4 shrink-0">
              <span className="text-sm text-ink-title font-medium">{currentChapter.title}</span>
              <span className="ml-3 text-xs text-ink-disabled">{wordCount.toLocaleString()} 字</span>
              {/* Outline match badge */}
              {(() => {
                const matchedNode = outlineNodes.find(n =>
                  n.title === currentChapter.title || n.title.includes(currentChapter.title)
                );
                if (matchedNode?.summary) {
                  return (
                    <Tooltip title={matchedNode.summary}>
                      <span className="ml-auto text-[10px] text-accent-primary/70 truncate max-w-[240px]">
                        📋 {matchedNode.summary.slice(0, 30)}...
                      </span>
                    </Tooltip>
                  );
                }
                return null;
              })()}
            </div>
          )}
          {/* Outline summary hint for current chapter */}
          {currentChapter && (() => {
            const matchedNode = outlineNodes.find(n =>
              n.title === currentChapter.title || n.title.includes(currentChapter.title) || currentChapter.title.includes(n.title)
            );
            if (matchedNode?.summary) {
              return (
                <div className="bg-accent-primary/5 border-b border-accent-primary/10 px-4 py-1.5 text-[11px] text-ink-muted animate-slide-down">
                  <span className="text-accent-primary font-medium mr-1">📋 大纲概要：</span>
                  {matchedNode.summary}
                  <button
                    onClick={() => navigate(`/work/${workId}/outline`)}
                    className="ml-2 text-[10px] text-ink-disabled hover:text-accent-primary"
                  >
                    打开大纲 →
                  </button>
                </div>
              );
            }
            return null;
          })()}
          <div className="flex-1 overflow-hidden">
            {currentChapter ? (
              <MarkdownEditor
                value={content}
                onChange={updateContent}
                onSave={handleSave}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Empty description={
                  <div>
                    <p>选择或创建一个章节开始写作</p>
                    <button onClick={() => setAddingChapter(true)} className="btn-primary mt-3">
                      <PlusOutlined className="mr-1" />新建章节
                    </button>
                  </div>
                } />
              </div>
            )}
          </div>
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div className="w-1/2 border-l border-white/5 bg-surface-main">
            <div className="h-9 bg-surface-secondary border-b border-white/5 flex items-center px-4 shrink-0">
              <span className="text-xs text-ink-muted">预览</span>
            </div>
            <MarkdownPreview content={content} className="h-[calc(100%-36px)]" />
          </div>
        )}
      </div>

      {/* AI Sidebar */}
      <AiSidebar visible={showAi} onToggle={() => setShowAi(false)} />

      {/* Version History Modal */}
      {currentChapter && (
        <VersionHistory
          chapterId={currentChapter.id}
          open={showVersions}
          onClose={() => setShowVersions(false)}
          onRestore={handleRestoreVersion}
        />
      )}
    </div>
  );
};

export default Editor;
