'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Sparkles,
  Plus,
  Trash2,
  Building2,
  Briefcase,
  Globe,
  MessageCircle,
  DollarSign,
  User,
  Check,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LeadScoringConfig,
  ScoreWeight,
  CompanySizeRule,
  IndustryRule,
  SourceQualityRule,
  DEFAULT_SCORING_CONFIG,
  DIMENSION_CONFIGS,
} from '@/lib/lead-scoring-types';
import { LeadSourceType } from '@/lib/crm-types';

// 维度图标映射
const DIMENSION_ICONS: Record<string, React.ElementType> = {
  company_size: Building2,
  industry_match: Briefcase,
  source_quality: Globe,
  engagement_level: MessageCircle,
  estimated_value: DollarSign,
  contact_complete: User,
};

// 来源类型中文映射
const SOURCE_LABELS: Record<LeadSourceType, string> = {
  referral: '客户推荐',
  website: '官网表单',
  cold_call: '电话拓展',
  event: '展会活动',
  advertisement: '广告投放',
  other: '其他来源',
};

// 默认配置
const INITIAL_CONFIG: LeadScoringConfig = {
  id: 'default',
  ...DEFAULT_SCORING_CONFIG,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function ScoringConfigPage() {
  const router = useRouter();
  const [config, setConfig] = useState<LeadScoringConfig>(INITIAL_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('weights');

  // 从 localStorage 加载配置
  useEffect(() => {
    const saved = localStorage.getItem('lead-scoring-config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load config:', e);
      }
    }
  }, []);

  // 检测变更
  useEffect(() => {
    const saved = localStorage.getItem('lead-scoring-config');
    if (saved) {
      try {
        const original = JSON.parse(saved);
        setHasChanges(JSON.stringify(original) !== JSON.stringify(config));
      } catch {
        setHasChanges(true);
      }
    } else {
      setHasChanges(JSON.stringify(INITIAL_CONFIG) !== JSON.stringify(config));
    }
  }, [config]);

  // 保存配置
  const handleSave = () => {
    const updatedConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('lead-scoring-config', JSON.stringify(updatedConfig));
    setConfig(updatedConfig);
    setHasChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // 重置为默认
  const handleReset = () => {
    const defaultConfig = {
      ...INITIAL_CONFIG,
      id: 'default',
      createdAt: config.createdAt,
      updatedAt: new Date().toISOString(),
    };
    setConfig(defaultConfig);
  };

  // 更新权重
  const updateWeight = (dimension: string, updates: Partial<ScoreWeight>) => {
    setConfig(prev => ({
      ...prev,
      weights: prev.weights.map(w => 
        w.dimension === dimension ? { ...w, ...updates } : w
      ),
    }));
  };

  // 更新公司规模规则
  const updateCompanySizeRule = (index: number, updates: Partial<CompanySizeRule>) => {
    setConfig(prev => ({
      ...prev,
      companySizeRules: prev.companySizeRules.map((r, i) => 
        i === index ? { ...r, ...updates } : r
      ),
    }));
  };

  // 添加公司规模规则
  const addCompanySizeRule = () => {
    setConfig(prev => ({
      ...prev,
      companySizeRules: [
        ...prev.companySizeRules,
        { range: '自定义', score: 50, label: '自定义规模' },
      ],
    }));
  };

  // 删除公司规模规则
  const deleteCompanySizeRule = (index: number) => {
    setConfig(prev => ({
      ...prev,
      companySizeRules: prev.companySizeRules.filter((_, i) => i !== index),
    }));
  };

  // 更新行业规则
  const updateIndustryRule = (industry: string, updates: Partial<IndustryRule>) => {
    setConfig(prev => ({
      ...prev,
      industryRules: prev.industryRules.map(r => 
        r.industry === industry ? { ...r, ...updates } : r
      ),
    }));
  };

  // 添加行业规则
  const addIndustryRule = () => {
    setConfig(prev => ({
      ...prev,
      industryRules: [
        ...prev.industryRules,
        { industry: '新行业', isTargetIndustry: false, score: 50 },
      ],
    }));
  };

  // 更新来源规则
  const updateSourceRule = (source: LeadSourceType, updates: Partial<SourceQualityRule>) => {
    setConfig(prev => ({
      ...prev,
      sourceRules: prev.sourceRules.map(r => 
        r.source === source ? { ...r, ...updates } : r
      ),
    }));
  };

  // 计算总权重
  const totalWeight = config.weights.reduce((sum, w) => sum + (w.isActive ? w.weight : 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/leads">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              AI 评分配置
            </h1>
            <p className="text-muted-foreground text-sm">
              配置线索评分规则和权重
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              <Check className="h-3 w-3 mr-1" />
              已保存
            </Badge>
          )}
          {hasChanges && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              有未保存的更改
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            重置
          </Button>
          <Button onClick={handleSave} className="gap-2" disabled={!hasChanges}>
            <Save className="h-4 w-4" />
            保存配置
          </Button>
        </div>
      </div>

      {/* 权重分配概览 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">权重分配概览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
              {config.weights.filter(w => w.isActive).map(w => (
                <div
                  key={w.dimension}
                  className={cn(
                    'transition-all duration-300',
                    w.dimension === 'company_size' ? 'bg-blue-500' :
                    w.dimension === 'industry_match' ? 'bg-purple-500' :
                    w.dimension === 'source_quality' ? 'bg-green-500' :
                    w.dimension === 'engagement_level' ? 'bg-orange-500' :
                    w.dimension === 'estimated_value' ? 'bg-pink-500' : 'bg-gray-500'
                  )}
                  style={{ width: `${w.weight}%` }}
                  title={`${w.dimension}: ${w.weight}%`}
                />
              ))}
            </div>
            <span className={cn(
              'font-semibold',
              totalWeight === 100 ? 'text-green-600' : 'text-red-600'
            )}>
              {totalWeight}% / 100%
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {config.weights.filter(w => w.isActive).map(w => {
              const dimConfig = DIMENSION_CONFIGS.find(d => d.dimension === w.dimension);
              return (
                <Badge key={w.dimension} variant="outline" className="gap-1">
                  {w.weight}% {dimConfig?.label}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 配置标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="weights">评分权重</TabsTrigger>
          <TabsTrigger value="company">公司规模</TabsTrigger>
          <TabsTrigger value="industry">行业规则</TabsTrigger>
          <TabsTrigger value="source">来源规则</TabsTrigger>
        </TabsList>

        {/* 评分权重配置 */}
        <TabsContent value="weights" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>评分权重配置</CardTitle>
              <CardDescription>
                调整各评分维度的权重比例，总权重需为 100%
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {config.weights.map(weight => {
                const dimConfig = DIMENSION_CONFIGS.find(d => d.dimension === weight.dimension);
                const Icon = DIMENSION_ICONS[weight.dimension] || Building2;
                
                return (
                  <div key={weight.dimension} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{dimConfig?.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {dimConfig?.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={weight.isActive}
                          onCheckedChange={(checked) => 
                            updateWeight(weight.dimension, { isActive: checked })
                          }
                        />
                        <span className="w-12 text-right font-medium">
                          {weight.weight}%
                        </span>
                      </div>
                    </div>
                    {weight.isActive && (
                      <Slider
                        value={[weight.weight]}
                        onValueChange={([value]) => 
                          updateWeight(weight.dimension, { weight: value })
                        }
                        max={100}
                        step={5}
                        className="max-w-md"
                      />
                    )}
                    <Separator />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 公司规模规则 */}
        <TabsContent value="company" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>公司规模评分规则</CardTitle>
              <CardDescription>
                配置不同规模公司的评分标准
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.companySizeRules.map((rule, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label>规模范围</Label>
                        <Input
                          value={rule.range}
                          onChange={(e) => 
                            updateCompanySizeRule(index, { range: e.target.value })
                          }
                          placeholder="如: 1-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>标签</Label>
                        <Input
                          value={rule.label}
                          onChange={(e) => 
                            updateCompanySizeRule(index, { label: e.target.value })
                          }
                          placeholder="如: 小微企业"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>评分</Label>
                        <Input
                          type="number"
                          value={rule.score}
                          onChange={(e) => 
                            updateCompanySizeRule(index, { 
                              score: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) 
                            })
                          }
                          min={0}
                          max={100}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteCompanySizeRule(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addCompanySizeRule}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  添加规模规则
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 行业规则 */}
        <TabsContent value="industry" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>行业匹配评分规则</CardTitle>
              <CardDescription>
                配置不同行业的匹配度和评分，标记目标行业可获得更高分数
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.industryRules.map((rule) => (
                  <div 
                    key={rule.industry} 
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label>行业名称</Label>
                        <Input
                          value={rule.industry}
                          onChange={(e) => {
                            const oldIndustry = rule.industry;
                            updateIndustryRule(oldIndustry, { industry: e.target.value });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>评分</Label>
                        <Input
                          type="number"
                          value={rule.score}
                          onChange={(e) => 
                            updateIndustryRule(rule.industry, { 
                              score: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) 
                            })
                          }
                          min={0}
                          max={100}
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-6">
                        <Switch
                          checked={rule.isTargetIndustry}
                          onCheckedChange={(checked) => 
                            updateIndustryRule(rule.industry, { isTargetIndustry: checked })
                          }
                        />
                        <span className="text-sm">
                          {rule.isTargetIndustry ? '目标行业' : '非目标行业'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addIndustryRule}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  添加行业规则
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 来源规则 */}
        <TabsContent value="source" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>来源渠道评分规则</CardTitle>
              <CardDescription>
                配置不同线索来源渠道的质量评分
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.sourceRules.map((rule) => (
                  <div 
                    key={rule.source} 
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>来源渠道</Label>
                        <div className="text-sm font-medium">
                          {SOURCE_LABELS[rule.source] || rule.source}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>质量等级</Label>
                        <div className="flex gap-2">
                          {(['high', 'medium', 'low'] as const).map(quality => (
                            <Button
                              key={quality}
                              variant={rule.quality === quality ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateSourceRule(rule.source, { quality })}
                              className="flex-1"
                            >
                              {quality === 'high' ? '高' : quality === 'medium' ? '中' : '低'}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="w-24 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {rule.score}
                      </div>
                      <div className="text-xs text-muted-foreground">分</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
