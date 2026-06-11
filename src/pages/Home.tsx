import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Input, Select, Dropdown, message, Popconfirm } from 'antd';
import {
  PlusOutlined, MoreOutlined, EditOutlined, DeleteOutlined, ExportOutlined,
  ImportOutlined, BookOutlined, FileTextOutlined, InboxOutlined,
} from '@ant-design/icons';
import { useWorksStore } from '../stores/useWorksStore';
import { ImportDialog, ExportDialog } from '../components/FileDialogs';
import type { Work } from '../lib/types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { works, loaded, loadWorks, createWork, deleteWork, renameWork, importWork, exportWork } = useWorksStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportTarget, setExportTarget] = useState<Work | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<Work['type']>('novel');

  useEffect(() => { loadWorks(); }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const work = await createWork(newTitle.trim(), newType);
    setShowCreate(false);
    setNewTitle('');
    navigate(`/work/${work.id}`);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const typeConfig: Record<string, { icon: React.ReactNode; accent: string; label: string }> = {
    novel: { icon: <BookOutlined className="text-accent-primary text-2xl" />, accent: 'border-accent-primary', label: '长篇小说' },
    short: { icon: <FileTextOutlined className="text-accent-warning text-2xl" />, accent: 'border-accent-warning', label: '短篇' },
    essay: { icon: <EditOutlined className="text-accent-success text-2xl" />, accent: 'border-accent-success', label: '散文随笔' },
  };

  return (
    <div className="flex-1 overflow-auto p-6 md:p-10 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-ink-title">我的作品</h1>
            <p className="text-ink-muted text-sm mt-1">
              共 {works.length} 部作品 · {works.reduce((s, w) => s + w.wordCount, 0).toLocaleString()} 字
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowImport(true)} className="btn-ghost">
              <ImportOutlined className="mr-1" />导入
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <PlusOutlined className="mr-1" />新建作品
            </button>
          </div>
        </div>

        {/* Works grid */}
        {!loaded ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card h-48 animate-pulse-soft" />
            ))}
          </div>
        ) : works.length === 0 ? (
          <div className="text-center py-20 animate-slide-up">
            <div className="text-6xl mb-6">📄</div>
            <h2 className="text-xl text-ink-title mb-2">开始你的第一部作品</h2>
            <p className="text-ink-muted mb-6 max-w-md mx-auto">
              创建新作品或导入已有的 Markdown / TXT 文件，AI将全程辅助你的创作。
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowCreate(true)} className="btn-primary text-lg px-6 py-3">
                <PlusOutlined className="mr-2" />创建作品
              </button>
              <button onClick={() => setShowImport(true)} className="glass-card px-6 py-3 text-ink-body hover:border-accent-primary/50 transition-colors duration-200">
                <ImportOutlined className="mr-2" />导入文件
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {works.map((work, i) => (
              <div
                key={work.id}
                className="glass-card p-5 cursor-pointer group animate-slide-up overflow-hidden relative"
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => navigate(`/work/${work.id}`)}
              >
                {/* Type accent bar */}
                <span
                  className="absolute top-0 left-0 right-0 h-[3px] rounded-t-lg opacity-60"
                  style={{ background: work.type === 'novel' ? '#3b82f6' : work.type === 'short' ? '#f59e0b' : '#22c55e' }}
                />
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-16 bg-surface-hover rounded-md flex items-center justify-center">
                    {typeConfig[work.type]?.icon}
                  </div>
                  <Dropdown
                    menu={{
                      items: [
                        { key: 'rename', icon: <EditOutlined />, label: '重命名', onClick: () => {
                          // handled inline
                        }},
                        { key: 'export', icon: <ExportOutlined />, label: '导出',
                          onClick: (e: any) => {
                            e?.domEvent?.stopPropagation?.();
                            setExportTarget(work);
                            setShowExport(true);
                          }
                        },
                        { type: 'divider' },
                        { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true,
                          onClick: (e: any) => {
                            e?.domEvent?.stopPropagation?.();
                          }
                        },
                      ],
                    }}
                    trigger={['click']}
                  >
                    <button
                      onClick={e => e.stopPropagation()}
                      className="opacity-0 group-hover:opacity-100 btn-ghost text-sm transition-opacity"
                    >
                      <MoreOutlined />
                    </button>
                  </Dropdown>
                </div>

                <h3 className="text-lg font-medium text-ink-title mb-1 truncate">{work.title}</h3>
                {work.description && (
                  <p className="text-xs text-ink-muted mb-3 line-clamp-2">{work.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-ink-disabled mt-auto">
                  <span>{work.wordCount.toLocaleString()} 字</span>
                  <span>{work.chapterCount} 章</span>
                  <span className="ml-auto">{formatDate(work.updatedAt)}</span>
                </div>
              </div>
            ))}

            {/* Create card */}
            <button
              onClick={() => setShowCreate(true)}
              className="glass-card h-full min-h-[160px] flex flex-col items-center justify-center gap-2 border-dashed border-surface-hover hover:border-accent-primary/50 transition-colors duration-200 text-ink-muted hover:text-accent-primary"
            >
              <PlusOutlined className="text-2xl" />
              <span className="text-sm">新建作品</span>
            </button>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        title="新建作品"
        open={showCreate}
        onOk={handleCreate}
        onCancel={() => { setShowCreate(false); setNewTitle(''); }}
        okText="创建"
        cancelText="取消"
        okButtonProps={{ disabled: !newTitle.trim() }}
      >
        <div className="flex flex-col gap-3 py-2">
          <Input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="作品名称"
            size="large"
            onPressEnter={handleCreate}
            className="input-dark"
          />
          <Select
            value={newType}
            onChange={setNewType}
            options={[
              { value: 'novel', label: '📖 长篇小说' },
              { value: 'short', label: '📄 短篇故事' },
              { value: 'essay', label: '✏️ 随笔散文' },
            ]}
          />
        </div>
      </Modal>

      {/* Import dialog */}
      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={async (file) => { const w = await importWork(file); navigate(`/work/${w.id}`); }}
      />

      {/* Export dialog */}
      <ExportDialog
        open={showExport}
        work={exportTarget}
        onClose={() => { setShowExport(false); setExportTarget(null); }}
        onExport={(format) => {
          if (exportTarget) exportWork(exportTarget.id, format);
          setShowExport(false);
        }}
      />
    </div>
  );
};

export default Home;
