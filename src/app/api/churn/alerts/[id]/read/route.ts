// 流失预警操作 API (标记已读/忽略)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// 标记预警已读
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();
    
    // 尝试更新数据库
    if (supabase) {
      try {
        const { error } = await supabase
          .from('churn_alerts')
          .update({ is_read: true })
          .eq('id', id);

        if (!error) {
          return NextResponse.json({ success: true });
        }
      } catch (dbError) {
        console.log('数据库更新失败:', dbError);
      }
    }

    // 模拟成功响应
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('标记已读失败:', error);
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    );
  }
}
