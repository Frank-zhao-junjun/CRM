// 跟进记录 API

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

type FollowUpCompatDb = typeof db & {
  completeFollowUp?: (id: string, completedAt: string) => Promise<unknown>;
  updateFollowUp?: (id: string, updates: Record<string, unknown>) => Promise<unknown>;
  deleteFollowUp?: (id: string) => Promise<void>;
};

const followUpDb = db as FollowUpCompatDb;

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
          type: data.followUpType || 'note',
          method: data.method || data.followUpType || 'note',
          content: data.content || data.title || '',
          scheduled_at: data.dueDate ? new Date(data.dueDate) : null,
          completed_at: null,
          next_follow_up_at: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
          created_by: data.assigneeId || 'system',
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
        const followUp = await followUpDb.completeFollowUp?.(id, now) 
          || await followUpDb.updateFollowUp?.(id, { 
              completed: true, 
              completed_at: now 
            });
        return NextResponse.json(followUp || { id, completed: true, completed_at: now });
      }

      case 'update': {
        if (!id) {
          return NextResponse.json({ error: '缺少跟进记录ID' }, { status: 400 });
        }
        const updates: Record<string, unknown> = {};
        if (data.content !== undefined || data.title !== undefined) updates.content = data.content || data.title;
        if (data.dueDate !== undefined) updates.scheduled_at = data.dueDate ? new Date(data.dueDate) : null;
        if (data.followUpType !== undefined) updates.type = data.followUpType;
        if (data.method !== undefined) updates.method = data.method;
        if (data.nextFollowUpAt !== undefined) updates.next_follow_up_at = data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null;
        
        const followUp = await followUpDb.updateFollowUp?.(id, updates);
        return NextResponse.json(followUp);
      }

      case 'delete': {
        if (!id) {
          return NextResponse.json({ error: '缺少跟进记录ID' }, { status: 400 });
        }
        await followUpDb.deleteFollowUp?.(id);
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
