// 跟进记录 API

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const overdue = searchParams.get('overdue');
    const upcoming = searchParams.get('upcoming');
    const hours = searchParams.get('hours');

    if (overdue === 'true') {
      const followUps = await db.getOverdueFollowUps();
      return NextResponse.json(followUps);
    }

    if (upcoming === 'true') {
      const hoursNum = hours ? parseInt(hours) : 24;
      const followUps = await db.getUpcomingFollowUps(hoursNum);
      return NextResponse.json(followUps);
    }

    if (entityType && entityId) {
      const followUps = await db.getFollowUpsByEntity(entityType, entityId);
      return NextResponse.json(followUps);
    }

    const followUps = await db.getAllFollowUps();
    return NextResponse.json(followUps);
  } catch (error) {
    console.error('Follow-ups GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, id } = body;

    switch (action) {
      case 'create': {
        const followUp = await db.createFollowUp({
          id: data.id || `followup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          entity_type: data.entityType,
          entity_id: data.entityId,
          entity_name: data.entityName || null,
          title: data.title,
          content: data.content || null,
          follow_up_type: data.followUpType || 'call',
          due_date: data.dueDate ? new Date(data.dueDate).toISOString() : null,
          completed: false,
          completed_at: null,
          assignee_id: data.assigneeId || null,
          assignee_name: data.assigneeName || null,
          reminder: data.reminder || false,
          notes: data.notes || null,
        });
        return NextResponse.json(followUp);
      }

      case 'complete': {
        if (!id) {
          return NextResponse.json({ error: '缺少跟进记录ID' }, { status: 400 });
        }
        // 更新为已完成
        const now = new Date().toISOString();
        // 注意: 如果数据库没有 completeFollowUp 函数，需要使用 updateFollowUp
        const followUp = await (db as any).completeFollowUp?.(id, now) 
          || await (db as any).updateFollowUp?.(id, { 
              completed: true, 
              completed_at: now 
            });
        return NextResponse.json(followUp || { id, completed: true, completed_at: now });
      }

      case 'update': {
        if (!id) {
          return NextResponse.json({ error: '缺少跟进记录ID' }, { status: 400 });
        }
        const updates: Record<string, any> = {};
        if (data.title !== undefined) updates.title = data.title;
        if (data.content !== undefined) updates.content = data.content;
        if (data.dueDate !== undefined) updates.due_date = data.dueDate ? new Date(data.dueDate).toISOString() : null;
        if (data.followUpType !== undefined) updates.follow_up_type = data.followUpType;
        if (data.notes !== undefined) updates.notes = data.notes;
        
        const followUp = await (db as any).updateFollowUp?.(id, updates);
        return NextResponse.json(followUp);
      }

      case 'delete': {
        if (!id) {
          return NextResponse.json({ error: '缺少跟进记录ID' }, { status: 400 });
        }
        await (db as any).deleteFollowUp?.(id);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: '未知的操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Follow-ups POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
