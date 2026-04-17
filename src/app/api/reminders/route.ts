/**
 * 智能提醒 API (V5.1)
 * GET    /api/reminders          - 查询提醒列表
 * POST   /api/reminders          - 创建提醒
 * PUT    /api/reminders          - 更新提醒
 * DELETE /api/reminders?id=xxx   - 删除提醒
 */

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'list';

    switch (action) {
      case 'list': {
        const status = searchParams.get('status') || undefined;
        const type = searchParams.get('type') || undefined;
        const reminders = await db.getAllReminders({ status, type });
        return NextResponse.json(reminders);
      }
      case 'pending': {
        const reminders = await db.getPendingReminders();
        return NextResponse.json(reminders);
      }
      case 'triggered': {
        const reminders = await db.getTriggeredReminders();
        return NextResponse.json(reminders);
      }
      case 'today': {
        const reminders = await db.getTodayReminders();
        return NextResponse.json(reminders);
      }
      case 'overdue': {
        const reminders = await db.getOverdueReminders();
        return NextResponse.json(reminders);
      }
      case 'stats': {
        const stats = await db.getReminderStats();
        return NextResponse.json(stats);
      }
      case 'detail': {
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const reminder = await db.getReminderById(id);
        if (!reminder) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(reminder);
      }
      case 'trigger': {
        const count = await db.triggerDueReminders();
        return NextResponse.json({ triggered: count });
      }
      case 'smart-detect': {
        const count = await db.generateSmartReminders();
        return NextResponse.json({ created: count });
      }
      case 'check': {
        const triggered = await db.triggerDueReminders();
        const smart = await db.generateSmartReminders();
        const stats = await db.getReminderStats();
        return NextResponse.json({ triggered, smartDetected: smart, stats });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Reminder GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, message, entityType, entityId, entityName, remindAt, advanceMinutes, frequency } = body;

    if (!type || !title || !remindAt) {
      return NextResponse.json({ error: 'Missing required fields: type, title, remindAt' }, { status: 400 });
    }

    const reminder = await db.createReminder({
      type,
      title,
      message: message || null,
      entity_type: entityType || null,
      entity_id: entityId || null,
      entity_name: entityName || null,
      remind_at: remindAt,
      advance_minutes: advanceMinutes || 60,
      frequency: frequency || 'once',
      status: 'pending',
      is_read: false,
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error('Reminder POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    switch (action) {
      case 'update': {
        const { title, message, remindAt, advanceMinutes, frequency } = body;
        const updates: Record<string, unknown> = {};
        if (title !== undefined) updates.title = title;
        if (message !== undefined) updates.message = message;
        if (remindAt !== undefined) updates.remind_at = remindAt;
        if (advanceMinutes !== undefined) updates.advance_minutes = advanceMinutes;
        if (frequency !== undefined) updates.frequency = frequency;
        const reminder = await db.updateReminder(id, updates);
        return NextResponse.json(reminder);
      }
      case 'complete': {
        const reminder = await db.completeReminder(id);
        return NextResponse.json(reminder);
      }
      case 'dismiss': {
        const reminder = await db.dismissReminder(id);
        return NextResponse.json(reminder);
      }
      case 'markRead': {
        await db.markReminderRead(id);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Reminder PUT error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await db.deleteReminder(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reminder DELETE error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
