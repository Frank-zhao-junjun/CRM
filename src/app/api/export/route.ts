// CSV 导出 API - 客户数据导出

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

function escapeCSV(value: string | number | boolean | Date | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'boolean') return value ? '是' : '否';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('type') || 'customers';

    let csv = '';
    const now = new Date().toISOString().split('T')[0];

    switch (entityType) {
      case 'customers': {
        const customers = await db.getAllCustomers();
        csv = 'ID,姓名,邮箱,电话,公司,状态,行业,网站,地址,备注,创建时间,更新时间\n';
        csv += customers.map(c => [
          escapeCSV(c.id), escapeCSV(c.name), escapeCSV(c.email), escapeCSV(c.phone),
          escapeCSV(c.company), escapeCSV(c.status), escapeCSV(c.industry),
          escapeCSV(c.website), escapeCSV(c.address), escapeCSV(c.notes),
          escapeCSV(c.created_at), escapeCSV(c.updated_at),
        ].join(',')).join('\n');
        break;
      }
      case 'leads': {
        const leads = await db.getAllLeads();
        csv = 'ID,标题,来源,客户ID,客户名称,联系人ID,联系人名称,预估金额,概率,状态,备注,创建时间,更新时间\n';
        csv += leads.map(l => [
          escapeCSV(l.id), escapeCSV(l.title), escapeCSV(l.source),
          escapeCSV(l.customer_id), escapeCSV(l.customer_name),
          escapeCSV(l.contact_id), escapeCSV(l.contact_name),
          escapeCSV(l.estimated_value), escapeCSV(l.probability),
          escapeCSV(l.status), escapeCSV(l.notes),
          escapeCSV(l.created_at), escapeCSV(l.updated_at),
        ].join(',')).join('\n');
        break;
      }
      case 'opportunities': {
        const opportunities = await db.getAllOpportunities();
        csv = 'ID,标题,客户ID,客户名称,联系人ID,联系人名称,金额,阶段,概率,预计成交日期,描述,来源线索ID,创建时间,更新时间\n';
        csv += opportunities.map(o => [
          escapeCSV(o.id), escapeCSV(o.title),
          escapeCSV(o.customer_id), escapeCSV(o.customer_name),
          escapeCSV(o.contact_id), escapeCSV(o.contact_name),
          escapeCSV(o.value), escapeCSV(o.stage), escapeCSV(o.probability),
          escapeCSV(o.expected_close_date), escapeCSV(o.description),
          escapeCSV(o.source_lead_id),
          escapeCSV(o.created_at), escapeCSV(o.updated_at),
        ].join(',')).join('\n');
        break;
      }
      case 'contacts': {
        const contacts = await db.getAllContacts();
        csv = 'ID,名,姓,邮箱,电话,职位,客户ID,是否主要联系人,创建时间,更新时间\n';
        csv += contacts.map(c => [
          escapeCSV(c.id), escapeCSV(c.first_name), escapeCSV(c.last_name),
          escapeCSV(c.email), escapeCSV(c.phone), escapeCSV(c.position),
          escapeCSV(c.customer_id), escapeCSV(c.is_primary),
          escapeCSV(c.created_at), escapeCSV(c.updated_at),
        ].join(',')).join('\n');
        break;
      }
      default:
        return NextResponse.json({ error: '不支持的导出类型' }, { status: 400 });
    }

    // BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF';
    const csvContent = bom + csv;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${entityType}_${now}.csv"`,
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
