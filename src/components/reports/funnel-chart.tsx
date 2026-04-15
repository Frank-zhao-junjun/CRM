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
  LabelList
} from 'recharts';
import { useCRM } from '@/lib/crm-context';
import { OPPORTUNITY_STAGE_CONFIG } from '@/lib/crm-types';

// 销售漏斗阶段配置（不含终态）
const FUNNEL_STAGES = ['qualified', 'discovery', 'proposal', 'negotiation', 'contract'] as const;

interface FunnelDataItem {
  stage: string;
  stageLabel: string;
  count: number;
  amount: number;
  conversionRate: number;
  color: string;
}

interface FunnelChartProps {
  data: FunnelDataItem[];
  viewMode: 'count' | 'amount';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white">{data.stageLabel}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          数量: <span className="font-medium">{data.count}</span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          金额: <span className="font-medium">¥{data.amount.toLocaleString()}</span>
        </p>
        {data.conversionRate > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            转化率: <span className="font-medium text-blue-600">{data.conversionRate}%</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function FunnelChart({ data, viewMode }: FunnelChartProps) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 80, left: 80, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            type="number" 
            tickFormatter={(value) => 
              viewMode === 'amount' 
                ? `¥${(value / 10000).toFixed(0)}万` 
                : value
            }
            className="text-xs"
          />
          <YAxis 
            type="category" 
            dataKey="stageLabel" 
            width={80}
            className="text-xs"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={viewMode === 'amount' ? 'amount' : 'count'} radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList 
              dataKey={viewMode === 'amount' ? 'amount' : 'count'} 
              position="right"
              formatter={(value: number) => 
                viewMode === 'amount' 
                  ? `¥${value.toLocaleString()}` 
                  : value.toString()
              }
              className="text-xs fill-gray-600 dark:fill-gray-400"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 计算漏斗数据
export function useFunnelData(timeRange: 'month' | 'quarter' | 'year' | 'all') {
  const { opportunities, leads } = useCRM();
  
  return useMemo(() => {
    // 过滤时间范围
    const now = new Date();
    let filteredOpportunities = [...opportunities];
    
    if (timeRange !== 'all') {
      filteredOpportunities = opportunities.filter(opp => {
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
    
    // 计算各阶段数据
    const stageData = FUNNEL_STAGES.map((stage, index) => {
      const stageOpps = filteredOpportunities.filter(opp => opp.stage === stage);
      const count = stageOpps.length;
      const amount = stageOpps.reduce((sum, opp) => sum + opp.value, 0);
      
      // 计算转化率（与上一阶段对比）
      let conversionRate = 100;
      if (index > 0) {
        const prevStage = FUNNEL_STAGES[index - 1];
        const prevCount = filteredOpportunities.filter(opp => opp.stage === prevStage).length;
        conversionRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
      }
      
      return {
        stage,
        stageLabel: OPPORTUNITY_STAGE_CONFIG[stage].label,
        count,
        amount,
        conversionRate,
        color: OPPORTUNITY_STAGE_CONFIG[stage].gradient.split(' ')[1] || '#8884d8',
      };
    });
    
    // 添加成交统计
    const wonOpps = filteredOpportunities.filter(opp => opp.stage === 'closed_won');
    const wonAmount = wonOpps.reduce((sum, opp) => sum + opp.value, 0);
    
    // 添加线索统计
    const leadCount = timeRange === 'all' 
      ? leads.length 
      : leads.filter(lead => {
          const createdAt = new Date(lead.createdAt);
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
        }).length;
    
    return {
      funnelData: stageData,
      wonOpps: {
        count: wonOpps.length,
        amount: wonAmount,
        label: '已成交',
      },
      leadCount,
    };
  }, [opportunities, leads, timeRange]);
}
