import React, { useState } from 'react';
import { Modal, Upload, message } from 'antd';
import { InboxOutlined, ExportOutlined } from '@ant-design/icons';
import type { Work } from '../lib/types';
import type { ExportFormat } from '../lib/file-importer';

const { Dragger } = Upload;

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ open, onClose, onImport }) => {
  const [loading, setLoading] = useState(false);

  return (
    <Modal
      title="导入作品"
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
    >
      <Dragger
        accept=".md,.txt,.docx"
        maxCount={1}
        showUploadList={false}
        beforeUpload={async (file) => {
          setLoading(true);
          try {
            await onImport(file);
            message.success(`成功导入 ${file.name}`);
            onClose();
          } catch (e: any) {
            message.error(`导入失败: ${e.message}`);
          } finally {
            setLoading(false);
          }
          return false;
        }}
        disabled={loading}
      >
        <p className="text-3xl mb-3"><InboxOutlined /></p>
        <p className="text-ink-body">点击或拖拽文件到此处</p>
        <p className="text-xs text-ink-muted mt-1">
          支持 .md / .txt / .docx 格式
        </p>
        <p className="text-[10px] text-ink-disabled mt-0.5">
          Markdown 按 # 标题或 --- 分章 · docx 自动提取章节结构
        </p>
      </Dragger>
    </Modal>
  );
};

interface ExportDialogProps {
  open: boolean;
  work: Work | null;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ open, work, onClose, onExport }) => {
  return (
    <Modal
      title={`导出 — ${work?.title || ''}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <div className="flex flex-col gap-3 py-4">
        <button
          onClick={() => onExport('docx')}
          className="glass-card p-4 text-left hover:border-accent-primary/50 transition-all"
        >
          <ExportOutlined className="mr-2 text-accent-primary" />
          <span className="text-ink-body font-medium">导出 Word 文档 (.docx)</span>
          <p className="text-xs text-ink-muted mt-1">带目录结构的 Word 文档，适合投稿和打印</p>
        </button>
        <button
          onClick={() => onExport('md')}
          className="glass-card p-4 text-left hover:border-accent-primary/50 transition-all"
        >
          <ExportOutlined className="mr-2 text-accent-primary" />
          <span className="text-ink-body font-medium">导出 Markdown (.md)</span>
          <p className="text-xs text-ink-muted mt-1">保留 Markdown 格式标记</p>
        </button>
        <button
          onClick={() => onExport('txt')}
          className="glass-card p-4 text-left hover:border-accent-primary/50 transition-all"
        >
          <ExportOutlined className="mr-2 text-accent-primary" />
          <span className="text-ink-body font-medium">导出纯文本 (.txt)</span>
          <p className="text-xs text-ink-muted mt-1">去除 Markdown 标记，纯文本输出</p>
        </button>
      </div>
    </Modal>
  );
};
