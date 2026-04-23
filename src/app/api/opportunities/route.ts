// /api/opportunities - 商机 API 路由
// 代理到 /api/crm 统一处理

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';
import { checkApiPermission } from '@/lib/api-permission';

function generateId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const excludeLead = searchParams.get('excludeLead') === 'true';
    
    if (customerId) {
      const opportunities = await db.getOpportunitiesByCustomerId(customerId);
      return NextResponse.json(opportunities);
    }
    
    const opportunities = await db.getAllOpportunities(excludeLead);
    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('API /api/opportunities GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await checkApiPermission(request, 'opportunities.create')).allowed) {
      return NextResponse.json({ error: '权限不足：创建商机' }, { status: 403 });
    }
    
    const body = await request.json();
    const opportunity = await db.createOpportunity(body);
    
    await db.createActivity({
      id: `act_${generateId('act')}`,
      type: 'created',
      entity_type: 'opportunity',
      entity_id: opportunity.id,
      entity_name: opportunity.title,
      description: `创建商机 ${opportunity.title}`,
      timestamp: new Date(),
    });
    
    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error('API /api/opportunities POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await checkApiPermission(request, 'opportunities.update')).allowed) {
      return NextResponse.json({ error: '权限不足：编辑商机' }, { status: 403 });
    }
    
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: '缺少商机ID' }, { status: 400 });
    }
    
    const oldOpp = await db.getOpportunityById(id);
    const opportunity = await db.updateOpportunity(id, updates);
    
    // 如果阶段变更，记录活动
    if (oldOpp && updates.stage && oldOpp.stage !== updates.stage) {
      const stageLabels: Record<string, string> = {
        qualified: '商机确认',
        discovery: '需求调研',
        proposal: '方案报价',
        negotiation: '商务洽谈',
        contract: '合同签署',
        closed_won: '成交',
        closed_lost: '失败',
      };
      
      await db.createActivity({
        id: `act_${generateId('act')}`,
        type: updates.stage === 'closed_won' ? 'closed_won' : updates.stage === 'closed_lost' ? 'closed_lost' : 'stage_change',
        entity_type: 'opportunity',
        entity_id: opportunity.id,
        entity_name: opportunity.title,
        description: updates.stage === 'closed_won' 
          ? `商机 "${opportunity.title}" 成交！金额: ¥${Number(opportunity.value).toLocaleString()}`
          : updates.stage === 'closed_lost'
          ? `商机 "${opportunity.title}" 失败`
          : `商机 "${opportunity.title}" 从 ${stageLabels[oldOpp.stage]} 变更为 ${stageLabels[updates.stage]}`,
        timestamp: new Date(),
      });
    }
    
    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('API /api/opportunities PUT error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await checkApiPermission(request, 'opportunities.delete')).allowed) {
      return NextResponse.json({ error: '权限不足：删除商机' }, { status: 403 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '缺少商机ID' }, { status: 400 });
    }
    
    const opportunity = await db.getOpportunityById(id);
    if (opportunity) {
      await db.deleteOpportunity(id);
      await db.createActivity({
        id: `act_${generateId('act')}`,
        type: 'deleted',
        entity_type: 'opportunity',
        entity_id: id,
        entity_name: opportunity.title,
        description: `删除商机 ${opportunity.title}`,
        timestamp: new Date(),
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API /api/opportunities DELETE error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
