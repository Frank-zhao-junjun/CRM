'use client';

import { useState, useEffect } from 'react';
import { Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { ConversionReport, TimeRange } from '@/lib/report-types';

export default function ConversionReportPage() {
  const [report, setReport] = useState<ConversionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('this_month');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?range=${timeRange}`)
      .then(res => res.json())
      .then(data => {
        setReport(data.conversion);
        setLoading(false);
      });
  }, [timeRange]);

  const exportCSV = () => {
    if (!report) return;
    
    const headers = ['阶段', '进入数量', '转化数量', '转化率', '平均停留天数', '瓶颈'];
    const rows = report.metrics.map(m => [
      m.label,
      m.enteredCount.toString(),
      m.convertedCount.toString(),
      `${m.conversionRate.toFixed(1)}%`,
      `${m.avgStayDays}天`,
      m.isBottleneck ? '是' : '否'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `转化分析_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bottlenecks = report?.metrics.filter(m => m.isBottleneck) || [];
  const avgConversion = report?.metrics 
    ? report.metrics.filter(m => m.enteredCount > 0)
        .reduce((sum, m) => sum + m.conversionRate, 0) / 
      report.metrics.filter(m => m.enteredCount > 0).length 
    : 0;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">阶段转化分析</h1>
            <p className="text-gray-500 mt-1">分析各阶段的转化效率，找出瓶颈</p>
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
          {/* 预警卡片 */}
          {bottlenecks.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">检测到瓶颈阶段</span>
              </div>
              <p className="text-sm text-red-600">
                以下阶段转化率低于30%，建议重点关注：
                {bottlenecks.map(b => b.label).join('、')}
              </p>
            </div>
          )}

          {/* 转化率柱状图 */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-6">各阶段转化率</h2>
            <div className="h-64 flex items-end justify-around gap-4">
              {report.metrics.map((metric) => (
                <div key={metric.stage} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center gap-1">
                    <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '180px' }}>
                      <div 
                        className={`absolute bottom-0 w-full rounded-t transition-all ${
                          metric.isBottleneck ? 'bg-red-400' : 
                          metric.conversionRate >= 50 ? 'bg-green-400' : 'bg-blue-400'
                        }`}
                        style={{ height: `${metric.conversionRate}%` }}
                      />
                      {/* 数值 */}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                        <span className={`font-bold ${metric.isBottleneck ? 'text-red-600' : 'text-gray-700'}`}>
                          {metric.conversionRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{metric.label}</p>
                  {metric.isBottleneck && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded mt-1">瓶颈</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 平均停留时间 */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">各阶段平均停留时间</h2>
            <div className="space-y-4">
              {report.metrics.map((metric) => (
                <div key={metric.stage} className="flex items-center gap-4">
                  <div className="w-24 text-sm">{metric.label}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div 
                      className={`h-full rounded-full flex items-center justify-end pr-2 ${
                        metric.avgStayDays > 15 ? 'bg-red-400' : 
                        metric.avgStayDays > 10 ? 'bg-yellow-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${Math.min((metric.avgStayDays / 20) * 100, 100)}%` }}
                    >
                      <span className="text-xs text-white font-medium">{metric.avgStayDays}天</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span>平均转化率</span>
              </div>
              <p className={`text-3xl font-bold ${avgConversion >= 50 ? 'text-green-600' : 'text-yellow-600'}`}>
                {avgConversion.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span>瓶颈阶段</span>
              </div>
              <p className="text-3xl font-bold text-red-600">
                {bottlenecks.length}
              </p>
            </div>
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Clock className="h-5 w-5" />
                <span>平均停留时间</span>
              </div>
              <p className="text-3xl font-bold">
                {(report.metrics.reduce((sum, m) => sum + m.avgStayDays, 0) / report.metrics.length).toFixed(0)}天
              </p>
            </div>
          </div>

          {/* 详细表格 */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">转化详情</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm text-gray-500">阶段</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-500">进入数</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-500">转化数</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-500">转化率</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-500">平均停留</th>
                  <th className="text-center py-3 px-4 text-sm text-gray-500">状态</th>
                </tr>
              </thead>
              <tbody>
                {report.metrics.map((metric) => (
                  <tr key={metric.stage} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{metric.label}</td>
                    <td className="text-right py-3 px-4">{metric.enteredCount}</td>
                    <td className="text-right py-3 px-4">{metric.convertedCount}</td>
                    <td className={`text-right py-3 px-4 font-medium ${
                      metric.conversionRate >= 50 ? 'text-green-600' : 
                      metric.conversionRate >= 30 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {metric.conversionRate.toFixed(1)}%
                    </td>
                    <td className={`text-right py-3 px-4 ${
                      metric.avgStayDays > 15 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {metric.avgStayDays}天
                    </td>
                    <td className="text-center py-3 px-4">
                      {metric.isBottleneck ? (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">瓶颈</span>
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      )}
                    </td>
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
