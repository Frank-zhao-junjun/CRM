'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  Calendar,
  ShoppingCart,
  FileCheck,
  Users,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ChurnRiskLevel,
  ChurnRiskResult,
  ChurnFactor,
  CHURN_RISK_CONFIG,
  ChurnDimension,
} from '@/lib/churn-prediction-types';

// 维度图标映射
const DIMENSION_ICONS: Record<ChurnDimension, React.ReactNode> = {
  last_interaction: <Users className="w-4 h-4" />,
  order_frequency: <ShoppingCart className="w-4 h-4" />,
  opportunity_conversion: <TrendingUp className="w-4 h-4" />,
  contract_expiry: <FileCheck className="w-4 h-4" />,
  activity_level: <Activity className="w-4 h-4" />,
};

// 维度中文名映射
const DIMENSION_LABELS: Record<ChurnDimension, string> = {
  last_interaction: '最近互动',
  order_frequency: '订单频率',
  opportunity_conversion: '商机转化',
  contract_expiry: '合同到期',
  activity_level: '活跃度',
};

interface ChurnRiskDisplayProps {
  riskResult?: ChurnRiskResult;
  riskScore?: number;
  riskLevel?: ChurnRiskLevel;
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

// 风险等级徽章组件
export function ChurnRiskBadge({ level }: { level: ChurnRiskLevel }) {
  const config = CHURN_RISK_CONFIG[level];
  
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        config.bgClass,
        config.borderClass,
        config.textClass
      )}
    >
      {config.label}
    </Badge>
  );
}

// 风险评分显示组件
export function ChurnRiskScore({ score, level }: { score: number; level: ChurnRiskLevel }) {
  const config = CHURN_RISK_CONFIG[level];
  
  return (
    <div className="flex items-center gap-2">
      <span className={cn('text-2xl font-bold', config.color)}>{Math.round(score)}</span>
      <span className="text-muted-foreground text-sm">/ 100</span>
    </div>
  );
}

// 风险趋势指示器
function RiskTrendIndicator({ currentScore, previousScore }: { currentScore: number; previousScore?: number }) {
  if (!previousScore) return null;
  
  const diff = currentScore - previousScore;
  
  if (diff > 5) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 gap-1">
              <TrendingUp className="w-3 h-3" />
              +{Math.abs(diff)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>风险评分上升 {Math.abs(diff)} 分</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  if (diff < -5) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 gap-1">
              <TrendingDown className="w-3 h-3" />
              -{Math.abs(diff)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>风险评分下降 {Math.abs(diff)} 分</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/30 gap-1">
      <Minus className="w-3 h-3" />
      持平
    </Badge>
  );
}

// 维度评分条
function DimensionScoreBar({ factor }: { factor: ChurnFactor }) {
  const config = CHURN_RISK_CONFIG;
  const maxLevel: ChurnRiskLevel = factor.value >= 50 ? 'high' : factor.value >= 25 ? 'medium' : 'low';
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {DIMENSION_ICONS[factor.dimension]}
          <span>{factor.name}</span>
        </div>
        <span className={cn('font-medium', config[maxLevel].color)}>
          +{factor.value}
        </span>
      </div>
      <Progress
        value={factor.value}
        className="h-2"
        indicatorClassName={cn(
          config[maxLevel].bgClass,
          'bg-current'
        )}
      />
      {factor.details && (
        <p className="text-xs text-muted-foreground">{factor.details}</p>
      )}
    </div>
  );
}

// 主组件
export function ChurnRiskDisplay({
  riskResult,
  riskScore = 0,
  riskLevel = 'low',
  compact = false,
  showDetails = false,
  className,
}: ChurnRiskDisplayProps) {
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  const displayLevel = riskResult?.riskLevel || riskLevel;
  const displayScore = riskResult?.riskScore || riskScore;
  const factors = riskResult?.factors || [];
  const activeFactors = factors.filter(f => f.value > 0);
  
  const config = CHURN_RISK_CONFIG[displayLevel];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <ChurnRiskBadge level={displayLevel} />
        <span className={cn('font-semibold', config.color)}>{displayScore}分</span>
      </div>
    );
  }

  return (
    <>
      <Card className={cn('', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn('w-5 h-5', config.color)} />
              <CardTitle className="text-base">流失风险评估</CardTitle>
            </div>
            <ChurnRiskBadge level={displayLevel} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 风险分数 */}
          <div className="flex items-center justify-between">
            <ChurnRiskScore score={displayScore} level={displayLevel} />
            {riskResult && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailDialog(true)}
                className="gap-1"
              >
                详情 <ChevronDown className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* 风险进度条 */}
          <div className="space-y-1">
            <Progress
              value={displayScore}
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>低风险</span>
              <span>中风险</span>
              <span>高风险</span>
            </div>
          </div>

          {/* 主要风险因素（简洁版） */}
          {activeFactors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Info className="w-4 h-4" />
                <span>主要风险因素</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {activeFactors.slice(0, 3).map((factor, idx) => (
                  <TooltipProvider key={idx}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="cursor-help">
                          {factor.reason}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{factor.details || factor.reason}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}

          {/* 风险说明 */}
          <p className="text-sm text-muted-foreground">
            {config.description}
          </p>
        </CardContent>
      </Card>

      {/* 详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className={cn('w-5 h-5', config.color)} />
              流失风险详情
            </DialogTitle>
            <DialogDescription>
              客户 {riskResult?.customerId} 的详细风险评估
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 综合评分 */}
            <div className="text-center py-4 bg-muted/50 rounded-lg">
              <div className="text-4xl font-bold mb-2">{Math.round(displayScore)}</div>
              <ChurnRiskBadge level={displayLevel} />
            </div>

            {/* 各维度评分 */}
            <div className="space-y-4">
              <h4 className="font-medium">各维度风险评分</h4>
              {factors.map((factor, idx) => (
                <DimensionScoreBar key={idx} factor={factor} />
              ))}
            </div>

            {/* 风险等级说明 */}
            <div className={cn('p-4 rounded-lg', config.bgClass, config.borderClass)}>
              <h4 className={cn('font-medium mb-2', config.color)}>
                {config.label} - {config.labelEn}
              </h4>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>

            {/* 操作建议 */}
            {displayLevel === 'high' && (
              <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-600 dark:text-red-400">建议立即处理</h4>
                  <p className="text-sm text-muted-foreground">建议安排专人跟进客户，了解流失原因</p>
                </div>
                <Button variant="destructive" size="sm">
                  快速跟进
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// 迷你风险指示器（用于表格行）
export function ChurnRiskMini({ level, score }: { level: ChurnRiskLevel; score: number }) {
  const config = CHURN_RISK_CONFIG[level];
  
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          level === 'high' ? 'bg-red-500' : level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
        )}
      />
      <span className={cn('text-sm font-medium', config.color)}>
        {score}分
      </span>
    </div>
  );
}
