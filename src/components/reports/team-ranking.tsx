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
  Legend
} from 'recharts';
import { SalesOpportunity } from '@/lib/crm-types';

// 模拟团队成员数据
interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
}

// 扩展商机关联owner信息（用于演示）
interface OpportunityWithOwner extends SalesOpportunity {
  ownerId?: string;
  ownerName?: string;
}

interface RankingData {
  member: TeamMember;
  metrics: {
    wonAmount: number;
    wonCount: number;
    newOpps: number;
    pipelineAmount: number;
    conversionRate: number;
    avgDealSize: number;
    growth: number; // 环比增长率
  };
}

interface TeamRankingChartProps {
  data: RankingData[];
  sortBy: 'wonAmount' | 'wonCount' | 'conversionRate' | 'newOpps';
}

const CHART_COLORS = {
  wonAmount: '#10b981',
  pipelineAmount: '#3b82f6',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white">{data?.member?.name}</p>
        <div className="mt-2 space-y-1 text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            成交金额: <span className="font-medium text-green-600">¥{data?.metrics?.wonAmount.toLocaleString()}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            成交数量: <span className="font-medium">{data?.metrics?.wonCount}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            新增商机: <span className="font-medium">{data?.metrics?.newOpps}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            转化率: <span className="font-medium text-blue-600">{data?.metrics?.conversionRate.toFixed(1)}%</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function TeamRankingChart({ data, sortBy }: TeamRankingChartProps) {
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => {
        switch (sortBy) {
          case 'wonAmount':
            return b.metrics.wonAmount - a.metrics.wonAmount;
          case 'wonCount':
            return b.metrics.wonCount - a.metrics.wonCount;
          case 'conversionRate':
            return b.metrics.conversionRate - a.metrics.conversionRate;
          case 'newOpps':
            return b.metrics.newOpps - a.metrics.newOpps;
          default:
            return 0;
        }
      })
      .slice(0, 10); // 只显示前10名
  }, [data, sortBy]);

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            dataKey="member.name" 
            angle={-45} 
            textAnchor="end" 
            height={60}
            className="text-xs"
          />
          <YAxis 
            yAxisId="left"
            orientation="left"
            stroke="#10b981"
            className="text-xs"
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#3b82f6"
            className="text-xs"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar yAxisId="left" dataKey="metrics.wonAmount" name="成交金额" fill={CHART_COLORS.wonAmount} radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="metrics.newOpps" name="新增商机" fill={CHART_COLORS.pipelineAmount} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 计算团队排名数据
export function useTeamRanking(opportunities: OpportunityWithOwner[], timeRange: 'month' | 'quarter' | 'year' | 'all') {
  // 模拟团队成员
  const teamMembers: TeamMember[] = [
    { id: 'user_1', name: '张销售' },
    { id: 'user_2', name: '李经理' },
    { id: 'user_3', name: '王总监' },
    { id: 'user_4', name: '赵专员' },
    { id: 'user_5', name: '钱顾问' },
  ];

  return useMemo(() => {
    const now = new Date();
    
    // 为商机分配随机的owner（用于演示）
    const opportunitiesWithOwner = opportunities.map((opp, index) => ({
      ...opp,
      ownerId: teamMembers[index % teamMembers.length].id,
      ownerName: teamMembers[index % teamMembers.length].name,
    }));

    // 过滤时间范围
    let filteredOpps = [...opportunitiesWithOwner];
    if (timeRange !== 'all') {
      filteredOpps = opportunitiesWithOwner.filter(opp => {
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

    // 按成员分组计算指标
    const rankingData: RankingData[] = teamMembers.map(member => {
      const memberOpps = filteredOpps.filter(opp => opp.ownerId === member.id);
      const wonOpps = memberOpps.filter(opp => opp.stage === 'closed_won');
      const activeOpps = memberOpps.filter(opp => !['closed_won', 'closed_lost'].includes(opp.stage));
      
      const wonAmount = wonOpps.reduce((sum, opp) => sum + opp.value, 0);
      const pipelineAmount = activeOpps.reduce((sum, opp) => sum + opp.value, 0);
      const totalClosed = wonOpps.length + memberOpps.filter(opp => opp.stage === 'closed_lost').length;
      
      return {
        member,
        metrics: {
          wonAmount,
          wonCount: wonOpps.length,
          newOpps: memberOpps.length,
          pipelineAmount,
          conversionRate: totalClosed > 0 ? (wonOpps.length / totalClosed) * 100 : 0,
          avgDealSize: wonOpps.length > 0 ? wonAmount / wonOpps.length : 0,
          growth: Math.random() * 40 - 10, // 模拟环比增长率
        },
      };
    });

    return rankingData.sort((a, b) => b.metrics.wonAmount - a.metrics.wonAmount);
  }, [opportunities, timeRange, teamMembers]);
}
