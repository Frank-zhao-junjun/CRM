// /api/leads - 销售线索 API 路由
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
    const status = searchParams.get('status');
    
    let leads = customerId 
      ? await db.getLeadsByCustomerId(customerId)
      : await db.getAllLeads();
    
    // 过滤状态
    if (status && status !== 'all') {
      leads = leads.filter(l => l.status === status);
    }
    
    return NextResponse.json(leads);
  } catch (error) {
    console.error('API /api/leads GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await checkApiPermission(request, 'leads.create')).allowed) {
      return NextResponse.json({ error: '权限不足：创建线索' }, { status: 403 });
    }
    
    const body = await request.json();
    const lead = await db.createLead(body);
    
    await db.createActivity({
      id: `act_${generateId('act')}`,
      type: 'created',
      entity_type: 'lead',
      entity_id: lead.id,
      entity_name: lead.title,
      description: `创建销售线索 ${lead.title}`,
      timestamp: new Date(),
    });
    
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('API /api/leads POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await checkApiPermission(request, 'leads.update')).allowed) {
      return NextResponse.json({ error: '权限不足：编辑线索' }, { status: 403 });
    }
    
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: '缺少线索ID' }, { status: 400 });
    }
    
    const lead = await db.updateLead(id, updates);
    return NextResponse.json(lead);
  } catch (error) {
    console.error('API /api/leads PUT error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await checkApiPermission(request, 'leads.delete')).allowed) {
      return NextResponse.json({ error: '权限不足：删除线索' }, { status: 403 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '缺少线索ID' }, { status: 400 });
    }
    
    const lead = await db.getLeadById(id);
    if (lead) {
      await db.deleteLead(id);
      await db.createActivity({
        id: `act_${generateId('act')}`,
        type: 'deleted',
        entity_type: 'lead',
        entity_id: id,
        entity_name: lead.title,
        description: `删除销售线索 ${lead.title}`,
        timestamp: new Date(),
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API /api/leads DELETE error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
