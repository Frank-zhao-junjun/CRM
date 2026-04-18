import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getAllInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice } from '@/lib/crm-database';
import type { InsertInvoice } from '@/storage/database/shared/schema';

// 生成发票号（基于日期 + UUID前缀）
function generateInvoiceNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const uid = nanoid(8).toUpperCase();
  return `INV-${y}${m}${d}-${uid}`;
}

// 将 API 数据转换为数据库格式
function convertToDbInvoice(data: Record<string, unknown>): InsertInvoice {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    invoice_number: generateInvoiceNumber(),
    order_id: data.orderId as string || null,
    order_number: data.orderNumber as string || null,
    customer_id: data.customerId as string,
    customer_name: data.customerName as string,
    tax_id: data.taxId as string || null,
    billing_address: data.billingAddress as string || null,
    status: (data.status as string) || 'draft',
    issue_date: (data.issueDate as string) || now.split('T')[0],
    due_date: data.dueDate as string || null,
    subtotal: String(Number(data.subtotal) || 0),
    tax_rate: String(Number(data.taxRate) || 0.06),
    tax: String(Number(data.tax) || 0),
    total: String(Number(data.total) || 0),
    paid_date: data.paidDate as string || null,
    payment_method: data.paymentMethod as string || null,
    notes: data.notes as string || null,
  };
}

// 将数据库记录转换为 API 响应格式
function convertFromDbInvoice(invoice: Record<string, unknown>): Record<string, unknown> {
  return {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    order_id: invoice.order_id,
    order_number: invoice.order_number,
    customer_id: invoice.customer_id,
    customer_name: invoice.customer_name,
    tax_id: invoice.tax_id,
    billing_address: invoice.billing_address,
    status: invoice.status,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    subtotal: Number(invoice.subtotal),
    tax_rate: Number(invoice.tax_rate),
    tax: Number(invoice.tax),
    total: Number(invoice.total),
    paid_date: invoice.paid_date,
    payment_method: invoice.payment_method,
    notes: invoice.notes,
    created_at: invoice.created_at,
    updated_at: invoice.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const invoice = await getInvoiceById(id);
      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      return NextResponse.json(convertFromDbInvoice(invoice as unknown as Record<string, unknown>));
    }
    
    const invoices = await getAllInvoices();
    return NextResponse.json(invoices.map(convertFromDbInvoice));
  } catch (error) {
    console.error('GET /api/invoices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;
    
    if (action === 'create') {
      const dbInvoice = convertToDbInvoice(data);
      const invoice = await createInvoice(dbInvoice);
      return NextResponse.json(convertFromDbInvoice(invoice as unknown as Record<string, unknown>), { status: 201 });
    }
    
    if (action === 'update') {
      const { id, ...updates } = data;
      const invoice = await updateInvoice(id, updates);
      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      return NextResponse.json(convertFromDbInvoice(invoice as unknown as Record<string, unknown>));
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/invoices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    // 检查发票是否存在
    const existing = await getInvoiceById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    await deleteInvoice(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/invoices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
