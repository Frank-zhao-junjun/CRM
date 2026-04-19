// 联系人管理 API

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const customerId = searchParams.get('customerId');

    if (id) {
      const contact = await db.getContactById(id);
      if (!contact) {
        return NextResponse.json({ error: '联系人不存在' }, { status: 404 });
      }
      return NextResponse.json(contact);
    }

    if (customerId) {
      const contacts = await db.getContactsByCustomerId(customerId);
      return NextResponse.json(contacts);
    }

    const contacts = await db.getAllContacts();
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Contacts GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, id } = body;

    switch (action) {
      case 'create': {
        const contact = await db.createContact({
          id: data.id || `contact_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          customer_id: data.customerId,
          first_name: data.firstName || '',
          last_name: data.lastName || '',
          position: data.position || null,
          phone: data.phone || null,
          email: data.email || null,
          is_primary: data.isPrimary || false,
        });
        return NextResponse.json(contact);
      }

      case 'update': {
        if (!id) {
          return NextResponse.json({ error: '缺少联系人ID' }, { status: 400 });
        }
        const contact = await db.updateContact(id, {
          customer_id: data.customerId,
          first_name: data.firstName,
          last_name: data.lastName,
          position: data.position,
          phone: data.phone,
          email: data.email,
          is_primary: data.isPrimary,
        });
        return NextResponse.json(contact);
      }

      case 'delete': {
        if (!id) {
          return NextResponse.json({ error: '缺少联系人ID' }, { status: 400 });
        }
        await db.deleteContact(id);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: '未知的操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Contacts POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
