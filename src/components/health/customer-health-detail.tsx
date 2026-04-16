'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Activity,
  DollarSign,
  ShoppingCart,
  Briefcase,
  CreditCard,
  Lightbulb,
  X
} from 'lucide-react';

// 健康度评分类型
interface HealthScore {
  customerId: string;
  customerName: string;
  totalScore: number;
  level: 'healthy' | 'good' | 'fair' | 'risk';
  levelLabel: string;
  dimensions: {
    interaction: { score: number; maxScore: number; value: number; label: string };
    salesAmount: { score: number; maxScore: number; value: number; label: string };
    orderFrequency: { score: number; maxScore: number; value: number; label: string };
    opportunityActivity: { score: number; maxScore: number; value: number; label: string };
    paymentTimeliness: { score: number; maxScore: number; value: number; label: string };
  };
  rank: number;
}

// 等级配置
const LEVEL_CONFIG = {
  healthy: {
    label: '健康',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-500',
    icon: CheckCircle,
    description: '客户关系非常健康',
  },
  good: {
    label: '良好',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-500',
    icon: TrendingUp,
    description: '客户关系状态良好',
  },
  fair: {
    label: '一般',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-500',
    icon: Activity,
    description: '需要关注客户关系',
  },
  risk: {
    label: '风险',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-500',
    icon: AlertTriangle,
    description: '客户关系需要立即改善',
  },
};

// 维度配置
const DIMENSION_CONFIG = {
  interaction: {
    label: '互动频率',
    icon: Activity,
    color: '#3b82f6',
    description: '最近90天内的互动活动次数',
    suggestions: [
      '增加客户拜访频率',
      '定期发送有价值的内容',
      '邀请参加客户活动',
    ],
  },
  salesAmount: {
    label: '销售金额',
    icon: DollarSign,
    color: '#22c55e',
    description: '客户累计成交金额',
    suggestions: [
      '推荐高价值产品',
      '提供批量采购优惠',
      '开发客户潜力',
    ],
  },
  orderFrequency: {
    label: '订单频次',
    icon: ShoppingCart,
    color: '#f59e0b',
    description: '客户订单数量',
    suggestions: [
      '促进复购',
      '推出订阅服务',
      '建立客户忠诚计划',
    ],
  },
  opportunityActivity: {
    label: '商机关怀',
    icon: Briefcase,
    color: '#8b5cf6',
    description: '当前活跃商机数量和金额',
    suggestions: [
      '加速商机推进',
      '定期跟进商机进展',
      '挖掘新商机机会',
    ],
  },
  paymentTimeliness: {
    label: '回款及时',
    icon: CreditCard,
    color: '#ec4899',
    description: '回款按时完成比例',
    suggestions: [
      '加强应收账款管理',
      '优化付款条款',
      '建立付款提醒机制',
    ],
  },
};

interface CustomerHealthDetailProps {
  healthScore: HealthScore | null;
  open: boolean;
  onClose: () => void;
}

export function CustomerHealthDetail({ healthScore, open, onClose }: CustomerHealthDetailProps) {
  if (!healthScore) return null;

  const levelConfig = LEVEL_CONFIG[healthScore.level];
  const LevelIcon = levelConfig.icon;

  // 准备雷达图数据
  const radarData = [
    { dimension: '互动频率', score: healthScore.dimensions.interaction.score, maxScore: healthScore.dimensions.interaction.maxScore, fullMark: 25 },
    { dimension: '销售金额', score: healthScore.dimensions.salesAmount.score, maxScore: healthScore.dimensions.salesAmount.maxScore, fullMark: 30 },
    { dimension: '订单频次', score: healthScore.dimensions.orderFrequency.score, maxScore: healthScore.dimensions.orderFrequency.maxScore, fullMark: 20 },
    { dimension: '商机关怀', score: healthScore.dimensions.opportunityActivity.score, maxScore: healthScore.dimensions.opportunityActivity.maxScore, fullMark: 15 },
    { dimension: '回款及时', score: healthScore.dimensions.paymentTimeliness.score, maxScore: healthScore.dimensions.paymentTimeliness.maxScore, fullMark: 10 },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${levelConfig.bgColor} flex items-center justify-center`}>
                <LevelIcon className={`h-6 w-6 ${levelConfig.color}`} />
              </div>
              <div>
                <DialogTitle className="text-xl">{healthScore.customerName}</DialogTitle>
                <p className="text-sm text-muted-foreground">健康度评分详情</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 总分和等级 */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold">{healthScore.totalScore}</div>
                <div className="text-sm text-muted-foreground">健康度总分</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <Badge className={`${levelConfig.bgColor} ${levelConfig.color} text-base px-3 py-1`}>
                  {levelConfig.label}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">{levelConfig.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold">#{healthScore.rank}</div>
              <div className="text-sm text-muted-foreground">排名</div>
            </div>
          </div>

          {/* 雷达图和维度得分 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 雷达图 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">健康度雷达图</CardTitle>
                <CardDescription>五维度得分分布</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis 
                        dataKey="dimension" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 30]} 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      />
                      <Radar
                        name="健康度"
                        dataKey="score"
                        stroke={levelConfig.color.replace('text-', 'var(--')}
                        fill={levelConfig.color.replace('text-', 'var(--')}
                        fillOpacity={0.4}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 维度详情 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">各维度得分</CardTitle>
                <CardDescription>详情及改善建议</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(healthScore.dimensions).map(([key, dim]) => {
                  const config = DIMENSION_CONFIG[key as keyof typeof DIMENSION_CONFIG];
                  const Icon = config?.icon || Activity;
                  const percentage = (dim.score / dim.maxScore) * 100;
                  
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" style={{ color: config?.color }} />
                          <span className="text-sm font-medium">{dim.label}</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {dim.score} / {dim.maxScore}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {key === 'interaction' && `活动次数: ${dim.value} 次`}
                        {key === 'salesAmount' && `成交金额: ¥${dim.value.toLocaleString()}`}
                        {key === 'orderFrequency' && `订单数: ${dim.value} 单`}
                        {key === 'opportunityActivity' && `活跃商机: ${dim.value} 个`}
                        {key === 'paymentTimeliness' && `按时回款: ${dim.value} 笔`}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* 改善建议 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                改善建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(healthScore.dimensions).map(([key, dim]) => {
                  // 如果得分低于60%，给出建议
                  const percentage = (dim.score / dim.maxScore) * 100;
                  if (percentage >= 80) return null;
                  
                  const config = DIMENSION_CONFIG[key as keyof typeof DIMENSION_CONFIG];
                  const suggestions = config?.suggestions || [];
                  
                  return (
                    <div key={key} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon 
                          className="h-4 w-4" 
                          style={{ color: config?.color }}
                        />
                        <span className="font-medium text-sm">{dim.label}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {percentage.toFixed(0)}%
                        </Badge>
                      </div>
                      <ul className="space-y-1">
                        {suggestions.slice(0, 2).map((suggestion, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-amber-500">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Icon 组件
function Icon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <Activity className={className} style={style} />;
}
