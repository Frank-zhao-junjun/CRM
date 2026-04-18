'use client';

import { useMemo } from 'react';
import { PredictionLevel, PREDICTION_LEVEL_CONFIG, getPredictionBadgeClass, getPredictionColorClass, getPredictionProgressColor } from '@/lib/opportunity-prediction-types';
import { cn } from '@/lib/utils';
import { Sparkles, TrendingUp, TrendingDown, Minus, Percent } from 'lucide-react';

// ============ 预测概率徽章组件 ============
interface ProbabilityBadgeProps {
  probability: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function ProbabilityBadge({ probability, size = 'md', showIcon = true, className }: ProbabilityBadgeProps) {
  const level = useMemo((): PredictionLevel => {
    if (probability >= 70) return 'high';
    if (probability >= 40) return 'medium';
    return 'low';
  }, [probability]);

  const levelConfig = PREDICTION_LEVEL_CONFIG[level];
  const badgeClass = getPredictionBadgeClass(probability);

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
      <span>{probability}%</span>
    </span>
  );
}

// ============ 概率进度条组件 ============
interface ProbabilityBarProps {
  probability: number;
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProbabilityBar({ probability, showLabel = true, height = 'md', className }: ProbabilityBarProps) {
  const colorClass = getPredictionColorClass(probability);
  const progressColor = getPredictionProgressColor(probability);

  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">成交概率</span>
          <span className={cn('font-semibold', colorClass)}>{probability}%</span>
        </div>
      )}
      <div className={cn('bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden', heightClasses[height])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            'bg-gradient-to-r',
            progressColor
          )}
          style={{ width: `${probability}%` }}
        />
      </div>
    </div>
  );
}

// ============ 概率指示器组件（用于列表） ============
interface ProbabilityIndicatorProps {
  probability: number;
  className?: string;
}

export function ProbabilityIndicator({ probability, className }: ProbabilityIndicatorProps) {
  const level = useMemo((): PredictionLevel => {
    if (probability >= 70) return 'high';
    if (probability >= 40) return 'medium';
    return 'low';
  }, [probability]);

  const colorClass = getPredictionColorClass(probability);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        {level === 'high' && <TrendingUp className={cn('h-4 w-4', colorClass)} />}
        {level === 'medium' && <Minus className={cn('h-4 w-4', colorClass)} />}
        {level === 'low' && <TrendingDown className={cn('h-4 w-4', colorClass)} />}
      </div>
      <span className={cn('font-semibold', colorClass)}>{probability}%</span>
    </div>
  );
}

// ============ 概率级别标签 ============
interface ProbabilityLevelBadgeProps {
  level: PredictionLevel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProbabilityLevelBadge({ level, size = 'md', className }: ProbabilityLevelBadgeProps) {
  const config = PREDICTION_LEVEL_CONFIG[level];

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

// ============ 快速概率显示（用于表格单元格） ============
interface QuickProbabilityProps {
  probability: number;
  className?: string;
}

export function QuickProbability({ probability, className }: QuickProbabilityProps) {
  const colorClass = getPredictionColorClass(probability);
  const progressColor = getPredictionProgressColor(probability);

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className={cn('font-medium', colorClass)}>{probability}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            'bg-gradient-to-r',
            progressColor
          )}
          style={{ width: `${probability}%` }}
        />
      </div>
    </div>
  );
}

// ============ 概率环形图组件 ============
interface ProbabilityRingProps {
  probability: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProbabilityRing({ probability, size = 80, strokeWidth = 8, className }: ProbabilityRingProps) {
  const colorClass = getPredictionColorClass(probability);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (probability / 100) * circumference;

  const progressColors: Record<string, string> = {
    'high': '#22c55e',
    'medium': '#eab308',
    'low': '#6b7280',
  };

  const level = probability >= 70 ? 'high' : probability >= 40 ? 'medium' : 'low';
  const strokeColor = progressColors[level];

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={strokeColor}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-lg font-bold', colorClass)}>{probability}%</span>
      </div>
    </div>
  );
}

// ============ 预测概览卡片 ============
interface PredictionOverviewProps {
  totalOpportunities: number;
  weightedValue: number;
  distribution: {
    high: number;
    medium: number;
    low: number;
  };
  className?: string;
}

export function PredictionOverview({ totalOpportunities, weightedValue, distribution, className }: PredictionOverviewProps) {
  const highPercent = totalOpportunities > 0 ? Math.round((distribution.high / totalOpportunities) * 100) : 0;
  const mediumPercent = totalOpportunities > 0 ? Math.round((distribution.medium / totalOpportunities) * 100) : 0;
  const lowPercent = totalOpportunities > 0 ? Math.round((distribution.low / totalOpportunities) * 100) : 0;

  return (
    <div className={cn('grid grid-cols-4 gap-4', className)}>
      {/* 加权预测值 */}
      <div className="col-span-1 p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Percent className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm text-muted-foreground">加权预测</span>
        </div>
        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
          ¥{weightedValue.toLocaleString()}
        </p>
      </div>

      {/* 高概率 */}
      <div className="col-span-1 p-4 bg-gradient-to-br from-green-500/5 to-transparent rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-sm text-muted-foreground">高概率</span>
        </div>
        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{distribution.high}</p>
        <p className="text-xs text-muted-foreground">{highPercent}%</p>
      </div>

      {/* 中概率 */}
      <div className="col-span-1 p-4 bg-gradient-to-br from-yellow-500/5 to-transparent rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Minus className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-muted-foreground">中概率</span>
        </div>
        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{distribution.medium}</p>
        <p className="text-xs text-muted-foreground">{mediumPercent}%</p>
      </div>

      {/* 低概率 */}
      <div className="col-span-1 p-4 bg-gradient-to-br from-gray-500/5 to-transparent rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-muted-foreground">低概率</span>
        </div>
        <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{distribution.low}</p>
        <p className="text-xs text-muted-foreground">{lowPercent}%</p>
      </div>
    </div>
  );
}
