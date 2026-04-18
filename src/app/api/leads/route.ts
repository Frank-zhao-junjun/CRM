// Leads API 路由
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as db from '@/lib/crm-database';

// 创建线索验证 schema
const createLeadSchema = z.object({
  title: z.string().min(1, '线索标题不能为空').max(255),
  source: z.enum(['referral', 'website', 'cold_call', 'event', 'advertisement', 'other'], {
    errorMap: () => ({ message: '来源必须是: referral, website, cold_call, event, advertisement, other' }),
  }),
  customerId: z.string().min(1, '客户ID不能为空').optional(),
  customer_id: z.string().min(1, '客户ID不能为空').optional(),
  customerName: z.string().optional(),
  customer_name: z.string().optional(),
  contactId: z.string().optional(),
  contact_id: z.string().optional(),
  contactName: z.string().optional(),
  contact_name: z.string().optional(),
  estimatedValue: z.number().min(0).optional(),
  estimated_value: z.number().min(0).optional(),
  probability: z.number().min(0).max(100).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'disqualified']).optional(),
  notes: z.string().optional(),
});

// 更新线索验证 schema
const updateLeadSchema = z.object({
  id: z.string().min(1, '线索ID不能为空'),
  title: z.string().min(1).max(255).optional(),
  source: z.enum(['referral', 'website', 'cold_call', 'event', 'advertisement', 'other']).optional(),
  customerId: z.string().optional(),
  customer_id: z.string().optional(),
  customerName: z.string().optional(),
  customer_name: z.string().optional(),
  contactId: z.string().optional(),
  contact_id: z.string().optional(),
  contactName: z.string().optional(),
  contact_name: z.string().optional(),
  estimatedValue: z.number().min(0).optional(),
  estimated_value: z.number().min(0).optional(),
  probability: z.number().min(0).max(100).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'disqualified']).optional(),
  notes: z.string().optional(),
});

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
    
    // 验证输入数据
    const validation = createLeadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: '输入验证失败', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const lead = await db.createLead({
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: validation.data.title,
      source: validation.data.source,
      customer_id: validation.data.customerId || validation.data.customer_id,
      customer_name: validation.data.customerName || validation.data.customer_name || '',
      contact_id: validation.data.contactId || validation.data.contact_id,
      contact_name: validation.data.contactName || validation.data.contact_name,
      estimated_value: validation.data.estimatedValue || validation.data.estimated_value || 0,
      probability: validation.data.probability || 10,
      status: validation.data.status || 'new',
      notes: validation.data.notes,
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
    
    // 验证输入数据
    const validation = updateLeadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: '输入验证失败', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const { id, ...updates } = validation.data;
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
