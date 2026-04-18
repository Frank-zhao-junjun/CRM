// 任务管理 API

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as db from '@/lib/crm-database';

// 创建任务验证 schema
const createTaskSchema = z.object({
  title: z.string().min(1, '任务标题不能为空').max(255),
  description: z.string().optional(),
  entityType: z.enum(['customer', 'contact', 'lead', 'opportunity']).optional(),
  entityId: z.string().optional(),
  entityName: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime().optional().or(z.string().optional()),
  assignedTo: z.string().optional(),
});

// 更新任务验证 schema
const updateTaskSchema = z.object({
  id: z.string().min(1, '任务ID不能为空'),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  entityType: z.enum(['customer', 'contact', 'lead', 'opportunity']).optional(),
  entityId: z.string().optional(),
  entityName: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['pending', 'completed']).optional(),
  dueDate: z.string().datetime().optional().or(z.string().optional()),
  assignedTo: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const filter = searchParams.get('filter');

    if (id) {
      const task = await db.getTaskById(id);
      if (!task) {
        return NextResponse.json({ error: '任务不存在' }, { status: 404 });
      }
      return NextResponse.json(task);
    }

    if (entityType && entityId) {
      const tasks = await db.getTasksByEntity(entityType, entityId);
      return NextResponse.json(tasks);
    }

    if (filter === 'pending') {
      const tasks = await db.getPendingTasks();
      return NextResponse.json(tasks);
    }

    if (filter === 'today') {
      const tasks = await db.getTodayTasks();
      return NextResponse.json(tasks);
    }

    if (filter === 'overdue') {
      const tasks = await db.getOverdueTasks();
      return NextResponse.json(tasks);
    }

    const tasks = await db.getAllTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Tasks GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'create': {
        // 验证输入数据
        const validation = createTaskSchema.safeParse(data);
        if (!validation.success) {
          return NextResponse.json(
            { error: '输入验证失败', details: validation.error.flatten() },
            { status: 400 }
          );
        }

        const task = await db.createTask({
          id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          title: validation.data.title,
          description: validation.data.description || null,
          entity_type: validation.data.entityType || null,
          entity_id: validation.data.entityId || null,
          entity_name: validation.data.entityName || null,
          priority: validation.data.priority || 'medium',
          status: 'pending',
          due_date: validation.data.dueDate || null,
          source: 'manual',
          workflow_id: null,
          assigned_to: validation.data.assignedTo || null,  // 移除硬编码
        });

        // Record activity
        await db.createActivity({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'created',
          entity_type: (validation.data.entityType as 'customer' | 'contact' | 'lead' | 'opportunity') || 'customer',
          entity_id: validation.data.entityId || task.id,
          entity_name: validation.data.entityName || validation.data.title,
          description: `创建任务: ${validation.data.title}`,
          timestamp: new Date(),
        });

        return NextResponse.json(task);
      }

      case 'complete': {
        const taskId = data.id || body.id;
        if (!taskId) {
          return NextResponse.json({ error: '任务ID不能为空' }, { status: 400 });
        }
        const task = await db.completeTask(taskId);

        await db.createActivity({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'updated',
          entity_type: (task.entity_type as 'customer' | 'contact' | 'lead' | 'opportunity') || 'customer',
          entity_id: task.entity_id || task.id,
          entity_name: task.entity_name || task.title,
          description: `完成任务: ${task.title}`,
          timestamp: new Date(),
        });

        return NextResponse.json(task);
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Tasks POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, data } = body;

    // 验证输入数据
    const validation = updateTaskSchema.safeParse({ id, ...data });
    if (!validation.success) {
      return NextResponse.json(
        { error: '输入验证失败', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.entityType !== undefined) updates.entity_type = data.entityType;
    if (data.entityId !== undefined) updates.entity_id = data.entityId;
    if (data.entityName !== undefined) updates.entity_name = data.entityName;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.status !== undefined) {
      updates.status = data.status;
      if (data.status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
    }
    if (data.dueDate !== undefined) updates.due_date = data.dueDate;
    if (data.assignedTo !== undefined) updates.assigned_to = data.assignedTo;

    const task = await db.updateTask(validation.data.id, updates);
    return NextResponse.json(task);
  } catch (error) {
    console.error('Tasks PUT error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少ID' }, { status: 400 });

    await db.deleteTask(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tasks DELETE error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
