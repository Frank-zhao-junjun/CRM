// CRM API 路由 - 处理所有 CRUD 操作

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    
    if (type === 'stats') {
      const stats = await db.getDashboardStats();
      return NextResponse.json(stats);
    }
    
    if (type === 'activities') {
      const limit = parseInt(searchParams.get('limit') || '50');
      const activities = await db.getRecentActivities(limit);
      return NextResponse.json(activities);
    }
    
    if (type === 'contacts') {
      const customerId = searchParams.get('customerId');
      if (customerId) {
        const contacts = await db.getContactsByCustomerId(customerId);
        return NextResponse.json(contacts);
      }
      const contacts = await db.getAllContacts();
      return NextResponse.json(contacts);
    }
    
    if (type === 'opportunities') {
      const customerId = searchParams.get('customerId');
      if (customerId) {
        const opportunities = await db.getOpportunitiesByCustomerId(customerId);
        return NextResponse.json(opportunities);
      }
      const opportunities = await db.getAllOpportunities();
      return NextResponse.json(opportunities);
    }
    
    // 默认返回所有客户
    const customers = await db.getAllCustomers();
    return NextResponse.json(customers);
  } catch (error) {
    console.error('CRM API GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;
    
    switch (action) {
      case 'createCustomer': {
        const customer = await db.createCustomer(data);
        return NextResponse.json(customer);
      }
      case 'createContact': {
        const contact = await db.createContact(data);
        return NextResponse.json(contact);
      }
      case 'createOpportunity': {
        const opportunity = await db.createOpportunity(data);
        return NextResponse.json(opportunity);
      }
      case 'createActivity': {
        const activity = await db.createActivity(data);
        return NextResponse.json(activity);
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('CRM API POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, data } = body;
    
    switch (action) {
      case 'updateCustomer': {
        const customer = await db.updateCustomer(id, data);
        return NextResponse.json(customer);
      }
      case 'updateContact': {
        const contact = await db.updateContact(id, data);
        return NextResponse.json(contact);
      }
      case 'updateOpportunity': {
        const opportunity = await db.updateOpportunity(id, data);
        return NextResponse.json(opportunity);
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('CRM API PUT error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    
    switch (action) {
      case 'deleteCustomer': {
        await db.deleteCustomer(id);
        return NextResponse.json({ success: true });
      }
      case 'deleteContact': {
        await db.deleteContact(id);
        return NextResponse.json({ success: true });
      }
      case 'deleteOpportunity': {
        await db.deleteOpportunity(id);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('CRM API DELETE error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
