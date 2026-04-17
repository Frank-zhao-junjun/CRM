'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  REMINDER_TYPE_CONFIG,
  REMINDER_ADVANCE_OPTIONS,
  type ReminderType,
  type ReminderFrequency,
} from '@/lib/crm-types';

interface ReminderCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEntityType?: string;
  defaultEntityId?: string;
  defaultEntityName?: string;
  onCreated?: () => void;
}

export function ReminderCreateDialog({
  open,
  onOpenChange,
  defaultEntityType,
  defaultEntityId,
  defaultEntityName,
  onCreated,
}: ReminderCreateDialogProps) {
  const [type, setType] = useState<ReminderType>('custom');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [advanceMinutes, setAdvanceMinutes] = useState(60);
  const [frequency, setFrequency] = useState<ReminderFrequency>('once');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('请输入提醒标题');
      return;
    }
    if (!remindAt) {
      toast.error('请选择提醒时间');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim(),
          message: message.trim() || undefined,
          entityType: defaultEntityType || undefined,
          entityId: defaultEntityId || undefined,
          entityName: defaultEntityName || undefined,
          remindAt: new Date(remindAt).toISOString(),
          advanceMinutes,
          frequency,
        }),
      });
      if (!res.ok) throw new Error('创建失败');
      toast.success('提醒创建成功');
      onCreated?.();
      onOpenChange(false);
      // Reset
      setTitle('');
      setMessage('');
      setRemindAt('');
      setAdvanceMinutes(60);
      setFrequency('once');
      setType('custom');
    } catch {
      toast.error('创建提醒失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>创建提醒</DialogTitle>
          <DialogDescription>
            设置提醒时间，系统会在指定时间通知您
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Reminder Type */}
          <div className="space-y-2">
            <Label>提醒类型</Label>
            <Select value={type} onValueChange={(v) => setType(v as ReminderType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REMINDER_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <span className={config.color}>{config.label}</span>
                    <span className="text-muted-foreground text-xs ml-2">- {config.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>提醒标题 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入提醒标题..."
            />
          </div>

          {/* Entity (if pre-linked) */}
          {defaultEntityName && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">关联:</span>
              <span className="text-sm font-medium">{defaultEntityName}</span>
              <span className="text-xs text-muted-foreground">({defaultEntityType})</span>
            </div>
          )}

          {/* Remind At */}
          <div className="space-y-2">
            <Label>提醒时间 *</Label>
            <Input
              type="datetime-local"
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
            />
          </div>

          {/* Advance Time */}
          <div className="space-y-2">
            <Label>提前提醒</Label>
            <Select value={String(advanceMinutes)} onValueChange={(v) => setAdvanceMinutes(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_ADVANCE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>重复频率</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as ReminderFrequency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">单次</SelectItem>
                <SelectItem value="daily">每天</SelectItem>
                <SelectItem value="weekly">每周</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>备注</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="添加提醒备注..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? '创建中...' : '创建提醒'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
