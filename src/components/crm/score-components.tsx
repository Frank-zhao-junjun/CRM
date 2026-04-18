'use client';

import { useMemo } from 'react';
import { ScoreLevel } from '@/lib/lead-scoring-types';
import { getScoreBadgeClass, getScoreColorClass, SCORE_LEVEL_CONFIG } from '@/lib/lead-scoring-types';
import { cn } from '@/lib/utils';
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ============ 评分徽章组件 ============
interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function ScoreBadge({ score, size = 'md', showIcon = true, className }: ScoreBadgeProps) {
  const level = useMemo((): ScoreLevel => {
    if (score >= 70) return 'hot';
    if (score >= 40) return 'warm';
    return 'cold';
  }, [score]);

  const levelConfig = SCORE_LEVEL_CONFIG[level];
  const badgeClass = getScoreBadgeClass(score);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        badgeClass,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Sparkles className={iconSizes[size]} />}
      <span>{score}</span>
    </span>
  );
}

// ============ 评分进度条组件 ============
interface ScoreProgressProps {
  score: number;
  showLabel?: boolean;
  className?: string;
}

export function ScoreProgress({ score, showLabel = true, className }: ScoreProgressProps) {
  const colorClass = getScoreColorClass(score);

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">评分</span>
          <span className={cn('font-semibold', colorClass)}>{score}分</span>
        </div>
      )}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-yellow-500' : 'bg-gray-400'
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ============ 评分指示器组件（用于列表） ============
interface ScoreIndicatorProps {
  score: number;
  className?: string;
}

export function ScoreIndicator({ score, className }: ScoreIndicatorProps) {
  const level = useMemo((): ScoreLevel => {
    if (score >= 70) return 'hot';
    if (score >= 40) return 'warm';
    return 'cold';
  }, [score]);

  const colorClass = getScoreColorClass(score);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        {level === 'hot' && <TrendingUp className={cn('h-4 w-4', colorClass)} />}
        {level === 'warm' && <Minus className={cn('h-4 w-4', colorClass)} />}
        {level === 'cold' && <TrendingDown className={cn('h-4 w-4', colorClass)} />}
      </div>
      <span className={cn('font-semibold', colorClass)}>{score}</span>
    </div>
  );
}

// ============ 评分级别标签 ============
interface ScoreLevelBadgeProps {
  level: ScoreLevel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ScoreLevelBadge({ level, size = 'md', className }: ScoreLevelBadgeProps) {
  const config = SCORE_LEVEL_CONFIG[level];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.bgClass,
        config.color,
        'border',
        config.borderClass,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </span>
  );
}

// ============ 推荐策略卡片 ============
interface StrategyCardProps {
  score: number;
  showDetails?: boolean;
  className?: string;
}

export function StrategyCard({ score, showDetails = true, className }: StrategyCardProps) {
  const level = useMemo((): ScoreLevel => {
    if (score >= 70) return 'hot';
    if (score >= 40) return 'warm';
    return 'cold';
  }, [score]);

  const config = SCORE_LEVEL_CONFIG[level];

  const strategyText = {
    hot: '建议在24小时内通过电话或面谈进行跟进',
    warm: '建议通过邮件或微信定期发送产品资料',
    cold: '建议定期维护，可在资源充足时进行跟进',
  };

  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        config.bgClass,
        config.borderClass,
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className={cn('h-5 w-5', config.color)} />
        <span className={cn('font-semibold', config.color)}>
          {config.strategy}
        </span>
      </div>
      {showDetails && (
        <p className="text-sm text-muted-foreground">{strategyText[level]}</p>
      )}
    </div>
  );
}

// ============ 评分分布统计 ============
interface ScoreDistributionProps {
  stats: {
    hot: number;
    warm: number;
    cold: number;
    average: number;
    total: number;
  };
  className?: string;
}

export function ScoreDistribution({ stats, className }: ScoreDistributionProps) {
  const hotPercent = stats.total > 0 ? (stats.hot / stats.total) * 100 : 0;
  const warmPercent = stats.total > 0 ? (stats.warm / stats.total) * 100 : 0;
  const coldPercent = stats.total > 0 ? (stats.cold / stats.total) * 100 : 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* 平均分 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">平均评分</span>
        <span className={cn('font-semibold', getScoreColorClass(stats.average))}>
          {stats.average}分
        </span>
      </div>

      {/* 分布条 */}
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
        {hotPercent > 0 && (
          <div
            className="bg-red-500 transition-all duration-300"
            style={{ width: `${hotPercent}%` }}
            title={`高优先级: ${stats.hot}`}
          />
        )}
        {warmPercent > 0 && (
          <div
            className="bg-yellow-500 transition-all duration-300"
            style={{ width: `${warmPercent}%` }}
            title={`中优先级: ${stats.warm}`}
          />
        )}
        {coldPercent > 0 && (
          <div
            className="bg-gray-400 transition-all duration-300"
            style={{ width: `${coldPercent}%` }}
            title={`低优先级: ${stats.cold}`}
          />
        )}
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">高 ({stats.hot})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">中 ({stats.warm})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-muted-foreground">低 ({stats.cold})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
