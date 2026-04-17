// 工单详情 API - GET/PATCH/DELETE /api/tickets/[id]

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { tickets, ticketComments, activities } from '@/storage/database/shared/schema';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 状态标签映射
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
  };
  return statusMap[status] || status;
}

// GET /api/tickets/[id] - 获取工单详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const client = await getSupabaseClient();
    const { id } = await params;
    
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
    
    // 获取活动记录
    const { data: activityRecords } = await client
      .from('activities')
      .select('*')
      .eq('entity_id', id)
      .order('timestamp', { ascending: true });
    
    return NextResponse.json({
      ...ticket,
      customer,
      comments: comments || [],
      activities: activityRecords || [],
    });
  } catch (error) {
    console.error('Ticket GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// PATCH /api/tickets/[id] - 更新工单
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const client = await getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { action, data } = body;

    // 获取当前工单
    const { data: ticket, error: ticketError } = await client
      .from('tickets')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (ticketError || !ticket) {
      return NextResponse.json({ error: '工单不存在' }, { status: 404 });
    }

    // 状态变更
    if (action === 'changeStatus') {
      const newStatus = data.status;
      const oldStatus = ticket.status;
      
      const updates: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      
      // 如果变更为已解决，记录解决时间
      if (newStatus === 'resolved' && oldStatus !== 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }
      
      // 如果变更为已关闭，记录关闭时间
      if (newStatus === 'closed' && oldStatus !== 'closed') {
        updates.closed_at = new Date().toISOString();
      }
      
      await client
        .from('tickets')
        .update(updates)
        .eq('id', id);
      
      // 创建活动记录
      await client.from('activities').insert({
        type: 'status_change',
        entity_type: 'ticket',
        entity_id: id,
        entity_name: ticket.title,
        description: `工单状态从 "${getStatusLabel(oldStatus)}" 变更为 "${getStatusLabel(newStatus)}"`,
      });
      
      const { data: updatedTicket } = await client
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();
      
      return NextResponse.json(updatedTicket);
    }

    // 分配处理人
    if (action === 'assign') {
      const statusUpdate = ticket.status === 'pending' ? 'processing' : ticket.status;
      
      await client
        .from('tickets')
        .update({
          assignee_id: data.assigneeId,
          assignee_name: data.assigneeName,
          status: statusUpdate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      await client.from('activities').insert({
        type: 'assigned',
        entity_type: 'ticket',
        entity_id: id,
        entity_name: ticket.title,
        description: `工单被分配给 ${data.assigneeName || '未知处理人'}`,
      });
      
      const { data: updatedTicket } = await client
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();
      
      return NextResponse.json(updatedTicket);
    }

    // 添加评论
    if (action === 'addComment') {
      const { data: newComment, error: commentError } = await client
        .from('ticket_comments')
        .insert({
          ticket_id: id,
          content: data.content,
          author_id: data.authorId || 'staff',
          author_name: data.authorName || '客服人员',
          author_type: data.authorType || 'staff',
          is_internal: data.isInternal || false,
        })
        .select()
        .single();
      
      if (commentError) {
        throw new Error(commentError.message);
      }
      
      // 如果是客户回复且工单状态为待处理，自动转为处理中
      if (data.authorType === 'customer' && ticket.status === 'pending') {
        await client
          .from('tickets')
          .update({
            status: 'processing',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        
        await client.from('activities').insert({
          type: 'status_change',
          entity_type: 'ticket',
          entity_id: id,
          entity_name: ticket.title,
          description: '客户回复后工单自动转为处理中',
        });
      }
      
      return NextResponse.json(newComment);
    }

    // 通用更新
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.type !== undefined) updates.type = data.type;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.status !== undefined) updates.status = data.status;
    
    await client
      .from('tickets')
      .update(updates)
      .eq('id', id);
    
    const { data: updatedTicket } = await client
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();
    
    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Ticket PATCH error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/tickets/[id] - 删除工单
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const client = await getSupabaseClient();
    const { id } = await params;
    
    const { data: ticket, error: ticketError } = await client
      .from('tickets')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    
    if (ticketError || !ticket) {
      return NextResponse.json({ error: '工单不存在' }, { status: 404 });
    }
    
    // 删除工单（评论会级联删除）
    await client.from('tickets').delete().eq('id', id);
    
    return NextResponse.json({ success: true, message: '工单已删除' });
  } catch (error) {
    console.error('Ticket DELETE error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
