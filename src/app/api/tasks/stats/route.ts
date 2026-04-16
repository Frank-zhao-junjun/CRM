// 任务统计 API

import { NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

export async function GET() {
  try {
    // 获取所有任务
    const allTasks = await db.getAllTasks();
    const pendingTasks = await db.getPendingTasks();
    const todayTasks = await db.getTodayTasks();
    const overdueTasks = await db.getOverdueTasks();

    // 计算统计数据
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const stats = {
      total: allTasks.length,
      pending: pendingTasks.filter(t => t.status !== 'completed').length,
      inProgress: pendingTasks.filter(t => t.status === 'in_progress').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      overdue: overdueTasks.length,
      dueToday: todayTasks.length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Tasks stats error:', error);
    return NextResponse.json({ 
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      dueToday: 0,
      error: (error as Error).message 
    }, { status: 500 });
  }
}
