'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Save,
  RefreshCw,
  ArrowLeft,
  Settings,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageWrapper } from '@/components/crm/page-wrapper';
import {
  ChurnPredictionConfig,
  DEFAULT_CHURN_CONFIG,
  DimensionConfig,
  InteractionRule,
  OrderFrequencyRule,
  ConversionRule,
  ContractExpiryRule,
  ActivityRule,
} from '@/lib/churn-prediction-types';

export default function ChurnAlertConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // 配置状态
  const [highRiskThreshold, setHighRiskThreshold] = useState(DEFAULT_CHURN_CONFIG.highRiskThreshold);
  const [mediumRiskThreshold, setMediumRiskThreshold] = useState(DEFAULT_CHURN_CONFIG.mediumRiskThreshold);
  const [dimensionConfigs, setDimensionConfigs] = useState<DimensionConfig[]>(
    DEFAULT_CHURN_CONFIG.dimensionConfigs
  );
  
  // 预警规则
  const [enableAutoAlert, setEnableAutoAlert] = useState(DEFAULT_CHURN_CONFIG.enableAutoAlert);
  const [alertOnHighRisk, setAlertOnHighRisk] = useState(DEFAULT_CHURN_CONFIG.alertOnHighRisk);
  const [alertOnRiskIncrease, setAlertOnRiskIncrease] = useState(DEFAULT_CHURN_CONFIG.alertOnRiskIncrease);
  const [riskIncreaseThreshold, setRiskIncreaseThreshold] = useState(
    DEFAULT_CHURN_CONFIG.riskIncreaseThreshold
  );

  // 加载配置
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/churn/config');
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            setHighRiskThreshold(data.config.highRiskThreshold);
            setMediumRiskThreshold(data.config.mediumRiskThreshold);
            setDimensionConfigs(data.config.dimensionConfigs || DEFAULT_CHURN_CONFIG.dimensionConfigs);
            setEnableAutoAlert(data.config.enableAutoAlert);
            setAlertOnHighRisk(data.config.alertOnHighRisk);
            setAlertOnRiskIncrease(data.config.alertOnRiskIncrease);
            setRiskIncreaseThreshold(data.config.riskIncreaseThreshold);
          }
        }
      } catch (err) {
        console.error('加载配置失败:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConfig();
  }, []);

  // 保存配置
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    
    try {
      const config: ChurnPredictionConfig = {
        highRiskThreshold,
        mediumRiskThreshold,
        dimensionConfigs,
        lastInteractionRules: DEFAULT_CHURN_CONFIG.lastInteractionRules,
        orderFrequencyRules: DEFAULT_CHURN_CONFIG.orderFrequencyRules,
        opportunityConversionRules: DEFAULT_CHURN_CONFIG.opportunityConversionRules,
        contractExpiryRules: DEFAULT_CHURN_CONFIG.contractExpiryRules,
        activityLevelRules: DEFAULT_CHURN_CONFIG.activityLevelRules,
        enableAutoAlert,
        alertOnHighRisk,
        alertOnRiskIncrease,
        riskIncreaseThreshold,
      };
      
      const res = await fetch('/api/churn/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('保存失败');
      }
    } catch (err) {
      console.error('保存配置失败:', err);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 更新维度权重
  const updateDimensionWeight = (dimension: string, weight: number) => {
    setDimensionConfigs(prev =>
      prev.map(d => d.dimension === dimension ? { ...d, weight } : d)
    );
  };

  // 切换维度启用状态
  const toggleDimensionActive = (dimension: string) => {
    setDimensionConfigs(prev =>
      prev.map(d => d.dimension === dimension ? { ...d, isActive: !d.isActive } : d)
    );
  };

  // 重置为默认配置
  const handleReset = () => {
    if (confirm('确定要重置为默认配置吗？')) {
      setHighRiskThreshold(DEFAULT_CHURN_CONFIG.highRiskThreshold);
      setMediumRiskThreshold(DEFAULT_CHURN_CONFIG.mediumRiskThreshold);
      setDimensionConfigs(DEFAULT_CHURN_CONFIG.dimensionConfigs);
      setEnableAutoAlert(DEFAULT_CHURN_CONFIG.enableAutoAlert);
      setAlertOnHighRisk(DEFAULT_CHURN_CONFIG.alertOnHighRisk);
      setAlertOnRiskIncrease(DEFAULT_CHURN_CONFIG.alertOnRiskIncrease);
      setRiskIncreaseThreshold(DEFAULT_CHURN_CONFIG.riskIncreaseThreshold);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/churn-alerts">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">流失预警配置</h1>
              <p className="text-muted-foreground text-sm">
                配置风险评估维度权重和预警规则
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              重置
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saved ? '已保存' : '保存配置'}
            </Button>
          </div>
        </div>

        {/* 阈值配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-5 h-5" />
              风险阈值配置
            </CardTitle>
            <CardDescription>
              设置高、中、低风险的分界线
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="highThreshold">高风险阈值</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="highThreshold"
                    min={50}
                    max={90}
                    step={5}
                    value={[highRiskThreshold]}
                    onValueChange={([v]) => setHighRiskThreshold(v)}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-medium">{highRiskThreshold}分</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  风险分数 ≥ {highRiskThreshold} 为高风险
                </p>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="mediumThreshold">中风险阈值</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="mediumThreshold"
                    min={20}
                    max={60}
                    step={5}
                    value={[mediumRiskThreshold]}
                    onValueChange={([v]) => setMediumRiskThreshold(v)}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-medium">{mediumRiskThreshold}分</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {mediumRiskThreshold} ≤ 风险分数 &lt; {highRiskThreshold} 为中风险
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 维度权重配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              评估维度权重配置
            </CardTitle>
            <CardDescription>
              调整各风险维度在综合评估中的权重占比
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {dimensionConfigs.map((dim) => (
              <div key={dim.dimension} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={dim.isActive}
                      onCheckedChange={() => toggleDimensionActive(dim.dimension)}
                    />
                    <div>
                      <Label className={!dim.isActive ? 'text-muted-foreground' : ''}>
                        {dim.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{dim.description}</p>
                    </div>
                  </div>
                  <span className={`font-medium ${dim.isActive ? '' : 'text-muted-foreground'}`}>
                    {dim.weight}%
                  </span>
                </div>
                {dim.isActive && (
                  <Slider
                    min={5}
                    max={50}
                    step={5}
                    value={[dim.weight]}
                    onValueChange={([v]) => updateDimensionWeight(dim.dimension, v)}
                    disabled={!dim.isActive}
                  />
                )}
              </div>
            ))}
            
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">权重合计</span>
                <span className={`font-medium ${getTotalWeight(dimensionConfigs) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  {getTotalWeight(dimensionConfigs)}%
                </span>
              </div>
              {getTotalWeight(dimensionConfigs) !== 100 && (
                <p className="text-xs text-red-500 mt-1">
                  权重合计应为100%，当前为 {getTotalWeight(dimensionConfigs)}%
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 预警规则配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">预警规则配置</CardTitle>
            <CardDescription>
              配置何时触发流失预警通知
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>启用自动预警</Label>
                <p className="text-xs text-muted-foreground">
                  开启后，系统将根据规则自动生成预警
                </p>
              </div>
              <Switch
                checked={enableAutoAlert}
                onCheckedChange={setEnableAutoAlert}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>高风险预警</Label>
                <p className="text-xs text-muted-foreground">
                  当客户变为高风险时发送通知
                </p>
              </div>
              <Switch
                checked={alertOnHighRisk}
                onCheckedChange={setAlertOnHighRisk}
                disabled={!enableAutoAlert}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>风险上升预警</Label>
                <p className="text-xs text-muted-foreground">
                  当客户风险评分在短时间内上升时发送通知
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  min={5}
                  max={30}
                  step={5}
                  value={[riskIncreaseThreshold]}
                  onValueChange={([v]) => setRiskIncreaseThreshold(v)}
                  disabled={!enableAutoAlert || !alertOnRiskIncrease}
                  className="w-[120px]"
                />
                <Switch
                  checked={alertOnRiskIncrease}
                  onCheckedChange={setAlertOnRiskIncrease}
                  disabled={!enableAutoAlert}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 默认评分规则说明 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">评分规则说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">最近互动时间</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>超过30天无互动 +20分</li>
                  <li>超过60天无互动 +40分</li>
                  <li>超过90天无互动 +60分</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">订单频率</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>超过180天无订单 +30分</li>
                  <li>超过365天无订单 +50分</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">商机转化率</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>转化率低于10% +20分</li>
                  <li>转化率低于5% +40分</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">合同到期</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>30天内到期 +30分</li>
                  <li>已过期 +50分</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">客户活跃度</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>超过90天无活动 +20分</li>
                  <li>超过180天无活动 +40分</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}

// 计算总权重
function getTotalWeight(dimensions: DimensionConfig[]): number {
  return dimensions.reduce((sum, d) => sum + (d.isActive ? d.weight : 0), 0);
}
