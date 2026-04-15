'use client';

import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Legend
} from 'recharts';
import { SalesOpportunity, OPPORTUNITY_STAGE_CONFIG } from '@/lib/crm-types';

const FUNNEL_STAGES = ['qualified', 'discovery', 'proposal', 'negotiation', 'contract', 'closed_won'] as const;

interface ConversionDataItem {
  stage: string;
  stageLabel: string;
  fromCount: number;
  toCount: number;
  conversionRate: number;
  avgDays: number;
  color: string;
  isBottleneck: boolean;
}

interface ConversionChartProps {
  data: ConversionDataItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white">{data.stageLabel}</p>
        <div className="mt-2 space-y-1 text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            进入数量: <span className="font-medium">{data.fromCount}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            流出数量: <span className="font-medium">{data.toCount}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            转化率: <span className="font-medium" style={{ color: data.isBottleneck ? '#ef4444' : '#3b82f6' }}>
              {data.conversionRate.toFixed(1)}%
            </span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            平均停留: <span className="font-medium">{data.avgDays.toFixed(0)} 天</span>
          </p>
          {data.isBottleneck && (
            <p className="text-red-600 font-medium mt-1">
              ⚠️ 转化瓶颈阶段
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function ConversionChart({ data }: ConversionChartProps) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis dataKey="stageLabel" className="text-xs" />
          <YAxis 
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
            className="text-xs"
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="5 5" label="平均线" />
          <Bar dataKey="conversionRate" name="转化率" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isBottleneck ? '#ef4444' : '#3b82f6'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 计算阶段转化数据
export function useConversionData(
  opportunities: SalesOpportunity[], 
  timeRange: 'month' | 'quarter' | 'year' | 'all',
  comparePeriod?: 'prev' | 'same'
) {
  return useMemo(() => {
    const now = new Date();
    
    // 过滤时间范围
    let filteredOpps = [...opportunities];
    if (timeRange !== 'all') {
      filteredOpps = opportunities.filter(opp => {
        const createdAt = new Date(opp.createdAt);
        switch (timeRange) {
          case 'month':
            return createdAt >= new Date(now.getFullYear(), now.getMonth(), 1);
          case 'quarter':
            const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
            return createdAt >= new Date(now.getFullYear(), quarterMonth, 1);
          case 'year':
            return createdAt >= new Date(now.getFullYear(), 0, 1);
          default:
            return true;
        }
      });
    }

    // 上期对比数据
    let prevOpps: SalesOpportunity[] = [];
    if (comparePeriod === 'prev') {
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      
      if (timeRange === 'month') {
        prevOpps = opportunities.filter(opp => {
          const createdAt = new Date(opp.createdAt);
          return createdAt >= prevStart && createdAt <= prevEnd;
        });
      }
    }

    // 计算各阶段转化率
    const conversionData: ConversionDataItem[] = [];
    const avgConversionRate = 60; // 假设平均转化率

    for (let i = 0; i < FUNNEL_STAGES.length - 1; i++) {
      const currentStage = FUNNEL_STAGES[i];
      const nextStage = FUNNEL_STAGES[i + 1];
      
      const currentStageOpps = filteredOpps.filter(opp => opp.stage === currentStage);
      const nextStageOpps = filteredOpps.filter(opp => opp.stage === nextStage);
      
      // 计算从当前阶段到下一阶段的转化率
      // 简化计算：下一阶段数量 / (当前阶段数量 + 下一阶段数量)
      const total = currentStageOpps.length + nextStageOpps.length;
      const conversionRate = total > 0 ? (nextStageOpps.length / total) * 100 : 0;
      
      // 计算平均停留时间（模拟数据）
      const avgDays = 5 + Math.random() * 15; // 5-20天
      
      conversionData.push({
        stage: currentStage,
        stageLabel: OPPORTUNITY_STAGE_CONFIG[currentStage].label,
        fromCount: currentStageOpps.length,
        toCount: nextStageOpps.length,
        conversionRate,
        avgDays,
        color: OPPORTUNITY_STAGE_CONFIG[currentStage].gradient.split(' ')[1] || '#8884d8',
        isBottleneck: conversionRate < avgConversionRate * 0.8,
      });
    }

    // 计算上期对比数据
    const prevConversionData = comparePeriod === 'prev' && prevOpps.length > 0
      ? FUNNEL_STAGES.slice(0, -1).map((stage, i) => {
          const prevStageOpps = prevOpps.filter(opp => opp.stage === stage);
          const prevNextStage = FUNNEL_STAGES[i + 1];
          const prevNextStageOpps = prevOpps.filter(opp => opp.stage === prevNextStage);
          const total = prevStageOpps.length + prevNextStageOpps.length;
          return {
            stage,
            conversionRate: total > 0 ? (prevNextStageOpps.length / total) * 100 : 0,
          };
        })
      : [];

    // 计算瓶颈阶段
    const bottleneckStages = conversionData.filter(d => d.isBottleneck);
    const overallConversion = conversionData.reduce((sum, d) => sum + d.conversionRate, 0) / Math.max(conversionData.length, 1);

    return {
      conversionData,
      prevConversionData,
      bottleneckStages,
      overallConversion,
      compareEnabled: comparePeriod === 'prev',
    };
  }, [opportunities, timeRange, comparePeriod]);
}
