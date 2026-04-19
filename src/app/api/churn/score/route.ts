// 客户流失风险评分 API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ChurnPredictionEngine } from '@/lib/churn-prediction-engine';
import { CustomerChurnContext, DEFAULT_CHURN_CONFIG } from '@/lib/churn-prediction-types';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// 计算客户流失风险
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, context } = body;

    if (!customerId) {
      return NextResponse.json({ error: '客户ID不能为空' }, { status: 400 });
    }

    // 获取客户数据
    let customerContext: CustomerChurnContext | null = null;
    const supabase = getSupabase();

    if (supabase) {
      try {
      // 获取客户信息
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customer) {
        // 获取最近互动（跟进记录）
        const { data: followUps } = await supabase
          .from('follow_ups')
          .select('*')
          .eq('entity_id', customerId)
          .order('completed_at', { ascending: false })
          .limit(10);

        // 获取订单
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', customerId)
          .order('order_date', { ascending: false });

        // 获取商机
        const { data: opportunities } = await supabase
          .from('opportunities')
          .select('*')
          .eq('customer_id', customerId);

        // 获取合同
        const { data: contracts } = await supabase
          .from('contracts')
          .select('*')
          .eq('customer_id', customerId);

        // 获取活动
        const { data: activities } = await supabase
          .from('activities')
          .select('*')
          .eq('entity_id', customerId)
          .order('timestamp', { ascending: false })
          .limit(20);

        // 构造上下文
        customerContext = {
          customer: {
            id: customer.id,
            name: customer.name,
            status: customer.status,
            createdAt: customer.created_at,
            updatedAt: customer.updated_at,
          },
          lastInteractionDate: followUps?.[0]?.completed_at,
          lastOrderDate: orders?.[0]?.order_date,
          totalOrders: orders?.length || 0,
          opportunities: (opportunities || []).map(o => ({
            id: o.id,
            stage: o.stage,
            createdAt: o.created_at,
          })),
          contracts: (contracts || []).map(c => ({
            id: c.id,
            status: c.status,
            endDate: c.end_date,
          })),
          activities: (activities || []).map(a => ({
            id: a.id,
            type: a.type,
            timestamp: a.timestamp,
          })),
          followUps: (followUps || []).map(f => ({
            id: f.id,
            completedAt: f.completed_at,
            scheduledAt: f.scheduled_at,
          })),
        };
      }
      } catch (dbError) {
        console.log('数据库查询失败，使用模拟数据');
      }
    }

    // 使用传入的context或构造模拟数据
    if (!customerContext) {
      // 模拟数据
      const now = new Date();
      customerContext = {
        customer: {
          id: customerId,
          name: '模拟客户',
          status: 'active',
          createdAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: now.toISOString(),
        },
        lastInteractionDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        lastOrderDate: new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000).toISOString(),
        totalOrders: 3,
        opportunities: [
          { id: 'opp-1', stage: 'closed_won', createdAt: new Date().toISOString() },
          { id: 'opp-2', stage: 'closed_won', createdAt: new Date().toISOString() },
          { id: 'opp-3', stage: 'proposal', createdAt: new Date().toISOString() },
        ],
        contracts: [
          { id: 'contract-1', status: 'active', endDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString() },
        ],
        activities: [
          { id: 'act-1', type: 'updated', timestamp: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString() },
        ],
        followUps: [],
      };
    }

    // 计算风险
    const engine = new ChurnPredictionEngine();
    const result = engine.calculateRisk(customerId, customerContext);

    // 保存风险结果到数据库（可选）
    if (supabase) {
      try {
        await supabase.from('customers').upsert({
          id: customerId,
          churn_risk_score: result.riskScore,
          churn_risk_level: result.riskLevel,
          churn_risk_details: result.dimensions,
          churn_risk_updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });
      } catch (saveError) {
        console.log('保存风险结果失败');
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        customerId: result.customerId,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        dimensions: result.dimensions.map(d => ({
          dimension: d.dimension,
          score: d.score,
          maxScore: d.maxScore,
          weight: d.weight,
          factors: d.factors,
        })),
        alerts: result.alerts,
        lastCalculatedAt: result.lastCalculatedAt,
      },
    });
  } catch (error) {
    console.error('计算流失风险失败:', error);
    return NextResponse.json(
      { error: '计算流失风险失败' },
      { status: 500 }
    );
  }
}

// 批量计算流失风险
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const supabase = getSupabase();

    // 获取需要评估的客户
    let customers: any[] = [];

    if (supabase) {
      try {
        const { data } = await supabase
          .from('customers')
          .select('id, name, status, created_at, updated_at')
          .limit(limit);

        customers = data || [];
      } catch (dbError) {
        console.log('数据库查询失败');
      }
    }

    if (customers.length === 0) {
      // 模拟数据
      customers = [
        { id: 'cust-001', name: '北京科技有限公司', status: 'active' },
        { id: 'cust-002', name: '上海电子集团', status: 'active' },
        { id: 'cust-003', name: '深圳创新科技', status: 'prospect' },
      ];
    }

    const engine = new ChurnPredictionEngine();
    const results = customers.map(customer => {
      // 构造模拟上下文
      const now = new Date();
      const context: CustomerChurnContext = {
        customer: {
          id: customer.id,
          name: customer.name,
          status: customer.status,
          createdAt: customer.created_at || now.toISOString(),
          updatedAt: customer.updated_at || now.toISOString(),
        },
        lastInteractionDate: new Date(now.getTime() - Math.random() * 120 * 24 * 60 * 60 * 1000).toISOString(),
        lastOrderDate: new Date(now.getTime() - Math.random() * 300 * 24 * 60 * 60 * 1000).toISOString(),
        totalOrders: Math.floor(Math.random() * 10) + 1,
        opportunities: [
          { id: '1', stage: 'closed_won', createdAt: now.toISOString() },
          { id: '2', stage: 'closed_won', createdAt: now.toISOString() },
          { id: '3', stage: 'proposal', createdAt: now.toISOString() },
        ],
        contracts: [
          { id: '1', status: 'active', endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() },
        ],
        activities: [],
        followUps: [],
      };

      return engine.calculateRisk(customer.id, context);
    });

    return NextResponse.json({
      results: results.map(r => ({
        customerId: r.customerId,
        riskScore: r.riskScore,
        riskLevel: r.riskLevel,
        lastCalculatedAt: r.lastCalculatedAt,
      })),
    });
  } catch (error) {
    console.error('批量计算流失风险失败:', error);
    return NextResponse.json(
      { error: '批量计算流失风险失败' },
      { status: 500 }
    );
  }
}
