'use client';

import { useMemo } from 'react';
import { useCRM } from '@/lib/crm-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, DollarSign, Percent, Calendar, Sparkles, ArrowRight, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { OpportunityPredictionEngine } from '@/lib/opportunity-prediction-engine';
import { calculateWeightedPipeline, calculatePredictionDistribution } from '@/lib/opportunity-prediction-engine';
import { ProbabilityBadge, ProbabilityRing } from '@/components/crm/prediction-components';
import { PREDICTION_LEVEL_CONFIG, getPredictionColorClass } from '@/lib/opportunity-prediction-types';

// 简易饼图组件
function SimplePieChart({ data, size = 200 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const radius = size / 2 - 20;
  const circumference = 2 * Math.PI * radius;
  let currentAngle = 0;

  const segments = data.map((item, index) => {
    const percentage = item.value / total;
    const dashLength = circumference * percentage;
    const dashOffset = circumference * currentAngle;
    currentAngle += percentage;

    return (
      <g key={index}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={item.color}
          strokeWidth="30"
          strokeDasharray={`${dashLength} ${circumference - dashLength}`}
          strokeDashoffset={-dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.5s ease-in-out' }}
        />
      </g>
    );
  });

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {segments}
    </svg>
  );
}

// 简易柱状图组件
function SimpleBarChart({ data, width = 400, height = 200 }: { data: { label: string; value: number; color: string }[]; width?: number; height?: number }) {
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = (width - 40) / data.length - 10;
  const chartHeight = height - 60;

  return (
    <svg width={width} height={height}>
      {/* Y轴 */}
      <line x1="30" y1="10" x2="30" y2={chartHeight + 10} stroke="currentColor" strokeOpacity="0.2" />
      
      {/* X轴 */}
      <line x1="30" y1={chartHeight + 10} x2={width - 10} y2={chartHeight + 10} stroke="currentColor" strokeOpacity="0.2" />

      {/* 柱状图 */}
      {data.map((item, index) => {
        const barHeight = (item.value / maxValue) * chartHeight;
        const x = 40 + index * ((width - 50) / data.length) + 5;
        const y = chartHeight + 10 - barHeight;

        return (
          <g key={index}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={item.color}
              rx="4"
              className="transition-all duration-500"
            />
            {/* 值 */}
            <text
              x={x + barWidth / 2}
              y={y - 5}
              textAnchor="middle"
              className="text-xs fill-current"
              fillOpacity="0.8"
            >
              ¥{(item.value / 10000).toFixed(1)}万
            </text>
            {/* 标签 */}
            <text
              x={x + barWidth / 2}
              y={chartHeight + 25}
              textAnchor="middle"
              className="text-xs fill-muted-foreground"
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function PredictionsPage() {
  const router = useRouter();
  const { opportunities } = useCRM();

  // 创建预测引擎
  const predictionEngine = useMemo(() => new OpportunityPredictionEngine(), []);

  // 计算所有商机的预测
  const predictions = useMemo(() => {
    return opportunities.map(opp => {
      const prediction = predictionEngine.calculatePrediction(opp);
      return {
        ...opp,
        aiProbability: prediction.probability,
        aiLevel: prediction.level,
        prediction,
      };
    });
  }, [opportunities, predictionEngine]);

  // 只统计活跃商机（排除已成交和失败的）
  const activeOpportunities = useMemo(() => {
    return predictions.filter(o => o.stage !== 'closed_won' && o.stage !== 'closed_lost');
  }, [predictions]);

  // 计算加权管道预测
  const pipelineStats = useMemo(() => {
    return calculateWeightedPipeline(
      activeOpportunities.map(o => ({ value: o.value, probability: o.aiProbability }))
    );
  }, [activeOpportunities]);

  // 计算预测分布
  const distribution = useMemo(() => {
    const probabilities = activeOpportunities.map(o => o.aiProbability);
    return calculatePredictionDistribution(probabilities);
  }, [activeOpportunities]);

  // 按阶段分组的预测数据（用于柱状图）
  const stagePredictionData = useMemo(() => {
    const stageGroups: Record<string, { total: number; weighted: number; count: number }> = {};
    
    activeOpportunities.forEach(opp => {
      if (!stageGroups[opp.stage]) {
        stageGroups[opp.stage] = { total: 0, weighted: 0, count: 0 };
      }
      stageGroups[opp.stage].total += opp.value;
      stageGroups[opp.stage].weighted += opp.value * opp.aiProbability / 100;
      stageGroups[opp.stage].count += 1;
    });

    const stageLabels: Record<string, string> = {
      qualified: '商机确认',
      discovery: '需求调研',
      proposal: '方案报价',
      negotiation: '商务洽谈',
      contract: '合同签署',
    };

    const stageColors: Record<string, string> = {
      qualified: '#3b82f6',
      discovery: '#0ea5e9',
      proposal: '#a855f7',
      negotiation: '#f97316',
      contract: '#14b8a6',
    };

    return Object.entries(stageGroups).map(([stage, data]) => ({
      label: stageLabels[stage] || stage,
      value: data.weighted,
      color: stageColors[stage] || '#6b7280',
      count: data.count,
      total: data.total,
    }));
  }, [activeOpportunities]);

  // 高概率商机列表
  const highProbabilityOpps = useMemo(() => {
    return activeOpportunities
      .filter(o => o.aiProbability >= 70)
      .sort((a, b) => b.aiProbability - a.aiProbability)
      .slice(0, 5);
  }, [activeOpportunities]);

  // 饼图数据
  const pieData = [
    { label: '高概率', value: distribution.high, color: '#22c55e' },
    { label: '中概率', value: distribution.medium, color: '#eab308' },
    { label: '低概率', value: distribution.low, color: '#6b7280' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-emerald-500/5 rounded-3xl -z-10" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/opportunities">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-green-600" />
                AI 销售预测
              </h1>
              <p className="text-muted-foreground mt-1">
                基于 {activeOpportunities.length} 个活跃商机的智能预测分析
              </p>
            </div>
          </div>
          <Link href="/opportunities/prediction-config">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              预测配置
            </Button>
          </Link>
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* 加权预测 */}
        <Card className="col-span-2 bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  加权管道预测
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  ¥{pipelineStats.weightedValue.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  预期成交金额 (基于概率加权)
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  管道总额
                </div>
                <div className="text-lg font-semibold">
                  ¥{pipelineStats.totalValue.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  转换率: {pipelineStats.totalValue > 0 ? Math.round(pipelineStats.weightedValue / pipelineStats.totalValue * 100) : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 最佳情况 */}
        <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-muted-foreground">最佳情况</p>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              ¥{pipelineStats.bestCase.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              高概率商机总额
            </p>
          </CardContent>
        </Card>

        {/* 平均概率 */}
        <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <p className="text-sm text-muted-foreground">平均概率</p>
            </div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
              {distribution.average}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {distribution.total} 个商机平均
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 概率分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              概率分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              {/* 饼图 */}
              <div className="relative">
                <SimplePieChart data={pieData} size={200} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ProbabilityRing probability={distribution.average} size={80} strokeWidth={6} />
                </div>
              </div>

              {/* 图例 */}
              <div className="space-y-4">
                {pieData.map((item, index) => {
                  const levelConfig = index === 0 ? PREDICTION_LEVEL_CONFIG.high :
                                     index === 1 ? PREDICTION_LEVEL_CONFIG.medium :
                                     PREDICTION_LEVEL_CONFIG.low;
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={cn('text-sm font-medium', levelConfig.color)}>
                            {levelConfig.label}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {item.value} 个 ({distribution.total > 0 ? Math.round(item.value / distribution.total * 100) : 0}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 阶段预测 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              各阶段预测
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stagePredictionData.length > 0 ? (
              <div className="flex justify-center">
                <SimpleBarChart data={stagePredictionData} width={400} height={220} />
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>暂无阶段数据</p>
              </div>
            )}
            
            {/* 阶段详情 */}
            <div className="grid grid-cols-5 gap-2 mt-4">
              {stagePredictionData.map((item, index) => (
                <div key={index} className="text-center p-2 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-sm font-semibold">{item.count}个</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 高概率商机 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            高概率商机 TOP 5
          </CardTitle>
        </CardHeader>
        <CardContent>
          {highProbabilityOpps.length > 0 ? (
            <div className="space-y-3">
              {highProbabilityOpps.map((opp, index) => (
                <div
                  key={opp.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => router.push(`/opportunities/${opp.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{opp.title}</p>
                      <p className="text-sm text-muted-foreground">{opp.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-semibold">¥{opp.value.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">预计金额</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-600 font-semibold">¥{Math.round(opp.value * opp.aiProbability / 100).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">加权预测</p>
                    </div>
                    <ProbabilityBadge probability={opp.aiProbability} size="md" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <TrendingDown className="h-12 w-12 mb-4 opacity-50" />
              <p>暂无高概率商机</p>
              <p className="text-sm">继续跟进更多商机以提高成交可能</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 预测洞察 */}
      <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-600" />
            AI 预测洞察
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium">成交机会</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{distribution.high}</p>
              <p className="text-sm text-muted-foreground">
                个高概率商机(≥70%)值得关注
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Minus className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">需要培育</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{distribution.medium}</p>
              <p className="text-sm text-muted-foreground">
                个中概率商机需要加强跟进
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="font-medium">建议行动</span>
              </div>
              <p className="text-lg font-bold text-purple-600">
                {highProbabilityOpps.length > 0 ? '重点跟进高概率商机' : '继续积累商机'}
              </p>
              <p className="text-sm text-muted-foreground">
                基于当前预测的推荐策略
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
