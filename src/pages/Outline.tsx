import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, Button, Spin, Modal, Select, message, Popconfirm, Empty, Tooltip } from 'antd';
import {
  PlusOutlined, DeleteOutlined, RadarChartOutlined, ThunderboltOutlined,
  ApartmentOutlined, EditOutlined, SwapOutlined, FileTextOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import { useOutlineStore } from '../stores/useOutlineStore';
import { useEditorStore } from '../stores/useEditorStore';
import ReactECharts from 'echarts-for-react';

const Outline: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const navigate = useNavigate();
  const {
    nodes, selectedNodeId, assessmentResult, isAnalyzing, loaded,
    loadOutline, selectNode, addNode, updateNode, deleteNode,
    analyzeOutline, generateOutline, reverseOutline,
  } = useOutlineStore();
  const { chapters, loadChapters, createChapter } = useEditorStore();

  const [editingTitle, setEditingTitle] = useState('');
  const [editingSummary, setEditingSummary] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [showReverse, setShowReverse] = useState(false);
  const [premise, setPremise] = useState('');
  const [reverseText, setReverseText] = useState('');
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [addingNodeParent, setAddingNodeParent] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (workId) {
      loadOutline(workId);
      loadChapters(workId);
    }
  }, [workId]);

  // Quick-jump: create a chapter from this outline node and open in editor
  const handleStartWriting = async (nodeId: string) => {
    if (!workId) return;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Mark node as "writing"
    await updateNode(nodeId, { status: 'writing' });

    // Create a chapter with the outline summary pre-filled
    const ch = await createChapter(workId, node.title);
    if (ch) {
      // Pre-fill with outline context
      const { loadChapter, updateContent, saveChapter } = useEditorStore.getState();
      await loadChapter(ch.id);
      const prefix = node.summary ? `> 📋 大纲概要：${node.summary}\n\n` : '';
      updateContent(prefix);
      await saveChapter();
      navigate(`/work/${workId}`);
    }
  };

  // Expand all children of a volume into chapters
  const handleExpandToChapters = async () => {
    if (!workId) return;
    const chapterNodes = nodes.filter(n => n.type === 'chapter' || n.type === 'section');
    if (chapterNodes.length === 0) {
      message.warning('大纲中没有章/节节点，请先添加');
      return;
    }

    let created = 0;
    for (const node of chapterNodes) {
      const exists = chapters.find(c => c.title === node.title);
      if (exists) continue;
      await createChapter(workId, node.title);
      created++;
    }
    if (created > 0) {
      await loadChapters(workId);
      message.success(`已从大纲创建 ${created} 个章节，切换到编辑页开始写作`);
      navigate(`/work/${workId}`);
    } else {
      message.info('所有章节已存在');
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  useEffect(() => {
    if (selectedNode) {
      setEditingTitle(selectedNode.title);
      setEditingSummary(selectedNode.summary);
    }
  }, [selectedNodeId]);

  const handleSelectNode = (id: string) => {
    // Save current edits
    if (selectedNodeId && (editingTitle !== selectedNode?.title || editingSummary !== selectedNode?.summary)) {
      updateNode(selectedNodeId, { title: editingTitle, summary: editingSummary });
    }
    selectNode(id);
  };

  const handleAddNode = async (parentId: string | null) => {
    if (!workId || !newNodeTitle.trim()) return;
    await addNode(workId, parentId, { title: newNodeTitle.trim() });
    setNewNodeTitle('');
    setAddingNodeParent(undefined); // hide input after adding
  };

  const handleAnalyze = async () => {
    await analyzeOutline();
  };

  const handleGenerate = async () => {
    if (!workId || !premise.trim()) return;
    await generateOutline(workId, premise);
    setShowGenerate(false);
    setPremise('');
    message.success('大纲生成完成');
  };

  const handleReverse = async () => {
    if (!reverseText.trim()) return;
    const result = await reverseOutline(reverseText);
    setShowReverse(false);
    message.success('反向大纲分析完成');
  };

  // Build tree from flat nodes
  const rootNodes = nodes.filter(n => !n.parentId);
  const getChildren = (parentId: string) => nodes.filter(n => n.parentId === parentId).sort((a, b) => a.order - b.order);

  // Radar chart options
  const radarOption = assessmentResult ? {
    radar: {
      indicator: [
        { name: '完整度', max: 100 },
        { name: '节奏感', max: 100 },
        { name: '冲突密度', max: 100 },
        { name: '角色成长', max: 100 },
        { name: '逻辑', max: 100 },
      ],
      axisName: { color: '#a0a0b0' },
      shape: 'circle',
      splitArea: { areaStyle: { color: ['rgba(233,69,96,0.05)', 'rgba(233,69,96,0.1)'] } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: [
          assessmentResult.dimensions.completeness,
          assessmentResult.dimensions.pacing,
          assessmentResult.dimensions.conflict,
          assessmentResult.dimensions.characterGrowth,
          assessmentResult.dimensions.logic,
        ],
        name: '大纲评分',
        areaStyle: { color: 'rgba(233,69,96,0.3)' },
        lineStyle: { color: '#3b82f6' },
        itemStyle: { color: '#3b82f6' },
      }],
    }],
  } : null;

  const renderNode = (node: typeof nodes[0], depth: number) => (
    <div key={node.id} className="animate-slide-right">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors duration-200 group text-sm ${
          selectedNodeId === node.id
            ? 'bg-accent-primary/20 text-accent-primary'
            : 'text-ink-body hover:bg-surface-hover'
        }`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
        onClick={() => handleSelectNode(node.id)}
      >
        <span className="text-xs opacity-50 shrink-0">
          {node.type === 'volume' ? '📘' : node.type === 'chapter' ? '📖' : node.type === 'section' ? '📄' : '📍'}
        </span>
        <span className="flex-1 truncate text-xs">{node.title}</span>
        {node.status === 'writing' && <span className="text-[10px] text-accent-warning">✍️</span>}
        {node.status === 'done' && <span className="text-[10px] text-accent-success">✓</span>}
        <Tooltip title="开始写这一章">
          <button
            className="hidden group-hover:block text-[10px] text-ink-muted hover:text-accent-primary"
            onClick={e => { e.stopPropagation(); handleStartWriting(node.id); }}
            disabled={node.type === 'volume'}
          >
            <EditOutlined />
          </button>
        </Tooltip>
        <Popconfirm
          title="删除此节点？"
          onConfirm={() => deleteNode(node.id)}
          okText="删除"
        >
          <button
            className="hidden group-hover:block text-ink-disabled hover:text-accent-error text-[10px]"
            onClick={e => e.stopPropagation()}
          >
            <DeleteOutlined />
          </button>
        </Popconfirm>
      </div>
      {getChildren(node.id).map(child => renderNode(child, depth + 1))}
    </div>
  );

  return (
    <div className="flex-1 flex overflow-hidden animate-fade-in">
      {/* Left: Outline tree */}
      <div className="w-64 bg-surface-secondary border-r border-white/5 flex flex-col shrink-0">
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-medium text-ink-muted">大纲结构</span>
          <div className="flex gap-1">
            <button onClick={() => { setAddingNodeParent(null); setNewNodeTitle(''); }} className="btn-ghost text-xs">
              <PlusOutlined />
            </button>
          </div>
        </div>

        {/* New node input */}
        {addingNodeParent !== undefined && (
          <div className="p-2 animate-slide-up flex items-center gap-1">
            <Input
              size="small"
              value={newNodeTitle}
              onChange={e => setNewNodeTitle(e.target.value)}
              placeholder={addingNodeParent === null ? '输入卷/章名称后回车' : '输入子节点名称后回车'}
              onPressEnter={() => handleAddNode(addingNodeParent)}
              onKeyDown={e => { if (e.key === 'Escape') setAddingNodeParent(undefined); }}
              onBlur={() => { if (!newNodeTitle.trim()) setAddingNodeParent(undefined); }}
              autoFocus
              style={{ background: '#242424', border: '1px solid #2a2a2a', color: '#e5e5e5' }}
            />
            <button
              onClick={() => setAddingNodeParent(undefined)}
              className="text-ink-disabled hover:text-ink-muted text-xs shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto py-1">
          {nodes.length === 0 ? (
            <div className="text-center py-8 text-ink-disabled text-xs">
              <ApartmentOutlined className="text-2xl mb-2 block" />
              <p>暂无大纲节点</p>
              <button
                onClick={() => setAddingNodeParent(null)}
                className="text-accent-primary mt-2 hover:underline"
              >
                + 创建大纲
              </button>
            </div>
          ) : (
            rootNodes.sort((a, b) => a.order - b.order).map(n => renderNode(n, 0))
          )}
        </div>

        {/* Add root node button */}
        <div className="p-2 border-t border-white/5 flex gap-1">
          <button
            onClick={() => setAddingNodeParent(null)}
            className="btn-ghost flex-1 text-xs"
          >
            <PlusOutlined className="mr-1" />添加节点
          </button>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || nodes.length === 0}
            className="btn-ghost flex-1 text-xs"
          >
            {isAnalyzing ? <Spin size="small" /> : <RadarChartOutlined className="mr-1" />}
            分析
          </button>
        </div>
      </div>

      {/* Center: Node editor */}
      <div className="flex-1 flex flex-col">
        {selectedNode ? (
          <>
            <div className="h-9 bg-surface-secondary border-b border-white/5 flex items-center px-4 shrink-0">
              <span className="text-xs text-ink-muted">编辑节点</span>
              <Select
                size="small"
                value={selectedNode.type}
                onChange={v => updateNode(selectedNode.id, { type: v })}
                className="ml-3 w-24"
                options={[
                  { value: 'volume', label: '卷' },
                  { value: 'chapter', label: '章' },
                  { value: 'section', label: '节' },
                  { value: 'scene', label: '场景' },
                ]}
              />
              <Select
                size="small"
                value={selectedNode.status}
                onChange={v => updateNode(selectedNode.id, { status: v })}
                className="ml-2 w-24"
                options={[
                  { value: 'planned', label: '规划中' },
                  { value: 'writing', label: '写作中' },
                  { value: 'done', label: '已完成' },
                ]}
              />
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <Input
                value={editingTitle}
                onChange={e => setEditingTitle(e.target.value)}
                onBlur={() => updateNode(selectedNode.id, { title: editingTitle })}
                placeholder="节点标题"
                className="mb-3 text-lg input-dark"
              />
              <Input.TextArea
                value={editingSummary}
                onChange={e => setEditingSummary(e.target.value)}
                onBlur={() => updateNode(selectedNode.id, { summary: editingSummary })}
                placeholder="节点概要..."
                rows={6}
                style={{ background: '#242424', border: '1px solid #2a2a2a', color: '#e5e5e5' }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Empty description="选择左侧大纲节点进行编辑" />
          </div>
        )}
      </div>

      {/* Right: AI Panel + Workflow */}
      <div className="w-80 bg-surface-secondary border-l border-white/5 flex flex-col shrink-0 p-3 gap-3 overflow-auto">
        {/* Workflow guide */}
        <div className="glass-card p-3">
          <h3 className="text-xs font-semibold text-ink-title mb-2">📋 大纲工作流</h3>
          <div className="flex flex-col gap-1.5">
            {[
              { step: '1', label: '搭建大纲', desc: '点 + 创建卷/章节点' },
              { step: '2', label: '填写概要', desc: '选中节点，在中间面板写内容概要' },
              { step: '3', label: 'AI 评估', desc: '点下方"分析大纲评分"看五维雷达图' },
              { step: '4', label: '展开为章节', desc: '点下方按钮一键生成章节到编辑器' },
              { step: '5', label: '开始写作', desc: '鼠标悬停节点 → ✏️ 跳转编辑器' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-surface-card flex items-center justify-center text-[10px] text-ink-muted shrink-0 mt-px">
                  {item.step}
                </span>
                <div>
                  <div className="text-[11px] text-ink-body font-medium">{item.label}</div>
                  <div className="text-[10px] text-ink-disabled">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        {nodes.length > 0 && (
          <div className="glass-card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-ink-muted">总体进度</span>
              <span className="text-[10px] text-ink-disabled">
                {nodes.filter(n => n.status === 'done').length}/{nodes.length} 节点
              </span>
            </div>
            <div className="h-1.5 bg-surface-card rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-primary rounded-full transition-[width] duration-500"
                style={{ width: `${nodes.length > 0 ? Math.round((nodes.filter(n => n.status === 'done').length / nodes.length) * 100) : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Expand to chapters — the KEY action button */}
        {nodes.length > 0 && (
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={handleExpandToChapters}
            block
            size="middle"
          >
            展开大纲为章节，开始写作
          </Button>
        )}

        {/* Score radar */}
        {assessmentResult && radarOption && (
          <div className="glass-card p-3 animate-slide-up">
            <div className="text-center mb-1">
              <span className="text-2xl font-bold text-accent-primary">{assessmentResult.total}</span>
              <span className="text-ink-muted text-sm"> / 100</span>
            </div>
            <ReactECharts option={radarOption} style={{ height: 200 }} />
            {assessmentResult.suggestions.map((s, i) => (
              <p key={i} className="text-xs text-ink-muted mt-1">💡 {s}</p>
            ))}
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-4"><Spin /></div>
        )}

        <div className="border-t border-white/5 pt-3">
          <h3 className="text-xs font-medium text-ink-title mb-2">🤖 AI 工具</h3>
          <div className="flex flex-col gap-2">
            <Button size="small" icon={<RadarChartOutlined />} onClick={handleAnalyze} block disabled={nodes.length === 0}>
              AI 分析大纲评分
            </Button>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => setShowGenerate(true)} block>
              从梗概生成大纲
            </Button>
            <Button size="small" icon={<SwapOutlined />} onClick={() => setShowReverse(true)} block>
              反向大纲（从正文提取）
            </Button>
          </div>
        </div>
      </div>

      {/* Generate modal */}
      <Modal
        title="从梗概生成大纲"
        open={showGenerate}
        onOk={handleGenerate}
        onCancel={() => setShowGenerate(false)}
        okText="生成"
        cancelText="取消"
        confirmLoading={isAnalyzing}
      >
        <Input.TextArea
          value={premise}
          onChange={e => setPremise(e.target.value)}
          placeholder="输入你的故事梗概，AI将生成完整的章节大纲..."
          rows={4}
          style={{ background: '#242424', border: '1px solid #2a2a2a', color: '#e5e5e5' }}
        />
      </Modal>

      {/* Reverse outline modal */}
      <Modal
        title="反向大纲分析"
        open={showReverse}
        onOk={handleReverse}
        onCancel={() => setShowReverse(false)}
        okText="分析"
        cancelText="取消"
        width={600}
      >
        <Input.TextArea
          value={reverseText}
          onChange={e => setReverseText(e.target.value)}
          placeholder="粘贴已完成的小说片段，AI将提取大纲结构..."
          rows={8}
          style={{ background: '#242424', border: '1px solid #2a2a2a', color: '#e5e5e5' }}
        />
      </Modal>
    </div>
  );
};

export default Outline;
