// 合同回款记录 API

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contractId = searchParams.get('contractId');
    const id = searchParams.get('id');
    const summary = searchParams.get('summary');

    if (summary === 'true') {
      const paymentSummary = await db.getPaymentSummary();
      return NextResponse.json(paymentSummary);
    }

    if (id) {
      const receipt = await db.getPaymentReceiptById(id);
      if (!receipt) {
        return NextResponse.json({ error: '回款记录不存在' }, { status: 404 });
      }
      return NextResponse.json(receipt);
    }

    if (contractId) {
      const receipts = await db.getPaymentReceiptsByContract(contractId);
      return NextResponse.json(receipts);
    }

    return NextResponse.json({ error: '缺少参数' }, { status: 400 });
  } catch (error) {
    console.error('Payment Receipts GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, id: bodyId } = body;

    switch (action) {
      case 'create': {
        const processDate = (dateStr: string | undefined): Date | undefined => {
          if (!dateStr) return undefined;
          return new Date(dateStr);
        };

        const receipt = await db.createPaymentReceipt({
          id: data.id || `payment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          contract_id: data.contractId,
          amount: String(data.amount || 0),
          payment_date: processDate(data.paymentDate) ?? new Date(),
          payment_method: data.paymentMethod || 'bank_transfer',
          receipt_number: data.receiptNumber || null,
          remark: data.remark || null,
        });
        return NextResponse.json(receipt);
      }

      case 'update': {
        const processDate = (dateStr: string | undefined): Date | undefined => {
          if (!dateStr) return undefined;
          return new Date(dateStr);
        };

        const receipt = await db.updatePaymentReceipt(bodyId || data?.id, {
          amount: data.amount !== undefined ? String(data.amount) : undefined,
          payment_date: data.paymentDate ? processDate(data.paymentDate) : undefined,
          payment_method: data.paymentMethod,
          receipt_number: data.receiptNumber,
          remark: data.remark,
        });
        return NextResponse.json(receipt);
      }

      case 'delete': {
        await db.deletePaymentReceipt(bodyId || data?.id);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Payment Receipts POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
