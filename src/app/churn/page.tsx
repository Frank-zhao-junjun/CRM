'use client';

import { useState, useEffect } from 'react';
import { 
  Users, TrendingDown, AlertTriangle, Calendar, 
  Download, RefreshCw, UserMinus, UserCheck, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

interface ChurnMetrics {
  churnRate: number;
  churnRateChange: number;
  atRiskCount: number;
  churnedCount: number;
  recoveredCount: number;
  recoveryRate: number;
}

interface AtRiskCustomer {
  id: string;
  name: string;
  risk: 'high' | 'medium' | 'low';
  lastActivity: string;
  engagement: number;
  reason: string;
}

interface ChurnTrend {
  month: string;
  churned: number;
  recovered: number;
  atRisk: number;
}

export default function ChurnPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ChurnMetrics | null>(null);
  const [atRiskCustomers, setAtRiskCustomers] = useState<AtRiskCustomer[]>([]);
  const [churnTrend, setChurnTrend] = useState<ChurnTrend[]>([]);
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    fetchChurnData();
  }, [timeRange]);

  const fetchChurnData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/churn?range=${timeRange}`);
      const data = await res.json();
      setMetrics(data.metrics || getDefaultMetrics());
      setAtRiskCustomers(data.atRiskCustomers || getDefaultAtRisk());
      setChurnTrend(data.trend || getDefaultTrend());
    } catch (error) {
      console.error('获取流失数据失败:', error);
      setMetrics(getDefaultMetrics());
      setAtRiskCustomers(getDefaultAtRisk());
      setChurnTrend(getDefaultTrend());
    }
    setLoading(false);
  };

  const getDefaultMetrics = (): ChurnMetrics => ({
    churnRate: 8.5,
    churnRateChange: -2.3,
    atRiskCount: 23,
    churnedCount: 156,
    recoveredCount: 42,
    recoveryRate: 26.9,
  });

  const getDefaultAtRisk = (): AtRiskCustomer[] => [
    { id: '1', name: '创新科技有限公司', risk: 'high', lastActivity: '15天前', engagement: 25, reason: '长期无互动' },
    { id: '2', name: '华信集团', risk: 'high', lastActivity: '20天前', engagement: 18, reason: '服务到期未续费' },
    { id: '3', name: '智联数据服务', risk: 'medium', lastActivity: '10天前', engagement: 42, reason: '使用频率下降' },
    { id: '4', name: '未来科技', risk: 'medium', lastActivity: '12天前', engagement: 38, reason: '竞品咨询' },
    { id: '5', name: '云端网络', risk: 'low', lastActivity: '7天前', engagement: 55, reason: '偶发低活跃' },
  ];

  const getDefaultTrend = (): ChurnTrend[] => [
    { month: '1月', churned: 18, recovered: 5, atRisk: 32 },
    { month: '2月', churned: 15, recovered: 8, atRisk: 28 },
    { month: '3月', churned: 22, recovered: 6, atRisk: 35 },
    { month: '4月', churned: 12, recovered: 10, atRisk: 25 },
    { month: '5月', churned: 19, recovered: 7, atRisk: 30 },
    { month: '6月', churned: 14, recovered: 9, atRisk: 26 },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high':
        return '高风险';
      case 'medium':
        return '中风险';
      case 'low':
        return '低风险';
      default:
        return '未知';
    }
  };

  const exportCSV = () => {
    if (!metrics) return;
    
    const headers = ['客户名称', '风险等级', '最后活动', '活跃度', '流失原因'];
    const rows = atRiskCustomers.map(c => [
      c.name,
      getRiskBadge(c.risk),
      c.lastActivity,
      `${c.engagement}%`,
      c.reason,
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `客户流失分析_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxChurned = Math.max(...churnTrend.map(t => t.churned), 1);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
              <UserMinus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">客户流失分析</h1>
              <p className="text-gray-500 mt-1">识别高风险客户，制定挽留策略</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value as 'month' | 'quarter' | 'year')}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="month">最近一月</option>
              <option value="quarter">最近一季度</option>
              <option value="year">最近一年</option>
            </select>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
            >
              <Download className="h-4 w-4" />
              导出CSV
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border shadow-sm p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      ) : metrics && (
        <>
          {/* 关键指标卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">流失率</p>
                  <p className="text-3xl font-bold text-red-600">{metrics.churnRate}%</p>
                </div>
                <div className={`p-3 rounded-full ${metrics.churnRateChange < 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {metrics.churnRateChange < 0 ? (
                    <ArrowDownRight className="h-6 w-6 text-green-600" />
                  ) : (
                    <ArrowUpRight className="h-6 w-6 text-red-600" />
                  )}
                </div>
              </div>
              <p className={`text-sm mt-2 ${metrics.churnRateChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                环比 {metrics.churnRateChange > 0 ? '+' : ''}{metrics.churnRateChange}%
              </p>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm">高风险客户</span>
              </div>
              <p className="text-3xl font-bold text-orange-600">{metrics.atRiskCount}</p>
              <p className="text-xs text-gray-400 mt-2">需要重点关注</p>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <UserMinus className="h-5 w-5" />
                <span className="text-sm">已流失客户</span>
              </div>
              <p className="text-3xl font-bold">{metrics.churnedCount}</p>
              <p className="text-xs text-gray-400 mt-2">本期流失总数</p>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <UserCheck className="h-5 w-5" />
                <span className="text-sm">挽回客户</span>
              </div>
              <p className="text-3xl font-bold text-green-600">{metrics.recoveredCount}</p>
              <p className="text-xs text-gray-400 mt-2">挽回率 {metrics.recoveryRate}%</p>
            </div>
          </div>

          {/* 流失趋势 */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              流失趋势
            </h2>
            <div className="h-64 flex items-end justify-around gap-4">
              {churnTrend.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center gap-1">
                    <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '180px' }}>
                      <div 
                        className="absolute bottom-0 w-full bg-red-400 rounded-t transition-all"
                        style={{ height: `${(item.churned / maxChurned) * 100}%` }}
                      />
                      <div className="absolute bottom-0 w-full bg-green-400/50 rounded-t"
                        style={{ height: `${(item.recovered / maxChurned) * 100}%`, opacity: 0.7 }}
                      />
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        <span className="text-xs font-medium">{item.churned}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{item.month}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded"></div>
                <span>流失客户</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded"></div>
                <span>挽回客户</span>
              </div>
            </div>
          </div>

          {/* 高风险客户列表 */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                高风险客户
              </h2>
              <button
                onClick={fetchChurnData}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                <RefreshCw className="h-4 w-4" />
                刷新
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm text-gray-500">客户名称</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-500">风险等级</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-500">最后活动</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-500">活跃度</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-500">流失原因</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{customer.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(customer.risk)}`}>
                          {getRiskBadge(customer.risk)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{customer.lastActivity}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-2">
                            <div 
                              className={`h-full rounded-full ${
                                customer.engagement > 50 ? 'bg-green-500' :
                                customer.engagement > 30 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${customer.engagement}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">{customer.engagement}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{customer.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
