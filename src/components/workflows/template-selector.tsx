'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GitBranch,
  Zap,
  Clock,
  Mail,
  Bell,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  triggerType: string;
  triggerConfig: Record<string, string>;
  tag?: string;
}

const TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'new-opportunity-alert',
    name: '新商机提醒',
    description: '当创建新商机时，自动通知销售负责人',
    category: '销售流程',
    triggerType: 'event',
    triggerConfig: { event: 'opportunity.created' },
    tag: '常用',
  },
  {
    id: 'stage-change-notify',
    name: '阶段变更通知',
    description: '商机阶段变更时，发送邮件通知相关人员',
    category: '销售流程',
    triggerType: 'event',
    triggerConfig: { event: 'opportunity.stage_changed' },
  },
  {
    id: 'follow-up-reminder',
    name: '跟进提醒',
    description: '商机超过3天未跟进时，提醒负责人',
    category: '销售流程',
    triggerType: 'schedule',
    triggerConfig: { cron: '0 10 * * *' },
  },
  {
    id: 'customer-birthday',
    name: '客户生日祝福',
    description: '客户生日当天自动发送祝福邮件',
    category: '客户关系',
    triggerType: 'event',
    triggerConfig: { event: 'customer.birthday' },
  },
  {
    id: 'deal-close-won',
    name: '成交庆祝',
    description: '商机成交时，自动发送庆祝通知',
    category: '销售流程',
    triggerType: 'event',
    triggerConfig: { event: 'opportunity.closed_won' },
    tag: '常用',
  },
  {
    id: 'lead-assign-notify',
    name: '线索分配通知',
    description: '新线索分配时通知负责人',
    category: '线索管理',
    triggerType: 'event',
    triggerConfig: { event: 'lead.assigned' },
  },
  {
    id: 'ticket-escalation',
    name: '工单升级提醒',
    description: '工单超过24小时未处理时自动升级',
    category: '服务工单',
    triggerType: 'schedule',
    triggerConfig: { cron: '0 */6 * * *' },
  },
  {
    id: 'weekly-report',
    name: '周报汇总',
    description: '每周一早上发送销售周报',
    category: '报表',
    triggerType: 'schedule',
    triggerConfig: { cron: '0 9 * * 1' },
  },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  '销售流程': <Zap className="h-4 w-4" />,
  '客户关系': <Bell className="h-4 w-4" />,
  '线索管理': <GitBranch className="h-4 w-4" />,
  '服务工单': <CheckCircle2 className="h-4 w-4" />,
  '报表': <Mail className="h-4 w-4" />,
};

interface TemplateSelectorProps {
  onSelect: (template: WorkflowTemplate) => void;
  onCancel: () => void;
}

export function TemplateSelector({ onSelect, onCancel }: TemplateSelectorProps) {
  // 按分类分组
  const groupedTemplates = TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, WorkflowTemplate[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">选择模板</h3>
          <p className="text-sm text-muted-foreground">
            从预设模板快速创建工作流
          </p>
        </div>
        <Button variant="ghost" onClick={onCancel}>
          取消
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedTemplates).map(([category, templates]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              {CATEGORY_ICONS[category]}
              {category}
              <Badge variant="secondary" className="ml-1">
                {templates.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                  onClick={() => onSelect(template)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium">
                        {template.name}
                      </CardTitle>
                      {template.tag && (
                        <Badge variant="default" className="text-xs">
                          {template.tag}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {template.triggerType === 'manual' ? '手动触发' : 
                         template.triggerType === 'schedule' ? '定时执行' : '事件触发'}
                      </span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
