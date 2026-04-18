'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, RotateCcw, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  PredictionConfig,
  PredictionWeight,
  StageProbabilityConfig,
  DEFAULT_PREDICTION_CONFIG,
  DEFAULT_PREDICTION_WEIGHTS,
  DEFAULT_STAGE_PROBABILITIES,
  DIMENSION_LABELS,
} from '@/lib/opportunity-prediction-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STORAGE_KEY = 'crm-prediction-config';

// 维度说明
const DIMENSION_DESCRIPTIONS: Record<string, string> = {
  stage: '根据商机所处阶段评估成交可能性',
  amount: '根据商机金额大小调整概率（大额决策周期长）',
  customer_history: '检查客户历史成交记录',
  competition: '评估竞争状况对成交的影响',
  engagement: '最近30天内的客户互动频率',
  timeline: '预计成交时间越近概率越高',
};

export default function PredictionConfigPage() {
  const router = useRouter();
  
  // 状态
  const [config, setConfig] = useState<PredictionConfig>(() => {
    // 从 localStorage 加载配置
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // 解析失败，使用默认配置
        }
      }
    }
    return {
      ...DEFAULT_PREDICTION_CONFIG,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 监听变更
  useEffect(() => {
    setHasChanges(true);
  }, [config]);

  // 更新权重
  const updateWeight = (dimension: string, updates: Partial<PredictionWeight>) => {
    setConfig(prev => ({
      ...prev,
      weights: prev.weights.map(w => 
        w.dimension === dimension ? { ...w, ...updates } : w
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  // 更新阶段概率
  const updateStageProbability = (stage: string, baseProbability: number) => {
    setConfig(prev => ({
      ...prev,
      stageProbabilities: prev.stageProbabilities.map(s => 
        s.stage === stage ? { ...s, baseProbability } : s
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  // 重置为默认配置
  const resetToDefault = () => {
    setConfig({
      ...DEFAULT_PREDICTION_CONFIG,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setHasChanges(true);
  };

  // 保存配置
  const saveConfig = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setShowSuccess(true);
      setHasChanges(false);
      setTimeout(() => setShowSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // 计算总权重
  const totalWeight = config.weights.reduce((sum, w) => sum + (w.isActive ? w.weight : 0), 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 1; // 允许小误差

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-emerald-500/5 rounded-3xl -z-10" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/predictions">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-green-600" />
                预测配置
              </h1>
              <p className="text-muted-foreground mt-1">
                调整 AI 商机预测算法的权重和规则
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={resetToDefault}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              重置默认
            </Button>
            <Button 
              onClick={saveConfig}
              disabled={isSaving || !hasChanges || !isWeightValid}
              className={cn(
                "gap-2 transition-all",
                showSuccess && "bg-green-600 hover:bg-green-600"
              )}
            >
              {showSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  已保存
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  保存配置
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 配置说明 */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-600">配置说明</p>
              <p className="text-sm text-muted-foreground mt-1">
                AI 预测基于多维度加权评分算法。通过调整各维度权重和阶段基准概率，可以定制符合您业务特点的预测模型。
                配置将保存在浏览器本地存储中。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 维度权重配置 */}
        <Card>
          <CardHeader>
            <CardTitle>维度权重配置</CardTitle>
            <CardDescription>
              调整各预测维度对最终概率的影响权重
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 总权重指示器 */}
            <div className={cn(
              "p-3 rounded-lg border",
              isWeightValid 
                ? "bg-green-500/5 border-green-500/20" 
                : "bg-red-500/5 border-red-500/20"
            )}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {isWeightValid ? (
                    <span className="text-green-600">权重配置有效</span>
                  ) : (
                    <span className="text-red-600">权重总和需等于 100%</span>
                  )}
                </span>
                <span className={cn(
                  "text-lg font-bold",
                  isWeightValid ? "text-green-600" : "text-red-600"
                )}>
                  {totalWeight}%
                </span>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isWeightValid ? "bg-green-500" : "bg-red-500"
                  )}
                  style={{ width: `${Math.min(100, totalWeight)}%` }}
                />
              </div>
            </div>

            {/* 维度列表 */}
            {config.weights.map((weight) => (
              <div key={weight.dimension} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={weight.isActive}
                      onCheckedChange={(checked) => updateWeight(weight.dimension, { isActive: checked })}
                    />
                    <Label className={cn(!weight.isActive && "text-muted-foreground")}>
                      {DIMENSION_LABELS[weight.dimension]}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={weight.weight}
                      onChange={(e) => updateWeight(weight.dimension, { weight: Math.min(100, Math.max(0, Number(e.target.value))) })}
                      disabled={!weight.isActive}
                      className="w-16 text-center"
                      min={0}
                      max={100}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                
                {/* 滑块 */}
                <Slider
                  value={[weight.weight]}
                  onValueChange={([value]) => updateWeight(weight.dimension, { weight: value })}
                  max={100}
                  step={5}
                  disabled={!weight.isActive}
                  className={cn(!weight.isActive && "opacity-50")}
                />
                
                {/* 说明 */}
                <p className={cn(
                  "text-xs",
                  weight.isActive ? "text-muted-foreground" : "text-muted-foreground/50"
                )}>
                  {DIMENSION_DESCRIPTIONS[weight.dimension]}
                </p>
                
                {weight.dimension !== 'timeline' && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 阶段基准概率配置 */}
        <Card>
          <CardHeader>
            <CardTitle>阶段基准概率</CardTitle>
            <CardDescription>
              设置各商机阶段的基准成交概率
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {config.stageProbabilities.map((stage) => (
              <div key={stage.stage} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{stage.label}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={stage.baseProbability}
                      onChange={(e) => updateStageProbability(stage.stage, Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-16 text-center"
                      min={0}
                      max={100}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                
                {/* 滑块 */}
                <Slider
                  value={[stage.baseProbability]}
                  onValueChange={([value]) => updateStageProbability(stage.stage, value)}
                  max={100}
                  step={5}
                  className={cn(
                    stage.stage === 'closed_won' && "[&>span:first-child]:bg-green-500 [&>span:first-child]:cursor-not-allowed [&>div>span]:bg-green-500",
                    stage.stage === 'closed_lost' && "[&>span:first-child]:bg-red-500 [&>span:first-child]:cursor-not-allowed [&>div>span]:bg-red-500"
                  )}
                  disabled={stage.stage === 'closed_won' || stage.stage === 'closed_lost'}
                />
                
                {stage.stage !== 'closed_lost' && (
                  <Separator />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 预览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-600" />
            配置预览
          </CardTitle>
          <CardDescription>
            当前配置的预测公式预览
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm">
            <p className="text-muted-foreground mb-2">预测公式:</p>
            <p className="mb-4">
              成交概率 = Σ (维度分数 × 权重%) / Σ 权重%
            </p>
            <p className="text-muted-foreground mb-2">当前配置权重分配:</p>
            <div className="space-y-1">
              {config.weights.filter(w => w.isActive).map(w => (
                <div key={w.dimension} className="flex justify-between">
                  <span>{DIMENSION_LABELS[w.dimension]}</span>
                  <span className="font-medium">{w.weight}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 更新信息 */}
      <div className="text-sm text-muted-foreground text-center">
        <p>配置更新时间: {new Date(config.updatedAt).toLocaleString('zh-CN')}</p>
      </div>
    </div>
  );
}
