'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomerHealthDetail } from '@/components/health/customer-health-detail';
import { 
  Heart, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Search,
  ChevronRight,
  Trophy,
  Activity,
  DollarSign,
  ShoppingCart,
  Briefcase,
  CreditCard,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import type { CustomerHealthScore, HealthStats, HealthLevel } from '@/lib/health-score';
import { HEALTH_LEVELS } from '@/lib/health-score';

// 饼图颜色
const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

// 等级配置
const LEVEL_CONFIG = {
  healthy: { label: '健康', color: '#22c55e', icon: CheckCircle },
  good: { label: '良好', color: '#3b82f6', icon: TrendingUp },
  fair: { label: '一般', color: '#f59e0b', icon: Activity },
  risk: { label: '风险', color: '#ef4444', icon: AlertTriangle },
};

export default function HealthDashboardPage() {
  const [scores, setScores] = useState<CustomerHealthScore[]>([]);
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerHealthScore | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // 获取数据
  const fetchData = async () => {
    setLoading(true);
    try {
      // 获取统计数据
      const statsRes = await fetch('/api/health?action=stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // 获取所有评分
      const scoresRes = await fetch('/api/health');
      const scoresData = await scoresRes.json();
      if (scoresData.success) {
        setScores(scoresData.data || []);
      }
    } catch (error) {
      console.error('获取健康度数据失败:', error);
      // 使用模拟数据
      setStats({
        totalCustomers: 25,
        distribution: { healthy: 8, good: 10, fair: 5, risk: 2 },
        averageScore: 68,
        highRiskCustomers: [],
        topCustomers: [],
      });
      setScores([
        { customerId: '1', customerName: '北京科技有限公司', company: '北京科技有限公司', totalScore: 92, level: 'healthy', levelLabel: '健康', dimensions: { interaction: { score: 95, maxScore: 100, weight: 0.25, weightedScore: 23.75, rawValue: 5, displayValue: '5天', label: '互动频率' }, salesAmount: { score: 100, maxScore: 100, weight: 0.30, weightedScore: 30, rawValue: 250000, displayValue: '¥25万', label: '销售金额' }, orderFrequency: { score: 100, maxScore: 100, weight: 0.20, weightedScore: 20, rawValue: 12, displayValue: '12单/年', label: '订单频次' }, opportunityActivity: { score: 100, maxScore: 100, weight: 0.15, weightedScore: 15, rawValue: 5, displayValue: '5个', label: '商机关怀' }, paymentTimeliness: { score: 100, maxScore: 100, weight: 0.10, weightedScore: 10, rawValue: 0, displayValue: '及时回款', label: '回款及时' } }, suggestions: ['继续保持优质的服务和合作关系'] },
        { customerId: '2', customerName: '上海实业集团', company: '上海实业集团', totalScore: 78, level: 'good', levelLabel: '良好', dimensions: { interaction: { score: 50, maxScore: 100, weight: 0.25, weightedScore: 12.5, rawValue: 45, displayValue: '45天', label: '互动频率' }, salesAmount: { score: 80, maxScore: 100, weight: 0.30, weightedScore: 24, rawValue: 80000, displayValue: '¥8万', label: '销售金额' }, orderFrequency: { score: 80, maxScore: 100, weight: 0.20, weightedScore: 16, rawValue: 6, displayValue: '6单/年', label: '订单频次' }, opportunityActivity: { score: 70, maxScore: 100, weight: 0.15, weightedScore: 10.5, rawValue: 2, displayValue: '2个', label: '商机关怀' }, paymentTimeliness: { score: 100, maxScore: 100, weight: 0.10, weightedScore: 10, rawValue: 0, displayValue: '及时回款', label: '回款及时' } }, suggestions: ['建议增加客户互动频次，定期电话或邮件跟进', '可尝试推荐高价值产品或套餐，提升客单价'] },
        { customerId: '3', customerName: '深圳创新科技', company: '深圳创新科技', totalScore: 65, level: 'good', levelLabel: '良好', dimensions: { interaction: { score: 20, maxScore: 100, weight: 0.25, weightedScore: 5, rawValue: 85, displayValue: '85天', label: '互动频率' }, salesAmount: { score: 60, maxScore: 100, weight: 0.30, weightedScore: 18, rawValue: 35000, displayValue: '¥3.5万', label: '销售金额' }, orderFrequency: { score: 60, maxScore: 100, weight: 0.20, weightedScore: 12, rawValue: 3, displayValue: '3单/年', label: '订单频次' }, opportunityActivity: { score: 50, maxScore: 100, weight: 0.15, weightedScore: 7.5, rawValue: 1, displayValue: '1个', label: '商机关怀' }, paymentTimeliness: { score: 80, maxScore: 100, weight: 0.10, weightedScore: 8, rawValue: 5, displayValue: '5%逾期', label: '回款及时' } }, suggestions: ['建议增加客户互动频次，定期电话或邮件跟进', '可尝试推荐高价值产品或套餐，提升客单价', '建议积极开拓新商机，增加销售机会'] },
        { customerId: '4', customerName: '杭州网络科技', company: '杭州网络科技', totalScore: 52, level: 'fair', levelLabel: '一般', dimensions: { interaction: { score: 0, maxScore: 100, weight: 0.25, weightedScore: 0, rawValue: 150, displayValue: '150天', label: '互动频率' }, salesAmount: { score: 60, maxScore: 100, weight: 0.30, weightedScore: 18, rawValue: 28000, displayValue: '¥2.8万', label: '销售金额' }, orderFrequency: { score: 60, maxScore: 100, weight: 0.20, weightedScore: 12, rawValue: 3, displayValue: '3单/年', label: '订单频次' }, opportunityActivity: { score: 30, maxScore: 100, weight: 0.15, weightedScore: 4.5, rawValue: 0, displayValue: '无进行中', label: '商机关怀' }, paymentTimeliness: { score: 50, maxScore: 100, weight: 0.10, weightedScore: 5, rawValue: 25, displayValue: '25%逾期', label: '回款及时' } }, suggestions: ['建议增加客户互动频次，定期电话或邮件跟进', '建议积极开拓新商机，增加销售机会', '建议完善合同条款，加强回款管理'] },
        { customerId: '5', customerName: '成都商贸公司', company: '成都商贸公司', totalScore: 35, level: 'risk', levelLabel: '风险', dimensions: { interaction: { score: 0, maxScore: 100, weight: 0.25, weightedScore: 0, rawValue: 200, displayValue: '200天', label: '互动频率' }, salesAmount: { score: 40, maxScore: 100, weight: 0.30, weightedScore: 12, rawValue: 5000, displayValue: '¥5000', label: '销售金额' }, orderFrequency: { score: 40, maxScore: 100, weight: 0.20, weightedScore: 8, rawValue: 1, displayValue: '1单/年', label: '订单频次' }, opportunityActivity: { score: 30, maxScore: 100, weight: 0.15, weightedScore: 4.5, rawValue: 0, displayValue: '无进行中', label: '商机关怀' }, paymentTimeliness: { score: 0, maxScore: 100, weight: 0.10, weightedScore: 0, rawValue: 50, displayValue: '50%逾期', label: '回款及时' } }, suggestions: ['建议增加客户互动频次，定期电话或邮件跟进', '可尝试推荐高价值产品或套餐，提升客单价', '可设置定期采购提醒，促进复购', '建议积极开拓新商机，增加销售机会', '建议完善合同条款，加强回款管理'] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 筛选客户
  const filteredCustomers = useMemo(() => {
    let filtered = [...scores];
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (levelFilter !== 'all') {
      filtered = filtered.filter(c => c.level === levelFilter);
    }
    
    return filtered;
  }, [scores, searchTerm, levelFilter]);

  // 饼图数据
  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: '健康', value: stats.distribution.healthy, color: COLORS[0] },
      { name: '良好', value: stats.distribution.good, color: COLORS[1] },
      { name: '一般', value: stats.distribution.fair, color: COLORS[2] },
      { name: '风险', value: stats.distribution.risk, color: COLORS[3] },
    ].filter(d => d.value > 0);
  }, [stats]);

  // 排行榜数据
  const rankingData = useMemo(() => {
    return scores.slice(0, 10).map((s, idx) => ({
      rank: idx + 1,
      name: s.customerName.length > 10 ? s.customerName.slice(0, 10) + '...' : s.customerName,
      score: s.totalScore,
      level: s.level,
    }));
  }, [scores]);

  const handleViewDetail = (customer: CustomerHealthScore) => {
    setSelectedCustomer(customer);
    setDetailOpen(true);
  };

  // 渲染客户列表项
  const renderCustomerItem = (customer: CustomerHealthScore, index: number) => {
    const levelCfg = LEVEL_CONFIG[customer.level] || LEVEL_CONFIG.fair;
    const LevelIcon = levelCfg.icon;
    const isTopThree = index < 3;
    
    return (
      <div
        key={customer.customerId}
        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={() => handleViewDetail(customer)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            isTopThree 
              ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' 
              : 'bg-muted'
          }`}>
            {isTopThree ? (
              <Trophy className="h-4 w-4" />
            ) : (
              index + 1
            )}
          </div>
          <div>
            <div className="font-medium">{customer.customerName}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge 
                className="text-xs font-normal"
                style={{ 
                  backgroundColor: `${levelCfg.color}15`, 
                  color: levelCfg.color,
                  borderColor: levelCfg.color 
                }}
              >
                <LevelIcon className="h-3 w-3 mr-1" />
                {levelCfg.label}
              </Badge>
              <span className="text-xs">{customer.company}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-lg font-bold">{customer.totalScore}</div>
            <div className="text-xs text-muted-foreground">总分</div>
          </div>
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
          <p className="mt-4 text-muted-foreground">加载健康度数据...</p>
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
            <Heart className="h-8 w-8 text-rose-500" />
            客户健康度
          </h1>
          <p className="text-muted-foreground mt-1">
            基于5维度自动计算客户健康度评分，帮助识别高价值客户和潜在流失风险
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          刷新数据
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">客户总数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCustomers || scores.length}</div>
            <p className="text-xs text-muted-foreground">全部客户</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 dark:border-green-800 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">健康客户</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.distribution.healthy || 0}</div>
            <p className="text-xs text-muted-foreground">80分以上</p>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">良好客户</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.distribution.good || 0}</div>
            <p className="text-xs text-muted-foreground">60-79分</p>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-200 dark:border-yellow-800 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">一般客户</CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.distribution.fair || 0}</div>
            <p className="text-xs text-muted-foreground">40-59分</p>
          </CardContent>
        </Card>
        
        <Card className="border-red-200 dark:border-red-800 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">风险客户</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.distribution.risk || 0}</div>
            <p className="text-xs text-muted-foreground">40分以下</p>
          </CardContent>
        </Card>
      </div>

      {/* 图表和列表 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧 - 饼图和排行榜 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 分布饼图 */}
          <Card>
            <CardHeader>
              <CardTitle>健康度分布</CardTitle>
              <CardDescription>各等级客户占比</CardDescription>
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
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-center gap-4">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 平均分 */}
          <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-5xl font-bold">{stats?.averageScore || 0}</div>
                <div className="text-sm opacity-80 mt-1">平均健康度</div>
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <div>
                    <div className="text-2xl font-bold">{scores.filter(s => s.totalScore >= 60).length}</div>
                    <div className="opacity-70">达标客户</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{scores.filter(s => s.totalScore < 40).length}</div>
                    <div className="opacity-70">高风险客户</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 评分维度说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">评分维度说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span>互动频率</span>
                </div>
                <Badge variant="outline">25%</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span>销售金额</span>
                </div>
                <Badge variant="outline">30%</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-amber-500" />
                  <span>订单频次</span>
                </div>
                <Badge variant="outline">20%</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-purple-500" />
                  <span>商机关怀</span>
                </div>
                <Badge variant="outline">15%</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-pink-500" />
                  <span>回款及时</span>
                </div>
                <Badge variant="outline">10%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧 - 客户列表 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>客户健康度排行</CardTitle>
                  <CardDescription>共 {filteredCustomers.length} 个客户</CardDescription>
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
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="筛选等级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部等级</SelectItem>
                      <SelectItem value="healthy">健康</SelectItem>
                      <SelectItem value="good">良好</SelectItem>
                      <SelectItem value="fair">一般</SelectItem>
                      <SelectItem value="risk">风险</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="ranking" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="ranking">排行榜</TabsTrigger>
                  <TabsTrigger value="risk">高风险客户</TabsTrigger>
                </TabsList>
                
                <TabsContent value="ranking" className="space-y-2">
                  {filteredCustomers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      未找到匹配的客户
                    </div>
                  ) : (
                    filteredCustomers.map((customer, index) => renderCustomerItem(customer, index))
                  )}
                </TabsContent>
                
                <TabsContent value="risk" className="space-y-2">
                  {scores.filter(c => c.level === 'risk' || c.totalScore < 40).length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p className="text-green-600 font-medium">太棒了！目前没有高风险客户</p>
                    </div>
                  ) : (
                    scores
                      .filter(c => c.level === 'risk' || c.totalScore < 40)
                      .map((customer, index) => (
                        <div
                          key={customer.customerId}
                          className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 cursor-pointer transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
                          onClick={() => handleViewDetail(customer)}
                        >
                          <div className="flex items-center gap-4">
                            <AlertTriangle className="h-6 w-6 text-red-500" />
                            <div>
                              <div className="font-medium">{customer.customerName}</div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  风险
                                </Badge>
                                <span>得分: {customer.totalScore}</span>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-100">
                            查看详情
                          </Button>
                        </div>
                      ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 健康度详情弹窗 */}
      <CustomerHealthDetail
        healthScore={selectedCustomer}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
