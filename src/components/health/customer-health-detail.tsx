'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Heart,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  Briefcase,
  CreditCard,
  Activity,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import type { CustomerHealthScore, DimensionScore, HealthLevel } from '@/lib/health-score';
import { HEALTH_LEVELS } from '@/lib/health-score';

interface CustomerHealthDetailProps {
  healthScore: CustomerHealthScore | null;
  open: boolean;
  onClose: () => void;
}

// 维度配置
const DIMENSION_CONFIG = [
  { key: 'interaction' as const, icon: Activity, color: '#3b82f6', label: '互动频率', weight: 25 },
  { key: 'salesAmount' as const, icon: DollarSign, color: '#22c55e', label: '销售金额', weight: 30 },
  { key: 'orderFrequency' as const, icon: ShoppingCart, color: '#f59e0b', label: '订单频次', weight: 20 },
  { key: 'opportunityActivity' as const, icon: Briefcase, color: '#8b5cf6', label: '商机关怀', weight: 15 },
  { key: 'paymentTimeliness' as const, icon: CreditCard, color: '#ec4899', label: '回款及时', weight: 10 },
];

// 等级图标组件
function LevelBadge({ level, score }: { level: HealthLevel; score: number }) {
  const config = HEALTH_LEVELS[level];
  const Icon = level === 'healthy' ? CheckCircle : level === 'risk' ? AlertTriangle : TrendingUp;
  
  return (
    <Badge 
      className="px-3 py-1 text-sm font-medium"
      style={{ 
        backgroundColor: `${config.color}20`, 
        color: config.color,
        borderColor: config.color 
      }}
    >
      <Icon className="h-4 w-4 mr-1" />
      {config.label} ({score}分)
    </Badge>
  );
}

// 雷达图数据
function getRadarData(dimensions: CustomerHealthScore['dimensions']) {
  return DIMENSION_CONFIG.map(config => ({
    dimension: config.label,
    score: dimensions[config.key].score,
    fullMark: 100,
  }));
}

// 维度得分项
function DimensionItem({ 
  config, 
  dimension 
}: { 
  config: typeof DIMENSION_CONFIG[0]; 
  dimension: DimensionScore; 
}) {
  const Icon = config.icon;
  const percentage = dimension.score;
  const isGood = percentage >= 60;
  const isMedium = percentage >= 40 && percentage < 60;
  
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${config.color}20` }}
          >
            <Icon className="h-4 w-4" style={{ color: config.color }} />
          </div>
          <div>
            <div className="font-medium text-sm">{config.label}</div>
            <div className="text-xs text-muted-foreground">权重 {config.weight}%</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold" style={{ color: config.color }}>
            {dimension.score}
          </div>
          <div className="text-xs text-muted-foreground">
            {dimension.displayValue}
          </div>
        </div>
      </div>
      <div className="relative">
        <Progress 
          value={percentage} 
          className="h-2"
          style={{
            // @ts-ignore
            '--progress-color': config.color,
          }}
        />
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>0</span>
          <span>满分: {dimension.maxScore}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs">
        {percentage >= 60 ? (
          <span className="text-green-600 flex items-center gap-1">
            <ArrowUp className="h-3 w-3" /> 表现良好
          </span>
        ) : percentage >= 40 ? (
          <span className="text-yellow-600 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> 有提升空间
          </span>
        ) : (
          <span className="text-red-600 flex items-center gap-1">
            <ArrowDown className="h-3 w-3" /> 需要改善
          </span>
        )}
      </div>
    </Card>
  );
}

export function CustomerHealthDetail({ healthScore, open, onClose }: CustomerHealthDetailProps) {
  if (!healthScore) return null;

  const radarData = getRadarData(healthScore.dimensions);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">{healthScore.customerName}</DialogTitle>
                <p className="text-sm text-muted-foreground">{healthScore.company}</p>
              </div>
            </div>
            <LevelBadge level={healthScore.level} score={healthScore.totalScore} />
          </div>
        </DialogHeader>

        <div className="grid gap-6 mt-4">
          {/* 雷达图 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">健康度雷达图</h3>
              <div className="text-sm text-muted-foreground">5维度综合评分</div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis 
                    dataKey="dimension" 
                    tick={{ fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10 }}
                  />
                  <Radar
                    name="健康度"
                    dataKey="score"
                    stroke="#f43f5e"
                    fill="#f43f5e"
                    fillOpacity={0.4}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value}分`, '得分']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 维度得分详情 */}
          <div>
            <h3 className="font-semibold mb-3">各维度详细得分</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {DIMENSION_CONFIG.map(config => (
                <DimensionItem 
                  key={config.key}
                  config={config}
                  dimension={healthScore.dimensions[config.key]}
                />
              ))}
            </div>
          </div>

          {/* 改善建议 */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  改善建议
                </h3>
                <ul className="space-y-1.5">
                  {healthScore.suggestions.map((suggestion, index) => (
                    <li 
                      key={index}
                      className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
