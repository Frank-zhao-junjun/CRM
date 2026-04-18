// Customers API 路由
import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('id');
    const status = searchParams.get('status');
    
    let customers;
    
    if (customerId) {
      const customer = await db.getCustomerById(customerId);
      return NextResponse.json(customer);
    }
    
    customers = await db.getAllCustomers();
    
    // 过滤状态
    if (status && status !== 'all') {
      customers = customers.filter(c => c.status === status);
    }
    
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Customers API error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customer = await db.createCustomer(body);
    
    // 记录活动
    await db.createActivity({
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: 'created',
      entity_type: 'customer',
      entity_id: customer.id,
      entity_name: customer.name,
      description: `创建客户 ${customer.name}`,
      timestamp: new Date(),
    });
    
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: '缺少客户ID' }, { status: 400 });
    }
    
    const customer = await db.updateCustomer(id, updates);
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '缺少客户ID' }, { status: 400 });
    }
    
    await db.deleteCustomer(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
