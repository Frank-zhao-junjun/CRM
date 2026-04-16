'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  TrendingDown,
  Clock,
  DollarSign,
  ShoppingCart,
  Users,
  FileWarning,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Calendar,
  Activity,
} from 'lucide-react';
import type { ChurnAnalysis, ChurnTrigger, ChurnRiskLevel } from '@/lib/churn-prediction';
import { CHURN_RISK_CONFIG } from '@/lib/churn-prediction';

interface ChurnAlertDetailProps {
  analysis: ChurnAnalysis | null;
  open: boolean;
  onClose: () => void;
  onTakeAction?: (customerId: string) => void;
}

// 触发因素图标映射
const TRIGGER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  interaction_decline: Activity,
  revenue_decline: DollarSign,
  engagement_drop: TrendingDown,
  competitor_switch: Users,
  support_complaints: AlertTriangle,
  payment_delays: Clock,
  inactive_period: Clock,
  contract_expiring: Calendar,
  product_adoption_low: ShoppingCart,
  relationship_risk: AlertTriangle,
};

// 触发因素标签映射
const TRIGGER_LABELS: Record<string, string> = {
  interaction_decline: '互动频率下降',
  revenue_decline: '收入下滑',
  engagement_drop: '参与度下降',
  competitor_switch: '竞品切换',
  support_complaints: '投诉增加',
  payment_delays: '付款延迟',
  inactive_period: '长期不活跃',
  contract_expiring: '合同即将到期',
  product_adoption_low: '产品使用率低',
  relationship_risk: '关系风险',
};

function RiskLevelBadge({ level, score }: { level: ChurnRiskLevel; score: number }) {
  const config = CHURN_RISK_CONFIG[level];
  
  return (
    <Badge
      className="px-3 py-1 text-sm font-medium"
      style={{
        backgroundColor: `${config.color}20`,
        color: config.color,
        borderColor: config.color,
      }}
    >
      <AlertTriangle className="h-4 w-4 mr-1" />
      {config.label} ({score}分)
    </Badge>
  );
}

function TriggerCard({ trigger }: { trigger: ChurnTrigger }) {
  const Icon = TRIGGER_ICONS[trigger.type] || AlertTriangle;
  const label = TRIGGER_LABELS[trigger.type] || trigger.type;
  const severityColor = trigger.severity === 'critical' ? 'text-red-600' : 
                        trigger.severity === 'warning' ? 'text-orange-600' : 'text-yellow-600';
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        trigger.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30' :
        trigger.severity === 'warning' ? 'bg-orange-100 dark:bg-orange-900/30' :
        'bg-yellow-100 dark:bg-yellow-900/30'
      }`}>
        <Icon className={`h-4 w-4 ${severityColor}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{label}</span>
          <Badge variant="outline" className={`text-xs ${severityColor}`}>
            {trigger.severity === 'critical' ? '严重' : trigger.severity === 'warning' ? '警告' : '提示'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{trigger.description}</p>
        <p className="text-xs text-muted-foreground mt-1">{trigger.evidence}</p>
      </div>
    </div>
  );
}

export function ChurnAlertDetail({ analysis, open, onClose, onTakeAction }: ChurnAlertDetailProps) {
  if (!analysis) return null;

  const config = CHURN_RISK_CONFIG[analysis.riskLevel];
  const riskPercent = analysis.churnScore;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${config.color}20` }}
              >
                <AlertTriangle className="h-6 w-6" style={{ color: config.color }} />
              </div>
              <div>
                <DialogTitle className="text-xl">{analysis.customerName}</DialogTitle>
                <p className="text-sm text-muted-foreground">{analysis.company}</p>
              </div>
            </div>
            <RiskLevelBadge level={analysis.riskLevel} score={analysis.churnScore} />
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 流失风险进度条 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">流失风险评估</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>风险指数</span>
                  <span className="font-bold" style={{ color: config.color }}>{riskPercent}%</span>
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${riskPercent}%`,
                      backgroundColor: config.color,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>低风险</span>
                  <span>高风险</span>
                </div>
              </div>
              {analysis.predictedChurnDate && (
                <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 text-sm text-orange-800 dark:text-orange-200">
                    <Calendar className="h-4 w-4" />
                    <span>预测流失日期: <strong>{analysis.predictedChurnDate}</strong></span>
                  </div>
                </div>
              )}
              <div className="mt-2 text-xs text-muted-foreground">
                预测置信度: {analysis.confidence}%
              </div>
            </CardContent>
          </Card>

          {/* 触发因素 */}
          {analysis.triggers.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                风险触发因素 ({analysis.triggers.length})
              </h3>
              <div className="space-y-2">
                {analysis.triggers.map((trigger, index) => (
                  <TriggerCard key={index} trigger={trigger} />
                ))}
              </div>
            </div>
          )}

          {/* 挽留建议 */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    挽留建议
                  </h3>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <li 
                        key={index}
                        className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          {onTakeAction && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                关闭
              </Button>
              <Button 
                onClick={() => onTakeAction(analysis.customerId)}
                style={{ backgroundColor: config.color }}
                className="text-white"
              >
                立即跟进
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
