// 任务详情 API - GET, PUT, DELETE 单个任务

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await db.getTaskById(id);
    
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error('Task GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { data } = body;

    // 先获取当前任务
    const currentTask = await db.getTaskById(id);
    if (!currentTask) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    // 检查状态 - 已完成任务不能修改
    if (currentTask.status === 'completed') {
      return NextResponse.json({ error: '已完成的任务不能修改' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.entityType !== undefined) updates.relatedType = data.entityType;
    if (data.entityId !== undefined) updates.relatedId = data.entityId;
    if (data.entityName !== undefined) updates.relatedName = data.entityName;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.status !== undefined) {
      updates.status = data.status;
      if (data.status === 'completed') {
        updates.completedAt = new Date().toISOString();
      }
    }
    if (data.dueDate !== undefined) updates.dueDate = data.dueDate;
    if (data.assignedTo !== undefined) updates.assigneeId = data.assignedTo;
    if (data.assignedName !== undefined) updates.assigneeName = data.assignedName;

    const task = await db.updateTask(id, updates);
    return NextResponse.json(task);
  } catch (error) {
    console.error('Task PUT error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 先获取当前任务
    const task = await db.getTaskById(id);
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    await db.deleteTask(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task DELETE error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
