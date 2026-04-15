'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Users, 
  CheckCircle, 
  TrendingUp,
  Mail,
  Clock,
  ListTodo
} from 'lucide-react';
import type { Sequence } from '@/lib/sequences';

interface SequenceCardProps {
  sequence: Sequence;
  onEdit: (sequence: Sequence) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export function SequenceCard({ sequence, onEdit, onDelete, onToggleStatus }: SequenceCardProps) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-3 h-3" />;
      case 'task': return <ListTodo className="w-3 h-3" />;
      case 'delay': return <Clock className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{sequence.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{sequence.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[sequence.status]}>
              {sequence.status === 'active' ? '进行中' : 
               sequence.status === 'paused' ? '已暂停' :
               sequence.status === 'draft' ? '草稿' : '已完成'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(sequence)}>
                  <Edit className="w-4 h-4 mr-2" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleStatus(sequence.id)}>
                  {sequence.status === 'active' ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      暂停
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      启动
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(sequence.id)} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Users className="w-5 h-5 mx-auto text-blue-600 mb-1" />
            <div className="text-2xl font-bold text-gray-900">{sequence.stats.enrolled}</div>
            <div className="text-xs text-gray-500">已参与</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <CheckCircle className="w-5 h-5 mx-auto text-green-600 mb-1" />
            <div className="text-2xl font-bold text-gray-900">{sequence.stats.completed}</div>
            <div className="text-xs text-gray-500">已完成</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <TrendingUp className="w-5 h-5 mx-auto text-purple-600 mb-1" />
            <div className="text-2xl font-bold text-gray-900">{sequence.stats.responseRate}%</div>
            <div className="text-xs text-gray-500">响应率</div>
          </div>
        </div>

        {/* 步骤预览 */}
        <div className="border-t pt-3">
          <div className="text-xs text-gray-500 mb-2">序列步骤 ({sequence.steps.length}步)</div>
          <div className="flex items-center gap-1 overflow-x-auto">
            {sequence.steps.slice(0, 6).map((step, index) => (
              <div
                key={step.id}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs whitespace-nowrap"
              >
                {getStepIcon(step.type)}
                <span>
                  {step.type === 'email' ? '邮件' : step.type === 'task' ? '任务' : '等待'}
                </span>
              </div>
            ))}
            {sequence.steps.length > 6 && (
              <span className="text-xs text-gray-400">+{sequence.steps.length - 6}步</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
