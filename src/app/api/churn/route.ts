import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import {
  analyzeChurnRisk,
  ChurnSignals,
  ChurnAnalysis,
  ChurnAlert,
  ChurnAlertStatus,
} from '@/lib/churn-prediction';

// 获取客户流失信号
async function getCustomerChurnSignals(customerId: string): Promise<ChurnSignals | null> {
  const supabase = await getSupabaseClient();
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  // 获取客户信息
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .maybeSingle();

  if (!customer) return null;

  // 并行获取各项数据
  const [
    activitiesResult,
    followUpsResult,
    ordersResult,
    opportunitiesResult,
    contractsResult,
  ] = await Promise.all([
    // 最近互动
    supabase
      .from('activities')
      .select('timestamp')
      .eq('entity_id', customerId)
      .order('timestamp', { ascending: false })
      .limit(30),
    
    // 跟进记录
    supabase
      .from('follow_ups')
      .select('completed_at, created_at')
      .eq('entity_id', customerId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(30),
    
    // 订单
    supabase
      .from('orders')
      .select('order_date, total, status, delivery_date')
      .eq('customer_id', customerId)
      .gte('order_date', sixMonthsAgo.toISOString()),
    
    // 商机
    supabase
      .from('opportunities')
      .select('stage, value')
      .eq('customer_id', customerId),
    
    // 合同
    supabase
      .from('contracts')
      .select('expiration_date')
      .eq('customer_id', customerId)
      .maybeSingle(),
  ]);

  // 计算最后互动天数
  let lastInteractionDays = 365;
  const allTimestamps: Date[] = [];
  
  if (activitiesResult.data) {
    activitiesResult.data.forEach(a => allTimestamps.push(new Date(a.timestamp)));
  }
  if (followUpsResult.data) {
    followUpsResult.data.forEach(f => {
      if (f.completed_at) allTimestamps.push(new Date(f.completed_at));
      else allTimestamps.push(new Date(f.created_at));
    });
  }
  
  if (allTimestamps.length > 0) {
    const latestInteraction = new Date(Math.max(...allTimestamps.map(d => d.getTime())));
    lastInteractionDays = Math.ceil((now.getTime() - latestInteraction.getTime()) / (1000 * 60 * 60 * 24));
  }

  // 计算最近3个月vs之前3个月的互动频率变化
  const recentInteractions = allTimestamps.filter(d => d >= threeMonthsAgo).length;
  const olderInteractions = allTimestamps.filter(d => d >= sixMonthsAgo && d < threeMonthsAgo).length;
  const interactionFrequencyChange = olderInteractions > 0 
    ? ((recentInteractions - olderInteractions) / olderInteractions) * 100 
    : 0;
  const interactionTrend = interactionFrequencyChange > 10 ? 'up' : interactionFrequencyChange < -10 ? 'down' : 'stable';

  // 计算最后购买天数和收入趋势
  let lastPurchaseDays = 365;
  let totalRevenue = 0;
  let recentRevenue = 0;
  let olderRevenue = 0;
  
  if (ordersResult.data) {
    ordersResult.data.forEach(order => {
      if (order.order_date) {
        const orderDate = new Date(order.order_date);
        const revenue = parseFloat(order.total || '0');
        totalRevenue += revenue;
        
        if (orderDate >= threeMonthsAgo) {
          recentRevenue += revenue;
        } else if (orderDate >= sixMonthsAgo) {
          olderRevenue += revenue;
        }
        
        if (orderDate < now && orderDate < new Date(lastPurchaseDays * 24 * 60 * 60 * 1000)) {
          lastPurchaseDays = Math.ceil((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      }
    });
  }

  const revenueChangePercent = olderRevenue > 0 
    ? ((recentRevenue - olderRevenue) / olderRevenue) * 100 
    : 0;
  const revenueTrend = revenueChangePercent > 10 ? 'up' : revenueChangePercent < -10 ? 'down' : 'stable';

  // 订单频次趋势
  const recentOrders = ordersResult.data?.filter(o => new Date(o.order_date) >= threeMonthsAgo).length || 0;
  const olderOrders = ordersResult.data?.filter(o => {
    const d = new Date(o.order_date);
    return d >= sixMonthsAgo && d < threeMonthsAgo;
  }).length || 0;
  const orderCountChange = olderOrders > 0 
    ? ((recentOrders - olderOrders) / olderOrders) * 100 
    : 0;
  const orderCountTrend = orderCountChange > 10 ? 'up' : orderCountChange < -10 ? 'down' : 'stable';

  // 进行中商机数
  const activeOpportunities = opportunitiesResult.data?.filter(o => 
    o.stage !== 'closed_won' && o.stage !== 'closed_lost'
  ).length || 0;

  // 商机丢失
  const opportunityLoss = opportunitiesResult.data?.some(o => o.stage === 'closed_lost') || false;

  // 付款延迟
  let paymentDelayDays = 0;
  let hasOverduePayments = false;
  const ordersWithDelay = ordersResult.data?.filter(o => 
    o.status === 'awaiting_payment' && o.delivery_date && new Date(o.delivery_date) < now
  ) || [];
  
  if (ordersWithDelay.length > 0) {
    hasOverduePayments = true;
    paymentDelayDays = Math.max(...ordersWithDelay.map(o => 
      Math.ceil((now.getTime() - new Date(o.delivery_date).getTime()) / (1000 * 60 * 60 * 24))
    ));
  }

  // 合同到期天数
  let contractDaysToExpire = -1;
  if (contractsResult.data?.expiration_date) {
    const expDate = new Date(contractsResult.data.expiration_date);
    contractDaysToExpire = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // 产品使用率 (简化为基于订单频率)
  const productUsageRate = Math.min(100, Math.max(0, (totalRevenue / 100000) * 100));

  return {
    lastInteractionDays,
    interactionTrend,
    interactionFrequencyChange,
    lastPurchaseDays,
    revenueTrend,
    revenueChangePercent,
    orderCountTrend,
    orderCountChange,
    activeOpportunities,
    opportunityLoss,
    paymentDelayDays,
    hasOverduePayments,
    supportTicketsCount: 0, // 暂无工单系统
    complaintRate: 0,
    contractDaysToExpire,
    productUsageRate,
  };
}

// 分析所有客户流失风险
async function analyzeAllCustomersChurnRisk(): Promise<ChurnAnalysis[]> {
  const supabase = await getSupabaseClient();
  
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, company')
    .order('name');

  if (!customers) return [];

  const analyses: ChurnAnalysis[] = [];

  for (const customer of customers) {
    const signals = await getCustomerChurnSignals(customer.id);
    if (signals) {
      const analysis = analyzeChurnRisk({
        customerId: customer.id,
        customerName: customer.name,
        company: customer.company,
        signals,
      });
      analyses.push(analysis);
    }
  }

  // 按流失风险排序
  return analyses.sort((a, b) => b.churnScore - a.churnScore);
}

// 获取流失预警统计
function getChurnStats(analyses: ChurnAnalysis[]) {
  return {
    totalCustomers: analyses.length,
    criticalCount: analyses.filter(a => a.riskLevel === 'critical').length,
    highCount: analyses.filter(a => a.riskLevel === 'high').length,
    mediumCount: analyses.filter(a => a.riskLevel === 'medium').length,
    lowCount: analyses.filter(a => a.riskLevel === 'low').length,
    averageChurnScore: analyses.length > 0 
      ? Math.round(analyses.reduce((sum, a) => sum + a.churnScore, 0) / analyses.length)
      : 0,
    topTriggers: getTopTriggers(analyses),
  };
}

// 获取主要触发因素
function getTopTriggers(analyses: ChurnAnalysis[]) {
  const triggerCounts: Record<string, number> = {};
  
  analyses.forEach(a => {
    a.triggers.forEach(t => {
      triggerCounts[t.type] = (triggerCounts[t.type] || 0) + 1;
    });
  });

  return Object.entries(triggerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));
}

// GET /api/churn
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const customerId = searchParams.get('customerId');
  const alertId = searchParams.get('alertId');

  try {
    // 获取单个客户流失分析
    if (customerId && action === 'analyze') {
      const signals = await getCustomerChurnSignals(customerId);
      if (!signals) {
        return NextResponse.json({ success: false, error: '客户不存在' }, { status: 404 });
      }

      const supabase = await getSupabaseClient();
      const { data: customer } = await supabase
        .from('customers')
        .select('id, name, company')
        .eq('id', customerId)
        .maybeSingle();

      const analysis = analyzeChurnRisk({
        customerId,
        customerName: customer?.name || '',
        company: customer?.company || '',
        signals,
      });

      return NextResponse.json({ success: true, data: analysis });
    }

    // 获取统计信息
    if (action === 'stats') {
      const analyses = await analyzeAllCustomersChurnRisk();
      const stats = getChurnStats(analyses);
      return NextResponse.json({ success: true, data: stats });
    }

    // 获取所有客户流失分析
    const analyses = await analyzeAllCustomersChurnRisk();
    return NextResponse.json({ success: true, data: analyses });

  } catch (error) {
    console.error('获取流失预警失败:', error);
    return NextResponse.json(
      { success: false, error: '获取流失预警失败' },
      { status: 500 }
    );
  }
}

// PATCH /api/churn - 更新预警状态
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, status } = body;

    // 更新预警状态逻辑 (如果有预警表)
    // 这里暂时返回成功
    return NextResponse.json({ 
      success: true, 
      data: { alertId, status, updatedAt: new Date().toISOString() } 
    });

  } catch (error) {
    console.error('更新预警状态失败:', error);
    return NextResponse.json(
      { success: false, error: '更新预警状态失败' },
      { status: 500 }
    );
  }
}
