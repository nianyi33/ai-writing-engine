import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal, Input, Select, Tag, Empty, message, Tabs, Button, Progress, Spin } from 'antd';
import {
  PlusOutlined, UserOutlined, EditOutlined, DeleteOutlined,
  MessageOutlined, HeartOutlined, TeamOutlined, EnvironmentOutlined,
  RobotOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { useRoleStore } from '../stores/useRoleStore';
import { useWorksStore } from '../stores/useWorksStore';
import { useAiStore } from '../stores/useAiStore';
import { useEditorStore } from '../stores/useEditorStore';
import type { Character, WorldSetting } from '../lib/types';

const roleColors: Record<string, string> = {
  protagonist: '#e94560',
  antagonist: '#f39c12',
  supporting: '#27ae60',
  minor: '#a0a0b0',
};

const roleLabels: Record<string, string> = {
  protagonist: '主角',
  antagonist: '对手',
  supporting: '配角',
  minor: '龙套',
};

const Roles: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const navigate = useNavigate();
  const {
    characters, worldSettings, selectedCharacterId, loaded,
    loadAll, selectCharacter, createCharacter, updateCharacter, deleteCharacter,
    addRelation, removeRelation, addWorldSetting, updateWorldSetting, removeWorldSetting,
  } = useRoleStore();

  const [showCreate, setShowCreate] = useState(false);
  const [showWorldCreate, setShowWorldCreate] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState<{ count: number; analysis: string } | null>(null);

  const { chapters } = useEditorStore();
  const { extractCharacters } = useAiStore();
  const [editingChar, setEditingChar] = useState<Partial<Character>>({});
  const [editingWS, setEditingWS] = useState<Partial<WorldSetting>>({});
  const [activeTab, setActiveTab] = useState('characters');

  useEffect(() => {
    if (workId) loadAll(workId);
  }, [workId]);

  const selectedChar = characters.find(c => c.id === selectedCharacterId);

  const handleCreate = async () => {
    if (!workId || !editingChar.name) return;
    await createCharacter(workId, editingChar);
    setShowCreate(false);
    setEditingChar({});
    message.success('角色已创建');
  };

  const handleUpdate = async () => {
    if (!selectedCharacterId) return;
    await updateCharacter(selectedCharacterId, editingChar);
    message.success('已更新');
  };

  const handleExtractCharacters = async () => {
    if (!workId) return;
    if (chapters.length === 0) {
      message.warning('当前作品没有章节内容，请先导入或创建章节');
      return;
    }
    setExtracting(true);
    setExtractResult(null);
    try {
      const work = useWorksStore.getState().works.find(w => w.id === workId);

      const result = await extractCharacters(
        work?.title || '未命名作品',
        chapters.map(c => ({ title: c.title, content: c.content })),
      );

      const chars = result.characters || [];
      let created = 0;
      for (const c of chars) {
        if (!c.name) continue;
        const existing = characters.find(ex => ex.name === c.name);
        if (existing) continue;

        const allCharNames = [...characters.map(x => x.name), ...chars.map((x: any) => x.name)];
        const relationships = (c.relationships || []).map((rel: any) => ({
          targetCharacterId: allCharNames.find((n: string) => n === rel.targetCharacterName) || '',
          relation: rel.relation || '',
          intimacy: rel.intimacy || 0,
          description: rel.description || '',
        }));

        await createCharacter(workId, {
          name: c.name,
          aliases: c.aliases || [],
          role: c.role || 'supporting',
          personality: c.personality || '',
          speechStyle: c.speechStyle || '',
          background: c.background || '',
          appearance: c.appearance || '',
          tags: c.tags || [],
          relationships,
        });
        created++;
      }

      setExtractResult({ count: created, analysis: result.analysis || '' });
      if (created > 0) {
        message.success(`AI 已识别并创建 ${created} 个角色`);
      } else {
        message.info('所有角色已存在，无需重复创建');
      }
    } catch (e: any) {
      message.error(e.message || '角色提取失败');
    } finally {
      setExtracting(false);
    }
  };

  const handleCreateWS = async () => {
    if (!workId || !editingWS.title) return;
    await addWorldSetting(workId, editingWS);
    setShowWorldCreate(false);
    setEditingWS({});
  };

  const handleChat = (char: Character) => {
    navigate(`/work/${workId}/characters/${char.id}/chat`);
  };

  return (
    <div className="flex-1 flex overflow-hidden animate-fade-in">
      {/* Left: Character list */}
      <div className="w-64 bg-surface-secondary border-r border-white/5 flex flex-col shrink-0">
        <div className="p-3 border-b border-white/5">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="small"
            items={[
              { key: 'characters', label: <span className="text-xs"><TeamOutlined /> 角色</span> },
              { key: 'world', label: <span className="text-xs"><EnvironmentOutlined /> 世界</span> },
            ]}
          />
        </div>

        <div className="flex-1 overflow-auto">
          {activeTab === 'characters' ? (
            <>
              {/* AI Extraction area */}
              <div className="px-3 py-2 border-b border-white/5">
                {extracting ? (
                  <div className="text-center py-2 animate-fade-in">
                    <Spin size="small" />
                    <p className="text-[10px] text-ink-muted mt-1">AI 正在分析角色...</p>
                    <Progress percent={50} size="small" status="active" showInfo={false} className="mt-1" />
                  </div>
                ) : extractResult ? (
                  <div className="text-center py-1 animate-slide-up">
                    <p className="text-[11px] text-accent-success font-medium">
                      <TeamOutlined className="mr-1" />已识别 {extractResult.count} 个角色
                    </p>
                    <button
                      onClick={handleExtractCharacters}
                      className="text-[10px] text-ink-muted hover:text-accent-primary mt-0.5"
                    >
                      <ThunderboltOutlined /> 重新分析
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleExtractCharacters}
                    className="w-full py-1.5 text-[11px] text-ink-muted hover:text-accent-primary hover:bg-surface-hover rounded-md transition-all flex items-center justify-center gap-1"
                  >
                    <RobotOutlined /> AI 分析文本提取角色
                  </button>
                )}
              </div>

              {characters.map(char => (
                <div
                  key={char.id}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-all hover:bg-surface-hover group ${
                    selectedCharacterId === char.id ? 'bg-accent-primary/10 border-l-2 border-accent-primary' : ''
                  }`}
                  onClick={() => {
                    selectCharacter(char.id);
                    setEditingChar(char);
                  }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                    style={{ background: `${roleColors[char.role]}20`, color: roleColors[char.role] }}>
                    {char.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink-body truncate">{char.name}</div>
                    <div className="text-[10px] text-ink-disabled">{roleLabels[char.role]}</div>
                  </div>
                  <div className="hidden group-hover:flex gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); handleChat(char); }} className="text-ink-muted hover:text-accent-primary text-xs">
                      <MessageOutlined />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteCharacter(char.id); }} className="text-ink-muted hover:text-accent-error text-xs">
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              ))}
              {characters.length === 0 && <Empty description="暂无角色" className="mt-8" />}
            </>
          ) : (
            <>
              {worldSettings.map(ws => (
                <div
                  key={ws.id}
                  className="px-3 py-2 cursor-pointer hover:bg-surface-hover transition-all"
                  onClick={() => setEditingWS(ws)}
                >
                  <div className="text-sm text-ink-body">{ws.title}</div>
                  <div className="text-[10px] text-ink-disabled">{ws.category}</div>
                </div>
              ))}
              {worldSettings.length === 0 && <Empty description="暂无世界设定" className="mt-8" />}
            </>
          )}
        </div>

        <div className="p-2 border-t border-white/5">
          <button
            onClick={() => {
              if (activeTab === 'characters') { setEditingChar({}); setShowCreate(true); }
              else { setEditingWS({}); setShowWorldCreate(true); }
            }}
            className="btn-ghost w-full text-xs"
          >
            <PlusOutlined className="mr-1" />
            {activeTab === 'characters' ? '添加角色' : '添加设定'}
          </button>
        </div>
      </div>

      {/* Right: Character detail editor */}
      <div className="flex-1 overflow-auto p-6">
        {selectedChar ? (
          <div className="max-w-2xl animate-slide-up">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl shrink-0"
                style={{ background: `${roleColors[selectedChar.role]}20`, color: roleColors[selectedChar.role] }}>
                {selectedChar.name[0]}
              </div>
              <div>
                <Input
                  value={editingChar.name}
                  onChange={e => setEditingChar({ ...editingChar, name: e.target.value })}
                  onBlur={handleUpdate}
                  className="text-xl font-bold input-dark w-48"
                />
                <Select
                  value={editingChar.role}
                  onChange={v => { setEditingChar({ ...editingChar, role: v }); updateCharacter(selectedChar.id, { role: v as Character['role'] }); }}
                  size="small"
                  className="mt-1 w-24"
                  options={Object.entries(roleLabels).map(([k, v]) => ({ value: k, label: v }))}
                />
              </div>
            </div>

            {/* Detail fields */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs text-ink-muted mb-1 block">性格描述</label>
                <Input.TextArea
                  value={editingChar.personality || ''}
                  onChange={e => setEditingChar({ ...editingChar, personality: e.target.value })}
                  onBlur={handleUpdate}
                  placeholder="描述角色的性格特征..."
                  rows={2}
                  style={{ background: '#0f3460', border: '1px solid #1a4a7a', color: '#e0e0e0' }}
                />
              </div>
              <div>
                <label className="text-xs text-ink-muted mb-1 block">说话风格</label>
                <Input.TextArea
                  value={editingChar.speechStyle || ''}
                  onChange={e => setEditingChar({ ...editingChar, speechStyle: e.target.value })}
                  onBlur={handleUpdate}
                  placeholder="如：古风、毒舌、温柔..."
                  rows={2}
                  style={{ background: '#0f3460', border: '1px solid #1a4a7a', color: '#e0e0e0' }}
                />
              </div>
              <div>
                <label className="text-xs text-ink-muted mb-1 block">背景故事</label>
                <Input.TextArea
                  value={editingChar.background || ''}
                  onChange={e => setEditingChar({ ...editingChar, background: e.target.value })}
                  onBlur={handleUpdate}
                  placeholder="角色的过去和经历..."
                  rows={3}
                  style={{ background: '#0f3460', border: '1px solid #1a4a7a', color: '#e0e0e0' }}
                />
              </div>
              <div>
                <label className="text-xs text-ink-muted mb-1 block">外貌描述</label>
                <Input.TextArea
                  value={editingChar.appearance || ''}
                  onChange={e => setEditingChar({ ...editingChar, appearance: e.target.value })}
                  onBlur={handleUpdate}
                  rows={2}
                  style={{ background: '#0f3460', border: '1px solid #1a4a7a', color: '#e0e0e0' }}
                />
              </div>
              <div>
                <label className="text-xs text-ink-muted mb-1 block">标签</label>
                <div className="flex flex-wrap gap-1">
                  {(editingChar.tags || []).map((tag: string, i: number) => (
                    <Tag key={i} closable onClose={() => {
                      const tags = [...(editingChar.tags || [])];
                      tags.splice(i, 1);
                      setEditingChar({ ...editingChar, tags });
                    }}>{tag}</Tag>
                  ))}
                  <Input
                    size="small"
                    placeholder="+ 添加标签"
                    className="w-24"
                    onPressEnter={(e: any) => {
                      const val = e.target.value.trim();
                      if (val) {
                        setEditingChar({ ...editingChar, tags: [...(editingChar.tags || []), val] });
                        e.target.value = '';
                      }
                    }}
                    style={{ background: '#0f3460', border: '1px solid #1a4a7a', color: '#e0e0e0' }}
                  />
                </div>
              </div>

              {/* Relations */}
              <div>
                <label className="text-xs text-ink-muted mb-1 block">
                  <HeartOutlined className="mr-1" />角色关系
                </label>
                {selectedChar.relationships.map((rel, i) => {
                  const target = characters.find(c => c.id === rel.targetCharacterId);
                  return (
                    <div key={i} className="flex items-center gap-2 py-1 text-sm">
                      <span className="text-ink-muted">→</span>
                      <span className="text-accent-primary">{target?.name || '未知'}</span>
                      <span className="text-ink-body">{rel.relation}</span>
                      <span className={`text-xs ${rel.intimacy >= 0 ? 'text-accent-success' : 'text-accent-error'}`}>
                        {rel.intimacy >= 0 ? '+' : ''}{rel.intimacy}
                      </span>
                      <button
                        onClick={() => removeRelation(selectedChar.id, rel.targetCharacterId)}
                        className="text-ink-disabled hover:text-accent-error text-xs"
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Empty description="选择左侧角色查看详情" />
          </div>
        )}
      </div>

      {/* Create character modal */}
      <Modal
        title="创建角色"
        open={showCreate}
        onOk={handleCreate}
        onCancel={() => setShowCreate(false)}
        okText="创建"
        cancelText="取消"
      >
        <div className="flex flex-col gap-3 py-2">
          <Input
            value={editingChar.name || ''}
            onChange={e => setEditingChar({ ...editingChar, name: e.target.value })}
            placeholder="角色姓名"
            size="large"
          />
          <Select
            value={editingChar.role || 'supporting'}
            onChange={v => setEditingChar({ ...editingChar, role: v })}
            options={Object.entries(roleLabels).map(([k, v]) => ({ value: k, label: v }))}
          />
        </div>
      </Modal>

      {/* Create world setting modal */}
      <Modal
        title="添加世界设定"
        open={showWorldCreate}
        onOk={handleCreateWS}
        onCancel={() => setShowWorldCreate(false)}
        okText="添加"
      >
        <div className="flex flex-col gap-3 py-2">
          <Input
            value={editingWS.title || ''}
            onChange={e => setEditingWS({ ...editingWS, title: e.target.value })}
            placeholder="设定名称"
          />
          <Select
            value={editingWS.category || 'other'}
            onChange={v => setEditingWS({ ...editingWS, category: v })}
            options={[
              { value: 'geography', label: '🌍 地理' },
              { value: 'history', label: '📜 历史' },
              { value: 'magic', label: '✨ 魔法' },
              { value: 'technology', label: '🔧 科技' },
              { value: 'culture', label: '🎭 文化' },
              { value: 'other', label: '📌 其他' },
            ]}
          />
          <Input.TextArea
            value={editingWS.content || ''}
            onChange={e => setEditingWS({ ...editingWS, content: e.target.value })}
            placeholder="详细设定内容..."
            rows={4}
            style={{ background: '#0f3460', border: '1px solid #1a4a7a', color: '#e0e0e0' }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Roles;
