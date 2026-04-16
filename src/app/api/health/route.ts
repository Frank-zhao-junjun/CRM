import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import {
  calculateCustomerHealthScore,
  CustomerHealthScore,
  HealthStats,
} from '@/lib/health-score';

// 获取客户最近一次互动时间
async function getLastInteractionDate(supabase: Awaited<ReturnType<typeof getSupabaseClient>>, customerId: string): Promise<number> {
  const now = new Date();

  // 查询活动记录
  const { data: activities } = await supabase
    .from('activities')
    .select('timestamp')
    .eq('entity_id', customerId)
    .order('timestamp', { ascending: false })
    .limit(1);

  // 查询跟进记录
  const { data: followUps } = await supabase
    .from('follow_ups')
    .select('completed_at, scheduled_at, created_at')
    .eq('entity_id', customerId)
    .is('deleted_at', null)
    .order('completed_at', { ascending: false })
    .limit(1);

  let latestDate: Date | null = null;

  if (activities && activities.length > 0) {
    latestDate = new Date(activities[0].timestamp);
  }

  if (followUps && followUps.length > 0) {
    const followUpDate = followUps[0].completed_at 
      ? new Date(followUps[0].completed_at)
      : followUps[0].scheduled_at
        ? new Date(followUps[0].scheduled_at)
        : new Date(followUps[0].created_at);
    
    if (!latestDate || followUpDate > latestDate) {
      latestDate = followUpDate;
    }
  }

  if (!latestDate) {
    return 365;
  }

  const diffTime = Math.abs(now.getTime() - latestDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 获取客户年度销售金额
async function getAnnualSalesAmount(supabase: Awaited<ReturnType<typeof getSupabaseClient>>, customerId: string): Promise<number> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const { data, error } = await supabase
    .from('orders')
    .select('total')
    .eq('customer_id', customerId)
    .gte('order_date', oneYearAgo.toISOString())
    .in('status', ['completed', 'paid']);

  if (error || !data) return 0;

  return data.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0);
}

// 获取客户年度订单数
async function getAnnualOrderCount(supabase: Awaited<ReturnType<typeof getSupabaseClient>>, customerId: string): Promise<number> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .gte('order_date', oneYearAgo.toISOString())
    .in('status', ['completed', 'paid']);

  return error ? 0 : (count || 0);
}

// 获取客户进行中商机数
async function getActiveOpportunityCount(supabase: Awaited<ReturnType<typeof getSupabaseClient>>, customerId: string): Promise<number> {
  const { count, error } = await supabase
    .from('opportunities')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .not('stage', 'eq', 'closed_won')
    .not('stage', 'eq', 'closed_lost');

  return error ? 0 : (count || 0);
}

// 获取客户逾期率
async function getOverdueInfo(supabase: Awaited<ReturnType<typeof getSupabaseClient>>, customerId: string): Promise<{ rate: number; hasOverdue: boolean }> {
  const { data, error } = await supabase
    .from('orders')
    .select('status, delivery_date')
    .eq('customer_id', customerId)
    .in('status', ['completed', 'paid', 'awaiting_payment']);

  if (error || !data || data.length === 0) {
    return { rate: 0, hasOverdue: false };
  }

  const now = new Date();
  let overdueCount = 0;

  for (const order of data) {
    if (order.status === 'awaiting_payment' && order.delivery_date) {
      const deliveryDate = new Date(order.delivery_date);
      if (deliveryDate < now) {
        overdueCount++;
      }
    }
  }

  const rate = (overdueCount / data.length) * 100;
  return { rate, hasOverdue: overdueCount > 0 };
}

// 获取单个客户健康度评分
async function getCustomerHealthScore(supabase: Awaited<ReturnType<typeof getSupabaseClient>>, customerId: string): Promise<CustomerHealthScore | null> {
  const { data: customer, error } = await supabase
    .from('customers')
    .select('id, name, company')
    .eq('id', customerId)
    .maybeSingle();

  if (error || !customer) return null;

  const [daysSinceLastInteraction, annualSalesAmount, annualOrderCount, activeOpportunityCount, overdueInfo] = await Promise.all([
    getLastInteractionDate(supabase, customerId),
    getAnnualSalesAmount(supabase, customerId),
    getAnnualOrderCount(supabase, customerId),
    getActiveOpportunityCount(supabase, customerId),
    getOverdueInfo(supabase, customerId),
  ]);

  return calculateCustomerHealthScore({
    customerId: customer.id,
    customerName: customer.name,
    company: customer.company,
    daysSinceLastInteraction,
    annualSalesAmount,
    annualOrderCount,
    activeOpportunityCount,
    overdueRate: overdueInfo.rate,
    hasOverduePayments: overdueInfo.hasOverdue,
  });
}

// 获取所有客户健康度评分
async function getAllCustomerHealthScores(supabase: Awaited<ReturnType<typeof getSupabaseClient>>): Promise<CustomerHealthScore[]> {
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, company')
    .order('name');

  if (error || !customers) return [];

  const scores = await Promise.all(
    customers.map(async (customer) => {
      const [daysSinceLastInteraction, annualSalesAmount, annualOrderCount, activeOpportunityCount, overdueInfo] = await Promise.all([
        getLastInteractionDate(supabase, customer.id),
        getAnnualSalesAmount(supabase, customer.id),
        getAnnualOrderCount(supabase, customer.id),
        getActiveOpportunityCount(supabase, customer.id),
        getOverdueInfo(supabase, customer.id),
      ]);

      return calculateCustomerHealthScore({
        customerId: customer.id,
        customerName: customer.name,
        company: customer.company,
        daysSinceLastInteraction,
        annualSalesAmount,
        annualOrderCount,
        activeOpportunityCount,
        overdueRate: overdueInfo.rate,
        hasOverduePayments: overdueInfo.hasOverdue,
      });
    })
  );

  return scores.sort((a, b) => b.totalScore - a.totalScore);
}

// 获取健康度统计信息
async function getHealthStats(supabase: Awaited<ReturnType<typeof getSupabaseClient>>): Promise<HealthStats> {
  const scores = await getAllCustomerHealthScores(supabase);

  const distribution = {
    healthy: scores.filter(s => s.level === 'healthy').length,
    good: scores.filter(s => s.level === 'good').length,
    fair: scores.filter(s => s.level === 'fair').length,
    risk: scores.filter(s => s.level === 'risk').length,
  };

  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length)
    : 0;

  const highRiskCustomers = scores.filter(s => s.level === 'risk' || s.totalScore < 40).slice(0, 5);
  const topCustomers = scores.slice(0, 10);

  return {
    totalCustomers: scores.length,
    averageScore,
    distribution,
    highRiskCustomers,
    topCustomers,
  };
}

// GET /api/health
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const customerId = searchParams.get('customerId');

  try {
    const supabase = await getSupabaseClient();

    // 获取单个客户健康度
    if (customerId) {
      const score = await getCustomerHealthScore(supabase, customerId);
      if (!score) {
        return NextResponse.json({ success: false, error: '客户不存在' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: score });
    }

    // 获取统计数据
    if (action === 'stats') {
      const stats = await getHealthStats(supabase);
      return NextResponse.json({ success: true, data: stats });
    }

    // 获取所有客户健康度列表
    const scores = await getAllCustomerHealthScores(supabase);
    return NextResponse.json({ success: true, data: scores });

  } catch (error) {
    console.error('获取健康度评分失败:', error);
    return NextResponse.json(
      { success: false, error: '获取健康度评分失败' },
      { status: 500 }
    );
  }
}
