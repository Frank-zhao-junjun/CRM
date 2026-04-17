// 服务工单管理 API (V5.2)

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { tickets, ticketComments, customers, activities } from '@/storage/database/shared/schema';
import type { Ticket, TicketComment } from '@/storage/database/shared/schema';

// 获取今日日期字符串
function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// 格式化时间
function formatTime(date: Date): string {
  return date.toISOString();
}

// 生成工单编号
async function generateTicketNumber(): Promise<string> {
  const client = await getSupabaseClient();
  const today = getTodayDateStr();
  const prefix = `TKT-${today}-`;
  
  // 查找今天最大的序号
  const { data, error } = await client
    .from('tickets')
    .select('ticket_number')
    .like('ticket_number', `${prefix}%`)
    .order('ticket_number', { ascending: false })
    .limit(1);
  
  let maxSeq = 0;
  if (data && data.length > 0) {
    const lastNumber = data[0].ticket_number;
    const seqStr = lastNumber?.substring(prefix.length);
    maxSeq = parseInt(seqStr) || 0;
  }
  
  const nextSeq = String(maxSeq + 1).padStart(4, '0');
  return `${prefix}${nextSeq}`;
}

// 创建活动记录
async function createActivity(
  type: string,
  entityType: string,
  entityId: string,
  entityName: string,
  description: string
) {
  const client = await getSupabaseClient();
  await client.from('activities').insert({
    type,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    description,
  });
}

// 获取工单统计
async function getTicketStats() {
  const client = await getSupabaseClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data: pendingData } = await client
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  
  const { data: processingData } = await client
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'processing');
  
  const { data: todayNewData } = await client
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());
  
  const { data: resolvedData } = await client
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .gte('resolved_at', today.toISOString());

  return {
    pending: pendingData?.length || 0,
    processing: processingData?.length || 0,
    todayNew: todayNewData?.length || 0,
    todayResolved: resolvedData?.length || 0,
  };
}

// GET /api/tickets - 获取工单列表
export async function GET(request: NextRequest) {
  try {
    const client = await getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const customerId = searchParams.get('customerId');
    const filter = searchParams.get('filter');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 获取单个工单
    if (id) {
      const { data: ticket, error: ticketError } = await client
        .from('tickets')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (ticketError || !ticket) {
        return NextResponse.json({ error: '工单不存在' }, { status: 404 });
      }
      
      // 获取关联的客户信息
      const { data: customer } = await client
        .from('customers')
        .select('*')
        .eq('id', ticket.customer_id)
        .maybeSingle();
      
      // 获取评论
      const { data: comments } = await client
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });
      
      return NextResponse.json({
        ...ticket,
        customer,
        comments: comments || [],
      });
    }

    // 构建查询
    let query = client.from('tickets').select('*', { count: 'exact' });
    
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    if (search) {
      query = query.or(`ticket_number.ilike.%${search}%,title.ilike.%${search}%`);
    }
    
    // 排序和分页
    query = query.order('created_at', { ascending: false });
    query = query.range((page - 1) * limit, page * limit - 1);
    
    const { data: ticketList, error, count } = await query;
    
    if (error) {
      throw new Error(error.message);
    }

    // 统计
    const stats = await getTicketStats();

    return NextResponse.json({
      tickets: ticketList || [],
      stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Tickets GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/tickets - 创建工单
export async function POST(request: NextRequest) {
  try {
    const client = await getSupabaseClient();
    const body = await request.json();
    const { action, data } = body;

    // 创建工单
    if (!action || action === 'create') {
      const ticketNumber = await generateTicketNumber();
      
      const { data: newTicket, error } = await client
        .from('tickets')
        .insert({
          ticket_number: ticketNumber,
          title: data.title,
          description: data.description,
          customer_id: data.customerId,
          type: data.type || 'inquiry',
          priority: data.priority || 'medium',
          status: 'pending',
          assignee_id: data.assigneeId || null,
          assignee_name: data.assigneeName || null,
          created_by: data.createdBy || 'system',
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // 如果有初始评论
      if (data.initialComment) {
        await client.from('ticket_comments').insert({
          ticket_id: newTicket.id,
          content: data.initialComment,
          author_id: data.createdBy || 'system',
          author_name: data.createdByName || '系统',
          author_type: 'staff',
        });
      }

      // 创建活动记录
      await createActivity('created', 'ticket', newTicket.id, newTicket.title, '创建了工单');

      return NextResponse.json(newTicket);
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('Tickets POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
