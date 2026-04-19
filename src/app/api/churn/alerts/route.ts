// 流失预警列表 API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// 模拟预警数据（用于演示）
function getMockAlerts() {
  const now = new Date();
  return [
    {
      id: 'alert-1',
      customerId: 'cust-001',
      customerName: '北京科技有限公司',
      type: 'high_risk' as const,
      title: '客户流失风险升高',
      message: '客户流失风险评分为 85 分（高风险），主要风险因素：超过90天无互动、超过180天无订单。请尽快安排跟进。',
      riskScore: 85,
      riskLevel: 'high' as const,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: false,
      isDismissed: false,
    },
    {
      id: 'alert-2',
      customerId: 'cust-002',
      customerName: '上海电子集团',
      type: 'contract_expiring' as const,
      title: '合同即将到期',
      message: '客户合同将在30天内到期，请及时处理续约事宜。',
      riskScore: 72,
      riskLevel: 'high' as const,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      isRead: false,
      isDismissed: false,
    },
    {
      id: 'alert-3',
      customerId: 'cust-003',
      customerName: '深圳创新科技',
      type: 'no_activity' as const,
      title: '长时间无互动',
      message: '客户已超过60天无互动记录，建议主动联系。',
      riskScore: 55,
      riskLevel: 'medium' as const,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      isDismissed: false,
    },
    {
      id: 'alert-4',
      customerId: 'cust-004',
      customerName: '广州制造业公司',
      type: 'high_risk' as const,
      title: '商机转化率过低',
      message: '客户商机转化率低于5%，存在流失风险。',
      riskScore: 68,
      riskLevel: 'medium' as const,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      isDismissed: false,
    },
  ];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const riskLevel = searchParams.get('riskLevel');
    const search = searchParams.get('search');
    const supabase = getSupabase();

    // 尝试从数据库获取预警
    if (supabase) {
      try {
        let query = supabase
          .from('churn_alerts')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (riskLevel && riskLevel !== 'all') {
          query = query.eq('risk_level', riskLevel);
        }
        if (search) {
          query = query.ilike('customer_name', `%${search}%`);
        }

        const { data, count, error } = await query.range(
          (page - 1) * pageSize,
          page * pageSize - 1
        );

        if (!error && data) {
          return NextResponse.json({
            alerts: data.map(row => ({
              id: row.id,
              customerId: row.customer_id,
              customerName: row.customer_name,
              type: row.alert_type,
              title: row.title,
              message: row.message,
              riskScore: row.risk_score,
              riskLevel: row.risk_level,
              createdAt: row.created_at,
              isRead: row.is_read,
              isDismissed: row.is_dismissed,
            })),
            total: count || 0,
            page,
            pageSize,
          });
        }
      } catch (dbError) {
        console.log('数据库查询失败，使用模拟数据:', dbError);
      }
    }

    // 使用模拟数据
    let alerts = getMockAlerts();
    
    if (riskLevel && riskLevel !== 'all') {
      alerts = alerts.filter(a => a.riskLevel === riskLevel);
    }
    if (search) {
      alerts = alerts.filter(a => 
        a.customerName.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = alerts.length;
    const paginatedAlerts = alerts.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({
      alerts: paginatedAlerts,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('获取流失预警失败:', error);
    return NextResponse.json(
      { error: '获取流失预警失败' },
      { status: 500 }
    );
  }
}
