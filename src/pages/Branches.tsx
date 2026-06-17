import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, Modal, Card, Empty, Button, Tag, Timeline, message, Popconfirm } from 'antd';
import {
  BranchesOutlined, PlusOutlined, DeleteOutlined,
  ForkOutlined, EditOutlined, ApartmentOutlined,
} from '@ant-design/icons';
import {
  getBranches, createBranch, deleteBranch, updateBranch,
  addBranchChapter, updateBranchChapter, buildBranchTree,
  type BranchTreeNode,
} from '../lib/branch-manager';
import type { StoryBranch, BranchChapter } from '../lib/types';
import ReactECharts from 'echarts-for-react';

const Branches: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const [branches, setBranches] = useState<StoryBranch[]>([]);
  const [tree, setTree] = useState<BranchTreeNode[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<StoryBranch | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', description: '', forkChapterId: '', forkPosition: 0 });

  const reload = async () => {
    if (!workId) return;
    const [brs, bt] = await Promise.all([getBranches(workId), buildBranchTree(workId)]);
    setBranches(brs);
    setTree(bt);
  };

  useEffect(() => { reload(); }, [workId]);

  const handleCreate = async () => {
    if (!workId || !newBranch.name.trim()) return;
    await createBranch(workId, newBranch.name.trim(), newBranch.description, newBranch.forkChapterId || 'root', newBranch.forkPosition);
    await reload();
    setShowCreate(false);
    setNewBranch({ name: '', description: '', forkChapterId: '', forkPosition: 0 });
    message.success('分支已创建');
  };

  const handleDelete = async (branchId: string) => {
    if (!workId) return;
    await deleteBranch(workId, branchId);
    await reload();
    if (selectedBranch?.id === branchId) setSelectedBranch(null);
  };

  // Branch tree chart
  const treeOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'tree',
      data: tree.map(t => ({
        name: t.branch.name,
        value: t.branch.chapters.length,
        children: t.children.length > 0 ? t.children.map(c => ({
          name: c.branch.name,
          value: c.branch.chapters.length,
        })) : undefined,
      })),
      top: '5%',
      left: '10%',
      bottom: '5%',
      right: '20%',
      symbol: 'roundRect',
      symbolSize: [120, 40],
      roam: true,
      label: { color: '#e5e5e5', fontSize: 12 },
      lineStyle: { color: '#2a2a2a', width: 2 },
      itemStyle: { color: '#3b82f6', borderColor: '#3b82f6' },
    }],
  };

  return (
    <div className="flex-1 flex overflow-hidden animate-fade-in">
      {/* Left: Branch list */}
      <div className="w-64 bg-surface-secondary border-r border-white/5 flex flex-col shrink-0">
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-medium text-ink-muted">
            <BranchesOutlined className="mr-1" />分支结局
          </span>
          <button onClick={() => setShowCreate(true)} className="btn-ghost text-xs">
            <PlusOutlined />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {branches.map(br => (
            <div
              key={br.id}
              className={`px-3 py-2.5 cursor-pointer transition-colors duration-200 hover:bg-surface-hover group ${
                selectedBranch?.id === br.id ? 'bg-accent-primary/10 border-l-2 border-accent-primary' : ''
              }`}
              onClick={() => setSelectedBranch(br)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-body truncate">
                  <ForkOutlined className="mr-1 text-accent-primary text-xs" />
                  {br.name}
                </span>
                <Popconfirm title="删除此分支？" onConfirm={() => handleDelete(br.id)}>
                  <button
                    className="hidden group-hover:block text-ink-muted hover:text-accent-error text-xs"
                    onClick={e => e.stopPropagation()}
                  >
                    <DeleteOutlined />
                  </button>
                </Popconfirm>
              </div>
              <div className="text-[10px] text-ink-disabled mt-0.5">
                {br.chapters.length}章 · {br.description}
              </div>
            </div>
          ))}
          {branches.length === 0 && (
            <Empty description="暂无分支结局" className="mt-8" image={Empty.PRESENTED_IMAGE_SIMPLE}>
              <Button type="primary" size="small" onClick={() => setShowCreate(true)}>
                <PlusOutlined /> 创建第一个分支
              </Button>
            </Empty>
          )}
        </div>
      </div>

      {/* Right: Branch details */}
      <div className="flex-1 overflow-auto p-8">
        {selectedBranch ? (
          <div className="animate-slide-up">
            <h2 className="text-xl font-bold text-ink-title mb-1">{selectedBranch.name}</h2>
            <p className="text-sm text-ink-muted mb-6">{selectedBranch.description}</p>

            {/* Chapters */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-ink-title">分支章节</h3>
                <button
                  onClick={() => {
                    if (!workId) return;
                    addBranchChapter(workId, selectedBranch.id, '新章节');
                    setBranches(getBranches(workId));
                  }}
                  className="btn-ghost text-xs"
                >
                  <PlusOutlined className="mr-1" />添加章节
                </button>
              </div>
              {selectedBranch.chapters.length === 0 ? (
                <Empty description="暂无章节" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Timeline
                  items={selectedBranch.chapters.map(ch => ({
                    children: (
                      <div className="glass-card p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-ink-title font-medium">{ch.title}</span>
                          <Tag>{ch.status === 'done' ? '已完成' : ch.status === 'writing' ? '写作中' : '草稿'}</Tag>
                        </div>
                        {ch.summary && (
                          <p className="text-xs text-ink-muted mt-1">{ch.summary}</p>
                        )}
                      </div>
                    ),
                  }))}
                />
              )}
            </div>

            {/* Branch tree visualization */}
            {tree.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="text-sm font-medium text-ink-title mb-3">分支树概览</h3>
                <ReactECharts option={treeOption} style={{ height: 300 }} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Empty description={
              <div>
                <p>选择一个分支或创建新的结局分支</p>
                <p className="text-xs text-ink-muted mt-1">
                  分支结局让你从同一个分叉点生成多个不同的故事走向
                </p>
              </div>
            } />
          </div>
        )}
      </div>

      {/* Create branch modal */}
      <Modal
        title="创建新分支"
        open={showCreate}
        onOk={handleCreate}
        onCancel={() => setShowCreate(false)}
        okText="创建"
        cancelText="取消"
      >
        <div className="flex flex-col gap-3 py-2">
          <Input
            value={newBranch.name}
            onChange={e => setNewBranch({ ...newBranch, name: e.target.value })}
            placeholder="分支名称，如：悲剧结局、圆满结局"
          />
          <Input.TextArea
            value={newBranch.description}
            onChange={e => setNewBranch({ ...newBranch, description: e.target.value })}
            placeholder="描述这个分支的走向..."
            rows={2}
            style={{ background: '#242424', border: '1px solid #2a2a2a', color: '#e5e5e5' }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Branches;
