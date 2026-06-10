import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  content: string;
  className?: string;
}

export const MarkdownPreview: React.FC<Props> = ({ content, className = '' }) => {
  if (!content) {
    return (
      <div className={`flex items-center justify-center h-full text-ink-disabled ${className}`}>
        <div className="text-center">
          <div className="text-3xl mb-3">📝</div>
          <p className="text-sm">预览区域</p>
          <p className="text-xs mt-1">在编辑器中输入文字即可预览</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`markdown-preview prose-p:my-2 overflow-auto p-6 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};
