import { NextRequest, NextResponse } from 'next/server';
import { getMockData } from '@/lib/crm-database';

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

// GET - 获取客户流失数据
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get('range') || 'month';
  
  const data = getMockData();
  
  // 计算流失率（基于当前客户）
  const totalCustomers = data.customers.length;
  const churnedCustomers = data.customers.filter(c => c.status === 'churned').length;
  const churnRate = totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0;
  
  // 识别高风险客户（基于跟进记录活跃度）
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const atRiskCustomers: AtRiskCustomer[] = data.customers
    .filter(c => c.status === 'active')
    .slice(0, 10)
    .map((c, idx) => {
      const lastFollowUp = data.followUps.find(f => f.customerId === c.id);
      const daysSinceLastActivity = lastFollowUp 
        ? Math.floor((Date.now() - new Date(lastFollowUp.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 60;
      
      let risk: 'high' | 'medium' | 'low' = 'low';
      let engagement = 80;
      let reason = '偶发低活跃';
      
      if (daysSinceLastActivity > 30) {
        risk = 'high';
        engagement = Math.floor(Math.random() * 20 + 10);
        reason = '长期无互动';
      } else if (daysSinceLastActivity > 14) {
        risk = 'medium';
        engagement = Math.floor(Math.random() * 20 + 30);
        reason = '使用频率下降';
      } else if (daysSinceLastActivity > 7) {
        risk = 'low';
        engagement = Math.floor(Math.random() * 20 + 50);
        reason = '活跃度轻微下降';
      }
      
      return {
        id: c.id,
        name: c.name,
        risk,
        lastActivity: `${daysSinceLastActivity}天前`,
        engagement,
        reason,
      };
    })
    .filter(c => c.risk !== 'low')
    .slice(0, 5);

  // 生成流失趋势数据
  const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
  const churnTrend: ChurnTrend[] = months.map((month, idx) => ({
    month,
    churned: Math.floor(Math.random() * 15 + 10),
    recovered: Math.floor(Math.random() * 8 + 3),
    atRisk: Math.floor(Math.random() * 15 + 20),
  }));

  const metrics: ChurnMetrics = {
    churnRate: Math.round(churnRate * 10) / 10,
    churnRateChange: Math.round((Math.random() * 6 - 3) * 10) / 10, // -3 to +3
    atRiskCount: atRiskCustomers.length,
    churnedCount: churnedCustomers,
    recoveredCount: Math.floor(churnedCustomers * 0.27),
    recoveryRate: 26.9,
  };

  return NextResponse.json({
    metrics,
    atRiskCustomers,
    trend: churnTrend,
  });
}
