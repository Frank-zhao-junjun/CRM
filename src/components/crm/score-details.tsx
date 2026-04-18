'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  LeadScoreResult, 
  SCORE_LEVEL_CONFIG, 
  ScoreDimension,
  getScoreBadgeClass,
  getScoreColorClass 
} from '@/lib/lead-scoring-types';
import { 
  Building2, 
  Briefcase, 
  Globe, 
  MessageCircle, 
  DollarSign, 
  User,
  Sparkles,
  CheckCircle2,
  Info
} from 'lucide-react';
import { ScoreBadge, ScoreLevelBadge, StrategyCard } from './score-components';

// ============ 维度配置 ============
const DIMENSION_ICONS: Record<ScoreDimension, React.ElementType> = {
  company_size: Building2,
  industry_match: Briefcase,
  source_quality: Globe,
  engagement_level: MessageCircle,
  estimated_value: DollarSign,
  contact_complete: User,
};

const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  company_size: '公司规模',
  industry_match: '行业匹配',
  source_quality: '来源渠道',
  engagement_level: '互动频率',
  estimated_value: '预估价值',
  contact_complete: '信息完整度',
};

// ============ 评分明细组件 ============
interface ScoreDetailsProps {
  scoreResult: LeadScoreResult;
  className?: string;
}

export function ScoreDetails({ scoreResult, className }: ScoreDetailsProps) {
  const levelConfig = SCORE_LEVEL_CONFIG[scoreResult.level];
  
  // 计算总分进度
  const totalProgress = scoreResult.totalScore;

  return (
    <div className={cn('space-y-4', className)}>
      {/* 总分概览 */}
      <div className={cn(
        'p-4 rounded-lg border',
        levelConfig.bgClass,
        levelConfig.borderClass
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className={cn('h-5 w-5', levelConfig.color)} />
            <span className={cn('font-semibold', levelConfig.color)}>
              AI 智能评分
            </span>
          </div>
          <ScoreLevelBadge level={scoreResult.level} />
        </div>
        
        {/* 总分 */}
        <div className="flex items-end gap-2 mb-3">
          <span className={cn(
            'text-4xl font-bold',
            getScoreColorClass(scoreResult.totalScore)
          )}>
            {scoreResult.totalScore}
          </span>
          <span className="text-muted-foreground mb-1">/ 100</span>
        </div>

        {/* 进度条 */}
        <div className="h-2 bg-white/50 dark:bg-gray-800/50 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              scoreResult.totalScore >= 70 ? 'bg-red-500' : 
              scoreResult.totalScore >= 40 ? 'bg-yellow-500' : 'bg-gray-400'
            )}
            style={{ width: `${scoreResult.totalScore}%` }}
          />
        </div>
      </div>

      {/* 推荐策略 */}
      <StrategyCard score={scoreResult.totalScore} />

      {/* 维度明细 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            评分明细
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {scoreResult.dimensions.map((dim, index) => {
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
                        getScoreColorClass(dim.score)
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
                        dim.score >= 70 ? 'bg-red-500' : 
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
        最后计算: {new Date(scoreResult.lastCalculatedAt).toLocaleString('zh-CN')}
      </p>
    </div>
  );
}

// ============ 简版评分展示（用于列表） ============
interface ScoreSummaryProps {
  scoreResult: LeadScoreResult;
  className?: string;
}

export function ScoreSummary({ scoreResult, className }: ScoreSummaryProps) {
  const levelConfig = SCORE_LEVEL_CONFIG[scoreResult.level];

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <ScoreBadge score={scoreResult.totalScore} size="sm" />
        <ScoreLevelBadge level={scoreResult.level} size="sm" />
      </div>
      <p className="text-xs text-muted-foreground line-clamp-1">
        {levelConfig.strategy}
      </p>
    </div>
  );
}

// ============ 评分对比组件 ============
interface ScoreComparisonProps {
  scores: { leadId: string; name: string; score: number }[];
  className?: string;
}

export function ScoreComparison({ scores, className }: ScoreComparisonProps) {
  const maxScore = Math.max(...scores.map(s => s.score), 1);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">评分对比</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {scores.map((item, index) => (
          <div key={item.leadId} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate">{item.name}</span>
              <span className={cn('font-semibold', getScoreColorClass(item.score))}>
                {item.score}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  item.score >= 70 ? 'bg-red-500' : 
                  item.score >= 40 ? 'bg-yellow-500' : 'bg-gray-400'
                )}
                style={{ width: `${(item.score / maxScore) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
