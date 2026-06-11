import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Input, Select, Slider, Popconfirm, message, Tag, Empty, Modal,
} from 'antd';
import {
  KeyOutlined, RobotOutlined, SettingOutlined, BulbOutlined,
  DeleteOutlined, PlusOutlined, ArrowLeftOutlined,
  CheckCircleFilled, WarningFilled,
} from '@ant-design/icons';
import { useSettingsStore } from '../stores/useSettingsStore';
import { PROVIDERS, AVAILABLE_MODELS, getDefaultBaseUrl } from '../lib/model-router';
import type { ApiKeyEntry } from '../lib/types';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, addApiKey, removeApiKey } = useSettingsStore();

  const [showAddKey, setShowAddKey] = useState(false);
  const [newKey, setNewKey] = useState<Partial<ApiKeyEntry>>({});

  useEffect(() => {
    useSettingsStore.getState().loadSettings();
  }, []);

  const activeModelInfo = AVAILABLE_MODELS.find(m => m.id === settings.activeModel);
  const activeProvider = PROVIDERS.find(p => p.id === activeModelInfo?.provider);
  const hasKeyForProvider = settings.apiKeys.some(k => k.provider === activeModelInfo?.provider);

  const providerOptions = PROVIDERS.map(p => ({ value: p.id, label: p.name }));
  const getProviderName = (id: string) => PROVIDERS.find(p => p.id === id)?.name || id;

  return (
    <div className="flex-1 overflow-auto p-8 md:p-12 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="btn-ghost mb-4">
          <ArrowLeftOutlined className="mr-1" />返回
        </button>

        <h2 className="text-xl font-bold text-ink-title mb-6">
          <SettingOutlined className="mr-2" />设置
        </h2>

        {/* ====== Global Model ====== */}
        <div className="glass-card p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/15 flex items-center justify-center text-xl">
              <RobotOutlined className="text-accent-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-ink-title">当前模型</h3>
              <p className="text-[10px] text-ink-muted">所有功能（续写/分析/去味/角色对话/大纲生成…）共用此模型</p>
            </div>
            {hasKeyForProvider ? (
              <Tag color="success" className="text-[10px]"><CheckCircleFilled /> 已配置 Key</Tag>
            ) : (
              <Tag color="warning" className="text-[10px]"><WarningFilled /> 需配置 Key</Tag>
            )}
          </div>

          {/* Model selector */}
          <div className="mb-4">
            <label className="text-[10px] text-ink-disabled mb-1.5 block">选择模型</label>
            <Select
              value={settings.activeModel}
              onChange={v => {
                const model = AVAILABLE_MODELS.find(m => m.id === v);
                updateSettings({ activeModel: v });
                // Set sensible defaults for this model category
                if (model?.category === 'reasoning') updateSettings({ temperature: 0.3, maxTokens: 4096 });
                else if (model?.category === 'fast') updateSettings({ temperature: 0.8, maxTokens: 2048 });
              }}
              className="w-full"
              size="large"
              options={PROVIDERS.filter(p => p.models.length > 0).map(p => ({
                label: p.name,
                options: p.models.map(m => ({
                  value: m.id,
                  label: (
                    <div className="flex items-center justify-between">
                      <span>{m.name}</span>
                      <span className="text-[10px] text-ink-disabled">{m.description || ''}</span>
                    </div>
                  ),
                })),
              }))}
            />
            {activeProvider && (
              <p className="text-[10px] text-ink-disabled mt-1">
                服务商：{activeProvider.name} · Base URL：{activeProvider.baseUrl}
              </p>
            )}
          </div>

          {/* Temperature */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-ink-muted">Temperature · 创造性</label>
              <span className="text-xs text-ink-disabled tabular-nums w-8 text-right">{settings.temperature}</span>
            </div>
            <Slider
              min={0} max={2} step={0.1}
              value={settings.temperature}
              onChange={v => updateSettings({ temperature: v })}
              marks={{ 0: '精确', 1: '平衡', 2: '发散' }}
              tooltip={{ formatter: v => `${v}` }}
            />
          </div>

          {/* Max Tokens */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-ink-muted">Max Tokens · 最大生成长度</label>
              <span className="text-xs text-ink-disabled tabular-nums w-12 text-right">{(settings.maxTokens / 1024).toFixed(1)}K</span>
            </div>
            <Slider
              min={256} max={16384} step={256}
              value={settings.maxTokens}
              onChange={v => updateSettings({ maxTokens: v })}
              marks={{ 1024: '1K', 4096: '4K', 8192: '8K', 16384: '16K' }}
              tooltip={{ formatter: v => `${((v as number) / 1024).toFixed(1)}K` }}
            />
          </div>
        </div>

        {/* ====== API Keys ====== */}
        <div className="glass-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-ink-title">
              <KeyOutlined className="mr-2 text-accent-primary" />API Key 管理
            </h3>
            <button onClick={() => { setNewKey({}); setShowAddKey(true); }} className="btn-ghost text-xs">
              <PlusOutlined className="mr-1" />添加 Key
            </button>
          </div>

          {settings.apiKeys.length === 0 ? (
            <div className="text-center py-4">
              <Empty description="未配置 API Key，AI功能无法使用" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {settings.apiKeys.map(k => {
                const isActive = activeModelInfo?.provider === k.provider;
                return (
                  <div key={k.provider}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors duration-200 ${
                      isActive ? 'bg-accent-primary/10 border border-accent-primary/30' : 'bg-surface-main'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag color={isActive ? 'red' : 'default'} className="shrink-0">
                        {getProviderName(k.provider)}
                      </Tag>
                      {isActive && <span className="text-[10px] text-accent-primary shrink-0">当前使用</span>}
                      <span className="text-sm text-ink-body font-mono truncate">{k.key.slice(0, 10)}•••••••</span>
                      <span className="text-[10px] text-ink-disabled hidden sm:inline truncate">{k.baseUrl}</span>
                    </div>
                    <Popconfirm title="删除此 Key？" onConfirm={() => removeApiKey(k.provider)}>
                      <button className="text-ink-muted hover:text-accent-error text-sm shrink-0 ml-2">
                        <DeleteOutlined />
                      </button>
                    </Popconfirm>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ====== Writing Preferences ====== */}
        <div className="glass-card p-4 mb-4">
          <h3 className="text-sm font-medium text-ink-title mb-3">
            <BulbOutlined className="mr-2 text-accent-primary" />写作偏好
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-body">编辑器字号</span>
              <div className="w-40">
                <Slider
                  min={12} max={24}
                  value={settings.fontSize}
                  onChange={v => updateSettings({ fontSize: v })}
                  marks={{ 12: '12', 16: '16', 20: '20', 24: '24' }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-body">自动保存间隔</span>
              <Select
                size="small" value={settings.autoSaveInterval}
                onChange={v => updateSettings({ autoSaveInterval: v })}
                className="w-32"
                options={[
                  { value: 15000, label: '15秒' },
                  { value: 30000, label: '30秒' },
                  { value: 60000, label: '1分钟' },
                  { value: 120000, label: '2分钟' },
                ]}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-body">默认文风</span>
              <Select
                size="small" value={settings.writingStyle}
                onChange={v => updateSettings({ writingStyle: v })}
                className="w-40"
                options={[
                  { value: '网文风格', label: '网文风格' },
                  { value: '轻小说', label: '轻小说' },
                  { value: '严肃文学', label: '严肃文学' },
                  { value: '古风', label: '古风' },
                  { value: '都市', label: '都市' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Add Key Modal */}
        <Modal
          title="添加 API Key"
          open={showAddKey}
          onOk={() => {
            if (newKey.provider && newKey.key) {
              addApiKey({
                provider: newKey.provider,
                key: newKey.key,
                baseUrl: newKey.baseUrl || '',
              });
              setShowAddKey(false);
              message.success('API Key 已添加');
            }
          }}
          onCancel={() => setShowAddKey(false)}
          okText="添加"
        >
          <div className="flex flex-col gap-3 py-2">
            <Select
              value={newKey.provider}
              onChange={v => setNewKey({ ...newKey, provider: v, baseUrl: getDefaultBaseUrl(v) })}
              placeholder="选择服务商"
              options={providerOptions}
              className="w-full"
            />
            <Input
              value={newKey.key || ''}
              onChange={e => setNewKey({ ...newKey, key: e.target.value })}
              placeholder="输入 API Key"
            />
            <Input
              value={newKey.baseUrl || ''}
              onChange={e => setNewKey({ ...newKey, baseUrl: e.target.value })}
              placeholder="API 地址（自动填充，可修改）"
            />
            {newKey.provider && newKey.provider !== 'custom' && (
              <div className="text-xs text-ink-muted bg-surface-card rounded-lg p-2">
                💡 获取 Key：{PROVIDERS.find(p => p.id === newKey.provider)?.website || ''}
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Settings;
