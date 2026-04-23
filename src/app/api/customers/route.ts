// /api/customers - 客户管理 API 路由
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
    
    if (customerId) {
      const customer = await db.getCustomerById(customerId);
      return NextResponse.json(customer);
    }
    
    const customers = await db.getAllCustomers();
    return NextResponse.json(customers);
  } catch (error) {
    console.error('API /api/customers GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await checkApiPermission(request, 'customers.create')).allowed) {
      return NextResponse.json({ error: '权限不足：创建客户' }, { status: 403 });
    }
    
    const body = await request.json();
    const customer = await db.createCustomer(body);
    
    await db.createActivity({
      id: `act_${generateId('act')}`,
      type: 'created',
      entity_type: 'customer',
      entity_id: customer.id,
      entity_name: customer.name,
      description: `创建客户 ${customer.name}`,
      timestamp: new Date(),
    });
    
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('API /api/customers POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await checkApiPermission(request, 'customers.update')).allowed) {
      return NextResponse.json({ error: '权限不足：编辑客户' }, { status: 403 });
    }
    
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: '缺少客户ID' }, { status: 400 });
    }
    
    const customer = await db.updateCustomer(id, updates);
    return NextResponse.json(customer);
  } catch (error) {
    console.error('API /api/customers PUT error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await checkApiPermission(request, 'customers.delete')).allowed) {
      return NextResponse.json({ error: '权限不足：删除客户' }, { status: 403 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '缺少客户ID' }, { status: 400 });
    }
    
    const customer = await db.getCustomerById(id);
    if (customer) {
      await db.deleteCustomer(id);
      await db.createActivity({
        id: `act_${generateId('act')}`,
        type: 'deleted',
        entity_type: 'customer',
        entity_id: id,
        entity_name: customer.name,
        description: `删除客户 ${customer.name}`,
        timestamp: new Date(),
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API /api/customers DELETE error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
