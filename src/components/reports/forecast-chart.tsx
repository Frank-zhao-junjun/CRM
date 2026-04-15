'use client';

import { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart
} from 'recharts';
import { SalesOpportunity, OPPORTUNITY_STAGE_CONFIG } from '@/lib/crm-types';

interface ForecastPoint {
  month: string;
  optimistic: number;
  expected: number;
  conservative: number;
  actual?: number;
}

interface ForecastChartProps {
  data: ForecastPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="flex justify-between gap-4">
              <span>{entry.name}:</span>
              <span className="font-medium">¥{entry.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function ForecastChart({ data }: ForecastChartProps) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="optimisticGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="conservativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis dataKey="month" className="text-xs" />
          <YAxis 
            tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
            className="text-xs"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="optimistic" 
            name="乐观预测" 
            stroke="#10b981" 
            fill="url(#optimisticGradient)" 
            strokeDasharray="5 5"
          />
          <Area 
            type="monotone" 
            dataKey="conservative" 
            name="保守预测" 
            stroke="#f59e0b" 
            fill="url(#conservativeGradient)" 
            strokeDasharray="3 3"
          />
          <Line 
            type="monotone" 
            dataKey="expected" 
            name="预期预测" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#3b82f6' }}
          />
          {data.some(d => d.actual !== undefined) && (
            <Line 
              type="monotone" 
              dataKey="actual" 
              name="实际收入" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ r: 4, fill: '#8b5cf6' }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// 计算收入预测数据
export function useForecastData(opportunities: SalesOpportunity[], period: 'quarter' | 'half' | 'year') {
  return useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // 确定预测月份数
    let months = 3; // 默认季度
    if (period === 'half') months = 6;
    if (period === 'year') months = 12;
    
    // 按阶段概率计算权重
    const stageWeights: Record<string, number> = {
      qualified: 0.1,
      discovery: 0.25,
      proposal: 0.5,
      negotiation: 0.75,
      contract: 0.9,
    };
    
    // 过滤活跃商机
    const activeOpps = opportunities.filter(
      opp => !['closed_won', 'closed_lost'].includes(opp.stage)
    );
    
    // 计算各月预测
    const forecastData: ForecastPoint[] = [];
    
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(currentYear, currentMonth + i, 1);
      const monthName = `${monthDate.getMonth() + 1}月`;
      
      // 计算该月到期的商机
      const dueOpps = activeOpps.filter(opp => {
        const dueDate = new Date(opp.expectedCloseDate);
        return dueDate.getFullYear() === monthDate.getFullYear() && 
               dueDate.getMonth() === monthDate.getMonth();
      });
      
      // 计算预期金额（按概率加权）
      const expectedAmount = dueOpps.reduce((sum, opp) => {
        const weight = stageWeights[opp.stage] || 0.5;
        return sum + (opp.value * weight);
      }, 0);
      
      // 乐观：所有商机都成交
      const optimisticAmount = dueOpps.reduce((sum, opp) => sum + opp.value, 0);
      
      // 保守：只有高概率商机成交
      const conservativeAmount = dueOpps.reduce((sum, opp) => {
        const weight = stageWeights[opp.stage] || 0.5;
        return sum + (opp.value * weight * 0.6);
      }, 0);
      
      // 实际收入（仅过去月份有）
      let actualAmount: number | undefined;
      if (i < 0) { // 假设只有过去月份有实际数据
        actualAmount = opportunities
          .filter(opp => {
            const closeDate = new Date(opp.updatedAt);
            return opp.stage === 'closed_won' &&
                   closeDate.getFullYear() === monthDate.getFullYear() &&
                   closeDate.getMonth() === monthDate.getMonth();
          })
          .reduce((sum, opp) => sum + opp.value, 0);
      }
      
      forecastData.push({
        month: monthName,
        optimistic: optimisticAmount,
        expected: expectedAmount,
        conservative: conservativeAmount,
        actual: actualAmount,
      });
    }
    
    // 计算总计
    const totals = forecastData.reduce(
      (acc, point) => ({
        optimistic: acc.optimistic + point.optimistic,
        expected: acc.expected + point.expected,
        conservative: acc.conservative + point.conservative,
      }),
      { optimistic: 0, expected: 0, conservative: 0 }
    );
    
    return { forecastData, totals };
  }, [opportunities, period]);
}
