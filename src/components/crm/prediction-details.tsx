'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  PredictionResult, 
  PREDICTION_LEVEL_CONFIG, 
  PredictionDimension,
  getPredictionBadgeClass,
  getPredictionColorClass,
  DIMENSION_LABELS
} from '@/lib/opportunity-prediction-types';
import { 
  Building2, 
  Briefcase, 
  DollarSign, 
  MessageCircle, 
  Clock,
  Users,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { ProbabilityBadge, ProbabilityLevelBadge } from './prediction-components';

// ============ 维度图标配置 ============
const DIMENSION_ICONS: Record<PredictionDimension, React.ElementType> = {
  stage: Briefcase,
  amount: DollarSign,
  customer_history: Building2,
  competition: Users,
  engagement: MessageCircle,
  timeline: Clock,
};

// ============ 预测明细组件 ============
interface PredictionDetailsProps {
  predictionResult: PredictionResult;
  className?: string;
}

export function PredictionDetails({ predictionResult, className }: PredictionDetailsProps) {
  const levelConfig = PREDICTION_LEVEL_CONFIG[predictionResult.level];
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* 总概览 */}
      <div className={cn(
        'p-4 rounded-lg border',
        levelConfig.bgClass,
        levelConfig.borderClass
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className={cn('h-5 w-5', levelConfig.color)} />
            <span className={cn('font-semibold', levelConfig.color)}>
              AI 成交预测
            </span>
          </div>
          <ProbabilityLevelBadge level={predictionResult.level} />
        </div>
        
        {/* 概率 */}
        <div className="flex items-end gap-2 mb-3">
          <span className={cn(
            'text-4xl font-bold',
            getPredictionColorClass(predictionResult.probability)
          )}>
            {predictionResult.probability}
          </span>
          <span className="text-muted-foreground mb-1">%</span>
        </div>

        {/* 进度条 */}
        <div className="h-2 bg-white/50 dark:bg-gray-800/50 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              'bg-gradient-to-r',
              predictionResult.probability >= 70 ? 'from-green-400 to-emerald-500' :
              predictionResult.probability >= 40 ? 'from-yellow-400 to-amber-500' : 'from-gray-400 to-gray-500'
            )}
            style={{ width: `${predictionResult.probability}%` }}
          />
        </div>
      </div>

      {/* 推荐策略 */}
      <RecommendationCard recommendation={predictionResult.recommendation} probability={predictionResult.probability} />

      {/* 维度明细 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            预测明细
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {predictionResult.breakdown.map((dim, index) => {
            const Icon = DIMENSION_ICONS[dim.dimension];
            const label = DIMENSION_LABELS[dim.dimension];
            
            return (
              <div key={dim.dimension}>
                {index > 0 && <Separator className="my-3" />}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-sm font-semibold',
                        getPredictionColorClass(dim.score)
                      )}>
                        {dim.score}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        / {dim.weight}%
                      </span>
                    </div>
                  </div>
                  
                  {/* 维度进度条 */}
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        dim.score >= 70 ? 'bg-green-500' : 
                        dim.score >= 40 ? 'bg-yellow-500' : 'bg-gray-400'
                      )}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>

                  {/* 评分因素 */}
                  {dim.factors.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dim.factors.map((factor, fIndex) => (
                        <span 
                          key={fIndex}
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full"
                        >
                          <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                          <span>{factor.reason}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 计算时间 */}
      <p className="text-xs text-muted-foreground text-right">
        最后计算: {new Date(predictionResult.lastCalculatedAt).toLocaleString('zh-CN')}
      </p>
    </div>
  );
}

// ============ 推荐策略卡片 ============
interface RecommendationCardProps {
  recommendation: PredictionResult['recommendation'];
  probability: number;
  className?: string;
}

export function RecommendationCard({ recommendation, probability, className }: RecommendationCardProps) {
  const priorityConfig = {
    urgent: {
      color: 'text-green-600 dark:text-green-400',
      bgClass: 'bg-green-500/10',
      borderClass: 'border-green-500/30',
      icon: Sparkles,
    },
    normal: {
      color: 'text-yellow-600 dark:text-yellow-400',
      bgClass: 'bg-yellow-500/10',
      borderClass: 'border-yellow-500/30',
      icon: Lightbulb,
    },
    low: {
      color: 'text-gray-600 dark:text-gray-400',
      bgClass: 'bg-gray-500/10',
      borderClass: 'border-gray-500/30',
      icon: Clock,
    },
  };

  const config = priorityConfig[recommendation.priority];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        config.bgClass,
        config.borderClass,
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn('h-5 w-5', config.color)} />
        <span className={cn('font-semibold', config.color)}>
          {recommendation.action}
        </span>
      </div>

      {/* 原因 */}
      {recommendation.reasons.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-1">原因分析:</p>
          <ul className="space-y-1">
            {recommendation.reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 建议 */}
      {recommendation.tips.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">行动建议:</p>
          <ul className="space-y-1">
            {recommendation.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-3 w-3 mt-1 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============ 简版预测展示（用于列表） ============
interface PredictionSummaryProps {
  predictionResult: PredictionResult;
  className?: string;
}

export function PredictionSummary({ predictionResult, className }: PredictionSummaryProps) {
  const levelConfig = PREDICTION_LEVEL_CONFIG[predictionResult.level];

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <ProbabilityBadge probability={predictionResult.probability} size="sm" />
        <ProbabilityLevelBadge level={predictionResult.level} size="sm" />
      </div>
      <p className="text-xs text-muted-foreground line-clamp-1">
        {levelConfig.strategy}
      </p>
    </div>
  );
}

// ============ 预测维度雷达图数据 ============
interface RadarChartData {
  dimension: string;
  score: number;
  fullMark: number;
}

export function getRadarChartData(breakdown: PredictionResult['breakdown']): RadarChartData[] {
  return breakdown.map(dim => ({
    dimension: DIMENSION_LABELS[dim.dimension],
    score: dim.score,
    fullMark: 100,
  }));
}
