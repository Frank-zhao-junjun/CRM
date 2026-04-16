'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChurnAlertDetail } from '@/components/churn/churn-alert-detail';
import {
  AlertTriangle,
  Users,
  TrendingDown,
  Activity,
  DollarSign,
  Clock,
  RefreshCw,
  Search,
  ChevronRight,
  CheckCircle,
  AlertOctagon,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import type { ChurnAnalysis, ChurnRiskLevel } from '@/lib/churn-prediction';
import { CHURN_RISK_CONFIG } from '@/lib/churn-prediction';

// 饼图颜色
const COLORS = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a'];

export default function ChurnDashboardPage() {
  const [analyses, setAnalyses] = useState<ChurnAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedAnalysis, setSelectedAnalysis] = useState<ChurnAnalysis | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // 获取数据
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/churn');
      const data = await res.json();
      if (data.success) {
        setAnalyses(data.data || []);
      }
    } catch (error) {
      console.error('获取流失预警数据失败:', error);
      // 使用模拟数据
      setAnalyses([
        {
          customerId: '1',
          customerName: '北京科技有限公司',
          company: '北京科技有限公司',
          churnScore: 85,
          riskLevel: 'critical',
          signals: {
            lastInteractionDays: 120,
            interactionTrend: 'down',
            interactionFrequencyChange: -50,
            lastPurchaseDays: 200,
            revenueTrend: 'down',
            revenueChangePercent: -60,
            orderCountTrend: 'down',
            orderCountChange: -70,
            activeOpportunities: 0,
            opportunityLoss: true,
            paymentDelayDays: 0,
            hasOverduePayments: false,
            supportTicketsCount: 0,
            complaintRate: 0,
            contractDaysToExpire: 15,
            productUsageRate: 15,
          },
          triggers: [
            { type: 'inactive_period', severity: 'critical', description: '客户超过90天无互动', evidence: '最近一次互动: 120天前', detectedAt: new Date().toISOString() },
            { type: 'revenue_decline', severity: 'critical', description: '收入大幅下滑', evidence: '收入下降60%', detectedAt: new Date().toISOString() },
            { type: 'contract_expiring', severity: 'critical', description: '合同即将到期', evidence: '剩余天数: 15天', detectedAt: new Date().toISOString() },
          ],
          recommendations: [
            '立即联系客户，了解情况',
            '准备续约优惠方案',
            '安排高层拜访',
          ],
          predictedChurnDate: '2024-05-01',
          confidence: 85,
        },
        {
          customerId: '2',
          customerName: '上海实业集团',
          company: '上海实业集团',
          churnScore: 72,
          riskLevel: 'high',
          signals: {
            lastInteractionDays: 75,
            interactionTrend: 'down',
            interactionFrequencyChange: -30,
            lastPurchaseDays: 100,
            revenueTrend: 'down',
            revenueChangePercent: -25,
            orderCountTrend: 'down',
            orderCountChange: -40,
            activeOpportunities: 1,
            opportunityLoss: false,
            paymentDelayDays: 15,
            hasOverduePayments: true,
            supportTicketsCount: 2,
            complaintRate: 15,
            contractDaysToExpire: 45,
            productUsageRate: 35,
          },
          triggers: [
            { type: 'interaction_decline', severity: 'warning', description: '互动频率显著下降', evidence: '互动频率下降30%', detectedAt: new Date().toISOString() },
            { type: 'payment_delays', severity: 'warning', description: '存在逾期付款记录', evidence: '逾期天数: 15天', detectedAt: new Date().toISOString() },
          ],
          recommendations: [
            '了解付款延迟原因',
            '加强客户互动',
            '探索新商机',
          ],
          confidence: 75,
        },
        {
          customerId: '3',
          customerName: '深圳创新科技',
          company: '深圳创新科技',
          churnScore: 55,
          riskLevel: 'medium',
          signals: {
            lastInteractionDays: 45,
            interactionTrend: 'stable',
            interactionFrequencyChange: -10,
            lastPurchaseDays: 60,
            revenueTrend: 'stable',
            revenueChangePercent: -5,
            orderCountTrend: 'stable',
            orderCountChange: 0,
            activeOpportunities: 2,
            opportunityLoss: false,
            paymentDelayDays: 0,
            hasOverduePayments: false,
            supportTicketsCount: 1,
            complaintRate: 5,
            contractDaysToExpire: 90,
            productUsageRate: 50,
          },
          triggers: [
            { type: 'product_adoption_low', severity: 'info', description: '产品使用率偏低', evidence: '产品使用率: 50%', detectedAt: new Date().toISOString() },
          ],
          recommendations: [
            '提供产品培训',
            '优化使用体验',
          ],
          confidence: 60,
        },
        {
          customerId: '4',
          customerName: '杭州网络科技',
          company: '杭州网络科技',
          churnScore: 30,
          riskLevel: 'low',
          signals: {
            lastInteractionDays: 15,
            interactionTrend: 'up',
            interactionFrequencyChange: 20,
            lastPurchaseDays: 30,
            revenueTrend: 'up',
            revenueChangePercent: 15,
            orderCountTrend: 'up',
            orderCountChange: 25,
            activeOpportunities: 3,
            opportunityLoss: false,
            paymentDelayDays: 0,
            hasOverduePayments: false,
            supportTicketsCount: 0,
            complaintRate: 0,
            contractDaysToExpire: 180,
            productUsageRate: 80,
          },
          triggers: [],
          recommendations: [
            '继续保持优质服务',
            '定期跟进维护关系',
          ],
          confidence: 90,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 筛选客户
  const filteredAnalyses = useMemo(() => {
    let filtered = [...analyses];
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.company.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (riskFilter !== 'all') {
      filtered = filtered.filter(a => a.riskLevel === riskFilter);
    }
    
    return filtered;
  }, [analyses, searchTerm, riskFilter]);

  // 统计数据
  const stats = useMemo(() => ({
    total: analyses.length,
    critical: analyses.filter(a => a.riskLevel === 'critical').length,
    high: analyses.filter(a => a.riskLevel === 'high').length,
    medium: analyses.filter(a => a.riskLevel === 'medium').length,
    low: analyses.filter(a => a.riskLevel === 'low').length,
    averageScore: analyses.length > 0 
      ? Math.round(analyses.reduce((sum, a) => sum + a.churnScore, 0) / analyses.length)
      : 0,
  }), [analyses]);

  // 饼图数据
  const pieData = useMemo(() => [
    { name: '严重', value: stats.critical, color: COLORS[0] },
    { name: '高风险', value: stats.high, color: COLORS[1] },
    { name: '中风险', value: stats.medium, color: COLORS[2] },
    { name: '低风险', value: stats.low, color: COLORS[3] },
  ].filter(d => d.value > 0), [stats]);

  const handleViewDetail = (analysis: ChurnAnalysis) => {
    setSelectedAnalysis(analysis);
    setDetailOpen(true);
  };

  const handleTakeAction = (customerId: string) => {
    setDetailOpen(false);
    // 跳转到跟进页面或创建任务
    window.location.href = `/follow-ups?customerId=${customerId}`;
  };

  // 渲染客户列表项
  const renderAnalysisItem = (analysis: ChurnAnalysis, index: number) => {
    const config = CHURN_RISK_CONFIG[analysis.riskLevel];
    const isTopRisk = analysis.riskLevel === 'critical' || analysis.riskLevel === 'high';
    
    return (
      <div
        key={analysis.customerId}
        className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
          isTopRisk 
            ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30' 
            : 'hover:bg-muted/50'
        }`}
        onClick={() => handleViewDetail(analysis)}
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className={`text-lg font-bold ${isTopRisk ? 'text-red-600' : 'text-muted-foreground'}`}>
              {index + 1}
            </span>
          </div>
          <div>
            <div className="font-medium">{analysis.customerName}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge
                className="text-xs font-normal"
                style={{
                  backgroundColor: `${config.color}15`,
                  color: config.color,
                  borderColor: config.color,
                }}
              >
                {config.label}
              </Badge>
              <span>{analysis.triggers.length}个风险因素</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div 
              className="text-2xl font-bold"
              style={{ color: config.color }}
            >
              {analysis.churnScore}
            </div>
            <div className="text-xs text-muted-foreground">流失风险</div>
          </div>
          {analysis.predictedChurnDate && (
            <div className="text-right hidden md:block">
              <div className="text-sm font-medium text-orange-600">
                {analysis.predictedChurnDate}
              </div>
              <div className="text-xs text-muted-foreground">预测流失</div>
            </div>
          )}
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载流失预警数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            客户流失预警
          </h1>
          <p className="text-muted-foreground mt-1">
            智能分析客户行为数据，预测流失风险，及时采取挽留措施
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          刷新数据
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">客户总数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200 dark:border-red-800 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">严重</CardTitle>
            <AlertOctagon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 dark:border-orange-800 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">高风险</CardTitle>
            <AlertOctagon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-200 dark:border-yellow-800 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">中风险</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 dark:border-green-800 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">低风险</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.low}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.averageScore}</div>
              <div className="text-sm opacity-80">平均风险指数</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表和列表 */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* 左侧 - 饼图 */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>风险分布</CardTitle>
              <CardDescription>各风险等级占比</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}人</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 风险等级说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">风险等级说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>严重 (80-100)</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>高风险 (60-79)</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>中风险 (40-59)</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>低风险 (0-39)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧 - 客户列表 */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>流失风险客户列表</CardTitle>
                  <CardDescription>共 {filteredAnalyses.length} 个客户需要关注</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索客户..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Select value={riskFilter} onValueChange={setRiskFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="筛选风险" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部风险</SelectItem>
                      <SelectItem value="critical">严重</SelectItem>
                      <SelectItem value="high">高风险</SelectItem>
                      <SelectItem value="medium">中风险</SelectItem>
                      <SelectItem value="low">低风险</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">全部</TabsTrigger>
                  <TabsTrigger value="critical" className="text-red-600">
                    严重 {stats.critical > 0 && `(${stats.critical})`}
                  </TabsTrigger>
                  <TabsTrigger value="high" className="text-orange-600">
                    高风险 {stats.high > 0 && `(${stats.high})`}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-2">
                  {filteredAnalyses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      未找到匹配的客户
                    </div>
                  ) : (
                    filteredAnalyses.map((analysis, index) => renderAnalysisItem(analysis, index))
                  )}
                </TabsContent>
                
                <TabsContent value="critical" className="space-y-2">
                  {stats.critical === 0 ? (
                    <div className="text-center py-8 text-green-600">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                      <p>太棒了！目前没有严重流失风险客户</p>
                    </div>
                  ) : (
                    filteredAnalyses
                      .filter(a => a.riskLevel === 'critical')
                      .map((analysis, index) => renderAnalysisItem(analysis, index))
                  )}
                </TabsContent>
                
                <TabsContent value="high" className="space-y-2">
                  {stats.high === 0 ? (
                    <div className="text-center py-8 text-green-600">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                      <p>太棒了！目前没有高流失风险客户</p>
                    </div>
                  ) : (
                    filteredAnalyses
                      .filter(a => a.riskLevel === 'high')
                      .map((analysis, index) => renderAnalysisItem(analysis, index))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 流失预警详情弹窗 */}
      <ChurnAlertDetail
        analysis={selectedAnalysis}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onTakeAction={handleTakeAction}
      />
    </div>
  );
}
