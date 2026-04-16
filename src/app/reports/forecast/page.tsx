'use client';

import { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, Minus, LineChart } from 'lucide-react';
import type { ForecastReport, TimeRange } from '@/lib/report-types';

export default function ForecastReportPage() {
  const [report, setReport] = useState<ForecastReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('this_quarter');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?range=${timeRange}`)
      .then(res => res.json())
      .then(data => {
        setReport(data.forecast);
        setLoading(false);
      });
  }, [timeRange]);

  const exportCSV = () => {
    if (!report) return;
    
    const headers = ['月份', '乐观预测', '预期收入', '保守预测', '实际收入'];
    const rows = report.forecasts.map(f => [
      f.month,
      f.optimistic.toFixed(0),
      f.expected.toFixed(0),
      f.conservative.toFixed(0),
      f.actual?.toFixed(0) || '-'
    ]);
    
    // 添加汇总行
    rows.push(['', '', '', '', '']);
    rows.push(['汇总', report.totalOptimistic.toFixed(0), report.totalExpected.toFixed(0), report.totalConservative.toFixed(0), report.totalActual?.toFixed(0) || '-']);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `收入预测_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxValue = report 
    ? Math.max(...report.forecasts.map(f => Math.max(f.optimistic, f.expected, f.conservative, f.actual || 0)))
    : 1;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">收入预测</h1>
            <p className="text-gray-500 mt-1">基于历史数据和当前管道，预测未来收入</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value as TimeRange)}
              className="px-3 py-2 border rounded-md text-sm"
            >
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
            <div className="h-80 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : report ? (
        <>
          {/* 预测图 */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-6">预测趋势</h2>
            <div className="h-80">
              {/* 简化的柱状图 */}
              <div className="flex items-end justify-around h-full gap-4">
                {report.forecasts.map((forecast, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col-reverse gap-1">
                      {forecast.actual ? (
                        <div 
                          className="bg-green-500 rounded-t transition-all"
                          style={{ height: `${(forecast.actual / maxValue) * 200}px` }}
                        />
                      ) : null}
                      <div 
                        className="bg-blue-400 rounded-t transition-all"
                        style={{ height: `${(forecast.expected / maxValue) * 200}px`, opacity: forecast.actual ? 0.6 : 1 }}
                      />
                      <div 
                        className="bg-blue-300 rounded-t transition-all"
                        style={{ height: `${((forecast.optimistic - forecast.expected) / maxValue) * 200}px` }}
                      />
                      <div 
                        className="bg-blue-200 rounded-t transition-all"
                        style={{ height: `${((forecast.conservative - forecast.expected) / maxValue) * 200}px`, marginTop: '-2px' }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{forecast.month}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 图例 */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">实际收入</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-400 rounded"></div>
                <span className="text-sm">预期</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-300 rounded"></div>
                <span className="text-sm">乐观</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-200 rounded"></div>
                <span className="text-sm">保守</span>
              </div>
            </div>
          </div>

          {/* 预测统计 */}
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <p className="text-green-100 text-sm">实际收入</p>
              <p className="text-3xl font-bold mt-2">¥{((report.totalActual || 0) / 10000).toFixed(1)}万</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <p className="text-blue-100 text-sm">预期收入</p>
              <p className="text-3xl font-bold mt-2">¥{(report.totalExpected / 10000).toFixed(1)}万</p>
            </div>
            <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg shadow-lg p-6 text-white">
              <p className="text-blue-100 text-sm">乐观预测</p>
              <p className="text-3xl font-bold mt-2">¥{(report.totalOptimistic / 10000).toFixed(1)}万</p>
            </div>
            <div className="bg-gradient-to-br from-blue-300 to-blue-400 rounded-lg shadow-lg p-6 text-white">
              <p className="text-blue-100 text-sm">保守预测</p>
              <p className="text-3xl font-bold mt-2">¥{(report.totalConservative / 10000).toFixed(1)}万</p>
            </div>
          </div>

          {/* 预测说明 */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">预测说明</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-medium">乐观预测</span>
                </div>
                <p className="text-sm text-green-600">假设所有在谈商机都能成交</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <LineChart className="h-5 w-5" />
                  <span className="font-medium">预期预测</span>
                </div>
                <p className="text-sm text-blue-600">根据各阶段概率加权计算</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <Minus className="h-5 w-5" />
                  <span className="font-medium">保守预测</span>
                </div>
                <p className="text-sm text-gray-600">仅计算90%以上概率的商机</p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
