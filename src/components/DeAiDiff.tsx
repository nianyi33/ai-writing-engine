import React, { useMemo } from 'react';
import { Modal, Empty } from 'antd';
import { computeWordDiff } from '../lib/text-differ';

interface Props {
  original: string;
  modified: string;
  open: boolean;
  onClose: () => void;
  onAccept: (text: string) => void;
}

export const DeAiDiff: React.FC<Props> = ({ original, modified, open, onClose, onAccept }) => {
  const diffs = useMemo(() => {
    if (!original || !modified) return [];
    return computeWordDiff(original, modified);
  }, [original, modified]);

  return (
    <Modal
      title="去AI味 — 前后对比"
      open={open}
      onCancel={onClose}
      width={700}
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">取消</button>
          <button onClick={() => { onAccept(modified); onClose(); }} className="btn-primary">
            接受修改
          </button>
        </div>
      }
    >
      {diffs.length === 0 ? (
        <Empty description="无差异" />
      ) : (
        <div className="max-h-[60vh] overflow-auto bg-surface-main rounded-lg p-4 font-editor text-editor leading-relaxed whitespace-pre-wrap">
          {diffs.map((d, i) => (
            <span
              key={i}
              className={
                d.type === 'added'
                  ? 'bg-green-900/40 text-green-300'
                  : d.type === 'removed'
                    ? 'bg-red-900/40 text-red-300 line-through'
                    : ''
              }
            >
              {d.value}
            </span>
          ))}
        </div>
      )}
    </Modal>
  );
};
