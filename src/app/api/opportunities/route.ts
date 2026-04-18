// Opportunities API 路由
import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

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
    const opportunity = await db.createOpportunity({
      id: body.id || `opp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: body.title,
      customer_id: body.customerId || body.customer_id,
      customer_name: body.customerName || body.customer_name,
      contact_id: body.contactId || body.contact_id,
      contact_name: body.contactName || body.contact_name,
      value: body.value,
      stage: body.stage || 'prospecting',
      probability: body.probability,
      expected_close_date: body.expectedCloseDate || body.expected_close_date,
      notes: body.notes,
      source: body.source,
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
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: '缺少商机ID' }, { status: 400 });
    }
    
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
