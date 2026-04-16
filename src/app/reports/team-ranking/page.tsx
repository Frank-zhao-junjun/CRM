'use client';

import { useState, useEffect } from 'react';
import { Download, Trophy, TrendingUp, TrendingDown, Users } from 'lucide-react';
import type { TeamRankingReport, TimeRange } from '@/lib/report-types';

export default function TeamRankingPage() {
  const [report, setReport] = useState<TeamRankingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('this_month');
  const [sortBy, setSortBy] = useState<'closedAmount' | 'newOpportunities' | 'conversionRate'>('closedAmount');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?range=${timeRange}`)
      .then(res => res.json())
      .then(data => {
        setReport(data.teamRanking);
        setLoading(false);
      });
  }, [timeRange]);

  const exportCSV = () => {
    if (!report) return;
    
    const headers = ['排名', '姓名', '成交金额', '新商机', '转化率', '环比增长'];
    const rows = report.members.map(m => [
      m.rank.toString(),
      m.userName,
      m.closedAmount.toString(),
      m.newOpportunities.toString(),
      `${m.conversionRate.toFixed(1)}%`,
      `${m.growthRate >= 0 ? '+' : ''}${m.growthRate.toFixed(1)}%`
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `团队排名_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortedMembers = report?.members 
    ? [...report.members].sort((a, b) => {
        if (sortBy === 'closedAmount') return b.closedAmount - a.closedAmount;
        if (sortBy === 'newOpportunities') return b.newOpportunities - a.newOpportunities;
        return b.conversionRate - a.conversionRate;
      }).map((m, idx) => ({ ...m, rank: idx + 1 }))
    : [];

  const topPerformer = sortedMembers[0];
  const avgPerformance = report?.members 
    ? {
        avgAmount: report.members.reduce((sum, m) => sum + m.closedAmount, 0) / report.members.length,
        avgConversion: report.members.reduce((sum, m) => sum + m.conversionRate, 0) / report.members.length
      }
    : { avgAmount: 0, avgConversion: 0 };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">团队业绩排行</h1>
            <p className="text-gray-500 mt-1">销售团队成员业绩排名，激励良性竞争</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value as TimeRange)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="this_month">本月</option>
              <option value="last_month">上月</option>
              <option value="this_quarter">本季度</option>
              <option value="this_year">本年</option>
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
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      ) : report ? (
        <>
          {/* 冠军卡片 */}
          {topPerformer && (
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Trophy className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">本月销冠</p>
                    <p className="text-2xl font-bold">{topPerformer.userName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">¥{(topPerformer.closedAmount / 10000).toFixed(1)}万</p>
                  <p className="text-white/80">成交金额</p>
                </div>
              </div>
            </div>
          )}

          {/* 排序选项 */}
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">排序：</span>
              <button
                onClick={() => setSortBy('closedAmount')}
                className={`px-3 py-1 rounded-md text-sm ${sortBy === 'closedAmount' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                成交金额
              </button>
              <button
                onClick={() => setSortBy('newOpportunities')}
                className={`px-3 py-1 rounded-md text-sm ${sortBy === 'newOpportunities' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                新商机数
              </button>
              <button
                onClick={() => setSortBy('conversionRate')}
                className={`px-3 py-1 rounded-md text-sm ${sortBy === 'conversionRate' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                转化率
              </button>
            </div>
          </div>

          {/* 排名列表 */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="divide-y">
              {sortedMembers.map((member) => (
                <div key={member.userId} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                  {/* 排名 */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    member.rank === 1 ? 'bg-yellow-100 text-yellow-600' :
                    member.rank === 2 ? 'bg-gray-100 text-gray-600' :
                    member.rank === 3 ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {member.rank <= 3 ? <Trophy className="h-5 w-5" /> : member.rank}
                  </div>
                  
                  {/* 姓名 */}
                  <div className="w-32">
                    <p className="font-medium">{member.userName}</p>
                  </div>
                  
                  {/* 成交金额 */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">成交金额</span>
                      <span className="font-semibold">¥{member.closedAmount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min((member.closedAmount / (topPerformer?.closedAmount || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* 新商机 */}
                  <div className="w-24 text-center">
                    <p className="text-2xl font-bold">{member.newOpportunities}</p>
                    <p className="text-xs text-gray-500">新商机</p>
                  </div>
                  
                  {/* 转化率 */}
                  <div className="w-24 text-center">
                    <p className="text-2xl font-bold text-green-600">{member.conversionRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">转化率</p>
                  </div>
                  
                  {/* 环比增长 */}
                  <div className={`w-24 text-right flex items-center justify-end gap-1 ${member.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {member.growthRate >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="font-medium">{member.growthRate >= 0 ? '+' : ''}{member.growthRate.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 平均水平 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <p className="text-sm text-gray-500">团队平均成交</p>
              <p className="text-3xl font-bold mt-2">¥{(avgPerformance.avgAmount / 10000).toFixed(1)}万</p>
            </div>
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <p className="text-sm text-gray-500">团队平均转化</p>
              <p className="text-3xl font-bold mt-2 text-green-600">{avgPerformance.avgConversion.toFixed(1)}%</p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
