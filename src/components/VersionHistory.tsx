import React, { useEffect, useState } from 'react';
import { Modal, Timeline, Button, Popconfirm, Empty, Spin, message } from 'antd';
import { HistoryOutlined, RollbackOutlined, ClockCircleOutlined, SaveOutlined, RobotOutlined } from '@ant-design/icons';
import type { ChapterVersion } from '../lib/types';
import { getVersionsByChapter } from '../lib/storage';
import { restoreVersion } from '../lib/version-manager';

interface Props {
  chapterId: string;
  open: boolean;
  onClose: () => void;
  onRestore: (content: string) => void;
}

const triggerIcons: Record<string, React.ReactNode> = {
  manual: <SaveOutlined />,
  ai_before_modify: <RobotOutlined />,
  auto_save: <ClockCircleOutlined />,
};

const triggerLabels: Record<string, string> = {
  manual: '手动保存',
  ai_before_modify: 'AI修改前',
  auto_save: '自动保存',
};

export const VersionHistory: React.FC<Props> = ({ chapterId, open, onClose, onRestore }) => {
  const [versions, setVersions] = useState<ChapterVersion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && chapterId) {
      setLoading(true);
      getVersionsByChapter(chapterId)
        .then(setVersions)
        .finally(() => setLoading(false));
    }
  }, [open, chapterId]);

  const handleRestore = async (versionId: string) => {
    const content = await restoreVersion(chapterId, versionId);
    if (content !== null) {
      onRestore(content);
      message.success('版本已恢复');
      onClose();
    } else {
      message.error('恢复失败');
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      title={<span className="text-ink-title"><HistoryOutlined className="mr-2" />版本历史</span>}
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      className="version-history-modal"
    >
      {loading ? (
        <div className="flex justify-center py-8"><Spin /></div>
      ) : versions.length === 0 ? (
        <Empty description="暂无版本记录" />
      ) : (
        <Timeline
          items={versions.map(v => ({
            color: v.trigger === 'ai_before_modify' ? 'red' : v.trigger === 'manual' ? 'blue' : 'gray',
            dot: triggerIcons[v.trigger],
            children: (
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink-body font-medium">v{v.sequence}</div>
                  <div className="text-xs text-ink-muted">
                    {triggerLabels[v.trigger] || v.trigger}
                    {v.description && ` · ${v.description}`}
                  </div>
                  <div className="text-xs text-ink-disabled mt-0.5">
                    {formatTime(v.timestamp)} · {v.content.length}字
                    <span className="ml-2 font-mono text-[10px] opacity-50">{v.contentHash}</span>
                  </div>
                </div>
                <Popconfirm
                  title="恢复到此版本？当前内容将丢失"
                  onConfirm={() => handleRestore(v.id)}
                  okText="确认恢复"
                  cancelText="取消"
                >
                  <Button size="small" icon={<RollbackOutlined />} type="text" className="text-ink-muted hover:text-accent-primary" />
                </Popconfirm>
              </div>
            ),
          }))}
        />
      )}
    </Modal>
  );
};
