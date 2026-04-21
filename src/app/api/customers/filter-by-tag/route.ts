import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client.server';
import type { Customer } from '@/storage/database/shared/schema';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tagId');

    if (!tagId) {
      return NextResponse.json({ error: '缺少标签ID' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('customer_tags')
      .select('customer:customers(*)')
      .eq('tag_id', tagId);

    if (error) throw new Error(`按标签筛选客户失败: ${error.message}`);

    const customers = (data as unknown as { customer: Customer }[] | undefined)
      ?.map((item) => item.customer)
      .filter(Boolean) || [];
    return NextResponse.json(customers);
  } catch (error) {
    console.error('按标签筛选客户失败:', error);
    return NextResponse.json({ error: '按标签筛选客户失败' }, { status: 500 });
  }
}
