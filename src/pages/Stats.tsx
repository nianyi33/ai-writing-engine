import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Empty, Card, Statistic } from 'antd';
import {
  EditOutlined, FireOutlined, ClockCircleOutlined, TrophyOutlined,
} from '@ant-design/icons';
import { useStatsStore } from '../stores/useStatsStore';
import { useWorksStore } from '../stores/useWorksStore';
import ReactECharts from 'echarts-for-react';

const Stats: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const { dailyCounts, sessionWords, streakDays, loadStats, loaded } = useStatsStore();
  const { works, currentWorkId } = useWorksStore();

  const work = works.find(w => w.id === currentWorkId);

  useEffect(() => {
    if (workId) loadStats(workId);
  }, [workId]);

  const totalWords = dailyCounts.reduce((s, c) => s + c.words, 0);
  const todayWords = dailyCounts.find(c => c.date === new Date().toISOString().split('T')[0])?.words || 0;

  // Daily word count bar chart
  const barOption = {
    tooltip: { trigger: 'axis' },
    grid: { top: 10, right: 20, bottom: 30, left: 50 },
    xAxis: {
      type: 'category',
      data: dailyCounts.slice(-14).map(c => c.date.slice(5)),
      axisLabel: { color: '#a0a0b0', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      name: '字数',
      axisLabel: { color: '#a0a0b0', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1a4a7a20' } },
    },
    series: [{
      type: 'bar',
      data: dailyCounts.slice(-14).map(c => c.words),
      itemStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#e94560' },
            { offset: 1, color: '#e9456040' },
          ]},
        borderRadius: [4, 4, 0, 0],
      },
    }],
  };

  // Writing time heatmap (simplified)
  const heatmapOption = {
    tooltip: { position: 'top' },
    grid: { top: 5, right: 15, bottom: 5, left: 50 },
    xAxis: {
      type: 'category',
      data: ['一', '二', '三', '四', '五', '六', '日'],
      axisLabel: { color: '#a0a0b0', fontSize: 10 },
    },
    yAxis: {
      type: 'category',
      data: ['0-6时', '6-12时', '12-18时', '18-24时'],
      axisLabel: { color: '#a0a0b0', fontSize: 10 },
    },
    visualMap: {
      min: 0, max: 10,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: ['#1a1a2e', '#16213e', '#0f3460', '#1a4a7a', '#e94560'] },
      show: false,
    },
    series: [{
      type: 'heatmap',
      data: Array.from({ length: 28 }, (_, i) => [i % 7, Math.floor(i / 7), Math.floor(Math.random() * 10)]),
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,.5)' } },
    }],
  };

  return (
    <div className="flex-1 overflow-auto p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-ink-title mb-6">写作统计</h2>

        {/* Overview cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4">
            <Statistic
              title={<span className="text-ink-muted text-xs">总字数</span>}
              value={work?.wordCount || 0}
              suffix="字"
              valueStyle={{ color: '#e0e0e0', fontSize: 24, fontWeight: 'bold' }}
              prefix={<EditOutlined className="text-accent-primary mr-1" />}
            />
          </div>
          <div className="glass-card p-4">
            <Statistic
              title={<span className="text-ink-muted text-xs">今日字数</span>}
              value={todayWords}
              suffix="字"
              valueStyle={{ color: '#e0e0e0', fontSize: 24, fontWeight: 'bold' }}
              prefix={<ClockCircleOutlined className="text-accent-primary mr-1" />}
            />
          </div>
          <div className="glass-card p-4">
            <Statistic
              title={<span className="text-ink-muted text-xs">连续天数</span>}
              value={streakDays}
              suffix="天"
              valueStyle={{ color: '#e0e0e0', fontSize: 24, fontWeight: 'bold' }}
              prefix={<FireOutlined className="text-accent-warning mr-1" />}
            />
          </div>
          <div className="glass-card p-4">
            <Statistic
              title={<span className="text-ink-muted text-xs">本次会话</span>}
              value={sessionWords}
              suffix="字"
              valueStyle={{ color: '#e0e0e0', fontSize: 24, fontWeight: 'bold' }}
              prefix={<TrophyOutlined className="text-accent-success mr-1" />}
            />
          </div>
        </div>

        {/* Daily chart */}
        <div className="glass-card p-4 mb-6">
          <h3 className="text-sm font-medium text-ink-title mb-3">每日字数趋势</h3>
          {dailyCounts.length > 0 ? (
            <ReactECharts option={barOption} style={{ height: 280 }} />
          ) : (
            <Empty description="暂无数据，开始写作吧" />
          )}
        </div>

        {/* Heatmap */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-ink-title mb-3">写作时段分布（示例）</h3>
          <ReactECharts option={heatmapOption} style={{ height: 200 }} />
          <p className="text-[10px] text-ink-disabled text-center mt-2">
            写作时段追踪功能将在后续版本中完善
          </p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
