import React, { useState, useRef, useEffect } from 'react';
import { Tabs, Button, Input, Spin, Empty, message, Select } from 'antd';
import { ThunderboltOutlined, ClearOutlined, CheckOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAiStore } from '../stores/useAiStore';
import { useEditorStore } from '../stores/useEditorStore';
import { computeWordDiff } from '../lib/text-differ';

interface Props {
  visible: boolean;
  onToggle: () => void;
}

export const AiSidebar: React.FC<Props> = ({ visible, onToggle }) => {
  const [instruction, setInstruction] = useState('');
  const [activeTab, setActiveTab] = useState('continue');
  const [deAiOriginal, setDeAiOriginal] = useState(''); // text before de-AI
  const [deAiStyle, setDeAiStyle] = useState('网文风格');
  const streamEndRef = useRef<HTMLDivElement>(null);

  const {
    isStreaming, streamingContent, error,
    streamContinue, deAi, acceptSuggestion, stopStreaming,
    startConversation, currentConversationId, rejectSuggestion,
  } = useAiStore();
  const { content: editorContent, currentChapter, updateContent, saveChapter } = useEditorStore();

  useEffect(() => {
    if (streamEndRef.current && isStreaming) {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingContent, isStreaming]);

  // === CONTINUE ===

  const handleContinue = async () => {
    if (!currentChapter) {
      message.warning('请先打开一个章节');
      return;
    }
    const context = editorContent.slice(-2000);
    startConversation('continue', { workId: currentChapter.workId });
    await streamContinue(context, instruction || '请续写接下来的内容');
  };

  const handleContinueAccept = () => {
    const content = acceptSuggestion(currentConversationId || '');
    const finalContent = streamingContent || content;
    if (finalContent && currentChapter) {
      updateContent(editorContent + '\n\n' + finalContent);
      saveChapter();
      message.success('已插入AI续写内容');
    }
  };

  const handleContinueReject = () => {
    rejectSuggestion(currentConversationId || '');
    message.info('已丢弃');
  };

  // === DE-AI ===

  const handleDeAi = async () => {
    if (!editorContent.trim()) {
      message.warning('请先在编辑器中输入或选中文本');
      return;
    }
    const selectedText = window.getSelection()?.toString();
    const text = selectedText || editorContent.slice(0, 3000);
    setDeAiOriginal(text);
    startConversation('de_ai');
    await deAi(text, deAiStyle);
  };

  const handleDeAiAccept = () => {
    if (!streamingContent) return;
    // Replace the original text with the de-AI'd version
    const newContent = editorContent.replace(deAiOriginal, streamingContent);
    updateContent(newContent);
    saveChapter();
    message.success('已替换为去AI味版本');
    useAiStore.getState().rejectSuggestion(useAiStore.getState().currentConversationId || '');
  };

  const handleDeAiReject = () => {
    rejectSuggestion(currentConversationId || '');
    setDeAiOriginal('');
    message.info('已丢弃');
  };

  if (!visible) return null;

  return (
    <div className="glass-panel w-80 flex flex-col h-full animate-slide-right overflow-hidden">
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        <span className="text-sm font-medium text-ink-title">🤖 AI 助手</span>
        <button onClick={onToggle} className="text-ink-muted hover:text-ink-body text-sm">✕</button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="small"
        className="px-2"
        items={[
          {
            key: 'continue',
            label: <span className="text-xs"><ThunderboltOutlined /> 续写</span>,
            children: (
              <div className="flex flex-col gap-3 p-2">
                <Input.TextArea
                  value={instruction}
                  onChange={e => setInstruction(e.target.value)}
                  placeholder="续写指令，如：主角推开大门..."
                  rows={2}
                  className="text-sm"
                  style={{ background: '#242424', border: '1px solid #2a2a2a', color: '#e5e5e5' }}
                />
                <div className="flex gap-2">
                  <Button
                    type="primary"
                    size="small"
                    icon={<ThunderboltOutlined />}
                    onClick={handleContinue}
                    loading={isStreaming && activeTab === 'continue'}
                    className="flex-1"
                  >
                    {isStreaming && activeTab === 'continue' ? '生成中...' : 'AI 续写'}
                  </Button>
                  {isStreaming && activeTab === 'continue' && (
                    <Button size="small" danger onClick={stopStreaming}>停止</Button>
                  )}
                </div>

                {/* Output area */}
                <div className="bg-surface-card rounded-lg p-3 min-h-[200px] max-h-[400px] overflow-auto text-sm leading-relaxed">
                  {error ? (
                    <div className="text-accent-error">{error}</div>
                  ) : streamingContent && activeTab === 'continue' ? (
                    <div className="whitespace-pre-wrap animate-fade-in">
                      {streamingContent}
                      {isStreaming && <span className="inline-block w-1.5 h-4 bg-accent-primary animate-pulse-soft ml-0.5 align-text-bottom" />}
                    </div>
                  ) : isStreaming && activeTab === 'continue' ? (
                    <div className="flex items-center justify-center h-full">
                      <Spin />
                    </div>
                  ) : (
                    <Empty description="AI续写内容将在这里显示" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                  <div ref={streamEndRef} />
                </div>

                {streamingContent && !isStreaming && activeTab === 'continue' && (
                  <div className="flex gap-2 animate-slide-up">
                    <Button size="small" type="primary" icon={<CheckOutlined />} onClick={handleContinueAccept}>
                      插入正文
                    </Button>
                    <Button size="small" icon={<CloseOutlined />} onClick={handleContinueReject}>
                      丢弃
                    </Button>
                    <Button size="small" icon={<ReloadOutlined />} onClick={handleContinue}>
                      重试
                    </Button>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'de-ai',
            label: <span className="text-xs"><ClearOutlined /> 去味</span>,
            children: (
              <div className="flex flex-col gap-3 p-2">
                <p className="text-xs text-ink-muted">
                  选中编辑器中的文字，或直接使用当前章节内容（前3000字），AI 将改写为更自然的文风。
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-ink-disabled shrink-0">目标风格:</span>
                  <Select
                    size="small"
                    value={deAiStyle}
                    onChange={setDeAiStyle}
                    className="flex-1"
                    options={[
                      { value: '网文风格', label: '网文风格' },
                      { value: '轻小说', label: '轻小说' },
                      { value: '严肃文学', label: '严肃文学' },
                      { value: '古风', label: '古风' },
                      { value: '都市', label: '都市' },
                    ]}
                  />
                </div>
                <Button
                  type="primary"
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={handleDeAi}
                  loading={isStreaming && activeTab === 'de-ai'}
                  block
                >
                  {isStreaming && activeTab === 'de-ai' ? '改写中...' : '检测并去AI味'}
                </Button>

                {/* De-AI result */}
                {(streamingContent && activeTab === 'de-ai') || (isStreaming && activeTab === 'de-ai') ? (
                  <>
                    {/* Diff comparison */}
                    {deAiOriginal && streamingContent && !isStreaming && (
                      <div className="text-[10px] text-ink-muted flex justify-between">
                        <span>原文 {deAiOriginal.length} 字</span>
                        <span>改写 {streamingContent.length} 字</span>
                      </div>
                    )}
                    <div className="bg-surface-card rounded-lg p-3 max-h-[300px] overflow-auto text-sm whitespace-pre-wrap animate-fade-in leading-relaxed">
                      {isStreaming ? (
                        <div className="flex items-center justify-center py-4"><Spin /></div>
                      ) : (
                        streamingContent
                      )}
                    </div>
                    {/* Contrast view: original vs rewritten side by side */}
                    {deAiOriginal && streamingContent && !isStreaming && (
                      <details className="text-xs">
                        <summary className="text-ink-disabled cursor-pointer hover:text-ink-muted">📊 逐字对比</summary>
                        <div className="bg-surface-main rounded-lg p-2 mt-1 max-h-[200px] overflow-auto font-editor leading-relaxed">
                          {computeWordDiff(deAiOriginal, streamingContent).map((d, i) => (
                            <span
                              key={i}
                              className={
                                d.type === 'added'
                                  ? 'bg-green-900/30 text-green-400'
                                  : d.type === 'removed'
                                    ? 'bg-red-900/30 text-red-400 line-through'
                                    : 'text-ink-disabled'
                              }
                            >
                              {d.value}
                            </span>
                          ))}
                        </div>
                      </details>
                    )}
                  </>
                ) : null}

                {streamingContent && !isStreaming && activeTab === 'de-ai' && (
                  <div className="flex gap-2 animate-slide-up">
                    <Button size="small" type="primary" icon={<CheckOutlined />} onClick={handleDeAiAccept}>
                      接受，替换原文
                    </Button>
                    <Button size="small" icon={<CloseOutlined />} onClick={handleDeAiReject}>
                      丢弃
                    </Button>
                    <Button size="small" icon={<ReloadOutlined />} onClick={handleDeAi}>
                      重试
                    </Button>
                  </div>
                )}

                {error && activeTab === 'de-ai' && (
                  <div className="text-accent-error text-xs">{error}</div>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};
