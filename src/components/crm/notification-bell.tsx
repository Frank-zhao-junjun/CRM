'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Clock, AlertTriangle, Info, BellRing, Calendar, DollarSign, FileCheck, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

// ============ Config ============

const notificationConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  overdue: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  reminder: { icon: Clock, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
  stage_change: { icon: Info, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  info: { icon: Info, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-500/10' },
  task_due: { icon: Clock, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
  opp_stage_timeout: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  lead_timeout: { icon: Lightbulb, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' },
  contract_milestone: { icon: FileCheck, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  payment_due: { icon: DollarSign, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
  custom: { icon: BellRing, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
};

// ============ Types ============

interface NotifItem {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
  source: 'notification' | 'reminder';
}

// ============ Browser Push ============

async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function sendBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/favicon.ico', tag: `crm-${Date.now()}` });
  } catch { /* ignore */ }
}

// ============ Component ============

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [open, setOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [notifRes, reminderRes] = await Promise.all([
        fetch('/api/crm?type=unreadNotifications'),
        fetch('/api/reminders?action=triggered'),
      ]);

      const items: NotifItem[] = [];

      if (notifRes.ok) {
        const data = await notifRes.json();
        for (const n of data) {
          items.push({
            id: `n-${n.id}`,
            type: n.type,
            title: n.title,
            message: n.message,
            entityType: n.entity_type,
            entityId: n.entity_id,
            isRead: n.is_read,
            createdAt: n.created_at,
            source: 'notification',
          });
        }
      }

      if (reminderRes.ok) {
        const data = await reminderRes.json();
        for (const r of data) {
          items.push({
            id: `r-${r.id}`,
            type: r.type,
            title: r.title,
            message: r.message || '',
            entityType: r.entity_type,
            entityId: r.entity_id,
            isRead: r.is_read,
            createdAt: r.triggered_at || r.created_at,
            source: 'reminder',
          });
        }
      }

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(items);
    } catch { /* silent */ }
  }, []);

  const checkAll = useCallback(async () => {
    try {
      await fetch('/api/reminders?action=check');
      await fetch('/api/crm?type=checkOverdue');
      await fetchData();
    } catch { /* silent */ }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(checkAll, 3 * 60 * 1000);
    const timer = setTimeout(checkAll, 15 * 1000);
    const onClickOnce = () => {
      requestBrowserNotificationPermission();
      document.removeEventListener('click', onClickOnce);
    };
    document.addEventListener('click', onClickOnce);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
      document.removeEventListener('click', onClickOnce);
    };
  }, [fetchData, checkAll]);

  const markNotificationRead = async (item: NotifItem) => {
    try {
      if (item.source === 'notification') {
        await fetch('/api/crm', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'markNotificationRead', id: item.id.replace('n-', ''), data: {} }),
        });
      } else {
        await fetch('/api/reminders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id.replace('r-', ''), action: 'markRead' }),
        });
      }
      setNotifications(prev => prev.filter(n => n.id !== item.id));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/crm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllNotificationsRead', id: 'all', data: {} }),
      });
      const reminderItems = notifications.filter(n => n.source === 'reminder');
      for (const item of reminderItems) {
        await fetch('/api/reminders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id.replace('r-', ''), action: 'markRead' }),
        });
      }
      setNotifications([]);
    } catch { /* silent */ }
  };

  const handleItemClick = (item: NotifItem) => {
    markNotificationRead(item);
    if (item.entityType && item.entityId) {
      const routeMap: Record<string, string> = {
        customer: `/customers/${item.entityId}`,
        lead: `/leads/${item.entityId}`,
        opportunity: `/opportunities/${item.entityId}`,
        contract: `/contracts/${item.entityId}`,
        task: `/tasks/${item.entityId}`,
      };
      const route = routeMap[item.entityType];
      if (route) {
        setOpen(false);
        router.push(route);
      }
    }
  };

  const unreadCount = notifications.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-[20px] p-0 flex items-center justify-center text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="font-semibold text-sm">通知与提醒</h4>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setOpen(false); router.push('/reminders'); }}>
              <Calendar className="h-3 w-3 mr-1" />全部提醒
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                <CheckCheck className="h-3 w-3 mr-1" />全部已读
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <ScrollArea className="max-h-[450px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>暂无新通知</p>
              <p className="text-xs mt-1">所有提醒都已处理</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(item => {
                const config = notificationConfig[item.type] || notificationConfig.info;
                const Icon = config.icon;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-start gap-3 p-3 hover:bg-accent/50 transition-colors cursor-pointer',
                      !item.isRead && 'bg-accent/20'
                    )}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className={cn('flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', config.bg)}>
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        {item.source === 'reminder' && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">提醒</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {isValid(parseISO(item.createdAt)) ? formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true, locale: zhCN }) : ''}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 mt-1" onClick={(e) => { e.stopPropagation(); markNotificationRead(item); }}>
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 5 && (
          <>
            <Separator />
            <div className="p-2">
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setOpen(false); router.push('/reminders'); }}>
                查看全部提醒
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
