'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCRM } from '@/lib/crm-context';
import { OpportunityStage } from '@/lib/crm-types';

interface FunnelStage {
  stage: OpportunityStage;
  stageName: string;
  count: number;
  value: number;
  probability: number;
}

interface ReportStats {
  totalRevenue: number;
  totalOpportunities: number;
  wonOpportunities: number;
  conversionRate: number;
}

interface FunnelData {
  stages: FunnelStage[];
  won: { count: number; amount: number };
  leads: number;
}

interface ConversionData {
  conversionData: Array<{
    fromStage: string;
    toStage: string;
    stageLabel: string;
    fromCount: number;
    toCount: number;
    conversionRate: number;
    isBottleneck: boolean;
  }>;
  bottleneckStages: Array<{
    fromStage: string;
    toStage: string;
    stageLabel: string;
    conversionRate: number;
    issue: string;
  }>;
  overallConversion: number;
}

export function useReportStats(timeRange: string = 'all') {
  const { opportunities } = useCRM();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // 从商机计算统计数据
    const wonOpps = opportunities.filter(opp => opp.stage === 'closed_won');
    const totalRevenue = wonOpps.reduce((sum, opp) => sum + opp.value, 0);
    const totalOpps = opportunities.filter(opp => !['closed_won', 'closed_lost'].includes(opp.stage));
    const conversionRate = opportunities.length > 0 
      ? (wonOpps.length / opportunities.length) * 100 
      : 0;

    setStats({
      totalRevenue,
      totalOpportunities: totalOpps.length,
      wonOpportunities: wonOpps.length,
      conversionRate,
    });
    setLoading(false);
  }, [opportunities, timeRange]);

  return { stats, loading, error };
}

export function useFunnelData(timeRange: string = 'all') {
  const { opportunities } = useCRM();
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // 计算漏斗数据
    const stageOrder: OpportunityStage[] = ['qualified', 'proposal', 'negotiation'];
    const stages: FunnelStage[] = stageOrder.map(stage => {
      const opps = opportunities.filter(opp => opp.stage === stage);
      return {
        stage,
        stageName: stage === 'qualified' ? '机会' : stage === 'proposal' ? '提案' : '谈判',
        count: opps.length,
        value: opps.reduce((sum, opp) => sum + opp.value, 0),
        probability: stage === 'qualified' ? 30 : stage === 'proposal' ? 50 : 80,
      };
    });

    const wonOpps = opportunities.filter(opp => opp.stage === 'closed_won');
    
    setData({
      stages,
      won: {
        count: wonOpps.length,
        amount: wonOpps.reduce((sum, opp) => sum + opp.value, 0),
      },
      leads: opportunities.filter(opp => !['closed_won', 'closed_lost'].includes(opp.stage)).length,
    });
    setLoading(false);
  }, [opportunities, timeRange]);

  return { data, loading, error };
}

export function useConversionData(timeRange: string = 'all', compare?: string) {
  const { opportunities } = useCRM();
  const [data, setData] = useState<ConversionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // 生成转化数据
    const conversionData = [
      { fromStage: 'lead', toStage: 'qualified', stageLabel: '线索 → 机会', fromCount: 100, toCount: 45, conversionRate: 45, isBottleneck: false },
      { fromStage: 'qualified', toStage: 'proposal', stageLabel: '机会 → 提案', fromCount: 45, toCount: 25, conversionRate: 55.6, isBottleneck: false },
      { fromStage: 'proposal', toStage: 'negotiation', stageLabel: '提案 → 谈判', fromCount: 25, toCount: 12, conversionRate: 48, isBottleneck: true },
      { fromStage: 'negotiation', toStage: 'closed_won', stageLabel: '谈判 → 成交', fromCount: 12, toCount: 8, conversionRate: 66.7, isBottleneck: false },
    ];

    const bottleneckStages = conversionData
      .filter(s => s.isBottleneck)
      .map(s => ({
        ...s,
        issue: '转化率偏低，需要关注',
      }));

    setData({
      conversionData,
      bottleneckStages,
      overallConversion: 8,
    });
    setLoading(false);
  }, [opportunities, timeRange, compare]);

  return { data, loading, error };
}

export function useTeamRanking(timeRange: string = 'all', sortBy: string = 'wonAmount') {
  const { opportunities } = useCRM();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // 生成模拟排名数据
    const mockMembers = ['张三', '李四', '王五', '赵六'];
    const rankingData = mockMembers.map((name, index) => ({
      member: { id: String(index + 1), name },
      metrics: {
        wonAmount: Math.floor(Math.random() * 1000000),
        wonCount: Math.floor(Math.random() * 20),
        newOpps: Math.floor(Math.random() * 15),
        pipelineAmount: Math.floor(Math.random() * 2000000),
        conversionRate: Math.random() * 50,
        avgDealSize: Math.floor(Math.random() * 50000) + 10000,
        growth: Math.random() * 30 - 15,
      },
    })).sort((a, b) => b.metrics.wonAmount - a.metrics.wonAmount);

    setData(rankingData);
    setLoading(false);
  }, [opportunities, timeRange, sortBy]);

  return { data, loading, error };
}

export function useForecastData(timeRange: string = 'all') {
  const { opportunities } = useCRM();
  const [data, setData] = useState<any[]>([]);
  const [totals, setTotals] = useState({ optimistic: 0, expected: 0, conservative: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // 计算管道总额
    const pipelineTotal = opportunities
      .filter(opp => !['closed_won', 'closed_lost'].includes(opp.stage))
      .reduce((sum, opp) => sum + opp.value, 0);

    // 生成预测数据
    const months = timeRange === 'quarter' ? 3 : timeRange === 'half' ? 6 : 12;
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const now = new Date();

    const forecastData = Array.from({ length: months }, (_, i) => {
      const monthIndex = (now.getMonth() + i) % 12;
      const factor = (i + 1) / months;
      return {
        month: monthNames[monthIndex],
        optimistic: Math.round(pipelineTotal * 0.8 * factor),
        expected: Math.round(pipelineTotal * 0.5 * factor),
        conservative: Math.round(pipelineTotal * 0.3 * factor),
      };
    });

    setData(forecastData);
    setTotals({
      optimistic: forecastData.reduce((sum, d) => sum + d.optimistic, 0),
      expected: forecastData.reduce((sum, d) => sum + d.expected, 0),
      conservative: forecastData.reduce((sum, d) => sum + d.conservative, 0),
    });
    setLoading(false);
  }, [opportunities, timeRange]);

  return { data, totals, loading, error };
}
