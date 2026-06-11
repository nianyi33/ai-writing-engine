import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, Button, Empty, Spin, message } from 'antd';
import { SendOutlined, ArrowLeftOutlined, HeartOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { useRoleStore } from '../stores/useRoleStore';
import { useAiStore } from '../stores/useAiStore';
import { useBondStore } from '../stores/useBondStore';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const RoleChat: React.FC = () => {
  const { workId, charId } = useParams<{ workId: string; charId: string }>();
  const navigate = useNavigate();
  const { characters, loadAll } = useRoleStore();
  const { isStreaming, streamingContent, streamRoleChat, error } = useAiStore();
  const { loadBonds, addRecord, getIntimacy } = useBondStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [intimacy, setIntimacy] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (workId) {
      loadAll(workId);
    }
  }, [workId]);

  useEffect(() => {
    if (charId) {
      loadBonds(charId);
      setIntimacy(getIntimacy(charId));
    }
  }, [charId]);

  const character = characters.find(c => c.id === charId);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || !character || isStreaming) return;

    const userMsg: ChatMessage = { role: 'user', content: input.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));

    await streamRoleChat(
      {
        name: character.name,
        personality: character.personality,
        speechStyle: character.speechStyle,
        background: character.background,
      },
      history,
      userMsg.content,
    );
  };

  // When streaming ends, add assistant message
  useEffect(() => {
    if (!isStreaming && streamingContent && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'user') {
        const assistantMsg: ChatMessage = { role: 'assistant', content: streamingContent, timestamp: Date.now() };
        setMessages(prev => [...prev, assistantMsg]);

        // Analyze bond change
        if (charId) {
          useAiStore.getState().analyzeBond(character?.name || '', streamingContent.slice(0, 500), intimacy)
            .then(result => {
              if (result.intimacyDelta) {
                addRecord({
                  characterId: charId,
                  chapterId: undefined,
                  event: result.event || '角色对话互动',
                  intimacyDelta: result.intimacyDelta,
                  memo: result.memo || '',
                });
                setIntimacy(prev => prev + result.intimacyDelta);
              }
            })
            .catch(() => {});
        }
      }
    }
  }, [isStreaming]);

  if (!character) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Empty description="角色不存在" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="h-12 bg-surface-secondary border-b border-white/5 flex items-center px-4 shrink-0">
        <button onClick={() => navigate(-1)} className="btn-ghost mr-3">
          <ArrowLeftOutlined />
        </button>
        <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-sm text-accent-primary mr-3">
          {character.name[0]}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-ink-title">{character.name}</div>
          <div className="text-[10px] text-ink-muted">{character.personality}</div>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <HeartOutlined className={intimacy >= 50 ? 'text-accent-primary' : intimacy >= 0 ? 'text-ink-muted' : 'text-accent-error'} />
          <span className={intimacy >= 0 ? 'text-accent-success' : 'text-accent-error'}>{intimacy}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-6">
        {messages.length === 0 && !isStreaming && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-slide-up">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-ink-title mb-2">与 {character.name} 对话</h3>
              <p className="text-ink-muted text-sm">
                {character.speechStyle || '开始一场沉浸式的角色对话吧'}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 mb-4 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
              msg.role === 'assistant' ? 'bg-accent-primary/20 text-accent-primary' : 'bg-surface-hover text-ink-muted'
            }`}>
              {msg.role === 'assistant' ? character.name[0] : <UserOutlined />}
            </div>
            <div className={`max-w-[70%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-accent-primary/20 text-ink-body'
                : 'bg-surface-card text-ink-body'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {/* Streaming output */}
        {isStreaming && streamingContent && (
          <div className="flex gap-3 mb-4 animate-slide-up">
            <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-sm text-accent-primary shrink-0">
              {character.name[0]}
            </div>
            <div className="bg-surface-card rounded-xl px-4 py-2.5 text-sm leading-relaxed max-w-[70%]">
              <div className="whitespace-pre-wrap">
                {streamingContent}
                <span className="inline-block w-1.5 h-4 bg-accent-primary animate-pulse-soft ml-0.5 align-text-bottom" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-accent-error text-sm my-2">{error}</div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/5 bg-surface-secondary">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onPressEnter={handleSend}
            placeholder={`和 ${character.name} 说点什么...`}
            disabled={isStreaming}
            style={{ background: '#242424', border: '1px solid #2a2a2a', color: '#e5e5e5' }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={isStreaming}
            disabled={!input.trim()}
          />
        </div>
      </div>
    </div>
  );
};

export default RoleChat;
