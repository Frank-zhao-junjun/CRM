'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, ExternalLink, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format, isPast, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assignee_name?: string;
  created_at: string;
  updated_at: string;
}

const TASK_STATUS_CONFIG: Record<string, { label: string; className: string; color: string }> = {
  pending: { label: '待处理', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', color: 'text-gray-600 dark:text-gray-400' },
  in_progress: { label: '进行中', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', color: 'text-blue-600 dark:text-blue-400' },
  completed: { label: '已完成', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', color: 'text-green-600 dark:text-green-400' },
  cancelled: { label: '已取消', className: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20', color: 'text-stone-600 dark:text-stone-400' },
};

const TASK_PRIORITY_CONFIG: Record<string, { label: string; className: string; color: string; icon: string }> = {
  low: { label: '低', className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20', color: 'text-slate-600 dark:text-slate-400', icon: '↓' },
  medium: { label: '中', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', color: 'text-blue-600 dark:text-blue-400', icon: '→' },
  high: { label: '高', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', color: 'text-orange-600 dark:text-orange-400', icon: '↑' },
  urgent: { label: '紧急', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', color: 'text-red-600 dark:text-red-400', icon: '!!' },
};

interface CustomerTasksCardProps {
  customerId: string;
  className?: string;
}

export function CustomerTasksCard({ customerId, className }: CustomerTasksCardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/crm?type=tasks&customerId=${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return isPast(new Date(dueDate)) && !isToday(new Date(dueDate));
  };

  return (
    <Card className={cn('card-hover', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10">
            <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          任务
          {tasks.length > 0 && (
            <Badge variant="secondary" className="ml-1">{tasks.length}</Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/tasks/new?customerId=${customerId}`}>
            添加
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">暂无任务</p>
            <Button variant="link" size="sm" asChild className="mt-2">
              <Link href={`/tasks/new?customerId=${customerId}`}>
                创建任务
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {task.due_date && (
                      <span className={cn(
                        'text-xs flex items-center gap-1',
                        isOverdue(task.due_date) && task.status !== 'completed' 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-muted-foreground'
                      )}>
                        <Clock className="h-3 w-3" />
                        {format(new Date(task.due_date), 'MM/dd', { locale: zhCN })}
                      </span>
                    )}
                    {task.assignee_name && (
                      <span className="text-xs text-muted-foreground">
                        {task.assignee_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Badge variant="outline" className={cn('text-xs', TASK_PRIORITY_CONFIG[task.priority]?.className)}>
                    {TASK_PRIORITY_CONFIG[task.priority]?.icon} {TASK_PRIORITY_CONFIG[task.priority]?.label || task.priority}
                  </Badge>
                  <Badge variant="outline" className={cn('text-xs', TASK_STATUS_CONFIG[task.status]?.className)}>
                    {TASK_STATUS_CONFIG[task.status]?.label || task.status}
                  </Badge>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
            {tasks.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href={`/tasks?customerId=${customerId}`}>
                  查看全部 {tasks.length} 个任务
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
