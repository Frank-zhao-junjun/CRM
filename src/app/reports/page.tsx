'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Target, PieChart,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import type { ReportSummary } from '@/lib/report-types';

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports?range=this_month')
      .then(res => res.json())
      .then(data => {
        setSummary(data.summary);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: '总收入',
      value: `¥${(summary?.totalRevenue || 0).toLocaleString()}`,
      change: summary?.revenueGrowth || 0,
      icon: DollarSign,
      color: 'text-green-600 bg-green-50'
    },
    {
      title: '成交单数',
      value: summary?.totalDeals?.toString() || '0',
      change: 12,
      icon: Target,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: '转化率',
      value: `${(summary?.dealConversion || 0).toFixed(1)}%`,
      change: 3.2,
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      title: '平均客单价',
      value: `¥${(summary?.avgDealValue || 0).toLocaleString()}`,
      change: -2.5,
      icon: PieChart,
      color: 'text-orange-600 bg-orange-50'
    },
    {
      title: '管道金额',
      value: `¥${(summary?.pipelineValue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-indigo-600 bg-indigo-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h1 className="text-2xl font-bold">销售数据概览</h1>
        <p className="text-gray-500 mt-1">本月销售业绩实时统计</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              {stat.change !== undefined && (
                <div className={`flex items-center text-sm ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span>{Math.abs(stat.change)}%</span>
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">{stat.title}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 快捷入口 */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">报表中心</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickLink
            href="/reports/funnel"
            title="销售漏斗"
            description="查看各阶段转化情况"
            color="bg-blue-50 text-blue-600"
          />
          <QuickLink
            href="/reports/team-ranking"
            title="团队排名"
            description="销售业绩排行榜"
            color="bg-green-50 text-green-600"
          />
          <QuickLink
            href="/reports/forecast"
            title="收入预测"
            description="预测未来收入趋势"
            color="bg-purple-50 text-purple-600"
          />
          <QuickLink
            href="/reports/conversion"
            title="转化分析"
            description="分析阶段转化效率"
            color="bg-orange-50 text-orange-600"
          />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, title, description, color }: { href: string; title: string; description: string; color: string }) {
  return (
    <a
      href={href}
      className="block p-4 rounded-lg border hover:border-gray-300 hover:shadow-md transition-all"
    >
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <TrendingUp className="h-6 w-6" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </a>
  );
}
