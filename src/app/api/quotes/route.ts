// 报价单 API

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const opportunityId = searchParams.get('opportunityId');

    if (id) {
      const quote = await db.getQuoteById(id);
      if (!quote) {
        return NextResponse.json({ error: '报价单不存在' }, { status: 404 });
      }
      return NextResponse.json(quote);
    }

    if (opportunityId) {
      const quotes = await db.getQuotesByOpportunity(opportunityId);
      return NextResponse.json(quotes);
    }

    const quotes = await db.getAllQuotes();
    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Quotes GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, id: bodyId } = body;

    switch (action) {
      case 'create': {
        const id = `quote_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const quote = await db.createQuote(
          {
            id,
            opportunity_id: data.opportunityId,
            title: data.title,
            status: data.status || 'draft',
            valid_from: data.validFrom || null,
            valid_until: data.validUntil || null,
            subtotal: String(data.subtotal || 0),
            discount: String(data.discount || 0),
            tax: String(data.tax || 0),
            total: String(data.total || 0),
            terms: data.terms || null,
            notes: data.notes || null,
          },
          (data.items || []).map((item: { productName: string; description?: string; quantity: number; unitPrice: number; discount?: number; subtotal: number }) => ({
            id: `qi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            product_name: item.productName,
            description: item.description || null,
            quantity: item.quantity,
            unit_price: String(item.unitPrice),
            discount: String(item.discount || 0),
            subtotal: String(item.subtotal),
          }))
        );
        return NextResponse.json(quote);
      }

      case 'send': {
        // Change status from draft to active
        const quote = await db.updateQuote(bodyId || data?.id, { status: 'active' });
        return NextResponse.json(quote);
      }

      case 'accept': {
        const quote = await db.updateQuote(bodyId || data?.id, { status: 'accepted' });
        return NextResponse.json(quote);
      }

      case 'reject': {
        const quote = await db.updateQuote(bodyId || data?.id, { status: 'rejected' });
        return NextResponse.json(quote);
      }

      case 'convertToOrder': {
        const order = await db.convertQuoteToOrder(bodyId || data?.id);
        return NextResponse.json(order);
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Quotes POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, data } = body;

    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.status !== undefined) updates.status = data.status;
    if (data.validFrom !== undefined) updates.valid_from = data.validFrom;
    if (data.validUntil !== undefined) updates.valid_until = data.validUntil;
    if (data.subtotal !== undefined) updates.subtotal = String(data.subtotal);
    if (data.discount !== undefined) updates.discount = String(data.discount);
    if (data.tax !== undefined) updates.tax = String(data.tax);
    if (data.total !== undefined) updates.total = String(data.total);
    if (data.terms !== undefined) updates.terms = data.terms;
    if (data.notes !== undefined) updates.notes = data.notes;

    const quote = await db.updateQuote(id, updates);

    // Update items if provided
    if (data.items) {
      await db.updateQuoteItems(id, data.items.map((item: { productName: string; description?: string; quantity: number; unitPrice: number; discount?: number; subtotal: number }) => ({
        id: `qi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        product_name: item.productName,
        description: item.description || null,
        quantity: item.quantity,
        unit_price: String(item.unitPrice),
        discount: String(item.discount || 0),
        subtotal: String(item.subtotal),
      })));
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Quotes PUT error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少ID' }, { status: 400 });

    await db.deleteQuote(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quotes DELETE error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
