'use client';

import { useState, useEffect } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import type { FunnelReport, TimeRange } from '@/lib/report-types';

export default function FunnelReportPage() {
  const [report, setReport] = useState<FunnelReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('this_month');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?range=${timeRange}`)
      .then(res => res.json())
      .then(data => {
        setReport(data.funnel);
        setLoading(false);
      });
  }, [timeRange]);

  const exportCSV = () => {
    if (!report) return;
    
    const headers = ['阶段', '标签', '数量', '金额', '转化率'];
    const rows = report.stages.map(s => [
      s.stage,
      s.label,
      s.count.toString(),
      s.amount.toString(),
      `${s.conversionRate.toFixed(1)}%`
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `销售漏斗_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxCount = Math.max(...(report?.stages.map(s => s.count) || [1]));
  const maxAmount = Math.max(...(report?.stages.map(s => s.amount) || [1]));

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">销售漏斗分析</h1>
            <p className="text-gray-500 mt-1">可视化展示从线索到成交各阶段的转化情况</p>
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
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : report ? (
        <>
          {/* 漏斗图 */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-6">转化漏斗</h2>
            <div className="space-y-4">
              {report.stages.map((stage, idx) => {
                const widthPercent = (stage.count / maxCount) * 100;
                const isBottleneck = stage.conversionRate < 30 && idx > 0 && idx < report.stages.length - 1;
                
                return (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center gap-4">
                      <div className="w-24 text-sm text-gray-600">{stage.label}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-12 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isBottleneck ? 'bg-red-400' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.max(widthPercent, 5)}%` }}
                        />
                      </div>
                      <div className="w-32 text-right">
                        <span className="font-semibold">{stage.count}</span>
                        <span className="text-gray-500 ml-2">¥{(stage.amount / 10000).toFixed(1)}万</span>
                      </div>
                      <div className={`w-20 text-right ${isBottleneck ? 'text-red-600' : 'text-green-600'}`}>
                        {stage.conversionRate.toFixed(1)}%
                      </div>
                    </div>
                    {isBottleneck && (
                      <div className="absolute right-0 top-0 transform -translate-y-full">
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">瓶颈</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 数据统计 */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <p className="text-sm text-gray-500">总数量</p>
              <p className="text-3xl font-bold mt-2">{report.totalCount}</p>
              <p className="text-sm text-gray-500 mt-1">个商机</p>
            </div>
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <p className="text-sm text-gray-500">总金额</p>
              <p className="text-3xl font-bold mt-2">¥{(report.totalAmount / 10000).toFixed(1)}万</p>
              <p className="text-sm text-gray-500 mt-1">管道价值</p>
            </div>
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <p className="text-sm text-gray-500">整体转化率</p>
              <p className={`text-3xl font-bold mt-2 ${report.overallConversionRate < 10 ? 'text-red-600' : 'text-green-600'}`}>
                {report.overallConversionRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 mt-1">线索到成交</p>
            </div>
          </div>

          {/* 阶段详情表 */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">阶段详情</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm text-gray-500">阶段</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-500">数量</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-500">金额</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-500">转化率</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-500">占比</th>
                </tr>
              </thead>
              <tbody>
                {report.stages.map((stage) => (
                  <tr key={stage.stage} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{stage.label}</td>
                    <td className="text-right py-3 px-4">{stage.count}</td>
                    <td className="text-right py-3 px-4">¥{stage.amount.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 text-green-600">{stage.conversionRate.toFixed(1)}%</td>
                    <td className="text-right py-3 px-4">{((stage.count / report.totalCount) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
