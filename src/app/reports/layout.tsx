import { Briefcase, TrendingUp, Users, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-6 h-full">
      {/* 报表导航 */}
      <div className="w-64 shrink-0">
        <div className="bg-white rounded-lg border shadow-sm p-4 sticky top-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            报表中心
          </h2>
          <nav className="space-y-1">
            <Link
              href="/reports"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
            >
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span>数据概览</span>
            </Link>
            <Link
              href="/reports/funnel"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
            >
              <Briefcase className="h-4 w-4 text-gray-500" />
              <span>销售漏斗</span>
            </Link>
            <Link
              href="/reports/team-ranking"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
            >
              <Users className="h-4 w-4 text-gray-500" />
              <span>团队排名</span>
            </Link>
            <Link
              href="/reports/forecast"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
            >
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span>收入预测</span>
            </Link>
            <Link
              href="/reports/conversion"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
            >
              <BarChart3 className="h-4 w-4 text-gray-500" />
              <span>转化分析</span>
            </Link>
          </nav>
        </div>
      </div>
      
      {/* 报表内容 */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
