// Leads API 路由
import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('id');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    
    let leads;
    
    if (leadId) {
      const lead = await db.getLeadById(leadId);
      return NextResponse.json(lead);
    }
    
    if (customerId) {
      leads = await db.getLeadsByCustomerId(customerId);
    } else {
      leads = await db.getAllLeads();
    }
    
    // 过滤状态
    if (status && status !== 'all') {
      leads = leads.filter(l => l.status === status);
    }
    
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lead = await db.createLead({
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: body.title,
      source: body.source,
      customer_id: body.customerId || body.customer_id,
      customer_name: body.customerName || body.customer_name,
      contact_id: body.contactId || body.contact_id,
      contact_name: body.contactName || body.contact_name,
      estimated_value: body.estimatedValue || body.estimated_value || 0,
      probability: body.probability || 10,
      status: body.status || 'new',
      notes: body.notes,
    });
    
    // 记录活动
    await db.createActivity({
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: 'created',
      entity_type: 'lead',
      entity_id: lead.id,
      entity_name: lead.title,
      description: `创建销售线索 "${lead.title}"，预估金额 ¥${Number(lead.estimated_value).toLocaleString()}`,
      timestamp: new Date(),
    });
    
    // 触发工作流
    db.executeWorkflowEngine({
      triggerType: 'lead_created',
      entityType: 'lead',
      entityId: lead.id,
      entityName: lead.title,
    }).catch(() => { /* 静默处理工作流错误 */ });
    
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Create lead error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: '缺少线索ID' }, { status: 400 });
    }
    
    const lead = await db.updateLead(id, updates);
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '缺少线索ID' }, { status: 400 });
    }
    
    await db.deleteLead(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
