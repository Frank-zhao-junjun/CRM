// Opportunities API 路由
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as db from '@/lib/crm-database';

// 创建商机验证 schema
const createOpportunitySchema = z.object({
  title: z.string().min(1, '商机标题不能为空').max(255),
  customerId: z.string().min(1, '客户ID不能为空').optional(),
  customer_id: z.string().min(1, '客户ID不能为空').optional(),
  customerName: z.string().optional(),
  customer_name: z.string().optional(),
  contactId: z.string().optional(),
  contact_id: z.string().optional(),
  contactName: z.string().optional(),
  contact_name: z.string().optional(),
  value: z.number().min(0, '金额不能为负数'),
  stage: z.enum(['prospecting', 'qualified', 'discovery', 'proposal', 'negotiation', 'contract', 'closed_won', 'closed_lost']).optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().datetime().optional().or(z.string().optional()),
  expected_close_date: z.string().datetime().optional().or(z.string().optional()),
  notes: z.string().optional(),
  source: z.string().optional(),
});

// 更新商机验证 schema
const updateOpportunitySchema = z.object({
  id: z.string().min(1, '商机ID不能为空'),
  title: z.string().min(1).max(255).optional(),
  customerId: z.string().optional(),
  customer_id: z.string().optional(),
  customerName: z.string().optional(),
  customer_name: z.string().optional(),
  contactId: z.string().optional(),
  contact_id: z.string().optional(),
  contactName: z.string().optional(),
  contact_name: z.string().optional(),
  value: z.number().min(0).optional(),
  stage: z.enum(['prospecting', 'qualified', 'discovery', 'proposal', 'negotiation', 'contract', 'closed_won', 'closed_lost']).optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().datetime().optional().or(z.string().optional()),
  expected_close_date: z.string().datetime().optional().or(z.string().optional()),
  notes: z.string().optional(),
  source: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const opportunityId = searchParams.get('id');
    const customerId = searchParams.get('customerId');
    const excludeLead = searchParams.get('excludeLead') === 'true';
    
    if (opportunityId) {
      const opportunity = await db.getOpportunityById(opportunityId);
      return NextResponse.json(opportunity);
    }
    
    if (customerId) {
      const opportunities = await db.getOpportunitiesByCustomerId(customerId);
      return NextResponse.json(opportunities);
    }
    
    const opportunities = await db.getAllOpportunities(excludeLead);
    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Opportunities API error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证输入数据
    const validation = createOpportunitySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: '输入验证失败', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const opportunity = await db.createOpportunity({
      id: `opp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: validation.data.title,
      customer_id: validation.data.customerId || validation.data.customer_id,
      customer_name: validation.data.customerName || validation.data.customer_name || '',
      contact_id: validation.data.contactId || validation.data.contact_id,
      contact_name: validation.data.contactName || validation.data.contact_name,
      value: validation.data.value,
      stage: validation.data.stage || 'prospecting',
      probability: validation.data.probability,
      expected_close_date: validation.data.expectedCloseDate || validation.data.expected_close_date,
      notes: validation.data.notes,
      source: validation.data.source,
    });
    
    // 记录活动
    await db.createActivity({
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: 'created',
      entity_type: 'opportunity',
      entity_id: opportunity.id,
      entity_name: opportunity.title,
      description: `创建商机 "${opportunity.title}"，预估金额 ¥${Number(opportunity.value).toLocaleString()}`,
      timestamp: new Date(),
    });
    
    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Create opportunity error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证输入数据
    const validation = updateOpportunitySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: '输入验证失败', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const { id, ...updates } = validation.data;
    const opportunity = await db.updateOpportunity(id, updates);
    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Update opportunity error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '缺少商机ID' }, { status: 400 });
    }
    
    await db.deleteOpportunity(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete opportunity error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
