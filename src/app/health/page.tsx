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
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// 健康度评分类型
interface HealthScore {
  customerId: string;
  customerName: string;
  totalScore: number;
  level: 'healthy' | 'good' | 'fair' | 'risk';
  levelLabel: string;
  dimensions: {
    interaction: { score: number; maxScore: number; value: number; label: string };
    salesAmount: { score: number; maxScore: number; value: number; label: string };
    orderFrequency: { score: number; maxScore: number; value: number; label: string };
    opportunityActivity: { score: number; maxScore: number; value: number; label: string };
    paymentTimeliness: { score: number; maxScore: number; value: number; label: string };
  };
  rank: number;
}

// 统计数据类型
interface HealthStats {
  total: number;
  distribution: { healthy: number; good: number; fair: number; risk: number };
  averageScore: number;
  topCustomers: HealthScore[];
  riskCustomers: HealthScore[];
}

// 等级配置
const LEVEL_CONFIG = {
  healthy: { label: '健康', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle },
  good: { label: '良好', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: TrendingUp },
  fair: { label: '一般', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', icon: Activity },
  risk: { label: '风险', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: AlertTriangle },
};

// 饼图颜色
const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

export default function HealthDashboardPage() {
  const [scores, setScores] = useState<HealthScore[]>([]);
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<HealthScore | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // 获取数据
  useEffect(() => {
    async function fetchData() {
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
          total: 25,
          distribution: { healthy: 8, good: 10, fair: 5, risk: 2 },
          averageScore: 68,
          topCustomers: [],
          riskCustomers: [],
        });
        setScores([
          { customerId: '1', customerName: '北京科技有限公司', totalScore: 92, level: 'healthy', levelLabel: '健康', dimensions: { interaction: { score: 22, maxScore: 25, value: 5, label: '互动频率' }, salesAmount: { score: 28, maxScore: 30, value: 250000, label: '销售金额' }, orderFrequency: { score: 18, maxScore: 20, value: 5, label: '订单频次' }, opportunityActivity: { score: 14, maxScore: 15, value: 3, label: '商机关怀' }, paymentTimeliness: { score: 10, maxScore: 10, value: 5, label: '回款及时' } }, rank: 1 },
          { customerId: '2', customerName: '上海实业集团', totalScore: 78, level: 'good', levelLabel: '良好', dimensions: { interaction: { score: 15, maxScore: 25, value: 3, label: '互动频率' }, salesAmount: { score: 25, maxScore: 30, value: 180000, label: '销售金额' }, orderFrequency: { score: 16, maxScore: 20, value: 4, label: '订单频次' }, opportunityActivity: { score: 12, maxScore: 15, value: 2, label: '商机关怀' }, paymentTimeliness: { score: 10, maxScore: 10, value: 4, label: '回款及时' } }, rank: 2 },
          { customerId: '3', customerName: '深圳创新科技', totalScore: 65, level: 'good', levelLabel: '良好', dimensions: { interaction: { score: 10, maxScore: 25, value: 2, label: '互动频率' }, salesAmount: { score: 20, maxScore: 30, value: 120000, label: '销售金额' }, orderFrequency: { score: 14, maxScore: 20, value: 3, label: '订单频次' }, opportunityActivity: { score: 11, maxScore: 15, value: 2, label: '商机关怀' }, paymentTimeliness: { score: 10, maxScore: 10, value: 3, label: '回款及时' } }, rank: 3 },
          { customerId: '4', customerName: '杭州网络科技', totalScore: 52, level: 'fair', levelLabel: '一般', dimensions: { interaction: { score: 8, maxScore: 25, value: 2, label: '互动频率' }, salesAmount: { score: 15, maxScore: 30, value: 80000, label: '销售金额' }, orderFrequency: { score: 12, maxScore: 20, value: 3, label: '订单频次' }, opportunityActivity: { score: 10, maxScore: 15, value: 2, label: '商机关怀' }, paymentTimeliness: { score: 7, maxScore: 10, value: 2, label: '回款及时' } }, rank: 4 },
          { customerId: '5', customerName: '成都商贸公司', totalScore: 35, level: 'risk', levelLabel: '风险', dimensions: { interaction: { score: 3, maxScore: 25, value: 0, label: '互动频率' }, salesAmount: { score: 10, maxScore: 30, value: 30000, label: '销售金额' }, orderFrequency: { score: 8, maxScore: 20, value: 2, label: '订单频次' }, opportunityActivity: { score: 7, maxScore: 15, value: 1, label: '商机关怀' }, paymentTimeliness: { score: 7, maxScore: 10, value: 1, label: '回款及时' } }, rank: 5 },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // 筛选客户
  const filteredCustomers = useMemo(() => {
    let filtered = [...scores];
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.customerName.toLowerCase().includes(searchTerm.toLowerCase())
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
    return scores.slice(0, 10).map(s => ({
      name: s.customerName.length > 8 ? s.customerName.slice(0, 8) + '...' : s.customerName,
      score: s.totalScore,
      level: s.level,
    }));
  }, [scores]);

  const handleViewDetail = (customer: HealthScore) => {
    setSelectedCustomer(customer);
    setDetailOpen(true);
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
            基于5维度自动计算客户健康度评分，助您识别高价值客户和风险客户
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            互动频率 25%
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            销售金额 30%
          </span>
          <span className="flex items-center gap-1">
            <ShoppingCart className="h-4 w-4" />
            订单频次 20%
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            商机关怀 15%
          </span>
          <span className="flex items-center gap-1">
            <CreditCard className="h-4 w-4" />
            回款及时 10%
          </span>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">客户总数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || scores.length}</div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">健康客户</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.distribution.healthy || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">良好客户</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.distribution.good || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">一般客户</CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.distribution.fair || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">风险客户</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.distribution.risk || 0}</div>
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
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
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
          <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white">
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
        </div>

        {/* 右侧 - 客户列表 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>客户评分排行</CardTitle>
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
                  {filteredCustomers.map((customer) => {
                    const levelCfg = LEVEL_CONFIG[customer.level];
                    const LevelIcon = levelCfg.icon;
                    const prevScore = customer.totalScore;
                    
                    return (
                      <div
                        key={customer.customerId}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleViewDetail(customer)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                            {customer.rank <= 3 ? (
                              <Trophy className={`h-4 w-4 ${customer.rank === 1 ? 'text-yellow-500' : customer.rank === 2 ? 'text-gray-400' : 'text-amber-600'}`} />
                            ) : (
                              customer.rank
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{customer.customerName}</div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge className={`${levelCfg.bgColor} ${levelCfg.color} text-xs`}>
                                <LevelIcon className="h-3 w-3 mr-1" />
                                {levelCfg.label}
                              </Badge>
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
                  })}
                  {filteredCustomers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      未找到匹配的客户
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="risk" className="space-y-2">
                  {scores.filter(c => c.level === 'risk' || c.totalScore < 40).length === 0 ? (
                    <div className="text-center py-8 text-green-600">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                      <p>太棒了！目前没有高风险客户</p>
                    </div>
                  ) : (
                    scores.filter(c => c.level === 'risk' || c.totalScore < 40).map((customer) => {
                      const levelCfg = LEVEL_CONFIG[customer.level];
                      const LevelIcon = levelCfg.icon;
                      
                      return (
                        <div
                          key={customer.customerId}
                          className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 cursor-pointer transition-colors"
                          onClick={() => handleViewDetail(customer)}
                        >
                          <div className="flex items-center gap-4">
                            <AlertTriangle className="h-6 w-6 text-red-500" />
                            <div>
                              <div className="font-medium">{customer.customerName}</div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="destructive" className="text-xs">
                                  <LevelIcon className="h-3 w-3 mr-1" />
                                  {levelCfg.label}
                                </Badge>
                                <span>得分: {customer.totalScore}</span>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                            查看详情
                          </Button>
                        </div>
                      );
                    })
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
