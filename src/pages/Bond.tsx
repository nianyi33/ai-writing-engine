import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Empty, Progress, Timeline, Tag } from 'antd';
import { HeartOutlined, HeartFilled, HistoryOutlined } from '@ant-design/icons';
import { useRoleStore } from '../stores/useRoleStore';
import { useBondStore } from '../stores/useBondStore';
import ReactECharts from 'echarts-for-react';

const Bond: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const { characters, loadAll } = useRoleStore();
  const { records, loadBonds, getIntimacy, getBondHistory } = useBondStore();

  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

  useEffect(() => {
    if (workId) loadAll(workId);
  }, [workId]);

  useEffect(() => {
    if (characters.length > 0 && !selectedCharId) {
      setSelectedCharId(characters[0].id);
    }
  }, [characters]);

  useEffect(() => {
    if (selectedCharId) loadBonds(selectedCharId);
  }, [selectedCharId]);

  const selectedChar = characters.find(c => c.id === selectedCharId);
  const bondHistory = selectedCharId ? getBondHistory(selectedCharId) : [];
  const currentIntimacy = selectedCharId ? getIntimacy(selectedCharId) : 0;

  // Intimacy trend chart
  const trendOption = {
    backgroundColor: 'transparent',
    grid: { top: 20, right: 20, bottom: 30, left: 50 },
    xAxis: {
      type: 'category',
      data: bondHistory.slice().reverse().map(r => {
        const d = new Date(r.timestamp);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }),
      axisLabel: { color: '#a0a0b0', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      min: -100,
      max: 100,
      axisLabel: { color: '#a0a0b0', fontSize: 10 },
      splitLine: { lineStyle: { color: '#2a2a2a20' } },
    },
    series: [{
      type: 'line',
      data: bondHistory.slice().reverse().map(r => r.intimacyAfter),
      smooth: true,
      lineStyle: { color: '#3b82f6', width: 2 },
      itemStyle: { color: '#3b82f6' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
        { offset: 0, color: 'rgba(233,69,96,0.3)' },
        { offset: 1, color: 'rgba(233,69,96,0.02)' },
      ]}},
    }],
  };

  return (
    <div className="flex-1 flex overflow-hidden animate-fade-in">
      {/* Left: Character list sorted by intimacy */}
      <div className="w-56 bg-surface-secondary border-r border-white/5 flex flex-col shrink-0">
        <div className="p-3 border-b border-white/5">
          <span className="text-xs font-medium text-ink-muted"><HeartOutlined className="mr-1" />角色好感度</span>
        </div>
        <div className="flex-1 overflow-auto">
          {characters.map(char => {
            const intimacy = getIntimacy(char.id);
            const absIntimacy = Math.abs(intimacy);
            const isPositive = intimacy >= 0;
            return (
              <div
                key={char.id}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors duration-200 hover:bg-surface-hover ${
                  selectedCharId === char.id ? 'bg-accent-primary/10 border-l-2 border-accent-primary' : ''
                }`}
                onClick={() => setSelectedCharId(char.id)}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 bg-surface-card text-ink-muted">
                  {char.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink-body truncate">{char.name}</div>
                  <div className="flex items-center gap-1">
                    <Progress
                      percent={absIntimacy}
                      size="small"
                      strokeColor={isPositive ? '#3b82f6' : '#ef4444'}
                      trailColor="#2a2a2a"
                      showInfo={false}
                      className="flex-1"
                    />
                    <span className={`text-[10px] ${isPositive ? 'text-accent-primary' : 'text-accent-error'}`}>
                      {isPositive ? '+' : ''}{intimacy}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {characters.length === 0 && <Empty description="暂无角色" className="mt-8" />}
        </div>
      </div>

      {/* Right: Bond details */}
      <div className="flex-1 overflow-auto p-8">
        {selectedChar ? (
          <div className="max-w-3xl animate-slide-up">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-accent-primary/20 flex items-center justify-center text-xl text-accent-primary">
                {selectedChar.name[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-ink-title">{selectedChar.name}</h2>
                <p className="text-ink-muted text-sm">{selectedChar.personality}</p>
              </div>
              <div className="ml-auto text-center">
                <div className={`text-3xl font-bold ${currentIntimacy >= 0 ? 'text-accent-primary' : 'text-accent-error'}`}>
                  {currentIntimacy >= 0 ? '+' : ''}{currentIntimacy}
                </div>
                <div className="text-xs text-ink-muted">好感度</div>
              </div>
            </div>

            {/* Trend chart */}
            {bondHistory.length > 0 && (
              <div className="glass-card p-4 mb-6">
                <h3 className="text-sm font-medium text-ink-title mb-2">
                  <HistoryOutlined className="mr-1" />好感度变化趋势
                </h3>
                <ReactECharts option={trendOption} style={{ height: 250 }} />
              </div>
            )}

            {/* Event timeline */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-medium text-ink-title mb-4">互动记录</h3>
              {bondHistory.length === 0 ? (
                <Empty description="暂无互动记录" />
              ) : (
                <Timeline
                  items={bondHistory.map(record => ({
                    color: record.intimacyDelta >= 0 ? '#3b82f6' : '#ef4444',
                    children: (
                      <div className="animate-slide-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-ink-body font-medium">{record.event}</span>
                          <Tag color={record.intimacyDelta >= 0 ? 'red' : 'error'}>
                            {record.intimacyDelta >= 0 ? '+' : ''}{record.intimacyDelta}
                          </Tag>
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5">{record.memo}</p>
                        <p className="text-[10px] text-ink-disabled mt-1">
                          {new Date(record.timestamp).toLocaleDateString('zh-CN')}
                          {' · 好感度 → '}{record.intimacyAfter}
                        </p>
                      </div>
                    ),
                  }))}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Empty description="选择左侧角色查看情缘详情" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Bond;
